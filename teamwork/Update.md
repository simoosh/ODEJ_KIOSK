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
