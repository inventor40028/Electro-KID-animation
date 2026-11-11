// The location format. A location is a JSON file made of shapes, so no code is needed to add one.
import { z } from "zod";

const n = z.number();
const V2 = z.tuple([n, n]);
const V3 = z.tuple([n, n, n]);
const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "hex color like #f2b632");
const PATTERNS = ["planks", "bricks", "tiles", "siding", "shingles", "stripes"] as const;
const SHAPES = ["box", "cyl", "cone", "ball", "rock", "blob", "roof", "wall", "profile", "tube", "leaf", "sign", "use"] as const;

export const PartSchema = z.object({
  // exactly one shape
  box: V3.optional().describe("[width, height, depth]"),
  cyl: z.union([V2, V3]).optional().describe("[radius, height] or [topRadius, bottomRadius, height]"),
  cone: V2.optional().describe("[radius, height]"),
  ball: n.optional().describe("radius"),
  rock: n.optional().describe("radius; a faceted lump"),
  blob: n.optional().describe("radius; a lumpy low-poly ball for tree tops and bushes"),
  roof: V3.optional().describe("[width, height, depth]; triangular prism, ridge along width"),
  wall: V3.optional().describe("[width, height, thickness]; use with holes"),
  profile: z.array(V2).min(3).optional().describe("outline of a flat shape in x,y, extruded along z by depth"),
  tube: z.array(V3).min(2).optional().describe("a smooth pipe through these points: wires, stems, handles"),
  leaf: V2.optional().describe("[length, width]; a curved blade pointing along +z"),
  sign: V2.optional().describe("[width, height]; a flat board facing +z, with text"),
  use: z.string().optional().describe("name of an object in locations/_objects.json"),
  // shape options
  round: n.optional().describe("box: edge radius"),
  seg: z.number().int().min(3).max(64).optional().describe("cyl/cone: number of sides"),
  holes: z.array(z.tuple([n, n, n, n])).optional().describe("wall: [centerX, bottomY, width, height] openings"),
  depth: n.optional().describe("profile: thickness"),
  bevel: n.optional().describe("profile: edge softening"),
  r: n.optional().describe("tube: radius"),
  text: z.string().optional().describe("sign: the words"),
  textColor: hex.optional(),
  // placement
  at: V3.default([0, 0, 0]).describe("where the BOTTOM CENTER of the shape goes"),
  turn: z.union([n, V3]).default(0).describe("degrees around Y, or [x, y, z] degrees"),
  scale: z.union([n, V3]).default(1),
  repeat: z.object({ count: z.number().int().min(1).max(200), step: V3.default([0, 0, 0]), turn: n.default(0) }).optional().describe("copies; each is shifted by step and rotated by turn"),
  // look
  color: z.union([hex, z.literal("main")]).optional().describe('"main" = the color chosen where the object is used'),
  glow: z.boolean().default(false).describe("ignores light: lit windows, screens, lamps, sun"),
  opacity: n.optional().describe("0 to 1, for glass"),
  pattern: z.enum(PATTERNS).optional().describe("box/wall: lines drawn on the surface"),
  tile: n.optional().describe("size in metres of one pattern repeat"),
  flat: z.boolean().optional().describe("show facets"),
  ink: z.boolean().optional().describe("dark outline. Default: on inside objects, off for bare location parts"),
  shadow: z.boolean().default(true).describe("casts a shadow"),
  screen: z.boolean().optional().describe("a live display that plays the search recording"),
}).strict().superRefine((p, ctx) => {
  const found = SHAPES.filter((s) => p[s] !== undefined);
  if (found.length !== 1) ctx.addIssue({ code: "custom", message: `a part needs exactly one of ${SHAPES.join(", ")} (found: ${found.join(", ") || "none"})` });
  if (found[0] && found[0] !== "use" && !p.color) ctx.addIssue({ code: "custom", message: `a ${found[0]} needs a color` });
});

export const ObjectSchema = z.object({ main: hex.default("#cccccc"), parts: z.array(PartSchema).min(1) }).strict();
export const ObjectsSchema = z.record(z.string(), ObjectSchema);

const Terrain = z.object({
  colors: z.array(hex).min(1).describe("low-poly ground colors, blended in patches"),
  height: n.default(8).describe("how tall the hills get"),
  flat: n.default(8).describe("half-width of the flat strip along x=0 where the action happens"),
  rise: n.default(30).describe("distance over which hills grow beyond the flat strip"),
  noise: n.default(0.02).describe("bigger = smaller, busier hills"),
  cell: n.default(4).describe("size of one low-poly facet in metres"),
  size: n.default(500),
  seed: n.default(1),
}).strict();

const Scatter = z.object({
  use: z.string().describe("an object to sprinkle around"),
  count: z.number().int().min(1).max(4000),
  area: z.tuple([n, n, n, n]).describe("[x1, z1, x2, z2]"),
  keepOut: n.default(1.5).describe("half-width around x=0 left empty"),
  scale: V2.default([0.8, 1.3]),
  seed: n.default(1),
}).strict();

export const LocationSchema = z.object({
  name: z.string(),
  sky: z.union([hex, z.tuple([hex, hex, hex])]).describe("one color, or [top, middle, horizon]"),
  ground: z.union([hex, z.object({ color: hex, pattern: z.enum(PATTERNS).optional(), tile: n.default(1) }).strict()]).optional().describe("flat floor; leave out if using terrain"),
  terrain: Terrain.optional(),
  haze: z.tuple([hex, n, n]).optional().describe("[color, startDistance, endDistance]"),
  sun: z.object({ dir: V3.default([-4, 8, 6]), strength: n.default(2.4), color: hex.default("#fff2dc"), range: n.default(30) }).strict().default({}),
  ambient: n.default(1.6),
  shade: hex.default("#c9d6ff").describe("color of the shadows"),
  camera: z.object({ from: V3, to: V3, look: V3, fov: n.default(50) }).strict(),
  stage: V3.default([0, 0, 1.5]).describe("the point stickmen stand around in a story"),
  parts: z.array(PartSchema).min(1),
  scatter: z.array(Scatter).default([]),
}).strict().superRefine((l, ctx) => {
  if (!l.ground && !l.terrain) ctx.addIssue({ code: "custom", message: "a location needs ground or terrain" });
});

export type Part = z.infer<typeof PartSchema>;
export type Objects = z.infer<typeof ObjectsSchema>;
export type LocationData = z.infer<typeof LocationSchema>;
export type LocationSet = { locations: LocationData[]; objects: Objects };
