# HyperBase Lobby

Office front-door loop for HyperBase — a portrait kiosk graphic that cycles:

1. HB monogram intro
2. Hero R3F digital-twin scene with the tagline "When energy is a given, / innovation is limitless."
3. American Macrogrid stats panel

20-second loop, designed for a portrait-mounted TV driven by a landscape browser.

## Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Orientation

By default the page renders rotated 90° CCW to match a portrait TV mounted on a landscape display pipeline. To preview on a landscape laptop without the rotation, append `?landscape=1`:

```
http://localhost:3000/?landscape=1
```
