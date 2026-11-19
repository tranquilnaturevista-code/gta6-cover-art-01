# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/tranquilnaturevista-code/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/tranquilnaturevista-code/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice City Cover Maker turns your photo and a caption into multi-panel poster cover art in the style of a Vice City sunset: pick a layout, drop in one photo or several, crop and position each panel, choose a colour grade, write the caption, and export a PNG to share. Pure static HTML, CSS and vanilla JavaScript — no network requests, no uploads; photos are read on your own machine. All decoration (sunset sky, sun disc, palm silhouettes, neon frames, halftone dots) is drawn procedurally on canvas, and the only font is Anton under the SIL Open Font License, shipped under `app/fonts/`.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

## Features

- Three multi-panel layouts: Poster Grid (2×2), Hero + Strip (one big panel over three small ones), and Triptych (three vertical panels), each with its own caption band.
- Per-panel photos: upload your own, use a built-in sample, or fill all panels with one photo. Click a panel (or its thumbnail) to select it, then zoom with the slider and drag the photo to position it.
- Editable caption and subtitle in bold condensed display lettering with an outline and an offset neon shadow, live in the preview.
- Three colour grades drawn on canvas: Vice Sunset, Neon Night, and Golden Hour.
- One-click PNG export in the three common post sizes: 1080 × 1080, 1080 × 1350, and 1920 × 1080.

---

<sub>Entered on [make.fun](https://make.fun/?ref=hftc77mr&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
