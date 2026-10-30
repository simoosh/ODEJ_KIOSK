# Borne interactive ODEJ Béjaïa

Application de borne tactile pour le salon des établissements de jeunesse (Palais des expositions, Alger, 11 novembre 2026).
Accueil → animation d'entrée → carte 3D de la wilaya avec les 67 établissements, recherche, panneau liste / fiche.

Stack : React 19 · TypeScript · Vite · MapLibre GL JS 5 · fonds OpenStreetMap · données dans un fichier JSON.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173  (ajouter ?sim=1 pour le simulateur d'écrans)
npm run build        # dossier dist/ à servir sur la borne
npm run preview
```

## Arborescence

```
public/data/odej-bejaia.json         toutes les données affichées (textes ar/en, catégories, lieux, établissements)
public/data/odej-bejaia.schema.json  schéma JSON (validation, futur panneau d'administration)
src/config.ts                        réglages borne : délai d'inactivité, caméras, relief
src/App.tsx                          écrans et état (accueil / carte, filtres, sélection)
src/map/MapView.tsx                  MapLibre : caméra, animations, marqueurs HTML, relief
src/map/basemaps.ts                  fonds de carte (plan OSM, satellite, relief, OSM classique)
src/components/                      accueil, recherche + clavier tactile, liste, fiche, contrôles caméra
src/i18n/strings.ts                  textes de l'interface (arabe par défaut, anglais)
docs/VERIFICATION.md                 contrôle de la liste fournie par l'ODEJ et questions à leur poser
```

## Données (`public/data/odej-bejaia.json`)

Un seul fichier, chargé au démarrage : on peut le modifier sans recompiler.

- `organization`, `wilaya` : textes de l'accueil, chiffres clés, caméra d'arrivée (`wilaya.camera`).
- `categories` : type d'établissement → couleur, icône, activités par défaut.
- `activities` : liste des activités (recherche, filtres, fiche).
- `places` : communes et lieux-dits cités (`kind: commune | locality`).
- `establishments` : un objet par établissement.

```json
{
  "id": "odej-006",
  "ref": 6,
  "name": { "ar": "بيت الشباب أقبو", "en": "Akbou Youth Hostel" },
  "category": "hostel",
  "placeId": "akbou",
  "location": { "lat": 36.4532417, "lng": 4.540312 },
  "description": { "ar": null, "en": null },
  "activities": [],
  "contact": { "phone": null, "email": null, "facebook": "https://www.facebook.com/profile.php?id=61580027542318" },
  "media": { "cover": null, "gallery": [] },
  "openingHours": null,
  "verification": { "status": "to_check", "issues": [] }
}
```

`activities` vide = activités par défaut de la catégorie. `verification` n'est jamais affiché sur la borne : c'est le suivi des
corrections demandées à l'ODEJ (voir `docs/VERIFICATION.md`). Les médias sont dans `public/media/odej-NNN/` et se référencent par chemin
relatif (`"src": "media/odej-003/gallery/gallery-01.webp"`). `cover` reste `null` tant qu'aucune photo du bâtiment n'est validée.
`media.gallery` s'affiche dans la fiche ; une vidéo ajoute `"kind": "video"` et une image `poster`.
Les originaux sont dans `RESOURCES/ODEJ-Media/`, et `docs/media/` relie chaque fichier optimisé à son original.

## Carte

| Vue | Source | Clé |
|---|---|---|
| Plan (défaut) | OpenFreeMap « Liberty », tuiles vectorielles OSM | aucune |
| Satellite | Esri World Imagery | aucune (attribution obligatoire) |
| Relief | OpenTopoMap | aucune |
| OSM classique | tile.openstreetmap.org | aucune (usage modéré) |
| Relief 3D | Terrain Tiles Mapzen (AWS Open Data), terrarium | aucune |

- Caméra : glisser, pincer, rotation et inclinaison à deux doigts, plus les boutons (zoom, inclinaison, rotation, nord, 2D/3D,
  toute la wilaya). Inclinaison jusqu'à 80°.
- Les libellés du plan passent en arabe ou en anglais (`name:ar` / `name:en`) ; le plugin RTL MapLibre est chargé pour l'arabe.
- Les établissements sont des marqueurs HTML (texte arabe parfait, pas de polices de carte nécessaires) posés sur le relief.

### Hors ligne (à prévoir pour le salon)

Le Wi-Fi d'un salon n'est pas fiable. Avant le 11 novembre :

1. Extraire la zone de Béjaïa en PMTiles :
   `pmtiles extract https://build.protomaps.com/<date>.pmtiles bejaia.pmtiles --bbox=4.2,36.2,5.7,37.0`
2. Ajouter le protocole `pmtiles://` (paquet `pmtiles`) et un style local ; héberger polices, sprites et plugin RTL dans `public/`.
3. Faire de même pour le relief (tuiles terrarium z8–z12 de la zone, quelques dizaines de Mo).

Si un fond ne répond pas, l'application bascule seule sur la vue « aperçu » (grille + établissements) et affiche un bandeau.

## Borne

- Arabe par défaut, bouton de langue en haut. Mise en page en `dir="rtl"` / `ltr` avec propriétés CSS logiques.
- Portrait : panneau en tiroir bas. Paysage : panneau latéral. La taille de base de l'interface suit le plus petit côté de
  l'écran, de la tablette au 4K.
- Retour automatique à l'accueil après 2 min sans contact, avec compte à rebours de 10 s (`src/config.ts`).
- Clavier tactile intégré (arabe / latin) : le clavier système n'apparaît pas toujours en plein écran.
- Facebook : QR code à scanner, pas de navigation web sur la borne.

Lancement conseillé (Chrome / Edge) :

```bash
chrome --kiosk --incognito --disable-pinch --overscroll-history-navigation=0 --noerrdialogs http://localhost:4173
```

## Suite

- Mode « diffusion en boucle » pour les écrans non tactiles (`?mode=loop`) : diaporama photos/vidéos + survol automatique des
  établissements.
- Panneau d'administration : édition du JSON (validé par le schéma), téléversement des médias, programmation par écran.
- Compléter les données avec l'ODEJ (types, photos, descriptions, activités) : voir `docs/VERIFICATION.md`.
