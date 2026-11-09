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
### 2026-10-31 23:05 · [app-agent] · CHANGE · maplibre-gl upgraded to 6.16.0
Area: APP/odej-kiosk (dependency, MapView, config), tools/media/pipeline/kiosk/serve.mjs, docs/PERF.md
What: fixes the critical XSS (GHSA-jrc7-96c5-q579). `npm audit --omit=dev` reports 0 vulnerabilities. Version 6 is ESM only, so `setWorkerUrl()` is set in `MapView.tsx` and the kiosk server now serves `.mjs` as JavaScript. Arabic labels no longer need the RTL plugin, so the `unpkg.com` download is gone.
Impact on others: run `npm ci` in `APP/odej-kiosk` after this merge. `dist/assets` gains a 519 KB worker file.

### 2026-11-01 00:32 · [data-agent] · CHANGE · odej-005 Amizour added, 28 photos, caps raised
Area: RESOURCES/ODEJ-Media/005-*, public/media/odej-005, docs/media/odej-005.json
What: fifth establishment collected and optimized. 1 cover + 27 gallery photos, no video: the scrape finished with `videos_found: 0`, the page has none. 5.7 MiB, largest file 0.54 MiB. `media:check --hash` passes with 0 errors.
What: cap raised for odej-005 to 28 photos, 0 videos, 5.7 MiB. Reason: the colleague chose to keep the whole reviewed set. Well inside the 50 MiB per-establishment default, and no hard limit is near.
What: 13 of the 28 are registration posters whose text is too small to read at kiosk distance, and `photo-004`, `photo-023`, `photo-024` are three frames of the same hike. The colleague knows and decided to keep them. The cover is the CSP Amizour building exterior, 785 px wide, which is small for a full-screen view.
Impact on others: project total is now 166 files and 135.0 MiB of 3 GiB. `info.json` for odej-005 has the e-mail and the telephone from the ODEJ website, not yet in `odej-bejaia.json`. Its `facebookCategory` reads "Restaurant" for a sports complex, like odej-004: one for the ODEJ to confirm.

### 2026-11-01 00:32 · [data-agent] · INFO · Identifiable minors in odej-005
Area: RESOURCES/ODEJ-Media/005-*, public/media/odej-005
What: children's faces are recognisable in `photo-001` (about ten girls in costume on stage), `photo-015` (close-up of one girl, the most exposed of the set), `photo-018` (children with a mascot) and `photo-020` (boys at the table-tennis table). Less identifiable, distant or from behind: `photo-016` and `photo-019`.
What: this comes from looking at every photo, so the ages are estimates. All of these are in the optimized set and will go to the CDN.
Impact on others: owner, this is your decision, consent and law 18-07. Nothing was removed.

### 2026-11-01 00:57 · [app-agent] · DECISION · D10 minors in published media
Area: public/media, CDN `odej-media`, kiosk pack
What: the owner states that the ODEJ has given its agreement for the media listed in the entry "Identifiable minors in approved media". These media stay online and on the kiosk. Nothing is removed.
Impact on others: none on files. The owner keeps a written trace of the agreement (date, name, scope). Data agent: keep reporting new identifiable minors with an `INFO` entry; this decision covers the listed files only.

### 2026-11-01 01:08 · [data-agent] · CHANGE · Second CDN publication, odej-005 included
Area: CDN `odej-media`, public/media
What: `media:publish -- --go` run by the colleague. 322 files, 140.7 MiB sent, which is the 166 media plus the 156 thumbnails. Second deployment of the project; the first was 31 Oct 20:40 UTC with 266 files.
What: all 166 URLs of `public/media/index.json` answer 200 with the right type: 156 `image/webp`, 10 `video/mp4`. The 10 videos still answer 200 to a Range request, which is the Pages limitation already recorded and now a warning.
What: the first attempt failed with "auth token has expired and could not be refreshed". The login was fine. This machine has no IPv6 route while these hosts publish AAAA records, and Node does not fall back to IPv4 the way curl does. A retry worked. `media:verify` cannot run here for the same reason, so the 166 URLs were checked with curl over IPv4 instead; the result is the same list of URLs from the same `index.json`.
Impact on others: the CDN now serves odej-001, 003, 004, 005 and 021. Project total 166 files, 135.0 MiB of 3 GiB. Owner, `media:verify` should work normally on your machine; this is local to the colleague's network.

### 2026-11-01 01:08 · [data-agent] · QUESTION · odej-005 minors are published but outside D10, re: D10 minors in published media
Area: public/media/odej-005, CDN `odej-media`
What: D10 says the ODEJ agreement covers "the media listed in the entry Identifiable minors in approved media", which is odej-001, 003, 004 and 021, and that the decision covers the listed files only. The odej-005 files reported in "Identifiable minors in odej-005" are a separate list, and they went to the CDN in the publication above before any decision on them.
What: the files are `photo-001`, `photo-015`, `photo-018` and `photo-020` as clearly identifiable, `photo-016` and `photo-019` as distant or from behind. They are now `odej-005/gallery/*.webp` and reachable publicly.
Impact on others: owner, this needs the same agreement as D10, or the word to remove them. Not blocking the rest of the work, and nothing will be removed without your answer. Tell us which and the data agent takes them out of `media.json`, re-runs the optimizer and republishes.

### 2026-11-01 01:48 · [app-agent] · CHANGE · Step 4 self-hosted terrain
Area: tools/dem, APP/odej-kiosk/public/terrain, basemaps, netlify.toml
What: relief now comes from `public/terrain/`: Copernicus GLO-30, 1171 OSM sports areas flattened, 134 Terrain-RGB WebP tiles, 13.8 MiB, zooms 8 to 11. Mapzen tiles are gone. The tiles are binary files tracked by git, because the site needs them at build time; `media:check`, `media:publish` and the CDN do not touch them.
Impact on others: to rebuild: `tools/dem/README.md`. The kiosk pack now has local terrain.

### 2026-11-01 02:37 · [app-agent] · DECISION · D10 extended to all platform media, re: odej-005 minors are published but outside D10
Area: public/media, CDN `odej-media`, public/terrain
What: the owner states that the ODEJ agreement covers absolutely all the photos and videos used in the platform, odej-005 included. This replaces the "listed files only" limit of the earlier D10 entry. Nothing is removed.
What: the owner also decided that the terrain tiles stay in the repository, not on the CDN.
Impact on others: data agent: no removal needed for odej-005. New media no longer wait for a per-file decision on minors.

### 2026-11-01 02:47 · [app-agent] · CHANGE · Step 5 basemaps
Area: src/map, src/config.ts, src/i18n/strings.ts, .env.example
What: only Plan and Satellite remain, with the 3D relief switch: OSM classic and OpenTopoMap are removed. Satellite source capped at z17, map at z18, so the "Map data not yet available" squares are gone. If a basemap fails, the app shows the fallback grid with the markers and a notice, including when the style itself never loads. Optional `VITE_SATELLITE_KEY` for an ArcGIS key (D3 still open).
Impact on others: none on data or media.
### 2026-11-01 02:56 · [data-agent] · CHANGE · odej-007, 008, 009 and 010 added, caps raised
Area: RESOURCES/ODEJ-Media/{007,008,009,010}-*, public/media/odej-{007,008,009,010}, docs/media
What: four establishments collected and optimized. `media:check --hash` passes with 0 errors. Counts exclude the cover: odej-007 32 photos, 1 video, 12.3 MiB. odej-008 26 photos, 1 video, 20.5 MiB. odej-009 28 photos, 1 video, 8.4 MiB. odej-010 23 photos, 3 videos, 14.2 MiB. Every file is under 24 MiB.
What: caps raised for these four, all far under 50 MiB. Reason: the colleague kept each reviewed set. The odej-008 video was 31.6 MiB, 1080x1920, 69.9 s in the original. It is now 15.6 MiB at 720 px wide, so it fits.
What: the odej-008 cover is not from Facebook. The colleague supplied `IMG-20261101-WA0002.jpg` (1600x900, an aerial view of a stone building with a dark dome) and chose it as the cover. It is stored as `preview/preview-2.jpg` next to the original `preview.jpg`, which stays on disk, and `manifest.json` points at it. It appears to show the same building as `photo-026` in that folder. The scrappper rebuilds the manifest from its database, so a later rewrite of that manifest would put `preview.jpg` back.
What: a light review found nothing that blocks publishing. Left in place, the colleague's call: odej-007 has 26 of 33 photos under 1000 px wide, a badminton poster (`photo-003`) and a photo of the Martyrs' Memorial in Algiers (`photo-002`). odej-008 `photo-001` is an advertising banner. odej-009 has three posters (`photo-003`, `photo-012`, `photo-026`). odej-010 has three low-resolution videos, 360 to 480 px wide, and several photos with a burned-in date stamp.
Impact on others: project total is 291 files and 190.4 MiB of 3 GiB. The children in these photos are covered by D10 as extended, so there is no per-file INFO entry. `info.json` has an e-mail for all four, and a telephone for odej-009 and odej-010. None of it is in `odej-bejaia.json` yet. odej-010 shares its coordinates with #32, a dataset warning that does not touch the media.

### 2026-11-01 02:56 · [data-agent] · QUESTION · .gitignore does not ignore .avif
Area: .gitignore
What: `RESOURCES/**/*.heic` is ignored, `.avif` is not. Facebook served odej-007 `photo-001` and its preview as AVIF, and `git add` would have taken both. They were left out of the commit by staging explicit paths. They stay untracked, so a later `git add -A` would pick them up.
Impact on others: app agent, this is your file. Please add `RESOURCES/**/*.avif` to `.gitignore`. Not blocking.

### 2026-11-01 02:58 · [data-agent] · CHANGE · .gitignore now ignores .avif, re: .gitignore does not ignore .avif
Area: .gitignore
What: one line added after the `heic` rule: `RESOURCES/**/*.avif`. It is the exact fix the question above asked for. `git check-ignore` confirms the two odej-007 AVIF originals are now ignored, and `git status` is clean.
What: the colleague asked for it and said the data agent may edit this file for it, so the app agent was not waited for. Nothing else in `.gitignore` changed.
Impact on others: app agent, this is your file. Revert the one line if you disagree, but then `git add -A` takes the two AVIF files again.

### 2026-11-01 03:05 · [data-agent] · CHANGE · Third CDN publication, odej-007 to 010 included
Area: CDN `odej-media`, public/media
What: `media:publish -- --go` run by the colleague. 566 files, 200.2 MiB staged, which is the 291 media plus the 275 thumbnails. The CDN now serves odej-001, 003, 004, 005, 007, 008, 009, 010 and 021.
What: all 291 URLs of `public/media/index.json` answer 200: 275 `image/webp` and 16 `video/mp4`. The thumbnails and the odej-008 cover were spot-checked too, and the cover on the CDN is byte for byte the local file. As in the previous publication, `media:verify` cannot run on the colleague's machine because it has no IPv6 route, so the check was done with curl over IPv4 on the same list.
What: before the PR, on the rebased branch: `validate:data`, lint (0 errors, 9 existing warnings), typecheck, 75 tests and the build all pass.
Impact on others: project total is 291 files and 190.4 MiB of 3 GiB. Nothing to do on your side. The odej-007 to 010 entries above carry the details.

### 2026-11-01 04:09 · [app-agent] · CHANGE · Terrain edges no longer stretched
Area: tools/dem/build.py, APP/odej-kiosk/public/terrain
What: the outer parts of the terrain tiles repeated the last source pixel, which showed as streaks around the wilaya. The build now downloads real GLO-30 data for the whole tile surface. 134 tiles, 15.7 MiB.
Impact on others: none.
### 2026-11-01 04:29 · [app-agent] · CHANGE · Step 6 framing, mask and landing tour
Area: public/data (`bejaia-boundary.geojson`, `wilaya.camera` in `odej-bejaia.json` and its schema), src/map, src/config.ts, tools/data/build-boundary.mjs
What: `wilaya.camera` loses `center` and `zoom`: the framing is computed from the OSM boundary. This edits the shared data file, two lines in the block above `establishments`. Neighbouring wilayas are muted by a mask. The landing shows a slow tour over land.
Impact on others: data agent: rebase before editing `odej-bejaia.json`. Nothing changes for media.

### 2026-11-01 05:18 · [data-agent] · CHANGE · odej-011, 012, 013, 016, 017 and 041 added, caps raised
Area: RESOURCES/ODEJ-Media/{011,012,013,016,017,041}-*, public/media/odej-{011,012,013,016,017,041}, docs/media
What: six establishments collected and optimized. `media:check --hash` passes with 0 errors. Counts exclude the cover: odej-011 0 photos (only a cover), odej-012 38 photos, 2 videos, 9.5 MiB. odej-013 15 photos, 0 videos, 1.6 MiB. odej-016 38 photos, 2 videos, 18.9 MiB. odej-017 33 photos, 3 videos, 29.0 MiB. odej-041 36 photos, 2 videos, 7.8 MiB. Every file is under 24 MiB.
What: caps raised for 012, 016, 017 and 041 (photos over 15, and odej-017 at 3 videos), all far under 50 MiB. Reason: the colleague kept each reviewed set. odej-016 `video-02` runs 90 s, over the 70 s default, a warning only.
What: odej-012 `video-02` is not from Facebook. The colleague supplied it (30 s, 324x640, H.264 + AAC) and it was added to that `manifest.json` by hand with tool `manual`. The scrappper rebuilds the manifest from its database, so a later rewrite would drop that entry. One Facebook video for odej-012 failed ("Video is damaged") and is listed in `failed`.
What: light review, nothing blocks publishing. Left in place: odej-013 has all 16 photos under 1000 px wide, odej-012 19 of 39, odej-041 15 of 37. The children in these photos are covered by D10 as extended, so there is no per-file INFO entry. `info.json` has a telephone and an e-mail for all six except odej-041 (no e-mail) and odej-011, where only the cover was kept. None of it is in `odej-bejaia.json` yet.
What: new file `tools/media/collect/status_table.py` prints the table below. Run it to refresh the table at any time.
Impact on others: project total, once uploaded, is 475 files and 257.2 MiB of 3 GiB. Nothing to do on your side. App agent: the contact import (`tools/data/import-info.mjs`) still has to run for odej-005 to 041.

### 2026-11-01 05:18 · [data-agent] · INFO · Establishments collected so far, with their data
Area: public/media, RESOURCES/ODEJ-Media
What: table of the establishments that already have media on the map, state after the batch above is uploaded.

| # | Establishment | Commune | Photos | Videos | MiB | Cover | Phone | E-mail | Address | Hours | Contact on map |
|--:|---|---|--:|--:|--:|:-:|:-:|:-:|:-:|:-:|:-:|
| 001 | Adekar Local Sports Complex | Adekar | 23 | 2 | 16.2 | yes | yes | yes | - | - | yes |
| 003 | Oued Ghir Science Leisure Centre | Oued Ghir | 35 | 6 | 98.9 | - | yes | yes | yes | yes | yes |
| 004 | Hamia Mohand Cherif Local Sports Complex | Beni Maouche | 27 | 0 | 3.9 | yes | yes | yes | yes | - | yes |
| 005 | Martyr Ouaglis Mohand Akli | Amizour | 27 | 0 | 5.7 | yes | yes | yes | - | - | - |
| 007 | Martyr Hamai Bachir | Chemini | 32 | 1 | 12.3 | yes | - | yes | yes | - | - |
| 008 | Mujahid Mohamed Boudiaf | Aokas | 26 | 1 | 20.5 | yes | - | yes | - | - | - |
| 009 | El Kseur Local Sports Complex | El Kseur | 28 | 1 | 8.4 | yes | yes | yes | yes | - | - |
| 010 | Martyr Bouhired Said | Souk El Tenine | 23 | 3 | 14.2 | yes | yes | yes | - | - | - |
| 011 | Ait Salah Martyrs | Bejaia | 0 | 0 | 0.0 | yes | yes | yes | yes | - | - |
| 012 | Martyr Khaldi Abdelkader | Senadla | 38 | 2 | 9.5 | yes | yes | yes | - | - | - |
| 013 | Tibane Youth Centre | Tibane | 15 | 0 | 1.6 | yes | yes | yes | yes | yes | - |
| 016 | Mouloud Feraoun | El Kseur | 38 | 2 | 18.9 | yes | yes | yes | - | - | - |
| 017 | Martyr Abderrahmane Fares | Akbou | 33 | 3 | 29.0 | yes | yes | yes | - | - | - |
| 021 | Martyr Chila Tayeb | Ouzellaguen | 30 | 2 | 10.3 | yes | yes | yes | - | - | yes |
| 041 | Chellata Youth Centre | Chellata | 36 | 2 | 7.8 | yes | yes | - | yes | - | - |
| | **15 of 67 collected** | | **411** | **25** | **257.2** | | | | | | |

Phone, E-mail, Address and Hours come from `info.json` (scrappper). 'Contact on map' says whether `odej-bejaia.json` already shows a phone or e-mail. Sizes are the optimized files, cover included, without thumbnails.

Impact on others: none. Remaining: 52 establishments with no media yet.

### 2026-11-01 05:34 · [data-agent] · CHANGE · Fourth CDN publication, odej-011 to 041 included
Area: CDN `odej-media`, public/media
What: `media:publish -- --go` run by the colleague. 925 files, 272.8 MiB staged, which is the 475 media plus the 450 thumbnails. The CDN now serves odej-001, 003, 004, 005, 007, 008, 009, 010, 011, 012, 013, 016, 017, 021 and 041.
What: all 925 URLs answer 200 over IPv4 with curl: image/webp or video/mp4. `media:verify` still cannot run on the colleague's machine (no IPv6 route). On the rebased branch: `validate:data`, lint (0 errors, 9 existing warnings), typecheck, 79 tests, the build and `media:check --hash` all pass.
Impact on others: project total is 475 files and 257.2 MiB of 3 GiB. Nothing to do on your side.

### 2026-11-01 17:20 · [data-agent] · CHANGE · odej-018 to 027 added, caps raised
Area: RESOURCES/ODEJ-Media/{018,019,020,022,023,024,025,026,027}-*, public/media, docs/media
What: nine establishments collected and optimized. `media:check --hash` passes with 0 errors. Counts exclude the cover: odej-018 43 photos, 2 videos, 8.8 MiB. odej-019 5 photos, 7 videos, 19.8 MiB. odej-020 24 photos, 1 video, 6.8 MiB. odej-022 46 photos, 2 videos, 15.9 MiB. odej-023 40 photos, 2 videos, 14.2 MiB. odej-024 36 photos, 3 videos, 10.8 MiB. odej-025 37 photos, 1 video, 12.9 MiB. odej-026 47 photos, 3 videos, 15.0 MiB. odej-027 40 photos, 4 videos, 16.2 MiB.
What: caps raised for all nine: photos over 15 for eight of them, videos over 3 for odej-019 and 027. All far under 50 MiB. Reason: the colleague kept each reviewed set.
What: odej-018 `video-02` and odej-026 `video-03` came out `yuvj420p`. Both were rebuilt from the originals as `yuv420p`, limited range, and their sizes and hashes updated in `docs/media`. `tools/publish_media.py` in the scrappper still has this trap for full-range sources.
Impact on others: project total is 852 files and 377.5 MiB of 3 GiB. Problems found in this batch are in `teamwork/Data.md`. App agent: run `tools/data/import-info.mjs` only after reading section 6 of that file, because some values must not be imported.

### 2026-11-01 17:21 · [data-agent] · CHANGE · Fifth CDN publication, odej-018 to 027 included
Area: CDN `odej-media`, public/media
What: `media:publish -- --go` run by the colleague. 1654 files, 404.4 MiB staged: 852 media plus 802 thumbnails. The CDN now serves 24 establishments.
What: all 1654 URLs answer 200 over IPv4 with curl: 1604 `image/webp`, 50 `video/mp4`. One re-encoded video was compared byte for byte with the local file. `media:verify` still cannot run on this machine (no IPv6 route).
Impact on others: nothing to do on your side.

### 2026-11-01 17:22 · [data-agent] · CHANGE · New data problems register
Area: teamwork/Data.md, teamwork/README.md section 4
What: at the colleague's request, `Data.md` lists every open problem with the establishments' data: coordinates, Facebook pages, names, types, contact details and media. It covers the 24 scraped establishments and the 43 still to scrape. The workflow now requires updating it in each batch PR.
Impact on others: when you solve a listed problem, delete its line and add a `CHANGE` entry here. `Data.md` is not append-only.

### 2026-11-01 17:52 · [data-agent] · INFO · Establishments collected so far, 24 of 67
Area: public/media, RESOURCES/ODEJ-Media
What: updated table of the establishments with media on the map, after the fifth CDN publication. It replaces the 15-row table of 2026-11-01 05:18. Refresh it with `python3 tools/media/collect/status_table.py`.

| # | Establishment | Commune | Photos | Videos | MiB | Cover | Phone | E-mail | Address | Hours | Contact on map |
|--:|---|---|--:|--:|--:|:-:|:-:|:-:|:-:|:-:|:-:|
| 001 | Adekar Local Sports Complex | Adekar | 23 | 2 | 16.2 | yes | yes | yes | - | - | yes |
| 003 | Oued Ghir Science Leisure Centre | Oued Ghir | 35 | 6 | 98.9 | - | yes | yes | yes | yes | yes |
| 004 | Hamia Mohand Cherif Local Sports Complex | Beni Maouche | 27 | 0 | 3.9 | yes | yes | yes | yes | - | yes |
| 005 | Martyr Ouaglis Mohand Akli | Amizour | 27 | 0 | 5.7 | yes | yes | yes | - | - | - |
| 007 | Martyr Hamai Bachir | Chemini | 32 | 1 | 12.3 | yes | - | yes | yes | - | - |
| 008 | Mujahid Mohamed Boudiaf | Aokas | 26 | 1 | 20.5 | yes | - | yes | - | - | - |
| 009 | El Kseur Local Sports Complex | El Kseur | 28 | 1 | 8.4 | yes | yes | yes | yes | - | - |
| 010 | Martyr Bouhired Said | Souk El Tenine | 23 | 3 | 14.2 | yes | yes | yes | - | - | - |
| 011 | Ait Salah Martyrs | Bejaia | 0 | 0 | 0.0 | yes | yes | yes | yes | - | - |
| 012 | Martyr Khaldi Abdelkader | Senadla | 38 | 2 | 9.5 | yes | yes | yes | - | - | - |
| 013 | Tibane Youth Centre | Tibane | 15 | 0 | 1.6 | yes | yes | yes | yes | yes | - |
| 016 | Mouloud Feraoun | El Kseur | 38 | 2 | 18.9 | yes | yes | yes | - | - | - |
| 017 | Martyr Abderrahmane Fares | Akbou | 33 | 3 | 29.0 | yes | yes | yes | - | - | - |
| 018 | Takriets Youth Centre | Takriets | 43 | 2 | 8.8 | yes | yes | yes | yes | yes | - |
| 019 | Martyr Maadaoui Bouelsaad | Guendouza | 5 | 7 | 19.8 | yes | yes | yes | yes | - | - |
| 020 | Tifra Local Sports Complex | Tifra | 24 | 1 | 6.8 | yes | yes | yes | yes | - | - |
| 021 | Martyr Chila Tayeb | Ouzellaguen | 30 | 2 | 10.3 | yes | yes | yes | - | - | yes |
| 022 | Barbacha Local Sports Complex | Barbacha | 46 | 2 | 15.9 | yes | yes | yes | - | - | - |
| 023 | Ait R'zine Youth Centre | Ait R'zine | 40 | 2 | 14.2 | yes | yes | yes | yes | - | - |
| 024 | Martyr Bentedji Mohand Akli | Barbacha | 36 | 3 | 10.8 | yes | - | yes | yes | - | - |
| 025 | 18 February Martyrs' Day | Tamridjet | 37 | 1 | 12.9 | yes | yes | yes | - | - | - |
| 026 | Tizi El Oued Youth Centre | Tizi El Oued | 47 | 3 | 14.9 | yes | yes | yes | yes | - | - |
| 027 | Martyr Banoun Akli | not known | 40 | 4 | 16.2 | yes | yes | yes | - | - | - |
| 041 | Chellata Youth Centre | Chellata | 36 | 2 | 7.8 | yes | yes | - | yes | - | - |
| | **24 of 67 collected** | | **729** | **50** | **377.5** | | | | | | |

Phone, E-mail, Address and Hours come from `info.json` (scrappper). 'Contact on map' says whether `odej-bejaia.json` already shows a phone or e-mail. Sizes are the optimized files, cover included, without thumbnails.

Impact on others: none. Remaining: 43 establishments with no media yet. Open problems are in `teamwork/Data.md`.

### 2026-11-01 19:49 · [app-agent] · DECISION · Kiosk screen is 1080p at most
Area: screens, performance
What: the owner states that no 4K screen will be used. 1080p is the maximum, so 3840×2160 leaves the screen list in `CLAUDE.md`.
Impact on others: none.

### 2026-11-01 19:49 · [app-agent] · CHANGE · Map polish before step 7
Area: src/map, src/config.ts, tools/dem, APP/odej-kiosk/public/terrain
What: at the owner's request: fog replaces the outline and the mask, the zoom-out is limited to the wilaya, the landing turns 360° without stopping (it replaces the tour of step 6), satellite detail stays uniform in the whole view, and tiles are preloaded on the landing screen. Terrain now covers 35.9°N and up: 156 tiles, 18.5 MiB.
What: about 6 000 tiles are fetched in the background, including from Esri. This adds to the open D3 question.
Impact on others: none on data or media.

### 2026-11-01 21:25 · [app-agent] · CHANGE · Progressive fog and landing redesign
Area: src/map/fog.ts, src/lib/clouds.ts, src/components/Landing.tsx, src/styles/app.css, tools/dem, public/terrain
What: at the owner's request: the fog now thickens with the distance to the boundary, so the sea and part of the neighbouring wilayas stay visible. The landing is split horizontally: centered text over clouds, the map turning below. The button opens the clouds to the sides while the text leaves upwards.
What: terrain and satellite now reach the neighbours: 224 tiles, 23.1 MiB. The landing card is reduced to the three figures: `wilaya.description` is no longer shown.
Impact on others: none on data or media.

### 2026-11-01 22:40 · [data-agent] · CHANGE · odej-028 to 038 added, caps raised
Area: RESOURCES/ODEJ-Media/{028,029,030,031,032,033,034,035,036,038}-*, public/media, docs/media
What: ten establishments collected and optimized. `media:check --hash` passes with 0 errors. Counts exclude the cover: odej-028 49 photos, 3 videos, 35.7 MiB. odej-029 41 photos, 0 videos, 5.3 MiB. odej-030 35 photos, 1 video, 16.5 MiB. odej-031 1 photo, 0 videos, 0.2 MiB. odej-032 40 photos, 2 videos, 12.6 MiB. odej-033 48 photos, 2 videos, 17.5 MiB. odej-034 46 photos, 4 videos, 11.5 MiB. odej-035 32 photos, 0 videos, 4.3 MiB. odej-036 55 photos, 1 video, 11.6 MiB. odej-038 41 photos, 1 video, 9.4 MiB.
What: caps raised for nine of them: photos over 15 for all but odej-031, videos over 3 for odej-034. All under 50 MiB. Reason: the colleague kept each reviewed set.
What: odej-028 `video-01` was 31.5 MiB and `yuvj420p`, and the four odej-034 videos were `yuvj420p`. All five were rebuilt from the originals as `yuv420p`, limited range, with sizes and hashes updated in `docs/media`. odej-028 `video-01` is now 18.0 MiB and runs 121 s, over the 70 s default, like odej-038 `video-01` at 138 s.
Impact on others: project total is 1278 files and 502.2 MiB of 3 GiB. The media under odej-033 appears to belong to odej-049: see `teamwork/Data.md`, sections 2 and 4. App agent: the same section 6 warning applies before running `tools/data/import-info.mjs`.

### 2026-11-01 22:41 · [data-agent] · CHANGE · Sixth CDN publication, odej-028 to 038 included
Area: CDN `odej-media`, public/media
What: `media:publish -- --go` run by the colleague. 2492 files, 540.9 MiB staged: 1278 media plus 1214 thumbnails. The CDN now serves 34 establishments.
What: all 2492 URLs answer 200 over IPv4 with curl: 2428 `image/webp`, 64 `video/mp4`. Two rebuilt videos were compared byte for byte with the local files. `media:verify` still cannot run on this machine (no IPv6 route).
Impact on others: nothing to do on your side.

### 2026-11-01 22:42 · [data-agent] · INFO · Establishments collected so far, 34 of 67
Area: public/media, RESOURCES/ODEJ-Media
What: updated table of the establishments with media on the map, after the sixth CDN publication. It replaces the 24-row table above. Refresh it with `python3 tools/media/collect/status_table.py`.

| # | Establishment | Commune | Photos | Videos | MiB | Cover | Phone | E-mail | Address | Hours | Contact on map |
|--:|---|---|--:|--:|--:|:-:|:-:|:-:|:-:|:-:|:-:|
| 001 | Adekar Local Sports Complex | Adekar | 23 | 2 | 16.2 | yes | yes | yes | - | - | yes |
| 003 | Oued Ghir Science Leisure Centre | Oued Ghir | 35 | 6 | 98.9 | - | yes | yes | yes | yes | yes |
| 004 | Hamia Mohand Cherif Local Sports Complex | Beni Maouche | 27 | 0 | 3.9 | yes | yes | yes | yes | - | yes |
| 005 | Martyr Ouaglis Mohand Akli | Amizour | 27 | 0 | 5.7 | yes | yes | yes | - | - | - |
| 007 | Martyr Hamai Bachir | Chemini | 32 | 1 | 12.3 | yes | - | yes | yes | - | - |
| 008 | Mujahid Mohamed Boudiaf | Aokas | 26 | 1 | 20.5 | yes | - | yes | - | - | - |
| 009 | El Kseur Local Sports Complex | El Kseur | 28 | 1 | 8.4 | yes | yes | yes | yes | - | - |
| 010 | Martyr Bouhired Said | Souk El Tenine | 23 | 3 | 14.2 | yes | yes | yes | - | - | - |
| 011 | Ait Salah Martyrs | Bejaia | 0 | 0 | 0.0 | yes | yes | yes | yes | - | - |
| 012 | Martyr Khaldi Abdelkader | Senadla | 38 | 2 | 9.5 | yes | yes | yes | - | - | - |
| 013 | Tibane Youth Centre | Tibane | 15 | 0 | 1.6 | yes | yes | yes | yes | yes | - |
| 016 | Mouloud Feraoun | El Kseur | 38 | 2 | 18.9 | yes | yes | yes | - | - | - |
| 017 | Martyr Abderrahmane Fares | Akbou | 33 | 3 | 29.0 | yes | yes | yes | - | - | - |
| 018 | Takriets Youth Centre | Takriets | 43 | 2 | 8.8 | yes | yes | yes | yes | yes | - |
| 019 | Martyr Maadaoui Bouelsaad | Guendouza | 5 | 7 | 19.8 | yes | yes | yes | yes | - | - |
| 020 | Tifra Local Sports Complex | Tifra | 24 | 1 | 6.8 | yes | yes | yes | yes | - | - |
| 021 | Martyr Chila Tayeb | Ouzellaguen | 30 | 2 | 10.3 | yes | yes | yes | - | - | yes |
| 022 | Barbacha Local Sports Complex | Barbacha | 46 | 2 | 15.9 | yes | yes | yes | - | - | - |
| 023 | Ait R'zine Youth Centre | Ait R'zine | 40 | 2 | 14.2 | yes | yes | yes | yes | - | - |
| 024 | Martyr Bentedji Mohand Akli | Barbacha | 36 | 3 | 10.8 | yes | - | yes | yes | - | - |
| 025 | 18 February Martyrs' Day | Tamridjet | 37 | 1 | 12.9 | yes | yes | yes | - | - | - |
| 026 | Tizi El Oued Youth Centre | Tizi El Oued | 47 | 3 | 14.9 | yes | yes | yes | yes | - | - |
| 027 | Martyr Banoun Akli | not known | 40 | 4 | 16.2 | yes | yes | yes | - | - | - |
| 028 | Martyr Smail Ali Benaissa | Aokas | 49 | 3 | 35.7 | yes | yes | yes | - | - | - |
| 029 | Martyr Aiouz Slimane | Darguina | 41 | 0 | 5.3 | yes | yes | yes | - | - | - |
| 030 | Seddouk Local Sports Complex | Seddouk | 35 | 1 | 16.5 | yes | yes | yes | yes | yes | - |
| 031 | Martyr Djeroud | Bermatane | 1 | 0 | 0.2 | yes | yes | yes | yes | - | - |
| 032 | Martyr Amara Amar | Souk El Tenine | 40 | 2 | 12.6 | yes | yes | yes | - | - | - |
| 033 | Martyr Ouchiha Lahlou | Tazmalt | 48 | 2 | 17.5 | yes | yes | yes | yes | yes | - |
| 034 | Martyr Sebahi Mohand | Tichy | 46 | 4 | 11.5 | yes | yes | yes | yes | - | - |
| 035 | Martyr Berkani Tahar | Timezrit | 32 | 0 | 4.3 | yes | yes | yes | yes | - | - |
| 036 | Chaabane Amar | Tizi N'Berber | 55 | 1 | 11.6 | yes | yes | yes | - | - | - |
| 038 | Martyr Belghania Ahmed | Adjiouane | 41 | 1 | 9.4 | yes | - | yes | yes | yes | - |
| 041 | Chellata Youth Centre | Chellata | 36 | 2 | 7.8 | yes | yes | - | yes | - | - |
| | **34 of 67 collected** | | **1117** | **64** | **502.2** | | | | | | |

Phone, E-mail, Address and Hours come from `info.json` (scrappper). 'Contact on map' says whether `odej-bejaia.json` already shows a phone or e-mail. Sizes are the optimized files, cover included, without thumbnails.

Impact on others: none. Remaining: 33 establishments with no media yet. Open problems are in `teamwork/Data.md`.

### 2026-11-02 01:48 · [app-agent] · DECISION · D4 D5 flagship establishment
Area: odej-003, product
What: the owner decided. D4: the flagship keeps the name of the list until the ODEJ confirms another one. D5: a second button on the landing, a gold marker with its name always visible, pinned in the list, suggested in the search, gallery first in its detail sheet.
Impact on others: none.

### 2026-11-02 01:48 · [app-agent] · CHANGE · Step 7 flagship establishment
Area: src/data/model.ts, src/map, Landing, EstablishmentList, EstablishmentDetail, SearchBox, docs/DATA.md
What: everything follows `featured` and `featuredOrder` in `odej-bejaia.json`, with no id in the code. Tested by moving `featured` to another establishment.
What: the new text "على جناحنا" / "On our stand" needs a review by the ODEJ.
Impact on others: data agent: `featured` now changes what visitors see. Do not set it without the owner's agreement.

### 2026-11-02 02:18 · [app-agent] · CHANGE · Step 8 cleanup and polish
Area: src/App.tsx, MediaGallery, MapControls, ScreenSimulator, map/basemaps.ts, map/MapView.tsx, lib/hooks.ts, lib/swipe.ts, config.ts, i18n/strings.ts, vite.config.ts, docs/PERF.md
What: the gallery grid loads 480 px thumbnails, with the full image as a fallback. The viewer has swipe gestures. A playing video holds off the idle timer. Going home also resets the language, basemap, relief and banner. The simulator only opens with `?sim=1`. Dead code removed.
Impact on others: data agent: the grid expects `thumbs/<name>-480.webp` next to each gallery folder, as `media:thumbs` writes it.

### 2026-11-03 21:30 · [app-agent] · CHANGE · Root README refreshed
Area: README.md, .github/assets/banner.svg
What: at the owner's request: the README shows the project status on 3 Nov (steps 1 to 8, data by category, 34 of 67 with media, what is left), the features, a media diagram and the team names. A text SVG banner in the app colours replaces the title. The GitHub description and topics were set too.
Impact on others: none. The ODEJ logo is not added yet: it is a binary, to be decided by the owner.

### 2026-11-07 00:40 · [data-agent] · DECISION · Sources for contacts and descriptions
Area: RESOURCES/ODEJ-Media/*/info.json, teamwork/Data.md
What: the owner decided. E-mail and phone: the Facebook page first, Youth Connect (youthconnect.mjeunesse.gov.dz) fills a gap. Address, description, founding year, capacity, accessibility and activities: Youth Connect. The ODEJ website is no longer a source (hacked, taken down): its values are removed. Coordinates: only the ODEJ's PDF of 6 Nov, not Youth Connect's points.
Impact on others: app agent: nothing changes in the data file yet. `tools/data/import-info.mjs` should read these `info.json` fields once the owner agrees.

### 2026-11-07 00:45 · [data-agent] · CHANGE · Youth Connect data in the 34 info.json files
Area: RESOURCES/ODEJ-Media/*/info.json
What: the scrapper (local, not in the repo) now reads the 67 establishment pages of Youth Connect and writes them into `info.json`: new fields `foundedYear`, `capacity`, `accessible`, `activities` and a `youthConnect` block (page, read date, conflicts). Placeholder phones (all zeros) are dropped. 22 e-mails and 18 phones now come from Youth Connect, 12 and 15 stay from Facebook. 20 of the 34 files have activities. Problems found are in Data.md section 6.
Impact on others: app agent: `info.json` has new fields, and `sources.*` no longer contains `odej-website`. The 33 establishments not collected yet get the same fields at their first scrape.

### 2026-11-07 01:20 · [data-agent] · CHANGE · Coordinates from the ODEJ table
Area: APP/odej-kiosk/public/data/odej-bejaia.json (shared file), teamwork/Data.md
What: the ODEJ sent a PDF of GPS points (6 Nov), after we reported the wrong ones. Each row was matched to an establishment by type, commune and name, and `location` was replaced for 65 of the 67 (60 values changed). #48 and #67 keep their old pins: the table's latitude is offshore for both. Only `location` changed: names, communes (`placeId`) and categories are the same.
Impact on others: app agent: pins move, some by several km (#16 21 km, #24 13 km, #11 8 km), so check the framing and the mask on the map. `validate:data`, lint, typecheck and the 100 tests pass.

### 2026-11-07 02:10 · [data-agent] · CHANGE · Communes for every establishment
Area: APP/odej-kiosk/public/data/odej-bejaia.json (shared file), teamwork/Data.md, README.md
What: `placeId` filled for #27, 46, 48, 51, 53, 56 and 60. Three communes added to `places` (beni-ksila, ighil-ali, souk-oufella). `communeId` set on the seven localities. Source: Youth Connect, checked against its address and the ODEJ's table. #51 uses Melbou, where Youth Connect's field says Souk El Tenine. Only `places` and `placeId` changed.
Impact on others: app agent: the seven establishments now appear under a commune in the search and the filters. `validate:data` and the 100 tests pass. This branch sits on top of the coordinates PR.
### 2026-11-07 03:00 · [app-agent] · CHANGE · Step 9 establishment sheet shows the info.json data
Area: APP/odej-kiosk/src (EstablishmentDetail, model, types, i18n, styles), scripts/build-details-index.mjs, scripts/details-lib.mjs, .gitignore
What: every establishment with an `info.json` now shows it in its sheet, in this order: name, cover photo, description, other photos and videos, contact card, "about" card (founded, capacity, accessibility), programme card (Youth Connect activities, dates translated), Facebook QR and coordinates, buttons, nearby. `npm run dev` and `npm run build` generate `public/data/details.json` (ignored by git) from `RESOURCES/ODEJ-Media/*/info.json`, so a new scrape appears with no import step. `odej-bejaia.json` is not touched. A description in `odej-bejaia.json` still wins, because it is reviewed and translated. Opening hours still come only from `odej-bejaia.json`.
Impact on others: data agent: nothing to run. A new `info.json` is picked up at the next dev or build. Activity titles stay in Arabic in the English version, because no official translation exists. The flagship (odej-003) keeps its gallery first, as decided on 2 Nov.


### 2026-11-09 03:10 · [data-agent] · CHANGE · odej-039, 040, 042 and 043 added, caps raised
Area: RESOURCES/ODEJ-Media/{039,040,042,043}-*, public/media, docs/media, teamwork/Data.md
What: four establishments collected and optimized with the scrappper's `publish_media.py`. `media:check --hash` passes with 0 errors. Counts exclude the cover: odej-039 37 photos, 3 videos, 11.2 MiB. odej-040 37 photos, 2 videos, 11.0 MiB. odej-042 28 photos, 1 video, 9.0 MiB. odej-043 26 photos, 2 videos, 11.7 MiB.
What: photo caps raised for all four, and the 70 s video default for odej-042 `video-01` (161 s, 5.7 MB). All under 50 MiB. Reason: the colleague kept each reviewed set. The AV1 and VP9 sources of #39, 40 and 43 are now H.264 `yuv420p` with faststart.
What: odej-043 had no cover. The colleague supplied a photo of the building, set by hand in its manifest (see Data.md, section 7).
Impact on others: project total is 1426 files and 545.2 MiB of 3 GiB. Not on the CDN yet: a human must run `media:publish -- --go`. New problems are in `teamwork/Data.md` (sections 4, 6 and 7), among them #39 football photos that may be #37's and #40's two Facebook pages.
### 2026-11-08 03:57 · [app-agent] · CHANGE · Landing with four Béjaïa landscapes
Area: src/components/Landing.tsx, LandingScenes.tsx, src/lib/clouds.ts, src/lib/scenes.ts, src/config.ts, src/styles/app.css, tools/media/pipeline, docs/MEDIA.md, docs/PERF.md
What: at the owner's request, the landing shows four cut-out landscapes in its corners, joined by clouds over the turning map. Entering the map, landscapes and clouds slide out to their side at different speeds; going home, they slide back in. A first touch on a landscape lights its edge. The 360° view of the second touch is not built yet.
What: the four photos live in public/media/landing/ (not in git, 1.2 MiB). `npm run media:landing` prepares them from the owner's PNG files. media:check checks them, media:publish sends them, kiosk:pack warns if they are missing. Their source and usage rights are still to be confirmed by the owner.
Impact on others: data agent: copy public/media/landing/ from the owner before the next media:publish, or the Netlify site shows the landing without landscapes. Do not rename these files without telling the app agent.


### 2026-11-09 04:05 · [data-agent] · CHANGE · odej-049 uses a copy of odej-033's folder
Area: RESOURCES/ODEJ-Media/049-*, APP/odej-kiosk/public/data/odej-bejaia.json (shared file), teamwork/Data.md
What: #49 has the same Facebook page as #33, so it is not scraped. The colleague decided to give it #33's data. The #33 folder was copied as `049-*` (info.json and manifest.json now say id 49, the #49 name and the #49 pin; page and files are #33's). #33 is unchanged. Both establishments got a `DUPLICATE_LINK` issue in `odej-bejaia.json`. Only `verification.issues` changed. `validate:data` and the 125 tests pass.
Impact on others: app agent: nothing to run. `odej-049` has no optimized media yet: it will be built with the next batch.

### 2026-11-09 05:30 · [data-agent] · CHANGE · odej-044 to 048 added, odej-049 built from odej-033
Area: RESOURCES/ODEJ-Media/{044..049}-*, public/media, docs/media, teamwork/Data.md
What: six establishments optimized with the scrappper's `publish_media.py`. `media:check --hash` passes with 0 errors. Counts exclude the cover: odej-044 39 photos, 2 videos, 14.3 MiB. odej-045 36 photos, 1 video, 7.7 MiB. odej-046 38 photos, 3 videos, 23.3 MiB. odej-047 30 photos, 1 video, 7.0 MiB. odej-048 30 photos, 2 videos, 35.9 MiB. odej-049 48 photos, 2 videos, 17.5 MiB.
What: photo caps raised for all six. The 70 s video default is exceeded by odej-045 `video-01` (115 s) and odej-047 `video-01` (105 s). All under 50 MiB. Reason: the colleague kept each reviewed set, with no removals.
What: odej-048 `video-02` (AV1) was 28.7 MiB after the standard encode. Rebuilt from the original with a 2 Mbit/s cap: 14.7 MiB, `yuv420p`, faststart, sizes and hashes updated in `docs/media`.
What: odej-049 has no scrape of its own: its page is odej-033's. Its folder is a copy of odej-033's, with the #49 id, name and pin, and both establishments carry a `DUPLICATE_LINK` issue in `odej-bejaia.json` (only `verification.issues` changed). The folder name follows the scrappper's dataset («لشهداء …»). odej-045 has no page cover: the colleague's upscaled building photo is set by hand.
What: five raw files were overwritten by contact sheets during an automatic review (#46 `photo-020`, #48 `photo-008`, `016`, `024`, `031`). The colleague chose to optimize and publish them as they are. How to fix them is in Data.md, section 7.
Impact on others: project total is 1679 files and 651.5 MiB of 3 GiB, 44 of 67 establishments. App agent: nothing to run. The landing photos (`public/media/landing/`) were prepared by the colleague from four JPG files, with the background keyed out: a pale halo remains on the soft edges, so a transparent PNG from the owner would look cleaner.

### 2026-11-09 06:10 · [data-agent] · CHANGE · odej-050, 051, 053, 054 and 055 added
Area: RESOURCES/ODEJ-Media/{050,051,053,054,055}-*, public/media, docs/media, teamwork/Data.md
What: five establishments optimized with the scrappper's `publish_media.py`. `media:check --hash` passes with 0 errors. Counts exclude the cover: odej-050 38 photos, 1 video, 9.7 MiB. odej-051 1 photo, 0 videos, 0.3 MiB. odej-053 36 photos, 2 videos, 19.7 MiB. odej-054 15 photos, 1 video, 8.5 MiB. odej-055 47 photos, 2 videos, 17.4 MiB.
What: photo caps raised for odej-050, 053 and 055, and the 70 s video default for odej-053 `video-01` (164 s, 464 px wide). All under 50 MiB. Reason: the colleague kept each set. No media check was run on this batch (no review of duplicates, posters or minors), and nothing was removed.
What: odej-051 has only a cover and one gallery photo, all the same view. odej-052 has no media at all: its scrapes found nothing, so it is not published. Both are in Data.md, section 7.
Impact on others: project total is 1833 files and 707.2 MiB of 3 GiB, 49 of 67 establishments. App agent: nothing to run.

### 2026-11-09 07:05 · [app-agent] · CHANGE · ODEJ logo on the landing
Area: public/brand/odej-logo.webp, public/data/odej-bejaia.json (shared file), src/components/Landing.tsx, src/styles/app.css, README.md
What: at the owner's request, the landing header shows the ODEJ logo in the slot that was reserved. `organization.logo` is now `brand/odej-logo.webp` (was null), read relative to `import.meta.env.BASE_URL`. The file (512 px, 143 KB, transparent) comes from the owner's JPG of the logo: its flat grey background was keyed out. It is the one image of the site tracked in git, because the local kiosk pack and Netlify both need it from the app. The logo slot grew from 3.6 to 5.4 rem so the lettering stays legible. The README no longer lists the logo as to do.
Impact on others: data agent: nothing. `odej-bejaia.json`: only `organization.logo` changed. The logo's usage rights are the owner's to confirm.

### 2026-11-09 07:29 · [app-agent] · CHANGE · Map screen redesigned in frosted glass
Area: APP/odej-kiosk/src (App, EstablishmentList, EstablishmentDetail styles, MediaGallery, SearchBox, MapControls, icons, map/markers, map/previewCard, map/MapView, lib/carousel, config), styles/app.css (map screen rules only), docs/PERF.md
What: on the owner's request, the map screen uses translucent glass panels with soft one-shot animations. Markers are teardrop bubbles; the selected one opens into a floating card with a photo preview, and touching the card shows the sheet. The list can be hidden and shown (toggle in landscape, sheet handle in portrait). Search is a round button that unfolds the bar. Plan and satellite are a day and night switch, 3D terrain a button. The sheet gallery is a 3D carousel with swipe.
Impact on others: data agent: nothing to do. The marker preview uses the cover, or else the first gallery photo, through its 480 px thumbnail.
