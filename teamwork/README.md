# Teamwork guide for agents (and humans)

Read this file once per session. Then read `Update.md` (see section 5) **before you do anything else**.

## 1. The project in 6 lines

- Touch-screen kiosk for the ODEJ Béjaïa stand at the youth-establishments exhibition, 11 Nov 2026, Algiers.
- 3D map of Béjaïa wilaya with 67 youth establishments. Arabic first, English second. Portrait **and** landscape.
- Stack: React + TypeScript + Vite + MapLibre + OpenStreetMap. Data in JSON files. No back-end, no database.
- The web app deploys on Netlify. Photos and videos are **not** on Netlify and **not** in git (section 4).
- At the exhibition the kiosk runs a **local pack** (app + media on the machine), not the Netlify site.
- Two humans decide: the **owner** and the **colleague**. Either one can answer a BLOCKER.

## 2. Who owns what

| Area | Owner | Everyone else |
|---|---|---|
| `APP/odej-kiosk/src/**`, `scripts/**`, config, CI, Netlify, `tools/media/pipeline/**`, `tools/dem/**`, `tools/data/**` | **app agent** (owner's agent) | read only. Ask first. |
| `RESOURCES/**`, `tools/media/collect/**`, `APP/odej-kiosk/docs/media/**`, `APP/odej-kiosk/public/media/odej-NNN/**` (files and `media.json`) | **data agent** (colleague's agent) | read only. Ask first. |
| `APP/odej-kiosk/public/data/odej-bejaia.json` + schema | shared, until media blocks move to `media.json` | tell the other agent in `Update.md` before editing |
| `teamwork/**` | everyone | `Update.md` is append-only |

## 3. Golden rules

1. **Never push to `main`.** One task = one branch = one PR. Branch names: `step/NN-name` (app), `data/NNN-name` (data). The only exception: one entry in `teamwork/Update.md` (section 5).
2. Never force-push `main`. Never rewrite history. Never touch the other agent's branch.
3. **Never add yourself as co-author.** No `Co-Authored-By` line, no "Generated with ..." line, no mention of AI in commits, PRs, tags or files. Turn off attribution in your tool's settings.
4. Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`...). English subject, imperative, short.
5. `main` must always build: `npm ci && npm run build` in `APP/odej-kiosk`.
6. **Never invent data.** No made-up names, phone numbers, hours, descriptions or activities. Not sure? Ask.
7. Don't create accounts. Don't type passwords or API keys. If a service needs an account or a login, tell your human.
8. Every screen and component works in portrait **and** landscape, in Arabic (RTL) **and** English (LTR).
9. **Doubt, or missing context? Stop and ask your human.** Writing a BLOCKER entry (section 5) is part of asking.
10. File paths contain spaces and Arabic. Always quote paths.

## 4. Where media lives (decision of 31 Oct 2026)

Photos and videos are too big for git and for Netlify's free plan, so they are split in three:

```
RAW        RESOURCES/ODEJ-Media/NNN-<name>/{photos,videos,preview}
           10-30 GB. On the colleague's disk + a 2nd copy on an external drive.
           Never in git. Never deployed.
              |  optimize (photos WebP 1600 px, videos MP4 H.264 <= 720p, faststart)
              v
OPTIMIZED  APP/odej-kiosk/public/media/odej-NNN/...      (binaries ignored by git)
           + media.json per establishment                (tracked by git, a few KB)
              |                                  |
              | media:publish (a human)          | kiosk:pack
              v                                  v
           Free CDN (Cloudflare Pages)         Local folder copied to the kiosk PC
```

**In git:** code, JSON data, schemas, `media.json`, `docs/media/odej-NNN.json` (traceability), `info.json` and `manifest.json` of the raw folders, `tools/`, `teamwork/`.
**Never in git:** any photo or video (raw, optimized, thumbnails). `.gitignore` blocks them. If `git status` shows one, **stop**.

### Limits and budgets

| Rule | Value | Why |
|---|---|---|
| One file | **<= 24 MiB** (hard) | CDN limit is 25 MiB per file |
| Photos | WebP, <= 1600 px wide, <= 15 per establishment | gallery speed |
| Videos | MP4 H.264 + AAC, <= 720 px wide, <= 70 s, <= 3 per establishment, **`-movflags +faststart`** | must stream from the CDN |
| One establishment | <= 50 MiB in total | total target <= 3 GiB |
| `odej-003` (Oued Ghir, the star) | no per-establishment cap. The 24 MiB per-file cap still applies. | it is allowed to be big |
| Total files on the CDN | <= 15 000 | CDN limit is 20 000 |
| File names | `[a-z0-9._-]` only | URLs |

### Workflow for the data agent

1. **Collect** into `RESOURCES/ODEJ-Media/NNN-<name>/` with the collection tool (versioned in `tools/media/collect/`). The ODEJ has agreed to the collection from **the official pages of its establishments**. Nothing else: no personal profiles, no private groups, no login tricks. Respect rate limits. If you get blocked, stop and write a BLOCKER.
2. **Select** about 10 photos and 3 videos per establishment: sharp, no duplicates, no tiny-text posters. If you see identifiable minors in a photo, add an `INFO` entry in `Update.md`. The owner decides (consent, law 18-07).
3. **Optimize** into `APP/odej-kiosk/public/media/odej-NNN/` following the budgets above. Never overwrite an existing optimized file without writing a `CHANGE` entry.
4. **Describe** the files in `public/media/odej-NNN/media.json` (once step 2 of the action plan has landed) and in `docs/media/odej-NNN.json` (traceability: sha256, original, source URL, date).
5. **Check**: `npm run media:check` (available after step 2b). Until then, check the budgets by hand.
6. **Commit text files only.** `git status` must not list any photo or video.
7. **PR** from `data/NNN-name`. Add an entry in `Update.md`.
8. **Publish to the CDN**: `npm run media:publish` (dry run by default, `--go` to publish). A human who did `wrangler login` runs it. Agents never log in.

### Backups

Raw files exist on **one disk** only. Keep a second copy (external drive) and refresh it after each collection session. Raw can be re-collected from the source URLs and sha256 listed in each `manifest.json`, but a copy is much faster than a new collection.

## 5. `Update.md`: the agents' channel

`teamwork/Update.md` is a shared log and a "Slack channel" for agents.

**Before you do anything** (every session, every task):

1. `git fetch origin` and update your branch (`git pull --ff-only` on `main`, or rebase).
2. Read the **last ~100 lines** of `teamwork/Update.md`.
3. Look for open blockers: `grep -n "BLOCKER\|RESOLVED" teamwork/Update.md`. A BLOCKER is **open** when no later `RESOLVED` entry has `re: <same title>`.
4. An open BLOCKER touches your area? **Stop and tell your human.** It doesn't? Go ahead.

**After you finish** something, and whenever you change something the other agent depends on (schema, folder names, `media.json` format, scripts, commands): append an entry at the **bottom**, in the same PR.

**Entry format** (copy it, keep it under ~10 lines):

```
### 2026-10-31 14:20 · [data-agent] · CHANGE · Short title
Area: path or topic
What: one or two lines
Impact on others: none | what the other agent must know or do
```

Types: `CHANGE` (done), `HEADS-UP` (about to touch something shared, others stay away), `QUESTION` (not blocking), `BLOCKER` (stop and wait), `DECISION` (a human decided), `RESOLVED` (closes a BLOCKER, with `re: <exact title>`), `INFO`.

**BLOCKER protocol.** Use it when your human must know **before** you (or the other agent) go further. Examples: you are about to rename, move or delete files of the other agent's area; a schema change; anything that rewrites history; a risk of data loss; a legal doubt; a rule you cannot follow (a video that won't fit in 24 MiB); CI broken on `main`; unexpected conflicts.

1. Append a `BLOCKER` entry: why, what the other agent did (if related), your options, **your recommendation**.
2. Commit **only** `teamwork/Update.md` and push it straight to `main` (`git pull --rebase` first). If `main` is protected, push a branch `notes/<date>-<slug>` and tell your human.
3. **Stop that task and tell your human in the chat**, in plain words. Wait for the answer. Do not work around the blocker. You may keep working on unrelated things.
4. When the human answers, append `RESOLVED` (or `DECISION`) with the exact title.

Rules: append only. Never edit or delete someone else's entry. No secrets, no tokens. Git merges this file with the `union` driver (see `.gitattributes`), so two agents appending at the same time do not conflict. Keep your timestamp honest and the title short and unique.

Agent names: `app-agent`, `data-agent`, `pm-agent` (the project-manager conversation). Humans sign as `owner` or `colleague`.

## 6. Commands

```bash
cd APP/odej-kiosk
npm ci
npm run dev                 # http://localhost:5173  (?sim=1 screen simulator, ?debug=1 perf panel)
npm run lint && npm run typecheck && npm test && npm run build
```

Media commands (`media:check`, `media:thumbs`, `media:publish`, `media:verify`, `kiosk:pack`) arrive with step 2b. When they land, the app agent updates this section.
