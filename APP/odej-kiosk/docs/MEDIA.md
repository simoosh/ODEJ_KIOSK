# Pipeline des médias

Les règles (limites, budgets, où vivent les fichiers) sont dans `teamwork/README.md`, section 4. Pour ajouter des médias à un établissement, voir `docs/DATA.md`. Ce document explique les outils.

## Installer

Une seule fois, depuis `APP/odej-kiosk` :

```bash
npm ci --prefix ../../tools/media/pipeline
```

Cela installe `sharp` à part, pour ne pas alourdir l'application ni le build Netlify.

Il faut aussi `ffmpeg` et `ffprobe` dans le PATH, pour `media:check` :

```bash
winget install ffmpeg
```

Ouvrez ensuite un nouveau terminal : le PATH n'est pas mis à jour dans ceux déjà ouverts.

## Commandes

À lancer depuis `APP/odej-kiosk`.

| Commande | Rôle |
|---|---|
| `npm run media:check` | contrôle `public/media/odej-*` et `public/media/landing/` |
| `npm run media:check -- --hash` | compare aussi les sha256 à `docs/media/odej-NNN.json` |
| `npm run media:thumbs` | crée `thumbs/<nom>-480.webp` pour chaque photo et chaque poster |
| `npm run media:landing -- "<dossier>"` | prépare les paysages détourés de l'accueil dans `public/media/landing/` |
| `npm run media:publish` | prépare `.media-stage/`, sans rien envoyer |
| `npm run media:publish -- --go` | publie sur le CDN |
| `npm run media:verify -- --base <url>` | contrôle les URL publiées |
| `npm run kiosk:pack` | produit `kiosk-pack/` pour la borne |

`media:check` et `media:thumbs` acceptent `--root <dossier>` pour travailler sur une copie, comme `media:publish`.

### `media:check`

Sort en erreur sur une limite dure : fichier de plus de 24 Mio, extension autre que `webp` ou `mp4`, nom hors `[a-z0-9._-]`, photo de plus de 1600 px, vidéo de plus de 720 px, vidéo qui n'est pas en H.264 `yuv420p`, audio qui n'est pas en AAC, vidéo sans `faststart`, référence de `media.json` vers un fichier absent, fichier sans référence.

Une vidéo muette est acceptée. Les plafonds par établissement, la durée de 70 s, le total de fichiers et le total de 3 Gio ne donnent que des avertissements. `odej-003` est exempté des plafonds par établissement, pas des limites dures. Les couvertures ne comptent pas dans le nombre de photos.

`--hash` révèle une copie locale en retard sur le collègue : un fichier qui diffère de `docs/media`.

Les paysages de l'accueil (`landing`) n'ont que les limites par fichier : ni `media.json`, ni plafond d'établissement.

### `media:thumbs`

Ne modifie jamais une source. Relancé, il ne recrée que les vignettes plus anciennes que leur source. Il n'y a pas de champ dans `media.json` : l'application les retrouvera par leur nom (étape 8).

### `media:publish`

Refuse de publier si un fichier dépasse 24 Mio ou si le total dépasse 15 000 fichiers. Un humain lance `--go`, après `npx wrangler login`. Jamais la CI : les médias ne sont pas dans git. Chaque publication donne une entrée `CHANGE` dans `teamwork/Update.md`.

### `media:verify`

Envoie un `HEAD` pour chaque URL de `public/media/index.json`, 8 requêtes à la fois, et attend 200 avec le bon `Content-Type`. Sur une vidéo, une requête `Range` doit répondre 206 : un 200 avec le fichier complet donne un avertissement, toute autre réponse une erreur. Seules les erreurs font échouer la commande.

```bash
npm run media:verify -- --base https://odej-media.pages.dev/
```

Cloudflare Pages répond 200 à toutes les requêtes `Range` : chaque vidéo publiée donne donc un avertissement. La cause vient de Pages, pas de nos fichiers. Les vidéos sont lues en téléchargement progressif grâce à `faststart`, et se déplacer vers un point pas encore téléchargé est moins fluide sur le web. Le pack de la borne n'est pas concerné : `serve.mjs` répond 206.

Les vignettes ne sont pas dans l'index : elles ne sont pas contrôlées.

### `kiosk:pack`

À lancer sur le poste qui a **tous** les médias : ceux qui manquent sont listés à la fin. Produit `kiosk-pack/` à la racine du dépôt (ignoré par git) :

```
kiosk-pack/
├─ app/              application et médias
├─ serve.mjs         serveur local, sans dépendance, requêtes Range gérées
├─ start-kiosk.bat   lance le serveur, puis Chrome en plein écran
└─ LISEZMOI.txt
```

Le PC de la borne doit avoir Node.js et Google Chrome. Les médias sont locaux, mais les fonds de carte viennent encore d'internet : voir l'étape 10 du plan.

Le pack retire `dist/` à la fin, pour qu'un dossier plein de médias ne parte jamais dans un déploiement.

## Paysages de l'accueil

Quatre paysages de Béjaïa détourés composent l'accueil. Ce sont des photos : elles restent hors de git, dans `public/media/landing/`, et partent sur le CDN avec `media:publish`. `kiosk:pack` prévient s'ils manquent. Sans eux, l'accueil s'affiche sans paysages, rien ne casse.

Le propriétaire fournit les PNG transparents, nommés `haut gauche.png`, `haut droite.png`, `bas gauche.png` et `bas droite.png`. `media:landing` retire leurs marges transparentes, les ramène à 1400 px au plus et les écrit en WebP transparent : `top-left.webp`, `top-right.webp`, `bottom-left.webp`, `bottom-right.webp`. Il ne modifie jamais une source.

Leur place à l'écran est dans `app.css` (`.scene-*`), leur liste dans `landingScenes` (`src/config.ts`). La source des quatre photos et le droit de les utiliser restent à noter ici.

## Comment l'application trouve les médias

| Environnement | `VITE_MEDIA_BASE_URL` | Médias |
|---|---|---|
| `npm run dev` | absente | `public/media/` |
| Netlify | l'URL du CDN | CDN |
| Netlify sans la variable | absente | aucun : galeries masquées |
| Pack de la borne | `/media/` | dossier local |

`mediaUrl()`, dans `src/config.ts`, est le seul endroit qui fabrique une URL de média. Un média en erreur est masqué. Un établissement sans aucun média affichable n'a pas de galerie.

`npm run build` retire tous les binaires de `dist/media/` (`scripts/prune-media.mjs`), sauf `index.json` : un déploiement ne peut pas emporter les médias par accident.

## Plan B

Si Cloudflare est impossible (carte bancaire exigée, compte refusé), le site Netlify reste en ligne sans médias : c'est la dégradation prévue. Les médias vivent dans le pack de la borne, qui est de toute façon la version jouée au salon.

## Dépannage

| Symptôme | Cause et solution |
|---|---|
| `sharp is missing` | `npm ci --prefix ../../tools/media/pipeline` |
| `ffprobe not found` | installer ffmpeg, puis ouvrir un nouveau terminal |
| `wrangler` demande une connexion | `npx wrangler login`, par un humain |
| Le nom de projet `odej-media` est pris | changer `PROJECT` dans `publish.mjs` et mettre à jour `.env.example` |
| Une vidéo se déplace mal sur le web | limite connue de Cloudflare Pages, voir `media:verify` : ni un bug ni un fichier à corriger |
| `referenced but missing` | la copie locale est incomplète : récupérer les fichiers du collègue |
| `sha256 differs from docs/media` | la copie locale n'est pas la dernière version |
