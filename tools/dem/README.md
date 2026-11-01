# Relief de la carte

`build.py` produit `APP/odej-kiosk/public/terrain/` : le relief servi par le site et par le pack de la borne.

## Lancer

Avec Python 3.13, depuis `tools/dem` :

```bash
py -3.13 -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python build.py
```

Ensuite, `build.py` seul suffit. Il réutilise `.cache/` (ignoré par git) et `data/sports-areas.geojson`. `--refresh-osm` interroge de nouveau OpenStreetMap.

## Ce qu'il fait

1. Télécharge les tuiles Copernicus GLO-30 (30 m) qui couvrent toute la surface des tuiles écrites, pas seulement l'emprise : sinon les bords seraient étirés. Le bucket n'a pas de fichier pour la pleine mer : l'altitude y vaut 0.
2. Lit les surfaces sportives d'OSM : `leisure=pitch|stadium|track|sports_centre` et `landuse=recreation_ground`.
3. Applique un léger lissage gaussien.
4. Remplace l'altitude de chaque surface par sa médiane, avec un raccord de 2 pixels. Les surfaces de plus de 200 000 m², ou avec plus de 20 m de dénivelé, ne sont pas aplaties.
5. Écrit des tuiles Terrain-RGB de 512 px en WebP sans perte, zooms 8 à 11, et `metadata.json`.

Au-delà de 50 Mio, le script sort en erreur : c'est le budget fixé.

## Limites

GLO-30 est un modèle de surface : il inclut une partie de la végétation et du bâti. Seules les surfaces cartographiées dans OSM sont aplaties.

## Licences

Le relief affiché doit porter cette mention, reprise dans `src/config.ts` :

> produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved

Les surfaces sportives viennent d'OpenStreetMap, licence ODbL.
