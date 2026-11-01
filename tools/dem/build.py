"""Construit le relief de la borne : Copernicus GLO-30, surfaces sportives OSM aplaties, tuiles Terrain-RGB.

Sortie : APP/odej-kiosk/public/terrain/{z}/{x}/{y}.webp et metadata.json.
Usage : python tools/dem/build.py [--refresh-osm]
Voir tools/dem/README.md.
"""
import argparse
import json
import math
import shutil
import sys
import time
from datetime import date
from pathlib import Path

import numpy as np
import rasterio
import requests
from PIL import Image
from rasterio.features import rasterize
from rasterio.transform import from_origin
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
OSM_FILE = HERE / "data" / "sports-areas.geojson"
OUTPUT = HERE.parent.parent / "APP" / "odej-kiosk" / "public" / "terrain"

# Emprise du plan d'action : la wilaya avec une marge
WEST, SOUTH, EAST, NORTH = 3.8, 35.75, 6.05, 37.3
ZOOMS = range(8, 12)
TILE_SIZE = 512
BUDGET_BYTES = 50 * 1024 * 1024

DEM_URL = "https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif"
PIXELS_PER_DEGREE = 3600

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
# Overpass refuse le User-Agent par défaut de requests
USER_AGENT = {"User-Agent": "odej-kiosk-dem/1.0"}
OVERPASS_QUERY = f"""
[out:json][timeout:180][bbox:{SOUTH},{WEST},{NORTH},{EAST}];
(
  nwr["leisure"~"^(pitch|stadium|track|sports_centre)$"];
  nwr["landuse"="recreation_ground"];
);
out geom;
"""

SMOOTH_SIGMA_PX = 1.0
BLEND_PX = 2
# Au-delà, le polygone n'est pas une surface plate : grand complexe, terrain en terrasses
MAX_AREA_M2 = 200_000
MAX_RELIEF_M = 20
# Terrain-RGB sans décimale inutile : le WebP sans perte se compresse bien mieux
QUANTIZE_M = 0.5


def dem_extent() -> tuple[int, int, int, int]:
    """Degrés entiers qui couvrent toutes les tuiles écrites, y compris leurs parties hors de l'emprise."""
    zoom = ZOOMS.start
    left, top, right, bottom = tile_range(zoom)
    west = tile_bounds(zoom, left, top)[0]
    north = tile_bounds(zoom, left, top)[3]
    east = tile_bounds(zoom, right, bottom)[2]
    south = tile_bounds(zoom, right, bottom)[1]
    return math.floor(west), math.floor(south), math.ceil(east), math.ceil(north)


def read_dem_tile(lat: int, lon: int) -> np.ndarray:
    """Un degré carré de GLO-30. Le bucket n'a pas de fichier pour la pleine mer : altitude 0."""
    name = f"Copernicus_DSM_COG_10_N{lat:02d}_00_E{lon:03d}_00_DEM"
    path = CACHE / f"{name}.tif"
    missing = CACHE / f"{name}.missing"
    if not path.exists() and not missing.exists():
        print(f"download {name}")
        response = requests.get(DEM_URL.format(name=name), timeout=300)
        if response.status_code == 404:
            missing.touch()
        else:
            response.raise_for_status()
            path.write_bytes(response.content)
    if missing.exists():
        return np.zeros((PIXELS_PER_DEGREE, PIXELS_PER_DEGREE), dtype=np.float32)
    with rasterio.open(path) as source:
        return source.read(1).astype(np.float32)


def download_dem() -> tuple[np.ndarray, rasterio.Affine]:
    CACHE.mkdir(exist_ok=True)
    west, south, east, north = dem_extent()
    rows = [
        np.hstack([read_dem_tile(lat, lon) for lon in range(west, east)])
        for lat in range(north - 1, south - 1, -1)
    ]
    return np.vstack(rows), from_origin(west, north, 1 / PIXELS_PER_DEGREE, 1 / PIXELS_PER_DEGREE)


def closed_ring(points: list[list[float]]) -> bool:
    return len(points) >= 4 and points[0] == points[-1]


def element_polygons(element: dict) -> list[list[list[list[float]]]]:
    """Polygones d'un élément Overpass, trous non gérés : ils restent aplatis comme le reste."""
    if element["type"] == "way":
        ring = [[p["lon"], p["lat"]] for p in element.get("geometry", [])]
        return [[ring]] if closed_ring(ring) else []
    if element["type"] == "relation":
        rings = []
        for member in element.get("members", []):
            if member.get("role") != "outer":
                continue
            ring = [[p["lon"], p["lat"]] for p in member.get("geometry", [])]
            if closed_ring(ring):
                rings.append([ring])
        return rings
    return []


def fetch_osm(refresh: bool) -> dict:
    if OSM_FILE.exists() and not refresh:
        return json.loads(OSM_FILE.read_text(encoding="utf-8"))
    print("download OSM sports areas")
    response = requests.post(OVERPASS_URL, data={"data": OVERPASS_QUERY}, headers=USER_AGENT, timeout=240)
    response.raise_for_status()
    time.sleep(2)
    features = []
    for element in response.json()["elements"]:
        tags = element.get("tags", {})
        kind = tags.get("leisure") or tags.get("landuse")
        for rings in element_polygons(element):
            features.append(
                {
                    "type": "Feature",
                    "properties": {"osm": f"{element['type']}/{element['id']}", "kind": kind},
                    "geometry": {"type": "Polygon", "coordinates": rings},
                }
            )
    features.sort(key=lambda f: f["properties"]["osm"])
    collection = {
        "type": "FeatureCollection",
        "attribution": "© OpenStreetMap contributors, ODbL",
        "date": date.today().isoformat(),
        "features": features,
    }
    OSM_FILE.parent.mkdir(exist_ok=True)
    OSM_FILE.write_text(json.dumps(collection, ensure_ascii=False, indent=0), encoding="utf-8")
    return collection


def polygon_area_m2(ring: list[list[float]]) -> float:
    lat = math.radians(sum(p[1] for p in ring) / len(ring))
    xs = [p[0] * 111_320 * math.cos(lat) for p in ring]
    ys = [p[1] * 110_540 for p in ring]
    return abs(sum(xs[i] * ys[i + 1] - xs[i + 1] * ys[i] for i in range(len(ring) - 1))) / 2


def flatten(dem: np.ndarray, transform: rasterio.Affine, collection: dict) -> dict:
    """Altitude médiane dans chaque polygone, raccord sur BLEND_PX. Les plus petits passent en dernier."""
    features = sorted(collection["features"], key=lambda f: -polygon_area_m2(f["geometry"]["coordinates"][0]))
    stats = {"polygons": len(features), "flattened": 0, "too_large": 0, "not_flat": 0, "at_sea": 0, "outside": 0}
    height, width = dem.shape
    margin = BLEND_PX + 2
    for feature in features:
        ring = feature["geometry"]["coordinates"][0]
        if polygon_area_m2(ring) > MAX_AREA_M2:
            stats["too_large"] += 1
            continue
        columns = [(p[0] - transform.c) / transform.a for p in ring]
        lines = [(p[1] - transform.f) / transform.e for p in ring]
        left, right = max(int(min(columns)) - margin, 0), min(int(max(columns)) + margin + 1, width)
        top, bottom = max(int(min(lines)) - margin, 0), min(int(max(lines)) + margin + 1, height)
        if left >= right or top >= bottom:
            stats["outside"] += 1
            continue
        window = dem[top:bottom, left:right]
        window_transform = transform * rasterio.Affine.translation(left, top)
        mask = rasterize(
            [(feature["geometry"], 1)], out_shape=window.shape, transform=window_transform, all_touched=True, dtype=np.uint8
        ).astype(bool)
        if not mask.any():
            stats["outside"] += 1
            continue
        inside = window[mask]
        if np.median(inside) <= 0:
            stats["at_sea"] += 1
            continue
        if np.percentile(inside, 95) - np.percentile(inside, 5) > MAX_RELIEF_M:
            stats["not_flat"] += 1
            continue
        level = float(np.median(inside))
        distance = distance_transform_edt(~mask)
        weight = np.clip(1 - distance / (BLEND_PX + 1), 0, 1).astype(np.float32)
        window[:] = window * (1 - weight) + level * weight
        stats["flattened"] += 1
    return stats


def tile_range(zoom: int) -> tuple[int, int, int, int]:
    def column(lon: float) -> int:
        return int((lon + 180) / 360 * 2**zoom)

    def line(lat: float) -> int:
        rad = math.radians(lat)
        return int((1 - math.asinh(math.tan(rad)) / math.pi) / 2 * 2**zoom)

    return column(WEST), line(NORTH), column(EAST), line(SOUTH)


def tile_bounds(zoom: int, x: int, y: int) -> tuple[float, float, float, float]:
    n = 2**zoom

    def latitude(row: float) -> float:
        return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * row / n))))

    return x / n * 360 - 180, latitude(y + 1), (x + 1) / n * 360 - 180, latitude(y)


def encode(elevation: np.ndarray) -> np.ndarray:
    """Terrain-RGB : hauteur = -10000 + (R * 65536 + G * 256 + B) * 0,1."""
    steps = np.round(elevation / QUANTIZE_M) * QUANTIZE_M
    value = np.round((steps + 10000) * 10).astype(np.uint32)
    return np.dstack([(value >> 16) & 255, (value >> 8) & 255, value & 255]).astype(np.uint8)


def render_tile(dem: np.ndarray, transform: rasterio.Affine, zoom: int, x: int, y: int) -> np.ndarray:
    west, south, east, north = tile_bounds(zoom, x, y)
    offsets = (np.arange(TILE_SIZE) + 0.5) / TILE_SIZE
    longitudes = west + (east - west) * offsets
    mercator_north = math.asinh(math.tan(math.radians(north)))
    mercator_south = math.asinh(math.tan(math.radians(south)))
    latitudes = np.degrees(np.arctan(np.sinh(mercator_north + (mercator_south - mercator_north) * offsets)))
    lon_grid, lat_grid = np.meshgrid(longitudes, latitudes)
    columns = (lon_grid - transform.c) / transform.a - 0.5
    lines = (lat_grid - transform.f) / transform.e - 0.5
    return map_coordinates(dem, [lines, columns], order=1, mode="nearest").astype(np.float32)


def write_tiles(dem: np.ndarray, transform: rasterio.Affine) -> tuple[int, int]:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    count = 0
    total = 0
    for zoom in ZOOMS:
        left, top, right, bottom = tile_range(zoom)
        for x in range(left, right + 1):
            for y in range(top, bottom + 1):
                path = OUTPUT / str(zoom) / str(x) / f"{y}.webp"
                path.parent.mkdir(parents=True, exist_ok=True)
                image = Image.fromarray(encode(render_tile(dem, transform, zoom, x, y)), "RGB")
                image.save(path, "WEBP", lossless=True, quality=100, method=6, exact=True)
                count += 1
                total += path.stat().st_size
        print(f"z{zoom}: {count} tiles, {total / 1024 / 1024:.1f} MiB so far")
    return count, total


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh-osm", action="store_true", help="interroge de nouveau Overpass")
    args = parser.parse_args()

    dem, transform = download_dem()
    collection = fetch_osm(args.refresh_osm)
    # Lissage d'abord : les surfaces aplaties restent exactement plates
    dem = gaussian_filter(dem, SMOOTH_SIGMA_PX)
    stats = flatten(dem, transform, collection)
    print("flatten:", stats)
    count, total = write_tiles(dem, transform)

    metadata = {
        "encoding": "mapbox",
        "format": "webp",
        "tileSize": TILE_SIZE,
        "minzoom": ZOOMS.start,
        "maxzoom": ZOOMS.stop - 1,
        "bounds": [WEST, SOUTH, EAST, NORTH],
        "source": "Copernicus DEM GLO-30, OpenStreetMap",
        "date": date.today().isoformat(),
        "osmDate": collection["date"],
        "flatten": stats,
        "tiles": count,
        "bytes": total,
    }
    (OUTPUT / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"done: {count} tiles, {total / 1024 / 1024:.1f} MiB")
    if total > BUDGET_BYTES:
        print("over the 50 MiB budget: stop and ask", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
