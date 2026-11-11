import { z } from "zod";
import {
  BACKGROUNDS, BUILDS, CAMERA_MOVES, EXPRESSIONS, FRAMINGS, FX, HAIR, HATS, INSERTS, MUSIC, OUTFITS, POSES, PROPS, SFX,
  TIMES, TRANSITIONS,
} from "./catalog";
import type { LocationData, Objects } from "./location3d/schema";

const color = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "hex color like #f2b632");

export const CharacterSchema = z.object({
  name: z.string().optional(),
  color: color.describe("main outfit color"),
  outfit: z.enum(OUTFITS).default("shirt"),
  hair: z.enum(HAIR).default("short"),
  hairColor: color.default("#8a4b24"),
  hat: z.enum(HATS).default("none"),
  hatColor: color.optional(),
  skin: color.default("#ffffff"),
  tie: color.optional(),
  bowtie: color.optional(),
  badge: z.boolean().default(false),
  mustache: z.boolean().default(false),
  beard: z.boolean().default(false),
  glasses: z.enum(["none", "round", "square", "sunglasses"]).default("none"),
  build: z.enum(BUILDS).default("normal"),
  lashes: z.boolean().default(false),
});

const at = z.union([z.string(), z.number()]).describe(
  "when: a word from this shot's `say` text (first match), or seconds from shot start",
);

export const ActorSchema = z.object({
  id: z.string().describe("key in story.cast"),
  x: z.number().min(-0.5).max(1.5).default(0.5).describe("0=left edge, 1=right edge"),
  z: z.number().min(0).max(1).default(0.45).describe("0=far (back wall), 1=near camera"),
  pose: z.enum(POSES).default("stand"),
  expression: z.enum(EXPRESSIONS).default("neutral"),
  facing: z.enum(["left", "right", "front"]).default("front"),
  holding: z.enum(PROPS).optional().describe("prop drawn in the actor's hand"),
  holdingLabel: z.string().optional(),
  talking: z.boolean().optional().describe("mouth flaps; default true for the shot's focus actor if it has a quote"),
  enter: z.enum(["none", "left", "right", "pop", "drop", "fade"]).default("none"),
  exit: z.enum(["none", "left", "right", "fade"]).default("none"),
  moveTo: z.number().optional().describe("x to walk to over the shot"),
  scale: z.number().default(1),
  flip: z.boolean().default(false).describe("upside down / tumbling"),
});

export const PropSchema = z.object({
  type: z.string().describe("a 2D prop from catalog.ts, or a 3D object from locations/_objects.json. Checked by scripts/make.ts"),
  x: z.number().default(0.5),
  z: z.number().min(0).max(1).default(0.45),
  y: z.number().optional().describe("lift above floor in px (e.g. on a table: 230)"),
  scale: z.number().default(1),
  rotate: z.number().default(0),
  color: color.optional(),
  label: z.string().optional().describe("text printed on the prop (signs, boards, cards, screens, boxes)"),
  glow: z.boolean().default(false),
  enter: z.enum(["none", "pop", "drop", "fade", "left", "right"]).default("none"),
  float: z.boolean().default(false),
  count: z.number().int().min(1).max(40).default(1).describe("repeat the prop in a row/pile"),
});

export const BeatSchema = z.object({
  at,
  actor: z.string().optional().describe("actor id; default = first actor"),
  pose: z.enum(POSES).optional(),
  expression: z.enum(EXPRESSIONS).optional(),
  fx: z.enum(FX).optional(),
  sfx: z.enum(SFX).optional(),
  zoom: z.number().optional().describe("punch the camera zoom by this factor, e.g. 1.25"),
});

export const InsertSchema = z.object({
  type: z.enum(INSERTS),
  title: z.string().optional(),
  lines: z.array(z.string()).default([]),
  value: z.number().optional().describe("counter: end value"),
  from: z.number().optional().describe("counter: start value"),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  data: z.array(z.number()).default([]).describe("chart bars"),
  highlight: z.number().int().optional().describe("index of line/bar to highlight"),
  color: color.optional(),
});

export const ShotSchema = z.object({
  say: z.string().min(1).describe("narration spoken during this shot"),
  bg: z.enum(BACKGROUNDS).default("void").describe("2D background; ignored when location is set"),
  location: z.string().optional().describe("a 3D location: the name of a file in locations/"),
  time: z.enum(TIMES).default("day"),
  tint: color.optional().describe("overall color grade tint for the scene (e.g. #ff4fa8 for a pink room)"),
  wall: color.optional().describe("override wall color for interiors"),
  actors: z.array(ActorSchema).default([]),
  props: z.array(PropSchema).default([]),
  framing: z.enum(FRAMINGS).default("medium"),
  focus: z.string().optional().describe("actor id or 'prop:N' (index in props) the camera frames"),
  camera: z.enum(CAMERA_MOVES).default("pushIn"),
  fx: z.array(z.enum(FX)).default([]),
  beats: z.array(BeatSchema).default([]),
  sfx: z.array(z.enum(SFX)).default([]).describe("sounds at shot start"),
  insert: InsertSchema.optional().describe("full-screen graphic instead of/over the scene"),
  transition: z.enum(TRANSITIONS).default("dissolve").describe("how this shot enters"),
  quote: z.string().optional().describe("actor id who is speaking a quoted line in this shot (gets talking mouth)"),
});

export const StorySchema = z.object({
  title: z.string(),
  voice: z.string().default("en-US-AndrewMultilingualNeural"),
  rate: z.string().default("+22%"),
  music: z.enum(MUSIC).default("curious"),
  cast: z.record(z.string(), CharacterSchema),
  shots: z.array(ShotSchema).min(1),
});

export type Story = z.infer<typeof StorySchema>;
export type StoryInput = z.input<typeof StorySchema>;
export type Shot = z.infer<typeof ShotSchema>;
export type Actor = z.infer<typeof ActorSchema>;
export type PropSpec = z.infer<typeof PropSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Beat = z.infer<typeof BeatSchema>;
export type Insert = z.infer<typeof InsertSchema>;

// ---------- resolved timeline (produced by scripts/make.ts, consumed by the composition) ----------
export type Word = { text: string; start: number; end: number }; // seconds, absolute

export type ResolvedBeat = Beat & { frame: number }; // frame relative to shot start

export type ResolvedShot = Shot & {
  from: number; // absolute start frame
  duration: number; // frames (not including dissolve overlap)
  words: Word[];
  beatsResolved: ResolvedBeat[];
  index: number;
};

export type SfxCue = { name: string; frame: number; volume: number };

export type Timeline = {
  story: Story;
  fps: number;
  durationInFrames: number;
  voiceSrc: string | null; // path under public/
  musicSrc: string | null;
  words: Word[];
  shots: ResolvedShot[];
  sfx: SfxCue[];
  locations?: Record<string, LocationData>; // only the 3D locations this story uses
  objects?: Objects;
};
