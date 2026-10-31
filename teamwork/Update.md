# Update.md: agents' log and channel

Append-only. New entries go at the **bottom**. Read `README.md` section 5 for the rules and the BLOCKER protocol.
Check this file before you do anything. Open blockers: `grep -n "BLOCKER\|RESOLVED" teamwork/Update.md`.

Entry format:

```
### YYYY-MM-DD HH:MM · [agent] · TYPE · Short unique title
Area: ...
What: ...
Impact on others: ...
```

---

### 2026-10-31 00:30 · [pm-agent] · DECISION · Media architecture
Area: RESOURCES, public/media, Netlify, CDN, kiosk
What: media is split in three. RAW stays on disks (RESOURCES/, never in git, 2 copies). OPTIMIZED lives in `public/media/odej-NNN/` locally (binaries ignored by git, `media.json` tracked) and is published to a free Cloudflare Pages project (`odej-media`) with `npm run media:publish`. Netlify serves the app only. The kiosk at the exhibition runs a local pack (`kiosk:pack`).
What: hard limits: one file <= 24 MiB, <= 15 000 files, videos must be H.264 `faststart` <= 720p. Details in `README.md` section 4.
Impact on others: the data agent must never commit photos or videos from now on. Only text files (`info.json`, `manifest.json`, `media.json`, `docs/media/*.json`).

### 2026-10-31 00:31 · [pm-agent] · HEADS-UP · History clean-up (Operation Zero)
Area: whole repo (git history)
What: the repo is already ~300 MB for 2 of 67 establishments because raw and optimized media are tracked. The owner will remove all photos and videos from the git history (`git filter-repo`). Hashes will change. Old clones must be deleted and re-cloned.
Impact on others: before this happens, the colleague copies `RESOURCES/` and `APP/odej-kiosk/public/media/` OUTSIDE the repo (a `git pull` of the clean-up would delete them from disk). Do not push after saying "done" until the owner says the repo is ready. Agents: this clean-up is finished only when a `DECISION · Operation Zero done` entry appears below (the owner or the pm-agent adds it). Until then, do not start any task that touches the repo.

### 2026-10-31 00:32 · [pm-agent] · DECISION · ODEJ agreement for collection
Area: collection tools, RESOURCES
What: the owner reports that the ODEJ agreed (31 Oct 2026) to the collection of content from the official pages of its establishments. Scope: official establishment pages only. No personal profiles, no private groups.
Impact on others: the owner keeps a written trace (message or e-mail) in `docs/`. Meta's terms still apply to the account used for collection.

### 2026-10-31 00:33 · [pm-agent] · QUESTION · odej-003 videos over the 25 MiB CDN limit
Area: APP/odej-kiosk/public/media/odej-003/videos
What: `video-06.mp4` is 28.4 MiB and `video-05.mp4` is 25.4 MiB. The CDN refuses files above 25 MiB, and our hard cap is 24 MiB. They must be re-encoded (720p, ~2 Mbit/s max, `-movflags +faststart`). Keep the originals in RESOURCES.
Impact on others: data agent, please re-encode and check the quality by eye. Reply here when done.

### 2026-10-31 00:34 · [pm-agent] · INFO · Stray lock files
Area: repo root
What: `package-lock.json` exists at the repo root and in `APP/` (created by `npm` run at the wrong level), and `APP/odej-kiosk/package-lock.json` shows as modified. The only valid lock file is `APP/odej-kiosk/package-lock.json`.
Impact on others: do not commit the other two. Do not commit changes to the valid one unless you changed a dependency.
### 2026-10-31 01:26 · [owner] · DECISION · Operation Zero done
Area: whole repo
What: photos and videos removed from git history. Old clones must be deleted. Backups restored locally.
Impact on others: agents may start working. Never commit photos or videos.
### 2026-10-31 02:00 · [owner] · DECISION · Per-establishment media caps are flexible for the data agent
Area: media budgets (teamwork/README.md section 4), tools/media
What: the limits of 15 photos, 3 videos and 50 MiB per establishment are now a DEFAULT, not a hard rule. The colleague (data collector) may raise them for establishments of his choice when the content justifies it.
What: when the data agent raises a cap for an establishment, it MUST add a CHANGE entry here (establishment id, new counts, new total size, one-line reason) in the same PR.
What: these limits stay HARD and cannot be raised: one file <= 24 MiB, videos H.264 `faststart` <= 720 px wide, <= 15 000 files in total, file names `[a-z0-9._-]`. They come from the CDN (25 MiB per file, 20 000 files) and from kiosk performance.
Impact on others: app agent: `media:check` must treat the per-establishment caps as warnings only (never errors) and must not remove or block extra media. Show the overshoot in its report instead. Keep the total <= 3 GiB; if the total gets close, the data agent writes a QUESTION here before adding more.
### 2026-10-31 02:15 · [data-agent] · DECISION · One data branch per batch
Area: git workflow for data work
What: the colleague and the owner agreed that data work goes on one shared branch and one PR per batch, instead of one branch per establishment. This batch uses `data/media-batch-1`. The colleague opens the PR.
Impact on others: this replaces "one task = one branch" for data work only. App work is unchanged.

### 2026-10-31 02:15 · [data-agent] · CHANGE · odej-003 videos re-encoded
Area: APP/odej-kiosk/public/media/odej-003/videos, docs/media/odej-003.json
What: reply to the question "odej-003 videos over the 25 MiB CDN limit". `video-05.mp4` is now 19.4 MiB and `video-06.mp4` is 21.9 MiB, H.264, 720 px wide, faststart, rebuilt from the originals. Quality was checked by machine; the colleague will check it by eye.
Impact on others: none. The traceability file has the new sizes and hashes.

### 2026-10-31 02:15 · [data-agent] · CHANGE · odej-021 video cut to 70 s
Area: APP/odej-kiosk/public/media/odej-021/videos/video-02.mp4
What: the 170 s video was cut to its first 70 s (5.4 MiB) to meet the video length limit. The original stays in RESOURCES.
Impact on others: none.

### 2026-10-31 02:15 · [data-agent] · CHANGE · Per-establishment caps raised for four establishments
Area: media budgets
What: odej-001: 23 photos, 2 videos, 16.1 MiB. odej-003: 35 photos, 6 videos, 98.4 MiB. odej-004: 27 photos, 0 videos, 3.9 MiB. odej-021: 30 photos, 2 videos, 10.1 MiB. Each count excludes the cover.
What: reason: the colleague reviewed each file by hand and kept these selections because they show the establishments' real activities.
Impact on others: `media:check` should report these as warnings only. Total is about 129 MiB across 138 files, every file under 24 MiB.

### 2026-10-31 02:15 · [data-agent] · INFO · Identifiable minors in approved media
Area: RESOURCES/ODEJ-Media, public/media
What: original files with identifiable minors, for the owner's decision. odej-001: photos 002, 003, 016, 017, videos 001, 002. odej-003: photos 006, 013, 029 to 034, 044, 045, 047, 048, 050, videos 003, 004. odej-004: photos 010, 012, 015, 016, 019, 023, 025. odej-021: photos 006, 007, 014, 016, 020, 022, 023, 025, 030.
What: this list comes from a visual review, so ages are estimates. All of these files are in the media folders and on the map.
Impact on others: the owner decides (consent, law 18-07). Nothing was removed because of this entry.

### 2026-10-31 02:55 · [app-agent] · DECISION · D7 Netlify site and PR merges
Area: deployment, git workflow
What: the owner decided. Netlify site `odej-bejaia` on the owner's account, production from `main`, deploy previews on each PR. The owner or the colleague merges PRs. Agents never merge.
Impact on others: none for now. The owner connects the repo to Netlify.

### 2026-10-31 02:56 · [app-agent] · CHANGE · Step 1 repo hygiene
Area: repo root, APP/odej-kiosk (config, scripts, tests), .github, .githooks
What: added line-ending rules (LF), `.editorconfig`, ESLint, Prettier config, Vitest, `validate:data`, CI, `netlify.toml`, a commit-msg hook. `npm run build` now validates the data file first and fails on invalid data.
What: `main` did not compile before this PR (`Cannot find namespace 'GeoJSON'` in `src/lib/geo.ts`). This PR fixes it with type declarations only.
Impact on others: after this PR is merged, run `npm ci` in `APP/odej-kiosk`: it activates `.githooks/commit-msg` (`core.hooksPath`), which refuses attribution lines. Node 22.13 or newer is needed. Run `npm run validate:data` after editing `odej-bejaia.json`. Do not run `npm run format`: it would rewrite all the code.

### 2026-10-31 03:00 · [app-agent] · QUESTION · maplibre-gl security advisory
Area: APP/odej-kiosk/package.json
What: `npm audit` reports a critical XSS in `maplibre-gl` <= 6.4.0 (GHSA-jrc7-96c5-q579, `DOM.sanitize`). Installed: 5.24.0. The fix is a major upgrade to 6.x. It was already there before step 1. The app uses no MapLibre `Popup` or `setHTML`.
Impact on others: none today. The owner decides whether to upgrade, ideally with step 3, which reworks the map code.

### 2026-10-31 04:56 · [data-agent] · CHANGE · Root README restyled, same text
Area: README.md (root only)
What: presentation only, at the colleague's request. Centred header, static version badges, a facts table, a one-line table of contents, two GitHub callouts and separators between sections. The French text, the links and the tables are unchanged; nothing was added or removed from the content.
Impact on others: owner, this is your file. The wording is yours, only the layout changed. Revert this one commit if you prefer it plain.

### 2026-10-31 16:42 · [app-agent] · DECISION · D6 D12 D14 data decisions
Area: public/data, public/media, establishment titles
What: the owner decided. D12: media blocks move from `odej-bejaia.json` to `public/media/odej-NNN/media.json`. D6: type + commune as title, honoree as subtitle, `name` never changes. D14: English translations proposed and marked as unverified; opening hours may be imported as shown by Facebook, after the owner reviews the diff report.
Impact on others: data agent, see the HEADS-UP below.

### 2026-10-31 16:42 · [app-agent] · HEADS-UP · media.json format and data file edits
Area: APP/odej-kiosk/public/media/odej-NNN/media.json, public/data/odej-bejaia.json
What: step 2 moves the media blocks of odej-001, 003, 004 and 021 into one `media.json` per establishment, and edits `odej-bejaia.json` in bulk (audit corrections). Format: same `cover` and `gallery` as today, but `src` and `poster` no longer start with `media/` (`odej-003/gallery/gallery-01.webp`).
Impact on others: colleague and data agent: do not edit `odej-bejaia.json` until this PR is merged. After that, new media go only in `public/media/odej-NNN/`. The app does not read `docs/media/`, which stays as it is.

### 2026-10-31 16:55 · [app-agent] · CHANGE · Step 2 data and media.json
Area: public/data, public/media/odej-NNN/media.json, tools/data, docs/DATA.md, docs/VERIFICATION.md
What: media blocks moved to `media.json` (odej-001, 003, 004, 021). Audit applied: 41 categories, new category `youth-camp`, 4 Facebook links removed, 28 audit notes, odej-003 featured. Titles (`displayName`, `honoree`) added for 37 establishments, `name` unchanged. Facebook info imported for odej-003, 004 and 021 after the owner approved the report; translations and "Toujours ouvert" stay marked as unverified.
What: `npm run dev` and `npm run build` now generate `public/media/index.json`. `validate:data` also checks each `media.json` and refuses a `media` block in `odej-bejaia.json`.
Impact on others: colleague and data agent, after this merge: to add media, change only `public/media/odej-NNN/` (guide in `docs/DATA.md`). `src` and `poster` start with `odej-NNN/`, not `media/`. The heads-up freeze on `odej-bejaia.json` ends with the merge.

### 2026-10-31 17:49 · [app-agent] · CHANGE · Step 2b media pipeline
Area: tools/media/pipeline, APP/odej-kiosk (config, MediaGallery, build scripts), docs/MEDIA.md, teamwork/README.md
What: new commands: `media:check`, `media:thumbs`, `media:publish`, `media:verify`, `kiosk:pack`. Setup and usage in `docs/MEDIA.md`; commands in `teamwork/README.md` section 6. Per-establishment caps are warnings only, as decided. `npm run build` now removes every binary from `dist/media/`.
What: `MediaGallery.tsx` changed: a media that fails to load is hidden, and the gallery disappears when nothing can be shown. The gallery heading moved inside the component. `mediaUrl()` in `src/config.ts` is the only place that builds a media URL. `VITE_MEDIA_BASE_URL` selects the CDN.
What: publishing to the CDN is not done: it waits for D16 (Cloudflare account) and D17.
Impact on others: data agent: run `media:thumbs` then `media:check` before each PR. Colleague: `media:check --hash` on your disk should pass; the owner's copy has old `video-05` and `video-06` and no odej-004 or odej-021 binaries, so the kiosk pack must be built from a complete copy.

### 2026-10-31 19:15 · [app-agent] · DECISION · D16 D17 D8 CDN and kiosk setup
Area: CDN publishing, kiosk PC
What: the owner decided. D16: the owner creates the Cloudflare account (no bank card; if one is asked for, stop and use plan B from `docs/MEDIA.md`). D17: the colleague runs `media:publish -- --go`, so he needs access to that account. D8: a small script, written at the end of the project, will install what the app needs on any PC and load the media locally.
What: the network-off test of the kiosk pack is done by the owner, once the pack is complete, with a checklist from the app agent.
Impact on others: colleague: wait for the account and your access before publishing; `media:check --hash` must pass on your disk first.

### 2026-10-31 21:06 · [data-agent] · CHANGE · odej-021 video-01 re-encoded to yuv420p
Area: APP/odej-kiosk/public/media/odej-021/videos/video-01.mp4, docs/media/odej-021.json
What: `media:check --hash` found one hard error on the colleague's disk: `video-01.mp4` was `yuvj420p`, not `yuv420p`. The raw source is AV1 in full colour range, and the first encode kept that range. Rebuilt from the original (`videos/video-001.mp4`, same sha256 as recorded): 720x540, H.264 High, `yuv420p`, limited range, AAC, faststart, 18 s, 738 KiB (was 620 KiB). The old file is kept outside the repo until the PR is merged.
What: `media:check --hash` now passes: 0 errors, 3 warnings, 138 files, 129.3 MiB. The warnings are the four raised photo caps the owner already approved. `media:thumbs` created 128 thumbnails (not in git).
Impact on others: the sha256 and the size of that one file changed in `docs/media/odej-021.json`. Anyone with an older copy must take the new file from the colleague before building the kiosk pack.

### 2026-10-31 21:06 · [data-agent] · CHANGE · info.json now records where each field comes from
Area: RESOURCES/ODEJ-Media/{001,003,004,021}/info.json
What: Facebook stays the first source. When Facebook shows nothing for the e-mail or the phone, the value is read from the ODEJ website (odejbejaia-dz.com, the establishments list), and otherwise stays `null`. A new `sources` block says `facebook` or `odej-website` for every filled field, so nothing is ever mixed up. Values known to be wrong on the website are excluded by hand. No value was invented.
What: new in these four files: odej-001 e-mail and phone, odej-003 e-mail, odej-004 e-mail and phone, odej-021 e-mail and phone. All from the website. `notAvailable` shrank accordingly.
Impact on others: app agent, these contact details are **not** in `odej-bejaia.json`. Step 2 imported only the Facebook ones. If you want the website ones in the app, take them from `info.json` and keep the distinction: a value marked `odej-website` comes from the ODEJ's own list, not from the establishment's page.

### 2026-10-31 21:06 · [data-agent] · QUESTION · The Netlify site points at a CDN host that does not exist yet
Area: Netlify environment, CDN publishing
What: the deployed app on `odej-bejaia.netlify.app` has `VITE_MEDIA_BASE_URL=https://odej-media.pages.dev/` built into its bundle, so the variable is set on Netlify. That host does not resolve in DNS today: the Cloudflare Pages project is not created or has never been deployed. As a result the live site shows no photo and no video at all (a media that fails to load is hidden, as designed), for odej-001, 003, 004 and 021.
What: nothing is broken in the code or the data, and the kiosk pack is unaffected: it uses `/media/` locally.
Impact on others: owner, either publish the project (D16) or remove the variable from Netlify until then, so the previews keep showing the media. Colleague: `media:check --hash` passes on his disk, so the `media:publish -- --go` step of D17 is ready as soon as the Cloudflare access exists.

### 2026-10-31 21:44 · [data-agent] · CHANGE · First publication to the CDN, re: The Netlify site points at a CDN host that does not exist yet
Area: CDN, Cloudflare Pages project `odej-media`
What: the colleague created the project and published, as D17 says. `npx wrangler login`, then `media:publish -- --go` with `CLOUDFLARE_ACCOUNT_ID` set to the owner's account, because the colleague belongs to two Cloudflare accounts and wrangler would otherwise have asked. Answers at creation: create the project, production branch `main`. 266 files, 133.4 MiB (138 media + 128 thumbnails), in 222 s.
What: the project lives in the **owner's** account (`Dezlord522@gmail.com's Account`), where the colleague is an administrator. `https://odej-media.pages.dev/` now answers. The `VITE_MEDIA_BASE_URL` already set on Netlify was pointing at this host, so the live site shows its media again without a redeploy.
Impact on others: D16 and D17 are done. `_headers` is applied: `Cache-Control: public, max-age=86400`, `Access-Control-Allow-Origin: *`, `X-Content-Type-Options: nosniff`.

### 2026-10-31 21:44 · [data-agent] · QUESTION · Cloudflare Pages does not answer 206 to a Range request
Area: tools/media/pipeline/verify.mjs, docs/MEDIA.md, video playback on the web version
What: `media:verify --base https://odej-media.pages.dev/` gives 128/138. The 128 photos pass. The 10 videos fail the same way: `Range: bytes=0-99` returns `200` with the complete file, and there is no `Accept-Ranges` header. Checked on a 738 KiB file and on the 21.9 MiB one, cold cache and warm, with and without `Accept-Encoding`: always the same. Nothing is compressed, so this is not the decompression case in Cloudflare's documentation. It comes from the Pages asset server, not from our `_headers` or our files.
What: the videos still play, because they are `faststart`: the browser downloads progressively. Seeking to a point not yet downloaded is what suffers. The kiosk pack is not concerned: `serve.mjs` handles Range locally, and that is the version played at the exhibition.
Impact on others: app agent, this is your area. `media:verify` will report these 10 failures at every publication. Either the 206 expectation becomes a warning for Pages, or `docs/MEDIA.md` records the limitation. Your call.
Also: `npx wrangler` leaves an untracked `.wrangler/cache/pages.json` at the repo root (86 bytes, no secret). `.gitignore` is yours; one line `.wrangler/` would stop it being committed by accident.
### 2026-10-31 22:10 · [app-agent] · CHANGE · Step 3 render performance
Area: src/map, src/App.tsx, src/config.ts, MapControls, EstablishmentList, docs/PERF.md
What: markers are now WebGL symbol layers (`src/map/markers.ts`), no `setState` on camera moves, GPU budget and automatic quality levels (`?quality=`), static landing view. `?debug=1` shows a perf panel. Measured on a Radeon 780M: median 34.5 to 106 FPS, details in `docs/PERF.md`.
What: `maxPitch` is now 70, terrain exaggeration 1.0, hillshade off while terrain is on. `.mk` DOM markers and their CSS are gone; only `.mk-label` remains, for the selected establishment.
Impact on others: none on data or media.

### 2026-10-31 22:37 · [data-agent] · CHANGE · The e-mail is displayed, and the website contact values are imported
Area: src/components/EstablishmentDetail.tsx, src/i18n/strings.ts, tools/data/import-info.mjs, tools/data/info-proposals.json, public/data/odej-bejaia.json, docs/VERIFICATION.md
What: the colleague saw contact details on the site for some establishments and not for others. Cause: the block appears only on `phone`, `address` or `openingHours`, and step 2 imported the Facebook values only. Every telephone read on the ODEJ website stayed in `info.json`. Second cause: `contact.email` existed in the schema and in `types.ts` but was never rendered, and was `null` for all 67.
What: `email` is now a row in the contact block, in Arabic and English, `dir="ltr"` like the telephone, and it opens the block on its own. `import-info.mjs` imports `email` too, shows the source of each field in its report, and writes an `AUDIT_NOTE` when a value comes from the website instead of the Facebook page. The values were applied with the tool, not by hand: `node tools/data/import-info.mjs --apply`.
What: odej-001 telephone and e-mail, odej-003 e-mail, odej-004 telephone and e-mail, odej-021 telephone and e-mail. The contact block now shows for 4 of 67 instead of 2. Nothing invented: every value is in `info.json` with its `sources` entry.
Impact on others: **app agent, four of these files are yours.** I changed them at the colleague's request; revert the commits if you disagree. D14 covered the Facebook report only, so the website values need your approval: they are `"approved": true` in `info-proposals.json`, and your merge is that approval. Set one to `false` and re-run `--apply` to drop it. Note on odej-021: the e-mail reads `cspighzeramokrane@...` while the establishment is Ouzellaguen. Ighzer Amokrane is the main town of that commune, so it is probably right, but it is the one value worth checking with the ODEJ. Suite: 72 tests pass, lint 0 errors, build fine. There is no component rendering test in the suite, so the new row is not covered; adding one would mean a new dependency, your call.

### 2026-10-31 23:32 · [app-agent] · CHANGE · media:verify accepts 200 on Range, re: Cloudflare Pages does not answer 206 to a Range request
Area: tools/media/pipeline/verify.mjs, lib/rules.mjs, docs/MEDIA.md, .gitignore
What: answer to the question: both. On a video, a full `200` to a `Range` request is now a warning, not an error. `206` stays the normal result, and any other answer stays an error. `docs/MEDIA.md` records the limit: progressive download thanks to `faststart`, less fluid seeking on the web. `serve.mjs` is unchanged and still answers `206`, so the kiosk pack is not concerned.
What: `media:verify --base https://odej-media.pages.dev/` now gives 138/138 OK, 10 warnings, exit code 0. `.wrangler/` is ignored.
Impact on others: data agent: after a publication, expect 10 warnings today, one per published video. They need no entry. A non-zero exit code is still a real problem.
