import type { POSES } from "../catalog";

export type Pose = (typeof POSES)[number];

// Arm target relative to its own shoulder. `out` is measured AWAY from the body
// (so the left arm mirrors), `dy` is downwards, `bend` bows the elbow outward.
// Special targets: "chin" | "ear" | "face" attach the hand to the head.
export type ArmT = { out: number; dy: number; bend: number; at?: "chin" | "ear" | "face" };
export type LegT = { out: number; dx?: number; lift: number; bend: number };

export type PoseDef = {
  l: ArmT; // left arm (screen-left when facing front)
  r: ArmT; // right arm = the "action" arm (points toward facing direction)
  ll: LegT;
  rl: LegT;
  tilt: number; // degrees, body lean (+ = toward facing)
  drop: number; // px the body is lowered (crouch / sit)
  headTilt: number;
};

const hang: ArmT = { out: 12, dy: 92, bend: 20 };
const legs = { ll: { out: 4, lift: 0, bend: 0 }, rl: { out: 4, lift: 0, bend: 0 } };

export const POSE_DEFS: Record<Pose, PoseDef> = {
  stand: { l: hang, r: hang, ...legs, tilt: 0, drop: 0, headTilt: 0 },
  talk: { l: hang, r: { out: 58, dy: 22, bend: -26 }, ...legs, tilt: 0, drop: 0, headTilt: 3 },
  point: { l: hang, r: { out: 104, dy: -14, bend: 4 }, ...legs, tilt: 4, drop: 0, headTilt: 0 },
  wave: { l: hang, r: { out: 50, dy: -82, bend: 24 }, ...legs, tilt: 0, drop: 0, headTilt: -4 },
  armsUp: { l: { out: 46, dy: -86, bend: 16 }, r: { out: 46, dy: -86, bend: 16 }, ...legs, tilt: 0, drop: 0, headTilt: 0 },
  shrug: { l: { out: 62, dy: -4, bend: -30 }, r: { out: 62, dy: -4, bend: -30 }, ...legs, tilt: 0, drop: 0, headTilt: 8 },
  think: { l: { out: -36, dy: 52, bend: 22 }, r: { out: 0, dy: 0, bend: -34, at: "chin" }, ...legs, tilt: 0, drop: 0, headTilt: 6 },
  crossed: { l: { out: -60, dy: 44, bend: -14 }, r: { out: -58, dy: 52, bend: -14 }, ...legs, tilt: 0, drop: 0, headTilt: -3 },
  hips: { l: { out: 14, dy: 64, bend: 46 }, r: { out: 14, dy: 64, bend: 46 }, ...legs, tilt: 0, drop: 0, headTilt: 0 },
  hold: { l: { out: -18, dy: 58, bend: 34 }, r: { out: -18, dy: 58, bend: 34 }, ...legs, tilt: 0, drop: 0, headTilt: 0 },
  holdUp: { l: hang, r: { out: 34, dy: -98, bend: 12 }, ...legs, tilt: -3, drop: 0, headTilt: -6 },
  facepalm: { l: hang, r: { out: 0, dy: 0, bend: -40, at: "face" }, ...legs, tilt: 4, drop: 0, headTilt: 10 },
  sit: {
    l: { out: 8, dy: 76, bend: 18 }, r: { out: 8, dy: 76, bend: 18 },
    ll: { out: 26, lift: 0, bend: 30 }, rl: { out: 26, lift: 0, bend: 30 }, tilt: 0, drop: 58, headTilt: 0,
  },
  walk: { l: hang, r: hang, ...legs, tilt: 3, drop: 0, headTilt: 0 },
  run: { l: { out: 20, dy: 60, bend: -40 }, r: { out: 20, dy: 60, bend: -40 }, ...legs, tilt: 12, drop: 0, headTilt: 0 },
  fall: {
    l: { out: 70, dy: -70, bend: 20 }, r: { out: 76, dy: -50, bend: -20 },
    ll: { out: 40, lift: 30, bend: 20 }, rl: { out: 30, lift: 10, bend: -20 }, tilt: -24, drop: 0, headTilt: -10,
  },
  lie: { l: hang, r: hang, ...legs, tilt: 0, drop: 0, headTilt: 0 },
  cower: {
    l: { out: 4, dy: -40, bend: 34 }, r: { out: 4, dy: -46, bend: 34 },
    ll: { out: 20, lift: 0, bend: 26 }, rl: { out: 20, lift: 0, bend: 26 }, tilt: -6, drop: 36, headTilt: 6,
  },
  push: { l: { out: -96, dy: 10, bend: 10 }, r: { out: 96, dy: 4, bend: 10 }, ll: { out: 4, dx: -20, lift: 0, bend: 0 }, rl: { out: 4, dx: 22, lift: 0, bend: 10 }, tilt: 14, drop: 0, headTilt: 0 },
  reach: { l: hang, r: { out: 22, dy: -116, bend: 6 }, ...legs, tilt: -4, drop: 0, headTilt: -10 },
  hammer: { l: hang, r: { out: 30, dy: -100, bend: 14 }, ...legs, tilt: -4, drop: 0, headTilt: 0 },
  type: { l: { out: -10, dy: 46, bend: 30 }, r: { out: -10, dy: 46, bend: 30 }, ...legs, tilt: 4, drop: 0, headTilt: 6 },
  phone: { l: hang, r: { out: 0, dy: 0, bend: -40, at: "ear" }, ...legs, tilt: 0, drop: 0, headTilt: -6 },
  fidget: { l: hang, r: { out: 30, dy: 96, bend: 26 }, ...legs, tilt: 4, drop: 0, headTilt: -2 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpArm = (a: ArmT, b: ArmT, t: number): ArmT => ({
  out: lerp(a.out, b.out, t), dy: lerp(a.dy, b.dy, t), bend: lerp(a.bend, b.bend, t), at: t < 0.5 ? a.at : b.at,
});
const lerpLeg = (a: LegT, b: LegT, t: number): LegT => ({
  out: lerp(a.out, b.out, t), dx: lerp(a.dx ?? 0, b.dx ?? 0, t), lift: lerp(a.lift, b.lift, t), bend: lerp(a.bend, b.bend, t),
});
export const lerpPose = (a: PoseDef, b: PoseDef, t: number): PoseDef => ({
  l: lerpArm(a.l, b.l, t), r: lerpArm(a.r, b.r, t), ll: lerpLeg(a.ll, b.ll, t), rl: lerpLeg(a.rl, b.rl, t),
  tilt: lerp(a.tilt, b.tilt, t), drop: lerp(a.drop, b.drop, t), headTilt: lerp(a.headTilt, b.headTilt, t),
});
