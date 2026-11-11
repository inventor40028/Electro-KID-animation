# Story-Teller Guide — Electro KID Animation

This file is fully self-contained. Use it to author a finished vertical (9:16) animated short for the Electro KID engine. Everything you need is here: characters, expressions, poses, cameras, effects, sounds, locations, and how to describe the shots. You only output a JSON story.

## 1. How it works
You produce a single JSON object (a "story"). The engine reads it and renders a film. Rules:
- One story = one JSON object with `title`, `music`, `cast`, and `shots`.
- Each `shot` has narration (`say`), a place, characters, camera, and optional effects.
- Narration drives timing — write it naturally.

## 2. Characters (cast)
A character is defined by style. Use any of these:
- `color` — main outfit colour (hex, e.g. "#3d5a80")
- `outfit` — shirt, suit, overalls, apron, uniform, dress, labcoat, prisoner, tshirt, hoodie, vest, sweater, spacesuit, robe, jersey
- `hair` — none, short, parted, spiky, curly, bob, long, ponytail, bun, mohawk, messy, old
- `hairColor` — hex
- `hat` — none, cap, police, chef, bowler, cowboy, hardhat, tophat, beanie, straw, captain, pirate, crown, helmet, beret, headphones, graduation, nurse, astronaut, bandana
- `skin` — hex
- `build` — normal, big, skinny, kid, tall
- `voice` — (optional) TTS voice override for this character

## 3. Expressions (use exactly these words)
neutral, smug, whistle, happy, laugh, grin, surprised, shocked, angry, furious, sad, worried, scared, suspicious, determined, sleepy, crazy, wink, bored, dead, love, smile_closed, relief, relief_open, lick, nervous, dazed

Meanings:
- neutral = calm default
- smug = satisfied, a little cocky
- whistle = casual, unaware, having a good time
- happy = warm smile
- laugh = laughing
- grin = big toothy smile
- surprised = wide eyes, small "o" mouth
- shocked = very wide eyes, "o" mouth
- angry = angry brows + frown
- furious = angry + red face
- sad = down
- worried = uneasy (has a sweat drop)
- scared = afraid (has a sweat drop)
- suspicious = squint, suspicious
- determined = focused
- sleepy = tired
- crazy = unhinged
- wink = one eye closed
- bored = flat
- dead = "x" eyes
- love = heart eyes
- smile_closed = quiet smile (use for warmth)
- relief = relaxed, relieved
- relief_open = visibly relieved
- lick = tongue out (playful)
- nervous = anxious
- dazed = dizzy

Rules:
- Use `angry` for anger; `stern` is not a word here.
- Use `furious` only for extreme rage (red face).
- `neutral` is the safe default.

## 4. Poses
stand, talk, point, wave, armsUp, shrug, think, crossed, hips, hold, holdUp, facepalm, sit, walk, run, fall, lie, cower, push, reach, hammer, type, phone, fidget, drink, dance

Meanings:
- stand = relaxed
- talk = one hand gesturing
- point = pointing
- wave = waving
- armsUp = celebrating / panic
- shrug = unsure
- think = hand on chin
- crossed = arms crossed
- hips = hands on hips
- hold = holding something in front
- holdUp = holding up high
- facepalm = facepalm
- sit = sitting
- walk = walking
- run = running
- fall = falling
- lie = lying down
- cower = crouched, hands up
- push = pushing
- reach = reaching up
- hammer = swinging a tool
- type = typing
- phone = holding phone to ear
- fidget = low hand moving fast
- drink = drinking from a cup
- dance = dancing (arms up, swaying)

## 5. Shots — the heart of the story
A story has a list of `shots`. Each shot has:
- `say` — the narration line spoken during this shot (string)
- `location` — one of the location names (section 8)
- `time` — day, sunset, night, dawn
- `actors` — list of characters in this shot
- `props` — list of objects in this shot (section 9)
- `framing` — wide, full, medium, close, extreme
- `camera` — pushIn, pullOut, panLeft, panRight, panUp, panDown, drift, static, crashZoom, orbit
- `focus` — an actor id (e.g. "barista") or a prop index ("prop:0")
- `fx` — effects (section 7)
- `sfx` — sounds (section 6)
- `beats` — timed events during the shot: { "at": "word from say", "pose":..., "expression":..., "fx":..., "sfx":..., "zoom":... }
- `transition` — dissolve, cut, iris, whip, flash, zoom

Actor format:
{ "id": "name", "x": 0..1 (left to right), "z": 0..1 (far to near), "pose": "...", "expression": "...", "facing": "left|right|front", "holding": "optional prop name" }

Prop format:
{ "type": "prop name", "x": 0..1, "z": 0..1, "y": optional lift px, "scale": number, "color": optional hex, "label": optional text, "glow": true/false, "enter": "pop|drop|fade|left|right" }

## 6. Sounds (SFX)
whoosh, swoosh, pop, click, ding, sparkle, chime, impact, thud, boom, crash, glass, cash, coins, tick, clock, heartbeat, rumble, splash, water, wind, rain, thunder, slide, boing, scratch, type, alarm, buzz, beep, bell, gasp, laugh, crowd, footsteps, door, knock, paper, stamp, riser, drop, suspense, magic, fail, success, punch, zap, fire, engine, horn, gunshot, metal, creak, squeak

## 7. Effects (FX)
sparkle, glow, rain, snow, dust, confetti, debris, smoke, fire, speedlines, flash, shake, cracks, rage, hearts, money, zzz, question, exclaim, sweat, lightning, explosion, ripples, stars, redtint, bluetint, darken, spotlight, godrays, groinspray

## 8. Locations (choose one name)
office, bedroom, livingroom, kitchen, classroom, lab, store, prison, cell, hospital, courtroom, factory, bar, street, city, suburb, field, farm, forest, desert, western, mountain, beach, sea, shipdeck, space, moon, cave, stage, void, bathroom, battlefield, gallery, plains, trench, wheatbelt, goony_bedroom

Each location is a complete ready-built 3D world. Just name it.

## 9. Props (common objects)
desk, table, chair, stool, bed, couch, shelf, lamp, floorlamp, door, window, plant, trashcan, box, crate, barrel, bag, moneybag, money, coins, coin, gem, trophy, key, lock, book, paper, letter, card, ticket, phone, laptop, computer, tv, clock, stopwatch, calendar, button, lever, lightbulb, bottle, potion, cup, mug, plate, food, pizza, cake, bucket, paintcan, hammer, wrench, pencil, magnifier, mirror, camera, microphone, megaphone, flag, sign, arrowsign, board, chart, map, globe, rocket, car, truck, bike, train, ship, boat, plane, balloon, bomb, dynamite, fire, tree, pinetree, palm, wheat, cactus, rock, house, building, tower, fence, ladder, rope, chain, cage, bars, glasscase, pedestal, statue, gun, machinegun, sword, shield, skull, heart, star, dice, cards, syringe, pill, flask, atom, magnet, battery, satellite, ufo, moonrock, piggybank, safe, vault, wheel, gear, pipe, rail, bench, mat, rug, tent, campfire, anchor, steeringwheel, cannon, horse, dog, cat, bird, fish, cow, pig, rat, monalisa, broom, trunk, wtfboard, glass_water

## 10. Story tips
- Open with a hook in the first 2-3 seconds.
- Build tension, then a pivot, then a satisfying payoff.
- Vary the `camera` between shots (pushIn, orbit, pullOut...).
- Use `beats` to make reactions land on key words.
- Keep dialog short and natural — it becomes the timing.
- One clear emotional arc beats three muddled ones.

## 11. Complete example story

{
  "title": "The Cup That Bought Time",
  "music": "warm",
  "cast": {
    "barista": { "color": "#3d5a80", "outfit": "apron", "hair": "short", "hairColor": "#4a3426", "skin": "#e8b98a" },
    "boss": { "color": "#3a3f4c", "outfit": "suit", "hair": "old", "hairColor": "#c9c9c9", "build": "big" }
  },
  "shots": [
    {
      "say": "The espresso machine broke at the worst moment.",
      "location": "kitchen", "time": "day", "framing": "wide", "camera": "pushIn", "focus": "barista",
      "actors": [ { "id": "barista", "x": 0.5, "z": 0.5, "pose": "talk", "expression": "worried" } ],
      "props": [ { "type": "machine", "x": 0.5, "z": 0.4 } ],
      "fx": ["smoke"]
    },
    {
      "say": "His boss stepped in with a calm smile.",
      "location": "kitchen", "time": "day", "framing": "close", "camera": "pushIn", "focus": "boss", "transition": "cut",
      "actors": [ { "id": "boss", "x": 0.5, "z": 0.45, "pose": "stand", "expression": "smug", "facing": "front" } ]
    },
    {
      "say": "A glass of water. The fix.",
      "location": "kitchen", "time": "day", "framing": "medium", "camera": "orbit", "focus": "barista",
      "actors": [ { "id": "barista", "x": 0.5, "z": 0.5, "pose": "drink", "expression": "relief", "holding": "mug" } ]
    },
    {
      "say": "Sometimes the simplest tool wins.",
      "location": "kitchen", "time": "day", "framing": "full", "camera": "pullOut", "focus": "barista", "transition": "dissolve",
      "actors": [ { "id": "barista", "x": 0.5, "z": 0.5, "pose": "dance", "expression": "happy" } ],
      "fx": ["sparkle"]
    }
  ]
}

Return a JSON story in exactly this shape and the engine will render the film.
