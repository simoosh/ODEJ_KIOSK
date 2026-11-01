#!/usr/bin/env python3
"""Prints the collection status of the 67 establishments as a Markdown table.

  python3 tools/media/collect/status_table.py

Read-only. Sizes come from the optimized files in APP/odej-kiosk/public/media/odej-NNN/ (what the
kiosk and the CDN serve), contact fields from RESOURCES/ODEJ-Media/NNN-*/info.json (what the
scrappper found) and from public/data/odej-bejaia.json (what the map shows today).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
APP = ROOT / 'APP' / 'odej-kiosk'
RAW = ROOT / 'RESOURCES' / 'ODEJ-Media'
MiB = 1024 * 1024


def yn(v):
    return 'yes' if v else '-'


def main():
    data = json.loads((APP / 'public' / 'data' / 'odej-bejaia.json').read_text(encoding='utf8'))
    places = {p['id']: p['name'].get('en') or p['name'].get('ar') for p in data['places']}
    rows, total = [], dict(n=0, photos=0, videos=0, size=0)
    for e in data['establishments']:
        ref = e['id']
        out = APP / 'public' / 'media' / ref
        mj = out / 'media.json'
        if not mj.exists():
            continue
        m = json.loads(mj.read_text(encoding='utf8'))
        gallery = m.get('gallery') or []
        photos = sum(1 for g in gallery if g['kind'] == 'image')
        videos = sum(1 for g in gallery if g['kind'] == 'video')
        size = sum(f.stat().st_size for f in out.rglob('*') if f.is_file() and f.name != 'media.json' and '/thumbs' not in f.as_posix())
        raw = next(RAW.glob(f"{e['ref']:03d}-*"), None)
        info = json.loads((raw / 'info.json').read_text(encoding='utf8')) if raw and (raw / 'info.json').exists() else {}
        c = e.get('contact') or {}
        rows.append((e['ref'], e['name'].get('en') or e['name'].get('ar'), places.get(e['placeId'], e['placeId']),
                     photos, videos, size / MiB, yn(m.get('cover')),
                     yn(info.get('phone')), yn(info.get('email')), yn(info.get('address')), yn(info.get('openingHours')),
                     yn(c.get('phone') or c.get('email'))))
        total['n'] += 1; total['photos'] += photos; total['videos'] += videos; total['size'] += size
    print('| # | Establishment | Commune | Photos | Videos | MiB | Cover | Phone | E-mail | Address | Hours | Contact on map |')
    print('|--:|---|---|--:|--:|--:|:-:|:-:|:-:|:-:|:-:|:-:|')
    for r in rows:
        print(f'| {r[0]:03d} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]:.1f} | {r[6]} | {r[7]} | {r[8]} | {r[9]} | {r[10]} | {r[11]} |')
    n = len(data['establishments'])
    print(f"| | **{total['n']} of {n} collected** | | **{total['photos']}** | **{total['videos']}** | **{total['size'] / MiB:.1f}** | | | | | | |")
    print(f"\nPhone, E-mail, Address and Hours come from `info.json` (scrappper). 'Contact on map' says whether `odej-bejaia.json` already shows a phone or e-mail. Sizes are the optimized files, cover included, without thumbnails.")


if __name__ == '__main__':
    main()
