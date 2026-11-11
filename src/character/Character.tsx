import React from "react";
import { INK, clamp, easeOut, hashStr, mix, shade } from "../theme";
import type { Character as CharDef } from "../schema";
import { Face, type Expression } from "./faces";
import { HairShape, HatShape, Star } from "./headwear";
import { POSE_DEFS, lerpPose, type ArmT, type LegT, type Pose, type PoseDef } from "./poses";

type Vec = [number, number];

export const BUILD = {
  normal: { bw: 106, bh: 148, leg: 100, head: 1, scale: 1 },
  big: { bw: 150, bh: 160, leg: 92, head: 1.05, scale: 1.06 },
  skinny: { bw: 80, bh: 150, leg: 112, head: 0.95, scale: 1 },
  kid: { bw: 96, bh: 118, leg: 78, head: 1.12, scale: 0.74 },
  tall: { bw: 100, bh: 170, leg: 140, head: 1, scale: 1.05 },
} as const;

export type CharacterProps = {
  ch: CharDef;
  id: string;
  pose: Pose;
  prevPose?: Pose;
  poseT?: number; // 0..1 blend progress from prevPose to pose
  expression: Expression;
  exprAge?: number; // frames since expression changed (for a little pop)
  facing: "left" | "right" | "front";
  talking: boolean;
  t: number; // seconds since shot start
  frame: number;
  walking?: number; // walk speed multiplier (0 = standing)
  held?: React.ReactNode;
  light?: { side: number; color: string; strength: number }; // rim light
};

const bodyPath = (w: number, yT: number, yB: number, flare = 0) => {
  const h = yB - yT;
  const wb = w * (0.5 + flare);
  return `M 0 ${yT} C ${w * 0.47} ${yT} ${w * 0.52} ${yT + h * 0.22} ${w * 0.5} ${yT + h * 0.52} C ${wb} ${yB - h * 0.06} ${wb * 0.66} ${yB} 0 ${yB} C ${-wb * 0.66} ${yB} ${-wb} ${yB - h * 0.06} ${-w * 0.5} ${yT + h * 0.52} C ${-w * 0.52} ${yT + h * 0.22} ${-w * 0.47} ${yT} 0 ${yT} Z`;
};

const limb = (a: Vec, b: Vec, bend: number, side: number): string => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len;
  if (nx * side + ny * 0.35 < 0) { nx = -nx; ny = -ny; }
  const cx = (a[0] + b[0]) / 2 + nx * bend, cy = (a[1] + b[1]) / 2 + ny * bend;
  return `M ${a[0]} ${a[1]} Q ${cx} ${cy} ${b[0]} ${b[1]}`;
};

export const Character: React.FC<CharacterProps> = (p) => {
  const { ch, t, frame } = p;
  const b = BUILD[ch.build] ?? BUILD.normal;
  const seed = hashStr(p.id);
  const uid = p.id.replace(/[^a-zA-Z0-9]/g, "") + Math.round(seed * 1e6);
  const base = ch.color;
  const mirror = p.facing === "left" ? -1 : 1;
  const look = p.facing === "front" ? 0 : 1;

  // ---------------- pose blending ----------------
  const target = POSE_DEFS[p.pose] ?? POSE_DEFS.stand;
  const from = p.prevPose ? POSE_DEFS[p.prevPose] : target;
  const pt = easeOut(clamp(p.poseT ?? 1));
  const pd: PoseDef = lerpPose(from, target, pt);

  // ---------------- body metrics ----------------
  const breathe = Math.sin(t * 2.4 + seed * 6) * 0.012;
  const walking = p.walking ?? (p.pose === "walk" ? 1 : p.pose === "run" ? 1.8 : 0);
  const phase = t * Math.PI * 2 * (walking > 1.2 ? 2.6 : 1.7) + seed * 10;
  const bob = walking ? Math.abs(Math.sin(phase)) * (walking > 1.2 ? 10 : 5) : 0;

  const leg = b.leg;
  const drop = pd.drop;
  const yB = -leg + 8 + drop - bob; // body bottom
  const yT = yB - b.bh * (1 + breathe); // body top
  const headR = 68 * b.head;
  const headY = yT - headR * 0.68;
  const shoulderY = yT + 34;
  const sx = b.bw * 0.4;
  const hipY = yB - 6;

  // ---------------- arms ----------------
  const headLocal = (v: Vec): Vec => v; // head coords are already body coords here
  const resolveArm = (a: ArmT, side: number, swing: number): Vec => {
    const sh: Vec = [side * sx, shoulderY];
    if (a.at === "chin") return headLocal([12 + look * 10, headY + headR * 0.82]);
    if (a.at === "face") return headLocal([look * 10 + 4, headY + 6]);
    if (a.at === "ear") return headLocal([side * headR * 0.95, headY + 8]);
    return [sh[0] + side * a.out + swing, sh[1] + a.dy];
  };
  const swingL = walking ? Math.sin(phase) * 24 * Math.min(walking, 1.4) : 0;
  const swingR = -swingL;

  // small idle/gesture motion
  const gest = p.pose === "talk" ? Math.sin(t * 6 + seed) * 8 : 0;
  const wave = p.pose === "wave" ? Math.sin(t * 14) * 18 : 0;
  const hammerSwing = p.pose === "hammer" ? (Math.sin(t * 9) + 1) / 2 : 0;
  const typeJig = p.pose === "type" ? Math.sin(t * 30) * 3 : 0;
  const fidget = p.pose === "fidget" ? Math.sin(t * 22 + seed) * 20 : 0;
  const fidgetY = p.pose === "fidget" ? Math.cos(t * 22 + seed) * 6 : 0;

  const fromL = resolveArm(from.l, -1, 0), toL = resolveArm(target.l, -1, swingL);
  const fromR = resolveArm(from.r, 1, 0), toR = resolveArm(target.r, 1, swingR);
  const lh: Vec = [fromL[0] + (toL[0] - fromL[0]) * pt, fromL[1] + (toL[1] - fromL[1]) * pt + typeJig];
  const rh: Vec = [
    fromR[0] + (toR[0] - fromR[0]) * pt + wave + hammerSwing * 70 + fidget,
    fromR[1] + (toR[1] - fromR[1]) * pt + gest - typeJig + hammerSwing * 120 + fidgetY,
  ];
  const ls: Vec = [-sx, shoulderY], rs: Vec = [sx, shoulderY];

  // ---------------- legs ----------------
  const foot = (lg: LegT, side: number, ph: number): Vec => {
    const step = walking ? Math.sin(ph) * (walking > 1.2 ? 40 : 26) : 0;
    const lift = walking ? Math.max(0, -Math.cos(ph)) * (walking > 1.2 ? 26 : 14) : 0;
    return [side * (22 + lg.out) + (lg.dx ?? 0) + step, -lg.lift - lift];
  };
  const lf = foot(pd.ll, -1, phase);
  const rf = foot(pd.rl, 1, phase + Math.PI);
  const lhip: Vec = [-b.bw * 0.2, hipY], rhip: Vec = [b.bw * 0.2, hipY];
  const legBendL = pd.ll.bend + (walking ? 6 : 0) + (drop > 30 ? 30 : 0);
  const legBendR = pd.rl.bend + (walking ? 6 : 0) + (drop > 30 ? 30 : 0);

  // ---------------- face timing ----------------
  const blinkPeriod = 96 + Math.floor(seed * 50);
  const blink = (frame + Math.floor(seed * 200)) % blinkPeriod < 4;
  const talk = p.talking
    ? clamp(0.55 + 0.45 * Math.sin(t * 2 * Math.PI * 6.5 + seed * 5) * Math.sin(t * 2 * Math.PI * 1.7 + 1) + 0.25 * Math.sin(t * 31))
    : 0;
  const pop = p.exprAge !== undefined && p.exprAge < 8 ? 1 + 0.07 * Math.sin((p.exprAge / 8) * Math.PI) : 1;

  // ---------------- colors ----------------
  const light = p.light ?? { side: -0.6, color: "#fff4dc", strength: 0.5 };
  const lightSide = light.side * mirror; // light side in character space
  const hi = shade(base, 0.22), lo = shade(base, -0.28);
  const skin = ch.skin;
  const headLo = mix(skin, "#b9a99c", 0.32);
  const red = p.expression === "furious" ? 0.55 : p.expression === "angry" ? 0.15 : 0;

  const SW = 6.5;
  const flare = ch.outfit === "dress" || ch.outfit === "robe" ? 0.14 : 0;
  const bp = bodyPath(b.bw, yT, yB, flare);

  const armStroke = (d: string) => (
    <>
      <path d={d} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
    </>
  );
  const arm = (s: Vec, h: Vec, bend: number, side: number) => {
    const d = limb(s, h, bend, side);
    return (
      <g>
        {armStroke(d)}
        <circle cx={h[0]} cy={h[1]} r={9.5} fill={INK} />
      </g>
    );
  };

  // depth ordering: arm crossing in front of body when hand x is inside the body silhouette
  const legW = 8.5;
  const legs = (
    <g>
      <path d={limb(lhip, lf, legBendL, -1)} stroke={INK} strokeWidth={legW} fill="none" strokeLinecap="round" />
      <path d={limb(rhip, rf, legBendR, 1)} stroke={INK} strokeWidth={legW} fill="none" strokeLinecap="round" />
      <ellipse cx={lf[0] - 4 + look * 6} cy={lf[1] - 2} rx={13} ry={8.5} fill={INK} />
      <ellipse cx={rf[0] + 4 + look * 6} cy={rf[1] - 2} rx={13} ry={8.5} fill={INK} />
    </g>
  );

  const head = (
    <g transform={`translate(0 ${headY}) rotate(${pd.headTilt + Math.sin(t * 1.9 + seed * 4) * 1.5}) scale(${b.head * pop})`}>
      <defs>
        <radialGradient id={`hg${uid}`} cx={0.5 - lightSide * 0.18} cy={0.36} r={0.72}>
          <stop offset="0.55" stopColor={mix(skin, "#ff3b2f", red)} />
          <stop offset="1" stopColor={mix(headLo, "#c0201a", red)} />
        </radialGradient>
      </defs>
      <circle cx={0} cy={0} r={68} fill={`url(#hg${uid})`} stroke={INK} strokeWidth={SW} />
      {/* rim light on head */}
      <path
        d={`M ${-lightSide * 20} -64 A 66 66 0 0 ${lightSide < 0 ? 0 : 1} ${-lightSide * 64} ${-14}`}
        stroke={light.color}
        strokeWidth={5}
        fill="none"
        opacity={0.35 * light.strength}
        strokeLinecap="round"
        transform={`translate(${lightSide * 4} 4)`}
      />
      <Face expression={p.expression} blink={blink} talk={talk} look={look} t={t} />
      {ch.mustache && (
        <path d={`M ${look * 16 - 22} 22 q 10 -10 22 -2 q 12 -8 22 2 q -10 10 -22 0 q -12 10 -22 0 Z`} fill={mix(ch.hairColor, INK, 0.3)} stroke={INK} strokeWidth={3} />
      )}
      {ch.beard && <path d="M -60 20 Q -56 86 0 92 Q 56 86 60 20 Q 40 54 0 54 Q -40 54 -60 20 Z" fill={ch.hairColor} stroke={INK} strokeWidth={4.5} />}
      {ch.glasses !== "none" && <Glasses kind={ch.glasses} look={look} />}
      <HairShape hair={ch.hair} color={ch.hairColor} look={look} />
      <HatShape hat={ch.hat} color={ch.hatColor} look={look} />
    </g>
  );

  const clipId = `bc${uid}`;
  const body = (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={bp} />
        </clipPath>
        <linearGradient id={`bg${uid}`} x1={lightSide < 0 ? 0 : 1} y1={0} x2={lightSide < 0 ? 1 : 0} y2={0.3}>
          <stop offset="0" stopColor={hi} />
          <stop offset="0.45" stopColor={base} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
      </defs>
      <path d={bp} fill={`url(#bg${uid})`} />
      <g clipPath={`url(#${clipId})`}>
        <Outfit ch={ch} w={b.bw} yT={yT} yB={yB} />
        {/* bottom occlusion */}
        <ellipse cx={0} cy={yB + 10} rx={b.bw * 0.6} ry={34} fill="rgba(0,0,0,0.16)" />
        {/* rim light */}
        <path d={bp} fill="none" stroke={light.color} strokeWidth={14} opacity={0.3 * light.strength} transform={`translate(${-lightSide * 5} 3)`} style={{ mixBlendMode: "screen" }} />
      </g>
      <path d={bp} fill="none" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {ch.badge && <Badge yT={yT} w={b.bw} />}
    </g>
  );

  const lieRot = p.pose === "lie" ? -90 : 0;
  const tilt = pd.tilt + (walking ? 2 : 0);

  // held prop position (in this local space)
  const heldPos: Vec = p.pose === "hold" ? [(lh[0] + rh[0]) / 2, (lh[1] + rh[1]) / 2 - 10] : rh;

  return (
    <g transform={lieRot ? `translate(0 -60) rotate(${lieRot})` : undefined}>
      {/* contact shadow */}
      <ellipse cx={lieRot ? -60 : 0} cy={lieRot ? -170 : 0} rx={lieRot ? 14 : b.bw * 0.75} ry={lieRot ? 190 : 14} fill="rgba(0,0,0,0.22)" />
      <g transform={`scale(${mirror} 1)`}>
        <g transform={`rotate(${tilt} 0 ${yB})`}>
          <g transform={`translate(0 ${headY}) rotate(${pd.headTilt}) scale(${b.head * pop})`}>
            <HairShape hair={ch.hair} color={ch.hairColor} look={look} behind />
          </g>
          {legs}
          {body}
          {head}
          {arm(ls, lh, pd.l.bend + (p.pose === "hammer" ? 0 : 0), -1)}
          {arm(rs, rh, pd.r.bend, 1)}
        </g>
      </g>
      {p.held && (
        <g transform={`translate(${heldPos[0] * mirror} ${heldPos[1]}) rotate(${(tilt + (p.pose === "hammer" ? -60 + hammerSwing * 110 : 0)) * mirror})`}>
          {p.held}
        </g>
      )}
    </g>
  );
};

// ---------------- outfit details (clipped to body) ----------------
const Outfit: React.FC<{ ch: CharDef; w: number; yT: number; yB: number }> = ({ ch, w, yT, yB }) => {
  const h = yB - yT;
  const c = ch.color;
  const tie = ch.tie ? <Tie x={0} y={yT + 6} color={ch.tie} h={h * 0.5} /> : null;
  const bow = ch.bowtie ? <Bowtie x={0} y={yT + 14} color={ch.bowtie} /> : null;
  const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const };
  switch (ch.outfit) {
    case "shirt":
      return (
        <g>
          <path d={`M -26 ${yT - 2} L 0 ${yT + 26} L 26 ${yT - 2}`} fill="#ffffff" {...S} />
          {tie}
          {bow}
        </g>
      );
    case "suit":
      return (
        <g>
          <path d={`M -22 ${yT - 4} L 0 ${yT + h * 0.55} L 22 ${yT - 4} Z`} fill="#ffffff" {...S} />
          {tie ?? <Tie x={0} y={yT + 6} color="#c23b33" h={h * 0.42} />}
          {bow}
          <path d={`M -22 ${yT - 4} L -6 ${yT + h * 0.55} L -34 ${yT + 30} Z`} fill={shade(c, -0.15)} {...S} />
          <path d={`M 22 ${yT - 4} L 6 ${yT + h * 0.55} L 34 ${yT + 30} Z`} fill={shade(c, -0.15)} {...S} />
          <circle cx={0} cy={yT + h * 0.68} r={4.5} fill={INK} />
          <circle cx={0} cy={yT + h * 0.82} r={4.5} fill={INK} />
        </g>
      );
    case "overalls":
      return (
        <g>
          <path d={`M -${w} ${yT + h * 0.42} L -${w * 0.3} ${yT + h * 0.42} L -${w * 0.3} ${yT + h * 0.2} L ${w * 0.3} ${yT + h * 0.2} L ${w * 0.3} ${yT + h * 0.42} L ${w} ${yT + h * 0.42} L ${w} ${yB + 20} L -${w} ${yB + 20} Z`} fill="#3d6bb5" {...S} />
          <path d={`M -${w * 0.3} ${yT + h * 0.22} L -${w * 0.36} ${yT} M ${w * 0.3} ${yT + h * 0.22} L ${w * 0.36} ${yT}`} stroke="#3d6bb5" strokeWidth={10} />
          <circle cx={-w * 0.24} cy={yT + h * 0.26} r={5} fill="#f2c230" stroke={INK} strokeWidth={2} />
          <circle cx={w * 0.24} cy={yT + h * 0.26} r={5} fill="#f2c230" stroke={INK} strokeWidth={2} />
          <rect x={-w * 0.16} y={yT + h * 0.3} width={w * 0.32} height={h * 0.18} rx={4} fill="#335d9f" {...S} strokeWidth={3} />
        </g>
      );
    case "apron":
      return (
        <g>
          <path d={`M -${w * 0.32} ${yT + h * 0.12} L ${w * 0.32} ${yT + h * 0.12} L ${w * 0.4} ${yB + 10} L -${w * 0.4} ${yB + 10} Z`} fill="#fbfbf8" {...S} />
          <path d={`M -${w * 0.32} ${yT + h * 0.12} L -${w * 0.2} ${yT - 6} M ${w * 0.32} ${yT + h * 0.12} L ${w * 0.2} ${yT - 6}`} stroke="#fbfbf8" strokeWidth={6} />
          <rect x={-w * 0.16} y={yT + h * 0.55} width={w * 0.32} height={h * 0.16} rx={4} fill="#efefea" {...S} strokeWidth={3} />
          {tie}
          {bow ?? <Bowtie x={0} y={yT + 10} color="#d8342c" small />}
        </g>
      );
    case "uniform":
      return (
        <g>
          <path d={`M -20 ${yT - 2} L 0 ${yT + 20} L 20 ${yT - 2}`} fill={shade(c, -0.3)} {...S} />
          {[0.3, 0.48, 0.66].map((f) => (
            <circle key={f} cx={0} cy={yT + h * f} r={4.5} fill="#e9c04a" stroke={INK} strokeWidth={2} />
          ))}
          <rect x={-w} y={yT + h * 0.78} width={w * 2} height={12} fill="#1b1b1b" />
          <rect x={-8} y={yT + h * 0.78 - 1} width={16} height={14} fill="#e9c04a" stroke={INK} strokeWidth={2} />
          <Star x={-w * 0.24} y={yT + h * 0.3} r={10} />
          {tie}
        </g>
      );
    case "dress":
      return (
        <g>
          <path d={`M -${w} ${yT + h * 0.42} Q 0 ${yT + h * 0.5} ${w} ${yT + h * 0.42}`} stroke={shade(c, -0.3)} strokeWidth={6} fill="none" />
          {[-0.25, 0, 0.25].map((f) => (
            <circle key={f} cx={w * f} cy={yT + h * 0.7} r={6} fill={shade(c, 0.4)} />
          ))}
          {bow}
        </g>
      );
    case "labcoat":
      return (
        <g>
          <rect x={-w} y={yT - 10} width={w * 2} height={h + 30} fill="#f4f4f2" />
          <path d={`M -16 ${yT - 4} L 0 ${yT + h * 0.45} L 16 ${yT - 4} Z`} fill={c} {...S} />
          {tie}
          <path d={`M -16 ${yT - 4} L -4 ${yT + h * 0.48} L -30 ${yT + 26} Z M 16 ${yT - 4} L 4 ${yT + h * 0.48} L 30 ${yT + 26} Z`} fill="#e4e4e0" {...S} />
          <path d={`M 0 ${yT + h * 0.48} L 0 ${yB + 10}`} stroke={INK} strokeWidth={3} />
          <rect x={w * 0.14} y={yT + h * 0.3} width={w * 0.22} height={h * 0.14} fill="#e8e8e4" {...S} strokeWidth={3} />
          <path d={`M ${w * 0.2} ${yT + h * 0.3} l 0 -12 M ${w * 0.27} ${yT + h * 0.3} l 0 -10`} stroke="#2a6fd6" strokeWidth={4} />
        </g>
      );
    case "prisoner":
      return (
        <g>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={-w} y={yT + i * (h / 7)} width={w * 2} height={h / 14} fill={shade(c, -0.45)} opacity={0.85} />
          ))}
          <rect x={w * 0.08} y={yT + h * 0.26} width={w * 0.3} height={14} fill="#fff" {...S} strokeWidth={2.5} />
        </g>
      );
    case "tshirt":
      return (
        <g>
          <path d={`M -22 ${yT - 2} Q 0 ${yT + 16} 22 ${yT - 2}`} fill="none" stroke={shade(c, -0.35)} strokeWidth={6} />
          {tie}
          {bow}
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path d={`M -40 ${yT - 6} Q 0 ${yT + 34} 40 ${yT - 6}`} fill={shade(c, -0.15)} {...S} />
          <path d={`M -8 ${yT + 18} l -2 30 M 8 ${yT + 18} l 2 30`} stroke="#f4f4f2" strokeWidth={4} strokeLinecap="round" />
          <path d={`M -${w * 0.3} ${yT + h * 0.62} L ${w * 0.3} ${yT + h * 0.62} L ${w * 0.36} ${yT + h * 0.84} L -${w * 0.36} ${yT + h * 0.84} Z`} fill={shade(c, -0.1)} {...S} strokeWidth={3} />
        </g>
      );
    case "vest":
      return (
        <g>
          <rect x={-w * 0.22} y={yT - 10} width={w * 0.44} height={h + 20} fill="#f4f1ea" />
          {tie}
          {bow}
          <path d={`M -${w * 0.22} ${yT} L -${w * 0.06} ${yT + h * 0.7} L -${w * 0.06} ${yB + 10} L -${w} ${yB + 10} L -${w} ${yT} Z`} fill={c} {...S} />
          <path d={`M ${w * 0.22} ${yT} L ${w * 0.06} ${yT + h * 0.7} L ${w * 0.06} ${yB + 10} L ${w} ${yB + 10} L ${w} ${yT} Z`} fill={c} {...S} />
          {[0.6, 0.75].map((f) => (
            <circle key={f} cx={w * 0.12} cy={yT + h * f} r={4} fill={INK} />
          ))}
        </g>
      );
    case "sweater":
      return (
        <g>
          <path d={`M -24 ${yT - 2} Q 0 ${yT + 18} 24 ${yT - 2}`} fill="none" stroke={shade(c, -0.3)} strokeWidth={8} />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={-w + i * (w / 5.5)} y1={yB - 18} x2={-w + i * (w / 5.5)} y2={yB + 4} stroke={shade(c, -0.25)} strokeWidth={3} />
          ))}
          <path d={`M -${w} ${yT + h * 0.45} L ${w} ${yT + h * 0.45}`} stroke={shade(c, 0.3)} strokeWidth={10} strokeDasharray="12 8" />
        </g>
      );
    case "spacesuit":
      return (
        <g>
          <rect x={-w} y={yT - 10} width={w * 2} height={h + 30} fill="#efefef" />
          <rect x={-w * 0.26} y={yT + h * 0.25} width={w * 0.52} height={h * 0.28} rx={6} fill="#c9ced6" {...S} />
          <circle cx={-w * 0.12} cy={yT + h * 0.34} r={5} fill="#d8342c" />
          <circle cx={w * 0.04} cy={yT + h * 0.34} r={5} fill="#2fa84f" />
          <rect x={-w * 0.18} y={yT + h * 0.42} width={w * 0.36} height={6} fill="#2a6fd6" />
          <rect x={-w} y={yT + h * 0.72} width={w * 2} height={10} fill={c} />
        </g>
      );
    case "robe":
      return (
        <g>
          <path d={`M -18 ${yT - 4} L 10 ${yB + 10}`} stroke={shade(c, -0.3)} strokeWidth={6} />
          <rect x={-w} y={yT + h * 0.55} width={w * 2} height={12} fill={shade(c, 0.35)} {...S} strokeWidth={3} />
        </g>
      );
    case "jersey":
      return (
        <g>
          <path d={`M -22 ${yT - 2} L 0 ${yT + 18} L 22 ${yT - 2}`} fill="none" stroke="#ffffff" strokeWidth={7} />
          <text x={0} y={yT + h * 0.62} textAnchor="middle" fontFamily="Montserrat, Arial Black, sans-serif" fontWeight={900} fontSize={44} fill="#ffffff" stroke={INK} strokeWidth={3}>
            {Math.floor(hashStr(c) * 98 + 1)}
          </text>
        </g>
      );
  }
  return null;
};

const Tie: React.FC<{ x: number; y: number; color: string; h: number }> = ({ x, y, color, h }) => (
  <g>
    <path d={`M ${x - 7} ${y} L ${x + 7} ${y} L ${x + 5} ${y + 12} L ${x + 12} ${y + h} L ${x} ${y + h + 12} L ${x - 12} ${y + h} L ${x - 5} ${y + 12} Z`} fill={color} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <path d={`M ${x - 9} ${y + 30} L ${x + 9} ${y + 22} M ${x - 10} ${y + 52} L ${x + 10} ${y + 44}`} stroke={shade(color, -0.3)} strokeWidth={4} />
  </g>
);

const Bowtie: React.FC<{ x: number; y: number; color: string; small?: boolean }> = ({ x, y, color, small }) => {
  const s = small ? 0.7 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 0 L -26 -13 L -26 13 Z M 0 0 L 26 -13 L 26 13 Z" fill={color} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <circle cx={-14} cy={-2} r={3} fill="#fff" />
      <circle cx={16} cy={3} r={3} fill="#fff" />
      <rect x={-6} y={-7} width={12} height={14} rx={3} fill={color} stroke={INK} strokeWidth={3} />
    </g>
  );
};

const Badge: React.FC<{ yT: number; w: number }> = ({ yT, w }) => (
  <g>
    <path d={`M -${w * 0.26} ${yT + 4} Q -${w * 0.2} ${yT + 60} -${w * 0.16} ${yT + 66}`} stroke="#d8342c" strokeWidth={5} fill="none" />
    <path d={`M -${w * 0.02} ${yT + 4} Q -${w * 0.08} ${yT + 60} -${w * 0.12} ${yT + 66}`} stroke="#d8342c" strokeWidth={5} fill="none" />
    <rect x={-w * 0.3} y={yT + 64} width={w * 0.34} height={w * 0.38} rx={5} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
    <rect x={-w * 0.3} y={yT + 64} width={w * 0.34} height={9} rx={4} fill="#d8342c" />
    <circle cx={-w * 0.13} cy={yT + 64 + w * 0.17} r={7} fill="#f2c230" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <line key={i} x1={-w * 0.26 + i * 5} y1={yT + 64 + w * 0.28} x2={-w * 0.26 + i * 5} y2={yT + 64 + w * 0.34} stroke={INK} strokeWidth={2} />
    ))}
  </g>
);

const Glasses: React.FC<{ kind: "round" | "square" | "sunglasses"; look: number }> = ({ kind, look }) => {
  const ox = look * 16;
  if (kind === "sunglasses")
    return (
      <g>
        <path d={`M ${ox - 42} -8 L ${ox - 4} -8 L ${ox - 8} 14 Q ${ox - 24} 22 ${ox - 38} 12 Z M ${ox + 4} -8 L ${ox + 42} -8 L ${ox + 38} 12 Q ${ox + 24} 22 ${ox + 8} 14 Z`} fill="#15151b" stroke={INK} strokeWidth={4} />
        <line x1={ox - 6} y1={-6} x2={ox + 6} y2={-6} stroke={INK} strokeWidth={4} />
        <path d={`M ${ox - 34} -4 l 10 0`} stroke="#ffffff" strokeWidth={3} opacity={0.6} />
      </g>
    );
  const r = 17;
  return (
    <g fill="rgba(255,255,255,0.15)" stroke={INK} strokeWidth={4}>
      {kind === "round" ? (
        <>
          <circle cx={ox - 23} cy={2} r={r} />
          <circle cx={ox + 23} cy={2} r={r} />
        </>
      ) : (
        <>
          <rect x={ox - 40} y={-12} width={34} height={27} rx={5} />
          <rect x={ox + 6} y={-12} width={34} height={27} rx={5} />
        </>
      )}
      <line x1={ox - 6} y1={0} x2={ox + 6} y2={0} />
    </g>
  );
};
