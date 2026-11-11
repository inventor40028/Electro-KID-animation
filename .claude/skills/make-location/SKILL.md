---
name: make-location
description: Create a new 3D location (a place stickmen stand in, such as a kitchen, beach, prison or spaceship) or a new 3D object (a fridge, a boat) when the user asks for one, or when make-video finds one is missing. Locations and objects are JSON files, no code needed. Low-poly territory, moderately detailed key objects, small details that sell the place.
---

# make-location: a new 3D location

The six locations in `locations/` are the **etalon**. A new location must look like it belongs next to them.

## The look

Three levels of detail. Getting these levels right is the whole job.

| Level | What | How much detail |
|---|---|---|
| **Territory** | ground, hills, walls, floor, sky | **Low poly.** Flat shapes, faceted terrain, one surface pattern at most. |
| **Key objects** | cars, plants, trees, desks, beds, houses | **A little detailed.** 8 to 20 parts. Inked outlines, rounded edges, recognizable silhouette. |
| **Minor details** | wall clock, poster, power lines, mailbox, mushrooms, pebbles, light switch | **Cheap but present.** 1 to 5 parts each. These are what make a plain scene look great. |

Plus: saturated colors, a strong sun with crisp shadows, a gradient sky.

Don't go past this level: no realistic textures, no fields of fine grass, no god rays. Don't go below it either: a room of plain boxes with no small details is not finished.

## The reference set

Read these before making a new location, and copy the closest one:

- `locations/office.json`, `locations/bedroom.json`: **indoor**
- `locations/plains.json`, `locations/forest.json`, `locations/desert.json`: **open land**, with terrain
- `locations/street.json`: **town**
- `locations/_objects.json`: the shared objects. `car`, `plant`, `tree`, `desk`, `house` show the detail level for a key object.

## Steps

1. Copy the closest reference to `locations/<name>.json`. `name` inside the file must equal the file name.
2. Reuse objects from `_objects.json`. If something is missing (stove, palm tree), add it there so other locations can use it.
3. Check it: `npx tsx scripts/locations.ts --check`
4. Look at it: `npx tsx scripts/locations.ts --stills --only=<name>`, then open `out/locations/<name>.png`.
5. Fix what you see and repeat until it passes the checklist.

## Format

```jsonc
{
  "name": "kitchen",
  "sky": ["#3f86d8", "#9fd0ef", "#e8f1f4"],   // [top, middle, horizon], or one color
  "ground": { "color": "#c9b08a", "pattern": "tiles", "tile": 1 },   // a flat floor, or
  "terrain": { "colors": ["#74ac3e", "#8dbb44"], "height": 22, "flat": 8, "rise": 44, "cell": 5, "seed": 3 },   // low-poly land
  "haze": ["#d7ecf2", 90, 420],     // optional: [color, start, end] distance fade
  "sun": { "dir": [-5, 7, 3], "strength": 2.4, "color": "#fff2dc", "range": 34 },   // range: 12 indoors, 30-40 outdoors
  "ambient": 1.6,
  "shade": "#c9d6ff",               // color of the shadows
  "camera": { "from": [0, 1.5, 7.2], "to": [0, 1.5, 5.8], "look": [0, 1, -3], "fov": 52 },
  "stage": [0, 0, 1.5],             // where stickmen stand in a story. This is the default
  "parts": [ /* shapes and objects */ ],
  "scatter": [ { "use": "grass", "count": 1400, "area": [-20, -60, 20, 14], "keepOut": 1.25, "scale": [1, 2] } ]
}
```

A location needs `ground` or `terrain`. `scatter` sprinkles an object over `[x1, z1, x2, z2]`, follows the terrain, and leaves `x` within `keepOut` of 0 empty. Use it for grass, pebbles and distant trees.

### Shapes. Each part has exactly one

| Shape | Value | Use for | Options |
|---|---|---|---|
| `box` | `[w, h, d]` | walls, tables, roads | `round`, `pattern`, `tile` |
| `cyl` | `[r, h]` or `[top, bottom, h]` | posts, pots, trunks | `seg` |
| `cone` | `[r, h]` | pine layers | `seg` |
| `ball` | `r` | knobs, clouds; squash with `scale` | |
| `rock` | `r` | faceted stones | |
| `blob` | `r` | lumpy low-poly tree tops and bushes | |
| `roof` | `[w, h, d]` | triangular prism | |
| `wall` | `[w, h, thick]` | a wall with openings | `holes`: `[[centerX, bottomY, w, h]]` |
| `profile` | `[[x,y], ...]` | any outline, extruded: car bodies, fence pickets, mesas | `depth`, `bevel` |
| `tube` | `[[x,y,z], ...]` | smooth curves: wires, stems, cactus arms, lamp arms | `r` |
| `leaf` | `[length, width]` | curved blades pointing along +z | |
| `sign` | `[w, h]` | a board with text, facing +z | `text` (use `\|` for a new line), `textColor` |
| `use` | object name | anything from `_objects.json` | |

Patterns are line drawings on a surface: `planks`, `bricks`, `tiles`, `siding`, `shingles`, `stripes`. `tile` is the size of one repeat in metres.

### Any part can also have

| Field | Meaning |
|---|---|
| `at` | `[x, y, z]` of the shape's **bottom center** |
| `turn` | degrees around the vertical axis, or `[x, y, z]` degrees |
| `scale` | a number, or `[x, y, z]` |
| `color` | hex, required on shapes. On a `use` it replaces that object's `"main"` color |
| `glow` | `true` ignores light: lit windows, screens, lamps |
| `opacity` | 0 to 1, for glass |
| `flat` | `true` shows facets |
| `ink` | dark outline. On by default inside objects, off for bare location parts |
| `shadow` | `false` stops it casting a shadow |
| `repeat` | `{ "count": n, "step": [x, y, z], "turn": degrees }` makes copies |

An object in `_objects.json` faces **+z** (toward the camera) and its origin is on the ground at its center. A part with `"color": "main"` takes the color chosen where the object is used.

```json
"mailbox": { "main": "#2f5f93", "parts": [
  { "box": [0.1, 1.1, 0.1], "color": "#7a5230" },
  { "box": [0.3, 0.22, 0.52], "round": 0.09, "at": [0, 1.1, 0], "color": "main" },
  { "box": [0.02, 0.24, 0.12], "at": [0.17, 1.22, 0.12], "color": "#d63a33" }
] }
```

## Making a new object

Add it to `locations/_objects.json`. Open the closest existing object and match its level of detail:

| Making a... | Copy from |
|---|---|
| vehicle | `car` |
| plant or tree | `plant`, `tree`, `pine`, `cactus` |
| furniture or appliance | `desk`, `bed`, `wardrobe`, `filing_cabinet` |
| building | `house`, `barn` |
| small street or wall detail | `mailbox`, `hydrant`, `clock` |

- Key objects get 8 to 20 parts. Small details get 1 to 5.
- Build it at real size in metres, facing **+z**, with its origin on the ground at its center.
- Use a plain name such as `fridge`, not `dans_fridge`. Assets stay in the library for every later video.
- The name works straight away as a prop `type` in any 3D location.
- Build furniture and appliances as objects, not as bare `parts` of the location. Bare parts get no ink outline, so a counter built that way looks flatter than the fridge next to it. For a one-off, add `"ink": true`.

## World rules

- Units are metres. A stickman is about 1.7 tall. Doors are 2.2.
- `y` is up, `x` is left and right, `+z` points at the camera.
- **Keep the stage clear:** stickmen stand within about 2 m of `stage`, side to side, and are always drawn in front of 3D objects, so nothing tall belongs there. By default that means `x` from -2 to 2 and `z` from 0 to 3. Keep the 8 m between the stage and the camera clear too.
- In a story, `camera` only sets the viewing direction and height. `from`, `to` and `look` are used as written only in the `--stills` preview.
- If the camera looks along a diagonal, as in `street`, move `stage` to a clear spot in that view.
- The video is vertical, so the view is narrow: visible width is about **half the distance** from the camera. Near objects get huge fast, so keep big things at least 8 m away or they fill the frame.
- **Tilt `look` down** indoors (y about 1), or the ceiling takes the top half of the shot.
- **Indoors:** back wall at `z = -3`, side walls about 3 to 3.6 from center and running past the camera, plus a ceiling. Use a `wall` with holes and aim the sun at the camera through them, so light patches fall on the floor.
- **Outdoors:** use `terrain` with `flat` wide enough for the action, hills beyond it, and something far away (barn, mesa, tree line) for depth.
- Every shot needs one thing that adds depth along the view: a path, a fence, a row of poles.

## Checklist

- [ ] You can name the place from the still alone
- [ ] The middle of the frame is free for stickmen
- [ ] Territory is low poly; only key objects have detail
- [ ] At least 3 minor details you only notice on a second look
- [ ] Sun casts visible shadows and the colors are saturated
- [ ] Main objects are not cut off by accident at the edges
- [ ] Nothing floats or sinks into the floor
