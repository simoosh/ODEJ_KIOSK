# Motion graphics (Remotion) — agent instructions

Read the repository `CLAUDE.md` first: its rules still apply here. This folder is a separate npm project, never deployed. It never touches the kiosk app (`APP/odej-kiosk`), its CI or Netlify.

- Remotion **4.0.541**, pinned exactly. Every `@remotion/*` package must have the **same version** as `remotion`. Add one with `npx remotion add @remotion/<name>` (it pins the matching version).
- License: Remotion is free for individuals and companies of up to 3 people only. Do not set this up for a larger team or organization without telling your human: a Company License is then required (https://remotion.pro/license).
- Docs: https://www.remotion.dev/docs/brownfield (setup), https://www.remotion.dev/docs/transitions/transitionseries, https://www.remotion.dev/docs/fonts/. Append `.md` to any docs URL for a Markdown version.

## Layout

```
tools/motion/
├─ remotion.config.ts       CLI settings (image format, overwrite)
├─ public/                  assets read with staticFile() — media files are git-ignored, never commit them
├─ out/                     renders (git-ignored)
└─ src/
   ├─ index.ts              entry point: registerRoot
   ├─ Root.tsx              every <Composition>
   ├─ config.ts             VIDEO (width, height, fps) and seconds()
   ├─ theme.ts              kiosk colors and fonts (Amiri, Readex Pro)
   ├─ lib/animation.ts      progress(), settle(), stagger(), fadeOut(), easings
   ├─ components/           reusable pieces: RevealText, Wave, Sky, FlagRule
   └─ compositions/         one file per video (Showcase.tsx is the sample)
```

## Rules for scenes

- Everything moves from `useCurrentFrame()`. Never use CSS transitions or animations, `setTimeout`, or `Math.random()` without a seed: a render must give the same frame every time. Use `random('seed')` from `remotion` when you need randomness.
- Durations in seconds through `seconds(s, fps)`, with `fps` from `useVideoConfig()`. Keep the timing of a composition in one exported constant, and compute its `durationInFrames` from it (see `SHOWCASE_TIMING` and `showcaseDuration`).
- Sequence scenes with `<Sequence from durationInFrames>` or `<TransitionSeries>` (`fade`, `slide`, `wipe`; `springTiming`, `linearTiming`). A transition overlaps its two scenes: subtract its duration from the total.
- Typography: Arabic text is RTL (`dir="rtl"`) and is animated **by word, never by letter** (letters are joined). Use `RevealText`. Fonts come from `theme.ts`, loaded with `@fontsource`: do not add font files to `public/`.
- Displayed text comes from the kiosk (`APP/odej-kiosk/src/i18n/strings.ts`, the data file). Never invent or translate an official text without your human's agreement.
- Audio: put the file in `public/` (git-ignored) and use `<Audio src={staticFile('name.mp3')} />` from `remotion` inside the composition or a `<Sequence>`. Sync events to the music with frame numbers (`seconds()`); `volume` takes a function of the frame for fades.
- New composition: create `src/compositions/Name.tsx`, export the component, its timing and its duration, then add a `<Composition id="Name" …>` in `Root.tsx` with `VIDEO` (or another size for a vertical video, e.g. 1080×1920).

## Check before you finish

```bash
npm run typecheck
npx remotion still src/index.ts <Id> out/check.png --frame=<n>   # look at key frames
npx remotion render src/index.ts <Id> out/<id>.mp4
```
