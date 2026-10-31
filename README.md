# ODEJ_KIOSK

Touch-screen kiosk for the ODEJ Béjaïa stand at the youth-establishments exhibition (Algiers, 11 November 2026): a 3D map of Béjaïa wilaya and its 67 establishments, in Arabic and English, in portrait and landscape.

Stack: React, TypeScript, Vite, MapLibre, OpenStreetMap. The data lives in JSON files: no back-end, no database.

Agents and contributors read [CLAUDE.md](CLAUDE.md) and [teamwork/README.md](teamwork/README.md) first.

## Getting started

Node 22 is required (see `.nvmrc`).

```bash
cd APP/odej-kiosk
npm ci
npm run dev
```

The app opens at `http://localhost:5173`. Add `?sim=1` to the URL for the screen simulator.

`npm ci` also enables the `.githooks/commit-msg` hook through the `prepare` script.

| Command (inside `APP/odej-kiosk`) | What it does |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | unit tests (Vitest) |
| `npm run build` | validates the data, checks the types, builds `dist/` |
| `npm run validate:data` | validates `public/data/odej-bejaia.json` (schema and internal consistency) |
| `npm run format` | Prettier. Reformats all the code: only run it once agreed, in a separate `style:` commit |

## Repository layout

```
ODEJ_KIOSK/
├─ .claude/settings.json   agent settings
├─ .githooks/commit-msg    rejects attribution lines in commits
├─ .github/workflows/      CI: lint, typecheck, test, build
├─ APP/odej-kiosk/         the application (do not move it)
│  ├─ public/data/         data and schema
│  ├─ public/media/        optimized media: binaries ignored by git
│  ├─ scripts/             build scripts
│  ├─ src/                 application code
│  ├─ tests/unit/          unit tests
│  └─ docs/                data verification, media traceability
├─ RESOURCES/ODEJ-Media/   raw media: only info.json and manifest.json are tracked
├─ teamwork/               shared rules and the agents' log
└─ netlify.toml            deployment
```

## Who owns what

| Area | Owner |
|---|---|
| `APP/odej-kiosk/src/**`, `scripts/**`, configuration, CI, Netlify, `tools/media/pipeline/**`, `tools/dem/**`, `tools/data/**` | owner (app agent) |
| `RESOURCES/**`, `tools/media/collect/**`, `APP/odej-kiosk/docs/media/**`, `APP/odej-kiosk/public/media/odej-NNN/**` | colleague (data agent) |
| `APP/odej-kiosk/public/data/odej-bejaia.json` and its schema | shared: say so in `teamwork/Update.md` before editing |
| `teamwork/**` | everyone. `Update.md` is append-only |

No photo or video goes into git. The rules are in [teamwork/README.md](teamwork/README.md), section 4.

## Git workflow

- One task, one branch, one PR. Branches: `step/NN-name` for the application, `data/...` for the data.
- No direct push to `main`, except an entry in `teamwork/Update.md`. Never force-push `main`.
- Conventional Commits, subject in English, imperative.
- Before a PR: `git fetch origin && git rebase origin/main`, then `npm ci && npm run lint && npm run typecheck && npm test && npm run build`.
- CI must be green. The owner or the colleague merges: an agent never merges.

## Deployment

Netlify builds the application from `main`, with a deploy preview on every PR. The configuration is in `netlify.toml` (`base = "APP/odej-kiosk"`). Planned site: `odej-bejaia`, on the owner's Netlify account.

To reproduce the Netlify build locally, from the repository root, after `npm ci` in `APP/odej-kiosk`:

```bash
npx netlify-cli build --offline
```

`--offline` avoids having to link the folder to a Netlify site: without it, the command requires a linked site.

Netlify only serves the application. The media go through a CDN, and the exhibition kiosk runs a local pack (see [teamwork/README.md](teamwork/README.md), section 4).
