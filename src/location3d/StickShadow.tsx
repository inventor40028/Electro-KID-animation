// An invisible 3D stand-in for a 2D stickman. It only exists to cast a real shadow from the location's sun.
import React from "react";
import * as THREE from "three";
import { BUILD } from "../character/Character";
import { POSE_DEFS, lerpPose, type ArmT, type Pose } from "../character/poses";
import type { Character as CharDef } from "../schema";
import { clamp, easeOut, hashStr } from "../theme";
import { METRE, type V3 } from "./stage";

type P = [number, number];
type Bone = { a: P; b: P; r: number; round?: boolean };

export type Figure = {
  ch: CharDef; id: string; pose: Pose; prevPose?: Pose; poseAge: number;
  walking: number; facing: "left" | "right" | "front"; t: number;
};

// Mirrors the proportions drawn by Character.tsx, in the same units (feet at 0, y pointing down).
const bonesOf = (f: Figure): Bone[] => {
  const b = BUILD[f.ch.build] ?? BUILD.normal;
  const target = POSE_DEFS[f.pose] ?? POSE_DEFS.stand, from = f.prevPose ? POSE_DEFS[f.prevPose] : target;
  const pd = lerpPose(from, target, easeOut(clamp(f.poseAge / 7)));
  const phase = f.t * Math.PI * 2 * (f.walking > 1.2 ? 2.6 : 1.7) + hashStr(f.id) * 10;
  const yB = -b.leg + 8 + pd.drop, yT = yB - b.bh, headR = 68 * b.head, headY = yT - headR * 0.68, shoulderY = yT + 34, sx = b.bw * 0.4;
  const hand = (a: ArmT, side: number, swing: number): P => {
    if (a.at === "chin") return [12, headY + headR * 0.82];
    if (a.at === "face") return [4, headY + 6];
    if (a.at === "ear") return [side * headR * 0.95, headY + 8];
    return [side * sx + side * a.out + swing, shoulderY + a.dy];
  };
  const swing = f.walking ? Math.sin(phase) * 24 * Math.min(f.walking, 1.4) : 0;
  const foot = (out: number, dx: number, lift: number, side: number, ph: number): P => [
    side * (22 + out) + dx + (f.walking ? Math.sin(ph) * (f.walking > 1.2 ? 40 : 26) : 0),
    -lift - (f.walking ? Math.max(0, -Math.cos(ph)) * (f.walking > 1.2 ? 26 : 14) : 0),
  ];
  const hip = yB - 6;
  const bones: Bone[] = [
    { a: [0, yT], b: [0, yB], r: b.bw * 0.46, round: true },
    { a: [0, headY], b: [0, headY], r: headR, round: true },
    { a: [-sx, shoulderY], b: hand(pd.l, -1, swing), r: 7 },
    { a: [sx, shoulderY], b: hand(pd.r, 1, -swing), r: 7 },
    { a: [-b.bw * 0.2, hip], b: foot(pd.ll.out, pd.ll.dx ?? 0, pd.ll.lift, -1, phase), r: 7 },
    { a: [b.bw * 0.2, hip], b: foot(pd.rl.out, pd.rl.dx ?? 0, pd.rl.lift, 1, phase + Math.PI), r: 7 },
  ];
  const mirror = f.facing === "left" ? -1 : 1;
  const tilt = (((pd.tilt + (f.walking ? 2 : 0)) * Math.PI) / 180) * mirror;
  const place = ([x, y]: P): P => {
    const dy = y - yB;
    let px = (x * Math.cos(tilt) * mirror - dy * Math.sin(tilt)), py = x * Math.sin(tilt) * mirror + dy * Math.cos(tilt) + yB;
    if (f.pose === "lie") { const lx = py, ly = -px; px = lx; py = ly - 60; }
    return [px, py];
  };
  return bones.map((x) => ({ ...x, a: place(x.a), b: place(x.b) }));
};

const cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
const sphere = new THREE.SphereGeometry(1, 12, 8);
// Writes nothing to the picture, but three.js still draws it into the shadow map.
const invisible = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
const UP = new THREE.Vector3(0, 1, 0);

export const StickShadow: React.FC<{ figure: Figure; foot: V3; right: V3; scale: number }> = ({ figure, foot, right, scale }) => {
  const u = scale / METRE;
  const world = ([x, y]: P) => new THREE.Vector3(foot[0] + right[0] * x * u, foot[1] - y * u, foot[2] + right[2] * x * u);
  return (
    <>
      {bonesOf(figure).map((bone, i) => {
        const a = world(bone.a), b = world(bone.b), dir = b.clone().sub(a), len = dir.length(), r = bone.r * u;
        const q = len > 1e-4 ? new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()) : new THREE.Quaternion();
        const size = bone.round ? new THREE.Vector3(r, Math.max(r, len / 2 + r * 0.5), r) : new THREE.Vector3(r, Math.max(len, 1e-3), r);
        const matrix = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, size);
        return <mesh key={i} geometry={bone.round ? sphere : cylinder} material={invisible} matrix={matrix} matrixAutoUpdate={false} castShadow frustumCulled={false} />;
      })}
    </>
  );
};
