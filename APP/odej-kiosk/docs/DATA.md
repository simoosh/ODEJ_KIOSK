# Données et médias

## Où vit quoi

| Fichier | Contenu | Qui le modifie |
|---|---|---|
| `public/data/odej-bejaia.json` | identité, type, lieu, coordonnées, contact, vérification | scripts de `tools/data`, ou à la main après une entrée dans `teamwork/Update.md` |
| `public/data/odej-bejaia.schema.json` | schéma des données | agent applicatif |
| `public/media/odej-NNN/media.json` | couverture et galerie d'un établissement | agent données |
| `public/data/media.schema.json` | schéma de `media.json` | agent applicatif |
| `public/media/index.json` | tous les `media.json` assemblés | généré par `npm run dev` et `npm run build`, ignoré par git |
| `public/data/details.json` | ce que disent les `info.json` de chaque établissement : contact, description, faits, programme | généré par `npm run dev` et `npm run build`, ignoré par git |

L'application charge `odej-bejaia.json`, `media/index.json` et `data/details.json`, puis les fusionne par id. Un établissement sans `media.json` n'a pas de médias, et sans `info.json` il n'a pas de détails : ce n'est pas une erreur.

## Ajouter des médias

Je crée ou je modifie seulement `public/media/odej-NNN/`. Je ne touche pas à `odej-bejaia.json`.

1. Je copie les binaires dans le dossier (ils sont ignorés par git).
2. J'écris `media.json` :

   ```json
   {
     "$schema": "../../data/media.schema.json",
     "cover": { "src": "odej-001/cover.webp", "kind": "image", "fit": "contain" },
     "gallery": [
       { "src": "odej-001/gallery/gallery-01.webp", "kind": "image" },
       { "src": "odej-001/videos/video-01.mp4", "kind": "video", "poster": "odej-001/videos/video-01-poster.webp" }
     ]
   }
   ```

   - Les chemins commencent par `odej-NNN/`, sans le préfixe `media/`.
   - `cover` vaut `null` s'il n'y a pas de couverture.
   - `fit: "contain"` montre l'image entière (logo, image carrée).
3. Je lance `npm run validate:data`. Il contrôle le format de `media.json`, mais pas l'existence des fichiers : ils ne sont pas dans git.
4. Je commite seulement `media.json` et `docs/media/odej-NNN.json`.

`activities` et `gaps` sont réservés aux étapes suivantes. L'application ne les lit pas encore.

## Détails venus des `info.json`

Chaque établissement qui a un `RESOURCES/ODEJ-Media/NNN-nom/info.json` affiche ses informations dans sa fiche, sans étape manuelle. `scripts/build-details-index.mjs` (lancé par `predev` et `prebuild`) lit tous les `info.json` et écrit `public/data/details.json`. Un nouveau scrape apparaît donc au prochain `npm run dev` ou `npm run build`.

Ordre de la fiche : nom, photo de couverture, description, autres photos et vidéos, contact (téléphone, e-mail, adresse, horaires), « À propos » (année de création, capacité, accessibilité), programme des activités, QR Facebook et coordonnées, boutons, établissements proches.

| Champ de la fiche | Source |
|---|---|
| téléphone, e-mail, adresse | `info.json`, qui porte la règle de source (e-mail et téléphone : Facebook d'abord, Youth Connect en complément) ; sinon `contact` de `odej-bejaia.json` |
| description | `description` de `odej-bejaia.json` si elle existe (relue, traduite) ; sinon le texte arabe de l'`info.json`. Un texte qui n'est pas en arabe est écarté |
| année de création, capacité, accessibilité | `info.json`. L'absence d'accessibilité n'est jamais affichée comme « non » |
| programme | `activities` de l'`info.json` (Youth Connect) : titre et thème en arabe, dates traduites dans la langue du visiteur. Sans programme, la fiche montre les activités du type |
| horaires | `openingHours` de `odej-bejaia.json` seulement : ceux de Facebook (« Toujours ouvert », « Ferme bientôt ») ne sont pas un horaire |

Une adresse qui est un lien ou le mot « Coordonnées » est écartée. Aucun texte n'est traduit : le programme reste en arabe en version anglaise.

## Titres affichés

`name` est le nom officiel de la liste ODEJ : il ne change jamais.

`displayName` (type + commune) et `honoree` (personne qui donne son nom à l'établissement) sont calculés par `tools/data/apply-names.mjs`. Ils sont absents si le type ou le lieu est inconnu, ou si le nom commence déjà par un type. L'application affiche alors `name`. La recherche couvre les trois champs.

## Scripts de `tools/data`

À lancer depuis la racine du dépôt. Tous sont idempotents : les relancer ne change rien.

| Script | Rôle |
|---|---|
| `split-media.mjs` | déplace les blocs `media` de `odej-bejaia.json` vers `media.json` |
| `apply-audit.mjs` | applique `sidecontent/data-corrections-from-audit.json` (hors du dépôt) |
| `apply-names.mjs` | calcule `displayName` et `honoree` |
| `import-info.mjs` | compare les `info.json` aux données ; avec `--apply`, importe les entrées validées de `info-proposals.json` |
| `build-verification.mjs` | régénère `docs/VERIFICATION.md` |

Après une modification de `name`, de `category` ou de `placeId`, je relance `apply-names.mjs`. Après une modification des issues, je relance `build-verification.mjs`.

## Contour de la wilaya

`public/data/bejaia-boundary.geojson` vient de la relation OpenStreetMap 1278765, licence ODbL, simplifiée à environ 110 m (10,9 Ko). Pour le régénérer, depuis la racine du dépôt :

```bash
node tools/data/build-boundary.mjs
```

Le cadrage de la carte, la limite de dézoom et le brouillard partent de ce contour : `wilaya.camera` ne garde que `pitch` et `bearing`.

## Établissement phare

`featured: true` dans `odej-bejaia.json` suffit : bouton de l'accueil, marqueur doré, tête de liste, recherche et galerie en tête de fiche suivent, sans toucher au code. Avec plusieurs phares, `featuredOrder` les classe, et l'accueil montre le premier.
