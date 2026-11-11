// Puts a story shot into a 3D location: where the stage is, where the camera goes,
// and how a point in the world lands on the screen.
import * as THREE from "three";
import { PROPS } from "../catalog";
import { H, W, clamp, ease, easeOut, hashStr, lerp, rand } from "../theme";
import type { ResolvedShot } from "../schema";
import type { LocationData, Objects } from "./schema";

export type V3 = [number, number, number];
export type View = { from: V3; look: V3; fov: number };
export type Extra = { use: string; at: V3; turn: number; scale: number; color?: string };

const HEIGHT = 1.7; // a stickman in metres
export const METRE = 362 / HEIGHT; // character drawing units per metre
const STAGE_W = 4.2; // metres from x=0 to x=1 in a story
const STAGE_D = 3; // metres from z=0 to z=1 in a story
const TRANS = 7; // keep in sync with Video.tsx
/** The 3D picture is drawn this much larger so that blur never shows its edges. */
export const OVERSCAN = 1.03;

export type Axes = { stage: V3; right: V3; back: V3 };

export const axesOf = (l: LocationData): Axes => {
  const c = l.camera;
  const bx = (c.from[0] + c.to[0]) / 2 - c.look[0], bz = (c.from[2] + c.to[2]) / 2 - c.look[2], n = Math.hypot(bx, bz) || 1;
  return { stage: l.stage, right: [bz / n, 0, -bx / n], back: [bx / n, 0, bz / n] };
};

/** Story coordinates (x 0..1, z 0..1) to metres. */
export const worldOf = ({ stage, right, back }: Axes, x: number, z: number, y = 0): V3 => {
  const a = (x - 0.5) * STAGE_W, b = (z - 0.45) * STAGE_D;
  return [stage[0] + right[0] * a + back[0] * b, stage[1] + y, stage[2] + right[2] * a + back[2] * b];
};

const SIZE_ON_SCREEN = { wide: 0.235, full: 0.34, medium: 0.47, close: 0.68, extreme: 0.99 } as const; // stickman height / frame height
const AIM = { wide: 0.5, full: 0.52, medium: 0.64, close: 0.84, extreme: 0.87 } as const; // which part of the body the camera frames

type Focus = { x: number; z: number; aim: number };

const focusOf = (shot: ResolvedShot): Focus => {
  const aim = AIM[shot.framing];
  const id = shot.focus ?? shot.actors[0]?.id ?? (shot.props.length ? "prop:0" : undefined);
  if (id?.startsWith("prop:")) {
    const p = shot.props[parseInt(id.slice(5), 10) || 0];
    if (p) return { x: p.x, z: p.z, aim: 0.35 };
  }
  const mid = (a: ResolvedShot["actors"][number]) => (a.moveTo !== undefined ? lerp(a.x, a.moveTo, 0.5) : a.x);
  const actor = shot.actors.find((a) => a.id === id) ?? shot.actors[0];
  if (!actor) return { x: 0.5, z: 0.45, aim };
  let x = mid(actor);
  if (actor.pose === "lie") x -= 0.2; // a lying figure stretches to the left of its feet
  if (shot.actors.length > 1 && (shot.framing === "wide" || shot.framing === "full" || shot.framing === "medium")) {
    const xs = shot.actors.map(mid);
    x = lerp(x, (Math.min(...xs) + Math.max(...xs)) / 2, shot.framing === "medium" ? 0.45 : 0.85);
  }
  if (shot.framing === "wide") x = lerp(0.5, x, 0.35);
  return { x, z: actor.z, aim };
};

/** The camera for one frame of a shot. Same moves as the 2D scenes, but real ones. */
export const shotView = (shot: ResolvedShot, location: LocationData, axes: Axes, frame: number, duration: number): View => {
  const { camera } = location, { right, back } = axes;
  const tan = Math.tan((camera.fov * Math.PI) / 360);
  const focus = focusOf(shot);
  const p = ease(clamp(frame / Math.max(1, duration + TRANS)));
  const seed = hashStr(shot.say);

  let zoom = 1, swing = 0, sideScreen = 0, riseScreen = 0;
  switch (shot.camera) {
    case "pushIn": zoom = 1 + 0.12 * p; break;
    case "pullOut": zoom = 1.14 - 0.14 * p; break;
    case "panLeft": sideScreen = 0.13 * (1 - 2 * p); break;
    case "panRight": sideScreen = -0.13 * (1 - 2 * p); break;
    case "panUp": riseScreen = -0.1 * (1 - 2 * p); break;
    case "panDown": riseScreen = 0.1 * (1 - 2 * p); break;
    case "drift": sideScreen = Math.sin(frame / 40 + seed * 6) * 0.028; zoom = 1.03 + 0.04 * p; break;
    case "crashZoom": zoom = 1 + 0.55 * easeOut(clamp(frame / 8)); break;
    case "orbit": swing = (16 * Math.PI * (1 - 2 * p)) / 180; break;
    case "static": break;
  }
  for (const b of shot.beatsResolved) if (b.zoom && frame >= b.frame) zoom *= 1 + (b.zoom - 1) * easeOut(clamp((frame - b.frame) / 6));

  const dist = HEIGHT / (SIZE_ON_SCREEN[shot.framing] * 2 * tan) / zoom;
  const visH = 2 * tan * dist, visW = (visH * W) / H;

  // handheld wobble and impact shake, in pixels
  let jx = Math.sin(frame / 23 + seed * 10) * 3 + Math.sin(frame / 11 + seed) * 1.5, jy = Math.cos(frame / 29 + seed * 7) * 3;
  const shakes = [
    ...(shot.fx.includes("shake") ? [0] : []),
    ...shot.beatsResolved.filter((b) => b.fx === "shake" || b.fx === "explosion" || b.sfx === "boom" || b.sfx === "impact" || b.sfx === "crash").map((b) => b.frame),
  ];
  for (const f0 of shakes) {
    const age = frame - f0;
    if (age >= 0 && age < 14) {
      const k = (1 - age / 14) * 22;
      jx += (rand(frame * 1.7 + f0) - 0.5) * k;
      jy += (rand(frame * 3.1 + f0) - 0.5) * k;
    }
  }

  const f = worldOf(axes, focus.x, focus.z);
  const side = sideScreen * visW, rise = riseScreen * visH, shiftX = side + (jx / W) * visW, shiftY = (jy / H) * visH;
  const bx = back[0] * Math.cos(swing) + right[0] * Math.sin(swing), bz = back[2] * Math.cos(swing) + right[2] * Math.sin(swing);
  const aimY = f[1] + HEIGHT * focus.aim - 0.0625 * visH; // keeps the subject above the captions
  return {
    from: [f[0] + bx * dist + right[0] * side, Math.max(0.3, camera.from[1] + rise), f[2] + bz * dist + right[2] * side],
    look: [f[0] + right[0] * shiftX, aimY + rise + shiftY, f[2] + right[2] * shiftX],
    fov: camera.fov,
  };
};

/** Turns world points into screen pixels plus a drawing scale for a stickman standing there. */
export const projector = (view: View) => {
  const cam = new THREE.PerspectiveCamera(view.fov, W / H, 0.1, 3000);
  cam.position.set(...view.from);
  cam.lookAt(...view.look);
  cam.updateMatrixWorld();
  const pxPerMetreAtOne = (H / 2 / Math.tan((view.fov * Math.PI) / 360)) * OVERSCAN;
  return (p: V3) => {
    const v = new THREE.Vector3(...p).project(cam);
    const depth = new THREE.Vector3(...p).applyMatrix4(cam.matrixWorldInverse).z * -1;
    return {
      x: W / 2 + (v.x * W * OVERSCAN) / 2,
      y: H / 2 - (v.y * H * OVERSCAN) / 2,
      s: pxPerMetreAtOne / Math.max(0.05, depth) / METRE,
      depth,
    };
  };
};

const ALIAS: Record<string, string> = { pinetree: "pine" };

/** The 3D object for a story prop, if the library has one. Labels and glow need the 2D drawing, when there is one. */
export const object3dFor = (type: string, objects: Objects, plain: boolean) => {
  const name = ALIAS[type] ?? type;
  if (!objects[name]) return undefined;
  return plain || !(PROPS as readonly string[]).includes(type) ? name : undefined;
};
