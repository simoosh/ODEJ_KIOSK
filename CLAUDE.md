# Agent instructions (read first)

1. Read `teamwork/README.md` once per session.
2. Before ANY task: `git fetch`, then read the end of `teamwork/Update.md` and check for open BLOCKER entries (protocol in the README, section 5). An open blocker in your area means: stop and tell your human.
3. Never add yourself as co-author and never mention AI in commits, PRs or files. No `Co-Authored-By` line, no "Generated with" line.
4. Never push to `main` (one exception: an entry in `teamwork/Update.md`). Never force-push. One task = one branch = one PR.
5. Never commit photos or videos. Only text files. Media rules are in the README, section 4.
6. Never invent data. Never create accounts or type credentials.
7. Unsure, or missing context? Stop and ask your human.

## Rules in short

- **Git:** branches `step/NN-name` (app) and `data/...` (data). Before a branch: `git fetch origin && git switch main && git pull --ff-only`. Before a PR: `git fetch origin && git rebase origin/main`, then lint, typecheck, tests and build. On your own branch, `--force-with-lease` only, after a rebase. Never touch the other agent's branches. A conflict you don't fully understand: stop and ask.
- **Commits:** small, Conventional Commits (`feat:`, `fix:`, `perf:`, `refactor:`, `chore:`, `docs:`, `test:`, `build:`, `ci:`), English subject, imperative, 72 characters at most. `package-lock.json` changes only with a dependency change, in a dedicated commit.
- **Attribution:** `.githooks/commit-msg` refuses attribution lines. `npm ci` activates it. `.claude/settings.json` turns attribution off.
- **Deployment:** `main` must always deploy. Before a PR, from a clean clone: `npm ci && npm run lint && npm run typecheck && npm test && npm run build`. No `localhost` URL, no absolute Windows path, no secret in the code. Runtime resources use paths relative to the site root (`import.meta.env.BASE_URL`).
- **Performance:** the kiosk is probably a weak machine (integrated GPU, 1080p or 4K). No React `setState` on every camera frame, no infinite CSS animation on many elements, no idle `requestAnimationFrame` loop. Thumbnails instead of full-size images. Videos: `preload="none"` or `"metadata"`, never several autoplaying. Justify every new dependency in the PR (gzip size, alternative).
- **Screens:** every screen and component works in portrait and landscape (1920×1080, 1080×1920, 1280×1024, 1024×768, 3840×2160), RTL (Arabic, the default) and LTR (English). Logical CSS properties only.
- **Doubt:** ask about any missing content, product choice, account, key or hardware. Never invent data, and don't translate an official text without agreement. A technical assumption with no product impact is fine if you write it in your report.
- **Code:** TypeScript `strict`. No `any` without a justifying comment. No dead code or `console.log` left in `main`. Displayed text lives in `i18n/strings.ts` or in the data. Settings live in `src/config.ts`.

## Who owns what

| Area | Owner | Others |
|---|---|---|
| `APP/odej-kiosk/src/**`, `scripts/**`, config, CI, Netlify, `tools/media/pipeline/**`, `tools/dem/**`, `tools/data/**` | app agent | read only, ask first |
| `RESOURCES/**`, `tools/media/collect/**`, `APP/odej-kiosk/docs/media/**`, `APP/odej-kiosk/public/media/odej-NNN/**` (files and `media.json`) | data agent | read only, ask first |
| `APP/odej-kiosk/public/data/odej-bejaia.json` and its schema | shared, until media blocks move to `media.json` | tell the other agent in `Update.md` before editing |
| `teamwork/**` | everyone | `Update.md` is append-only |

## Repository layout

The app stays in `APP/odej-kiosk/`: never move it.

```
ODEJ_KIOSK/
├─ .claude/settings.json            attribution turned off
├─ .editorconfig
├─ .gitattributes                   LF line endings, binaries declared
├─ .githooks/commit-msg             refuses attribution lines
├─ .github/workflows/ci.yml         lint + typecheck + test + build on each PR
├─ .gitignore
├─ .nvmrc                           22
├─ CLAUDE.md, AGENTS.md             agent rules
├─ teamwork/                        README.md (shared rules) + Update.md (agents' log)
├─ README.md
├─ netlify.toml                     base = "APP/odej-kiosk"
├─ APP/odej-kiosk/
│  ├─ public/data/                  odej-bejaia.json + schema
│  ├─ public/media/odej-NNN/        optimized media: binaries ignored, media.json tracked
│  ├─ public/terrain/, public/vendor/   planned
│  ├─ scripts/                      build scripts (data validation, media index)
│  ├─ src/
│  ├─ tests/unit/, tests/e2e/
│  └─ docs/                         VERIFICATION.md, PERF.md, DATA.md, media/
├─ tools/                           never deployed: dem/, data/, media/collect/, media/pipeline/
└─ RESOURCES/ODEJ-Media/NNN-<name>/ raw media: only info.json and manifest.json are tracked
```

## Commands

```bash
# from APP/odej-kiosk
npm ci
npm run dev                 # http://localhost:5173  (?sim=1 screen simulator)
npm run lint && npm run typecheck && npm test && npm run build
npm run validate:data       # data file: schema and internal consistency
npm run preview

# from the repo root
npx netlify-cli build       # reproduces the Netlify build
```

Paths contain spaces and Arabic: always quote them.
