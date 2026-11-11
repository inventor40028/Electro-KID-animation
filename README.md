# Electro KID Animation

A Remotion + React-Three-Fiber engine for short, vertical (9:16) animated films driven entirely by JSON stories — the "BEANMEN" character/film system.

## What it is
- **1080×1920 @ 30fps** vertical shorts.
- **Data-driven**: each film is a `stories/<story>.json` file (zod-validated). Characters, shots, locations, expressions, FX, narration, music and sound are all declared in JSON — no per-film code.
- **2D characters**, **3D locations** (React-Three-Fiber), camera framing system, film grain, captions, and a full audio mix at −14 LUFS.

## Stack
- Remotion 4 + React 19 + @react-three/fiber + three
- zod for story/location validation
- edge-tts for narration (Microsoft neural voices)
- ffmpeg for loudness normalization

## Quick start
```bash
npm install
npm run make -- stories/goony-nov11.json        # full render -> out/<slug>/<slug>.mp4
npm run make -- stories/goony-nov11.json --stills  # one QA still per shot
npm run make -- stories/goony-nov11.json --preview # fast 50% render
npm run studio                                     # Remotion studio
```

## Story schema (essentials)
- `title`, `voice`, `rate`, `music`, `cast` (character map), `shots` (array).
- Each shot: `say` (narration), `location` (3D world) or `bg` (2D), `actors`, `props`, `framing`, `camera`, `focus`, `fx`, `sfx`, `beats` (anchored to spoken words), `insert` (full-screen graphic), `transition`.
- Durations derive from narration word timing.

## Character
- 2D SVG stickmen with builds, outfits, hair, hats, 20+ expressions, poses, blinks, walk cycles, real 3D shadows.

## Locations (3D)
- JSON-defined rooms/worlds: shapes (`box/cyl/cone/ball/rock/roof/wall/profile/tube/leaf/sign/use`), terrain, scatter, sun/ambient/fog, camera.
- The sky is a real shader dome; windows are physical cuts in walls, so the outside world can be real 3D geometry.

## Notable system features (learned)
- **Screen displays**: 2D prop screens (`computer`/`laptop`) show real frames via `<image href={staticFile(...)}>`; a 3D monitor can show a live canvas texture. Prefer readable drawn UI over blank captures.
- **FX** include `groinspray` (white water bursts) for gags.
- Make/QA pipeline validates stories, renders, and loud-norms to −14 LUFS.

## Films
- `stories/goony-nov11.json` — "Goony — November 11" (whistle → shock → invoice → fly-out → CTA).

> Story/story details and per-short lessons are kept in the project notes, not this README.
