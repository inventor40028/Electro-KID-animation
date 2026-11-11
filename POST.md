# Electro KID Animation — "Goony — November 11"

A 14-second vertical (9:16) animated short built entirely from one JSON story, rendered by the Electro KID engine (Remotion + React-Three-Fiber). This is the flagship piece that exercises every core system end-to-end.

## What you see
1. **A real 3D bedroom** — moonlit night window with a genuine 3D moon, stars, and a city skyline visible through a physical window cut-out. You feel the world outside the room.
2. **A living character** — Goony (a 2D stickman) breathes, blinks, and walks through poses: whistle → shock → typing → smug → whistle again. His low hand fidgets fast; the shock hits with hands up.
3. **Real screens** — a desktop PC on the desk loops a search; a laptop at the 4-second mark plays the typed `xqivo.com` search. The invoice opens and fills with line items and `xqivo.com`.
4. **An invoice that flies out** — the completed invoice bursts out of the screen and whips away with sparkles and a whoosh.
5. **A playable endcard** — Goony + a small black "WTF" tile, with two bursts of white spray rising from between his legs.

## What the engine proves
- **Data-driven storytelling:** the whole film is `stories/goony-nov11.json` — no per-film code.
- **3D locations from JSON:** rooms, terrain, sky dome, sun, fog, camera — all declared in `locations/*.json`.
- **Character system:** builds, outfits, expressions, poses, blinks, walk cycles, 3D shadows.
- **Camera grammar:** framing, push-ins, orbits, crash-zooms, beats anchored to spoken words.
- **Audio:** Edge-tts narration, per-character voice overrides, SFX cues, −14 LUFS mix.
- **FX:** sparkle, speedlines, exclaim, and custom `groinspray`.

## Design philosophy
- Static = JSON. Scripted movement = Three.js. Physics = only when asked.
- Default voice = the story's Edge voice; characters may override.
- Keep it small, cute, and legible.

**Made with the Electro KID engine.**
