# Expressions

All characters use the face system in `faces.tsx` (name list in `catalog.ts` → `EXPRESSIONS`). A story sets an expression per actor with the `expression` field. This file is the single source of truth for what every expression looks like and how to choose them.

## Full set (27)

| Expression | Look |
|---|---|
| `neutral` | lidded dots, flat brows, dash mouth (default) |
| `smug` | half-lidded eyes, one raised brow, smirk |
| `whistle` | half-lidded eyes, pursed o mouth (signature) |
| `happy` | closed happy eyes (arcs), smile |
| `laugh` | closed laughing eyes, big open mouth |
| `grin` | dot eyes, big toothy grin |
| `surprised` | white round eyes, small o mouth |
| `shocked` | wide white eyes, o mouth (classic) |
| `angry` | dot eyes, sharp V brows, frown |
| `furious` | angry + red face (head tints red) |
| `sad` | droopy dots, slanted brows, frown |
| `worried` | dots, high brows, wavy mouth + sweat |
| `scared` | white eyes, high brows, shout mouth + sweat |
| `suspicious` | squint lines, sneer |
| `determined` | set lidded eyes, angled brows, firm mouth |
| `sleepy` | heavy lids, small o mouth |
| `crazy` | wild eyes, huge grin |
| `wink` | one closed eye, one dot, smirk |
| `bored` | heavy lids, flat mouth |
| `dead` | X eyes, wavy mouth |
| `love` | heart eyes, smile |
| `smile_closed` | closed happy eyes, small smile (use randomly, like laugh) |
| `relief` | relaxed lidded eyes, soft smile |
| `relief_open` | relieved wide eyes, open relieved mouth |
| `lick` | dot eyes, open mouth with tongue |
| `nervous` | wide eyes, high brows, wavy mouth + sweat |
| `dazed` | dizzy eyes (arcs), small o mouth |

## Rules / mapping (important)
- `neutral` always uses the BEANMEN neutral.
- `stern` is **not** an expression — use `angry`.
- `furious` = stern/angry look **plus a red face**.
- `laugh` and `smile_closed` may be chosen **randomly per character** (so multiple people can each use one).
- `whistle`: use it freely in open/calm scenes; when a character is pretending not to notice something, it still reads as "not aware".
- All 27 are usable in any story. No external folder is needed — this set is self-contained.
