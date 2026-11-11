---
name: make-video
description: Turn one prompt (a topic, a "what if", "make shorts about why X", a fascinating true story) into a finished 60-second vertical short with 2D bean men in 3D locations, narration, captions, music and sound effects. Checks which locations and props already exist and builds the missing ones from the reference set. Use whenever the user asks to make/create/generate a video, short, or story in this project.
---

# make-video: one prompt to finished short

The user gives a topic, such as "make shorts about why ships were painted like zebras". You write the story, make sure every place and object exists, run the engine, check the frames, and hand back the MP4.

## What every video is made of

Don't swap any of these unless the user asks.

| Part | What to use |
|---|---|
| Places and big objects | **3D**, from `locations/`. Low-poly territory, moderately detailed key objects, small details. |
| Characters | **2D bean men** from `src/character/`. Never build a character in 3D. |
| Narration | **edge-tts** (free, needs internet). Default voice `en-US-AndrewMultilingualNeural` at `+22%`. |
| Sound effects | The 54 sounds in `public/sfx/`. Most are added automatically. |
| Music | The 6 moods in `public/music/`. |

No paid APIs and no AI-generated video.

## Steps

1. **Write the script** (rules below). Aim for 190 to 210 words, about 60 seconds. Keep it to 2 to 5 places.
2. **List what the story needs:** every place, every object that stands in a scene, and every item someone holds.
3. **Check what exists:** `npx tsx scripts/locations.ts --list`
4. **Build whatever is missing** (next section). Do this before storyboarding.
5. **Storyboard** as `stories/<kebab-title>.json`, one shot per 1 to 3 seconds of narration, so 14 to 24 shots.
6. **Check stills:** `npm run make -- stories/<file>.json --stills`, then look at `out/<slug>/stills/*.png`. Fix framing, actors out of frame, wrong props and empty-looking shots. Repeat until it looks good.
7. **Render:** `npm run make -- stories/<file>.json`, in the background because it takes several minutes. The output is `out/<slug>/<slug>.mp4`. Use `--preview` for a quick half-size version.
8. **Report:** tell the user where the MP4 is, which new assets you created, and any shot you'd improve.

## Building missing assets

| The story needs... | Exists? | Do this |
|---|---|---|
| A place | yes | Use it: `"location": "<name>"`. |
| A place | no | Create a new location. Follow the `make-location` skill. |
| An object that stands in a scene (fridge, boat, statue) | yes | Use it as a prop `type`. |
| An object that stands in a scene | no | Add a 3D object. Follow the `make-location` skill. |
| A small item someone holds (a wrench, a letter) | yes | Use it: `"holding": "<name>"`. |
| A small item someone holds | no | Add a 2D prop (below), or use a close one with `holdingLabel` if that reads clearly. |

**Always look at the references before making an asset.** Read the closest location in `locations/` and the closest object in `_objects.json`, then match their level of detail. After making a location, run `npx tsx scripts/locations.ts --stills --only=<name>` and compare `out/locations/<name>.png` with a reference still from `out/locations/`. Keep working until it looks like the same show.

Name assets for what they are (`kitchen`, `fridge`), never for the story. They stay in the library for later videos, so check for an existing one first and never make a near-duplicate.

**To add a 2D prop:**
1. Add its id to `PROPS` in `src/catalog.ts`.
2. Add a `case` for it in `drawProp` in `src/scene/props/Props.tsx`. The origin is bottom-center and it's drawn upward (negative y), in the same units as a bean man, who is 362 tall. Use the `s()` and `ln()` style helpers so it gets the same ink outlines.
3. If it's held, add a size to `HELD` in the same file.

## Script rules (learned from the reference shorts)

- **Line 1 is a paradox hook, stated as plain fact, with no intro.** Examples: "He bet his life savings on the slowest horse in the race." "They painted the jail cell pink." Never open with "Did you know" or "In this video".
- Structure:
  1. Hook.
  2. Setup and stakes ("Imagine you're…" or "It all started when…").
  3. Escalation, where someone mocks the hero in a short quoted line.
  4. A turning point or rhetorical question ("Wait, what?", "How is that possible?").
  5. **"You see,"** followed by the real explanation, ideally with an everyday analogy (soup, a phone sliding off a table).
  6. A twist or payoff as the very last line. End hard, with no outro and no call to action.
- Write in present tense, with short punchy sentences, concrete numbers ("exactly 15 minutes", "47 tiny scratches") and humor in the asides.
- Write for the ear: spell numbers the way they should be spoken when it matters ("five bucks").

## Storyboard rules

- Every shot's `say` is a slice of the script, and the slices together must equal the full script in order. Shots are timed by when their first word is spoken.
- **Change the shot every 1 to 3 sentences**, and vary framing: `wide` for establishing, `full`/`medium` for action, `close`/`extreme` for reactions and punchlines.
- Reactions are what sell it. Use `beats` to change expression or pose on a specific word, for example `{ "at": "winner", "expression": "surprised", "fx": "sparkle" }`.
- Use `insert` graphics (map, chart, counter, document, phone, list, timeline, versus, bigtext) for the "You see," explanation beats. An insert-only shot can use `"bg": "void"`.
- Keep the same character looking the same across the whole story, which means one `cast` entry per person. Give each character a distinct hero color.
- Put actors at `x` 0.25 to 0.75 so they stay in frame. Use `z` 0.3 to 0.6. Two-person shots use about x 0.35 and x 0.68, with the second actor facing `"left"`. Two people far apart need `full` or `wide`, because `medium` can cut one off.
- `quote: "<actorId>"` makes that actor's mouth move during a quoted line.
- Transitions: the default `dissolve` is right most of the time. Use `cut` or `flash` for punchlines, `iris` for "meanwhile…", and `whip` for fast jumps.
- Music moods: curious (default), warm, mystery, tense, upbeat, sad.

## In a 3D location

- `framing` and `camera` are real 3D camera moves, so `orbit` and the pans show true parallax.
- `x` and `z` work as usual, and each bean man casts a real shadow from the location's sun.
- A prop whose `type` is in `locations/_objects.json` is drawn in 3D at real-world size, so `"scale": 1` on a car is a whole car. A 3D object can't show `label` text. If the same name is also a 2D prop, adding `label` or `glow` uses the 2D drawing instead.
- The camera frames the actors, not the props. A big prop off to one side will be out of frame, so use `wide` and keep the actor and prop close together.
- **Bean men are always drawn in front of 3D objects.** Put a 3D prop behind them with a lower `z`, or to one side. They can't stand behind a desk or sit in a car.
- `time` and `wall` do nothing, because each location has its own light. `tint` still works. If the story needs the same place at night, make a separate location such as `street_night`.

## Sound

Most of it is automatic: transitions, fx, pops, drops and inserts all get sounds, and the final mix is normalized to -14 LUFS. Add `sfx` only for specific moments such as a punch, cash, glass or crowd. The ids are in `SFX` in `src/catalog.ts`.

Narration needs internet. `--no-tts` skips it and estimates the timing, which is useful for checking stills offline.

## Schema (validated by zod in `src/schema.ts`; ids listed in `src/catalog.ts`)

```jsonc
{
  "title": "Why Sailors Carried Storm Oil",
  "music": "curious",            // curious | warm | mystery | tense | upbeat | sad | none
  "voice": "en-US-AndrewMultilingualNeural", "rate": "+22%",   // optional
  "cast": {
    "cook": { "color": "#ffffff", "outfit": "apron", "hat": "chef", "hair": "none" },
    "captain": { "color": "#21357a", "outfit": "uniform", "hat": "captain", "mustache": true, "build": "big" }
  },
  "shots": [
    {
      "say": "He poured cooking oil into the sea.",
      "location": "street",
      "framing": "full", "camera": "pushIn", "focus": "cook",
      "actors": [
        { "id": "cook", "x": 0.45, "z": 0.5, "pose": "hold", "expression": "smug", "holding": "bucket" },
        { "id": "captain", "x": 0.75, "z": 0.4, "pose": "crossed", "expression": "suspicious", "facing": "left" }
      ],
      "props": [{ "type": "barrel", "x": 0.15, "z": 0.3, "label": "OIL" }],
      "fx": ["dust"],
      "beats": [{ "at": "sea", "actor": "captain", "expression": "shocked", "zoom": 1.1 }],
      "transition": "dissolve"
    }
  ]
}
```

Field reference:
- **Character (a 2D bean man):**
  - `color`, `outfit`, `hair`, `hairColor`, `hat`, `hatColor`, `skin`
  - `tie`/`bowtie` (color), `badge`, `mustache`, `beard`
  - `glasses` (none, round, square, sunglasses)
  - `build` (normal, big, skinny, kid, tall)
- **Actor:**
  - Placement: `id`, `x`, `z`, `scale`, `facing` (front, left, right)
  - Acting: `pose`, `expression`, `talking`, `flip` (tumbling)
  - Holding: `holding` (a 2D prop), `holdingLabel`
  - Movement: `enter` (none, left, right, pop, drop, fade), `exit` (none, left, right, fade), `moveTo` (an x to walk to)
- **Prop:**
  - Placement: `type` (a 2D prop or 3D object), `x`, `z`, `y` (lift in px, e.g. 196 = on a desk), `scale`, `rotate`, `count` (repeat in a row)
  - Look: `color`, `label` (text on signs, boards, boxes, screens, doors, cans), `glow`
  - Motion: `enter`, `float`
- **Shot:**
  - Narration and speaker: `say`, `quote`
  - Scene: `location` (3D, the default choice), or `bg`, `time`, `wall` (2D); `tint` for both
  - Contents: `actors`, `props`
  - Camera: `framing` (wide, full, medium, close, extreme), `focus` (an actor id or `"prop:N"`), `camera` (pushIn, pullOut, panLeft, panRight, panUp, panDown, drift, static, crashZoom, orbit)
  - Effects and sound: `fx[]`, `beats[]`, `sfx[]`, `insert`, `transition`
- **Beat:** `at` (a word in this shot, or seconds), `actor`, `pose`, `expression`, `fx`, `sfx`, `zoom`
- **Insert:** `type`, `title`, `lines[]`, `value`/`from`/`prefix`/`suffix` (counter), `data[]` (chart), `highlight`, `color`

Poses, expressions, outfits, hats, fx and sfx are all listed in `src/catalog.ts`. Read it before writing a story and use only those ids.
