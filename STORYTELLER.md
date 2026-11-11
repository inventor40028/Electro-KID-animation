# Story-Teller Guide — Electro KID Animation

This guide is everything an AI needs to author a finished vertical (9:16) animated short for the Electro KID engine. No other folder is required. Stories are plain JSON; the engine renders them.

## Rule of thumb
- **Write a JSON story.** Characters, shots, dialog, camera, FX, music, and sound are all declared in `stories/<name>.json`. No code.
- Run it with: `npm run make -- stories/<name>.json` (add `--preview` for a fast 50% check, `--stills` for one still per shot).

## Story schema (the fields that matter)
```
{
  "title": "...",
  "voice": "en-US-AndrewMultilingualNeural",   // default narrator
  "music": "curious | tense | warm | mystery | upbeat | sad | none",
  "cast": { "<id>": { "color":"#hex","outfit":"shirt|hoodie|suit|...","hair":"short|messy|...","hairColor":"#hex","hat":"none|cap|...","skin":"#hex","build":"normal|big|skinny|kid|tall","voice":"optional TTS override" } },
  "shots": [ ... ]
}
```

### Each shot
- `say` — narration spoken this shot (drives the length).
- `location` — a 3D world from `locations/*.json` (e.g. `bedroom`, `office`, `plains`, `goony_bedroom`). Or `bg` for a 2D backdrop.
- `actors` — `{ id, x (0..1), z (0 far..1 near), pose, expression, facing: "left|right|front", holding?: <prop>, moveTo? }`.
- `props` — `{ type, x, z, y (lift), scale, color, label, glow, enter }`.
- `framing` — `wide | full | medium | close | extreme`.
- `camera` — `pushIn | pullOut | panLeft | panRight | panUp | panDown | drift | static | crashZoom | orbit`.
- `focus` — `"goony"` (actor id) or `"prop:0"` (prop index).
- `fx` — list of effects (below). `sfx` — list of sounds.
- `beats` — mid-shot events: `{ at: "<word from say>", pose?, expression?, fx?, sfx?, zoom? }`.
- `insert` — full-screen graphic: `{ type:"document|bigtext|chart|list|...", ... }`.
- `transition` — `dissolve | cut | iris | whip | flash | zoom`.

## Poses
`stand, talk, point, wave, armsUp, shrug, think, crossed, hips, hold, holdUp, facepalm, sit, walk, run, fall, lie, cower, push, reach, hammer, type, phone, fidget, drink, dance`

## Expressions (27 — see `src/character/EXPRESSIONS.md`)
`neutral, smug, whistle, happy, laugh, grin, surprised, shocked, angry, furious, sad, worried, scared, suspicious, determined, sleepy, crazy, wink, bored, dead, love, smile_closed, relief, relief_open, lick, nervous, dazed`

Rules:
- `neutral` = BEANMEN neutral. `stern` does NOT exist → use `angry`.
- `furious` = angry look + red face.
- `laugh` / `smile_closed` can be picked randomly per character.
- `whistle` reads as "casually unaware".

## Locations / world
- 3D worlds are JSON in `locations/`: shapes (`box, cyl, cone, ball, rock, blob, roof, wall, profile, tube, leaf, sign, use`), terrain, scatter, sun, fog, camera.
- The sky is a real dome; windows are physical cut-outs, so what's behind them is real 3D.
- Static props = JSON. **Scripted movement = Three.js** (only objects a script tells to move animate). Physics only when explicitly requested.

## FX
`sparkle, glow, rain, snow, dust, confetti, debris, smoke, fire, speedlines, flash, shake, cracks, rage, hearts, money, zzz, question, exclaim, sweat, lightning, explosion, ripples, stars, redtint, bluetint, darken, spotlight, godrays, groinspray`

## SFX (public/sfx)
`whoosh, pop, click, ding, sparkle, chime, impact, burst, crash, glass, cash, coins, tick, clock, heartbeat, rumble, splash, water, wind, rain, thunder, slide, boing, scratch, type, alarm, buzz, beep, bell, gasp, laugh, crowd, footsteps, door, knock, paper, stamp, riser, drop, suspense, magic, fail, success, punch, zap, fire, engine, horn, gunshot, metal, creak, squeak`

## Voice
- Default = story `voice` (Edge TTS). A character can override with its own `voice`.
- Per-character voices kick in for quoted lines.

## Good-practice for a "sick" story
- Hook in the first 2–3s; escalate; pivot; payoff; close on the product/CTA.
- Use `camera` variety + `beats` on key words for punch.
- Keep faces/expressions legible; use the readable screens (laptop/computer) for any screen moments.
- End with a CTA only when asked.

## Quick start
```bash
npm install
npm run make -- stories/goony-nov11.json
```
