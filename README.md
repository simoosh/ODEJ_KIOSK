<div align="center">

# ODEJ_KIOSK

**Borne tactile de l'ODEJ Béjaïa pour le salon des établissements de jeunesse**
_Alger · 11 novembre 2026_

Une carte 3D de la wilaya de Béjaïa et de ses 67 établissements,
en arabe et en anglais, en portrait et en paysage.

<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19">
<img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5.7">
<img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6">
<img src="https://img.shields.io/badge/MapLibre-5-295DAA?style=flat-square&logo=maplibre&logoColor=white" alt="MapLibre 5">
<img src="https://img.shields.io/badge/Node-22-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node 22">

</div>

---

Stack : React, TypeScript, Vite, MapLibre, OpenStreetMap. Les données sont dans des fichiers JSON : pas de back-end, pas de base de données.

> [!IMPORTANT]
> Les agents et les contributeurs lisent d'abord [CLAUDE.md](CLAUDE.md) et [teamwork/README.md](teamwork/README.md).

| | |
|---|---|
| **Événement** | Salon des établissements de jeunesse, Alger |
| **Date** | 11 novembre 2026 |
| **Contenu** | 67 établissements · 6 catégories · 43 communes et lieux-dits |
| **Langues** | arabe (par défaut) et anglais |
| **Affichage** | portrait et paysage |
| **Hébergement** | Netlify pour l'application, CDN pour les médias, pack local sur la borne |

### Sommaire

[Démarrage](#démarrage) · [Arborescence](#arborescence) · [Répartition des fichiers](#répartition-des-fichiers) · [Workflow git](#workflow-git) · [Déploiement](#déploiement)

---

## Démarrage

Node 22 est requis (voir `.nvmrc`).

```bash
cd APP/odej-kiosk
npm ci
npm run dev
```

L'application s'ouvre sur `http://localhost:5173`. Ajoute `?sim=1` à l'URL pour le simulateur d'écrans, `?debug=1` pour le panneau de performance et `?quality=low` pour imposer un niveau de qualité (voir [docs/PERF.md](APP/odej-kiosk/docs/PERF.md)).

`npm ci` active aussi le hook `.githooks/commit-msg` avec le script `prepare`.

| Commande (dans `APP/odej-kiosk`) | Rôle |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | tests unitaires (Vitest) |
| `npm run build` | valide les données, vérifie les types, construit `dist/` |
| `npm run validate:data` | valide `public/data/odej-bejaia.json` (schéma et cohérence interne) |
| `npm run format` | Prettier. Reformate tout le code : à ne lancer qu'après accord, dans un commit `style:` séparé |
| `npm run media:check` | contrôle les médias. Les autres outils sont dans [docs/MEDIA.md](APP/odej-kiosk/docs/MEDIA.md) |
| `npm run kiosk:pack` | produit `kiosk-pack/`, le dossier à copier sur le PC de la borne |

---

## Arborescence

```
ODEJ_KIOSK/
├─ .claude/settings.json   réglages de l'agent
├─ .githooks/commit-msg    refuse les lignes d'attribution dans les commits
├─ .github/workflows/      CI : lint, typecheck, test, build
├─ APP/odej-kiosk/         l'application (ne pas déplacer)
│  ├─ public/data/         données et schéma
│  ├─ public/media/        médias optimisés : binaires ignorés par git
│  ├─ scripts/             scripts de build
│  ├─ src/                 code de l'application
│  ├─ tests/unit/          tests unitaires
│  └─ docs/                vérification des données, traçabilité des médias
├─ tools/                  scripts hors application : data/, media/pipeline/
├─ RESOURCES/ODEJ-Media/   médias bruts : seuls info.json et manifest.json sont suivis
├─ teamwork/               règles partagées et journal des agents
└─ netlify.toml            déploiement
```

---

## Répartition des fichiers

| Zone | Responsable |
|---|---|
| `APP/odej-kiosk/src/**`, `scripts/**`, configuration, CI, Netlify, `tools/media/pipeline/**`, `tools/dem/**`, `tools/data/**` | propriétaire (agent applicatif) |
| `RESOURCES/**`, `tools/media/collect/**`, `APP/odej-kiosk/docs/media/**`, `APP/odej-kiosk/public/media/odej-NNN/**` | collègue (agent données) |
| `APP/odej-kiosk/public/data/odej-bejaia.json` et son schéma | partagé : prévenir dans `teamwork/Update.md` avant d'éditer |
| `teamwork/**` | tout le monde. `Update.md` se modifie en ajout seulement |

> [!WARNING]
> Aucune photo ni vidéo n'entre dans git. Les règles sont dans [teamwork/README.md](teamwork/README.md), section 4.

---

## Workflow git

- Une tâche, une branche, une PR. Branches : `step/NN-nom` pour l'application, `data/...` pour les données.
- Pas de push direct sur `main`, sauf une entrée dans `teamwork/Update.md`. Jamais de force-push sur `main`.
- Commits au format Conventional Commits, sujet en anglais à l'impératif.
- Avant une PR : `git fetch origin && git rebase origin/main`, puis `npm ci && npm run lint && npm run typecheck && npm test && npm run build`.
- La CI doit être verte. Le propriétaire ou le collègue fusionne : un agent ne fusionne jamais.

---

## Déploiement

Netlify construit l'application depuis `main`, avec un aperçu de déploiement sur chaque PR. La configuration est dans `netlify.toml` (`base = "APP/odej-kiosk"`). Site prévu : `odej-bejaia`, sur le compte Netlify du propriétaire.

Pour reproduire le build Netlify en local, depuis la racine du dépôt, après `npm ci` dans `APP/odej-kiosk` :

```bash
npx netlify-cli build --offline
```

`--offline` évite d'avoir à lier le dossier à un site Netlify : sans cette option, la commande exige un site lié.

Netlify ne sert que l'application. Les médias passent par un CDN, et la borne du salon exécute un pack local (voir [teamwork/README.md](teamwork/README.md), section 4).

### Mode borne

`npm run kiosk:pack` produit `kiosk-pack/`, à copier sur le PC de la borne. Node.js et Google Chrome doivent y être installés. `start-kiosk.bat` lance le serveur local, puis Chrome avec ces options :

```
--kiosk --no-first-run --disable-pinch --overscroll-history-navigation=0 --user-data-dir=chrome-profile
```

Détails dans [docs/MEDIA.md](APP/odej-kiosk/docs/MEDIA.md).
