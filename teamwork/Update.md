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