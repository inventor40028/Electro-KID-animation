import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { H, W, clamp, ease, easeOut, easeOutBack, hashStr, lerp, rand } from "../theme";
import type { Character as CharDef, ResolvedShot, PropSpec, Actor } from "../schema";
import { Character } from "../character/Character";
import type { Pose } from "../character/poses";
import type { Expression } from "../character/faces";
import { drawProp, HELD, type PropType } from "./props/Props";
import { buildEnv, type Env, type Light } from "./backgrounds/environments";
import { X0, X1, Y0, Y1 } from "./backgrounds/parts";
import { Fx } from "../fx/Fx";
import { InsertGraphic } from "../fx/Insert";

const CHAR_H = 362;
const TRANS = 7; // dissolve overlap frames (kept in sync with Video.tsx)

// ---------------------------------------------------------------- floor mapping
export const stageOf = (env: Pick<Env, "horizon">) => {
  const hz = Math.min(env.horizon, 1250);
  return {
    y: (z: number) => hz + 40 + z * 620,
    s: (z: number) => 0.75 + z * 1.0,
  };
};

type Placed = { kind: "actor"; z: number; node: React.ReactNode } | { kind: "prop"; z: number; node: React.ReactNode };

type ActorState = {
  a: Actor;
  pose: Pose; prevPose?: Pose; poseAge: number;
  expression: Expression; exprAge: number;
  x: number; y: number; s: number; opacity: number; walking: number; facing: "left" | "right" | "front";
  yOff: number; sMul: number; // the entrance animation on its own, for scenes that place actors themselves
};

const FRAMING = {
  wide: { z: 1, k: 0.5 },
  full: { z: 1.45, k: 0.52 },
  medium: { z: 2.0, k: 0.64 },
  close: { z: 2.9, k: 0.84 },
  extreme: { z: 4.2, k: 0.87 },
} as const;

const DOF = { wide: [0, 0, 0], full: [1, 0.5, 0], medium: [4, 2.5, 1.2], close: [7, 5, 3], extreme: [9, 7, 4.5] } as const;

export const resolveActors = (shot: ResolvedShot, env: Pick<Env, "horizon">, frame: number, durFrames: number): ActorState[] => {
  const st = stageOf(env);
  const p = clamp(frame / Math.max(1, durFrames));
  return shot.actors.map((a, idx) => {
    let pose: Pose = a.pose, prevPose: Pose | undefined, poseAge = 999;
    let expression: Expression = a.expression, exprAge = 999;
    for (const b of shot.beatsResolved) {
      const target = b.actor ?? shot.actors[0]?.id;
      if (target !== a.id || b.frame > frame) continue;
      if (b.pose && b.pose !== pose) { prevPose = pose; pose = b.pose; poseAge = frame - b.frame; }
      if (b.expression && b.expression !== expression) { expression = b.expression; exprAge = frame - b.frame; }
    }
    // horizontal motion
    let x = a.x;
    let walking = 0;
    let facing = a.facing;
    const enterF = 16, exitF = 16;
    if (a.moveTo !== undefined) {
      x = lerp(a.x, a.moveTo, ease(p));
      walking = Math.abs(a.moveTo - a.x) > 0.02 && p < 0.98 ? 1 : 0;
      if (walking) facing = a.moveTo > a.x ? "right" : "left";
    }
    let opacity = 1;
    let yOff = 0;
    let sMul = 1;
    if (a.enter === "left" || a.enter === "right") {
      const q = clamp(frame / enterF);
      const from = a.enter === "left" ? -0.35 : 1.35;
      x = lerp(from, x, easeOut(q));
      if (q < 1) { walking = 1.4; facing = a.enter === "left" ? "right" : "left"; }
    } else if (a.enter === "pop") sMul = easeOutBack(clamp(frame / 10));
    else if (a.enter === "drop") {
      const q = clamp(frame / 12);
      yOff = -(1 - q * q) * 900;
      if (q >= 1) sMul = 1 + 0.08 * Math.sin(clamp((frame - 12) / 8) * Math.PI) * -1;
    } else if (a.enter === "fade") opacity = clamp(frame / 10);
    const exitStart = durFrames - exitF;
    if (a.exit !== "none" && frame > exitStart) {
      const q = clamp((frame - exitStart) / exitF);
      if (a.exit === "fade") opacity *= 1 - q;
      else {
        x = lerp(x, a.exit === "left" ? -0.4 : 1.4, q * q);
        walking = 1.6;
        facing = a.exit;
      }
    }
    if (a.pose === "walk" || a.pose === "run") walking = Math.max(walking, a.pose === "run" ? 1.8 : 1);
    const s = st.s(a.z) * a.scale * Math.max(0.01, sMul);
    return {
      a, pose: walking && pose === "stand" ? "walk" : pose, prevPose, poseAge, expression, exprAge,
      x: x * W, y: st.y(a.z) + yOff, s, opacity, walking, facing, yOff, sMul: Math.max(0.01, sMul),
      _i: idx,
    } as ActorState;
  });
};

const propBox = (p: Partial<PropSpec>, env: Env) => {
  const st = stageOf(env);
  const z = p.z ?? 0.45;
  const s = st.s(z) * (p.scale ?? 1);
  return { x: (p.x ?? 0.5) * W, y: st.y(z) - (p.y ?? 0) * st.s(z), s, z };
};

export const cameraFor = (shot: ResolvedShot, env: Env, actors: ActorState[], frame: number, durFrames: number) => {
  const fr = FRAMING[shot.framing];
  let fx = W / 2, fy = H / 2;
  const focusId = shot.focus ?? (shot.actors[0]?.id ?? (shot.props.length ? "prop:0" : undefined));
  if (focusId?.startsWith("prop:")) {
    const pr = shot.props[parseInt(focusId.slice(5), 10) || 0];
    if (pr) {
      const b = propBox(pr, env);
      fx = b.x; fy = b.y - 130 * b.s;
    }
  } else if (focusId) {
    const a = actors.find((x) => x.a.id === focusId) ?? actors[0];
    if (a) {
      // frame the actor at its starting place (not following every step)
      const st = stageOf(env);
      fx = a.a.moveTo !== undefined ? lerp(a.a.x, a.a.moveTo, 0.5) * W : a.a.x * W;
      fy = st.y(a.a.z) - CHAR_H * a.s * fr.k;
      // wider framings keep the whole group in frame: drift toward the actors' centroid
      if (actors.length > 1 && (shot.framing === "wide" || shot.framing === "full" || shot.framing === "medium")) {
        const cxs = actors.map((o) => (o.a.moveTo !== undefined ? lerp(o.a.x, o.a.moveTo, 0.5) : o.a.x) * W);
        const mid = (Math.min(...cxs) + Math.max(...cxs)) / 2;
        fx = lerp(fx, mid, shot.framing === "medium" ? 0.45 : 0.85);
      }
    }
  }
  let zoom = fr.z;
  if (shot.framing === "wide") { fx = lerp(W / 2, fx, 0.35); fy = lerp(H / 2, fy, 0.25); }
  // vertical: keep the subject a bit above center (captions live in the lower third)
  fy += 120 / zoom;

  const p = ease(clamp(frame / Math.max(1, durFrames + TRANS)));
  const seed = hashStr(shot.say);
  let dx = 0, dy = 0, dz = 1;
  switch (shot.camera) {
    case "pushIn": dz = 1 + 0.12 * p; break;
    case "pullOut": dz = 1.14 - 0.14 * p; break;
    case "panLeft": dx = 140 * (0.5 - p) * 2 / zoom; dz = 1.04; break;
    case "panRight": dx = -140 * (0.5 - p) * 2 / zoom; dz = 1.04; break;
    case "panUp": dy = 200 * (0.5 - p) * 2 / zoom; dz = 1.04; break;
    case "panDown": dy = -200 * (0.5 - p) * 2 / zoom; dz = 1.04; break;
    case "drift": dx = Math.sin(frame / 40 + seed * 6) * 30 / zoom; dz = 1.03 + 0.04 * p; break;
    case "crashZoom": dz = 1 + 0.55 * easeOut(clamp(frame / 8)); break;
    case "orbit": dx = 260 * (0.5 - p) * 2 / zoom; dz = 1.06; break;
    case "static": dz = 1.01; break;
  }
  // beat zoom punches
  for (const b of shot.beatsResolved) {
    if (b.zoom && frame >= b.frame) dz *= 1 + (b.zoom - 1) * easeOut(clamp((frame - b.frame) / 6));
  }
  zoom *= dz;
  // handheld noise
  const hx = Math.sin(frame / 23 + seed * 10) * 3 + Math.sin(frame / 11 + seed) * 1.5;
  const hy = Math.cos(frame / 29 + seed * 7) * 3;
  // shake
  let sx = 0, sy = 0;
  const shakeAt = [
    ...(shot.fx.includes("shake") ? [0] : []),
    ...shot.beatsResolved.filter((b) => b.fx === "shake" || b.fx === "explosion" || b.sfx === "boom" || b.sfx === "impact" || b.sfx === "crash").map((b) => b.frame),
  ];
  for (const f0 of shakeAt) {
    const age = frame - f0;
    if (age >= 0 && age < 14) {
      const k = (1 - age / 14) * 22;
      sx += (rand(frame * 1.7 + f0) - 0.5) * k;
      sy += (rand(frame * 3.1 + f0) - 0.5) * k;
    }
  }
  let cx = fx + dx, cy = fy + dy;
  const hw = W / 2 / zoom, hh = H / 2 / zoom;
  cx = clamp(cx, X0 + hw, X1 - hw);
  cy = clamp(cy, Y0 + hh, Y1 - hh);
  return { cx: cx + (hx + sx) / zoom, cy: cy + (hy + sy) / zoom, zoom };
};

const layerTransform = (cam: { cx: number; cy: number; zoom: number }, d: number) => {
  const z = 1 + (cam.zoom - 1) * d;
  const cx = W / 2 + (cam.cx - W / 2) * d;
  const cy = H / 2 + (cam.cy - H / 2) * d;
  return `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`;
};

const Layer: React.FC<{ children: React.ReactNode; blur?: number; blend?: React.CSSProperties["mixBlendMode"]; opacity?: number }> = ({ children, blur = 0, blend, opacity }) => (
  <AbsoluteFill style={{ filter: blur > 0.2 ? `blur(${blur}px)` : undefined, mixBlendMode: blend, opacity }}>
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: "visible" }}>
      {children}
    </svg>
  </AbsoluteFill>
);

let lid = 0;
export const LightShape: React.FC<{ l: Light; t: number }> = ({ l, t }) => {
  const id = React.useMemo(() => `lt${++lid}`, []);
  const flick = 1 + Math.sin(t * 7 + lid) * 0.03;
  if (l.kind === "glow")
    return (
      <g>
        <defs>
          <radialGradient id={id}>
            <stop offset="0" stopColor={l.color} stopOpacity={l.a * flick} />
            <stop offset="0.35" stopColor={l.color} stopOpacity={l.a * 0.45} />
            <stop offset="1" stopColor={l.color} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={l.x} cy={l.y} r={l.r} fill={`url(#${id})`} />
      </g>
    );
  if (l.kind === "cone") {
    const a = (l.dir * Math.PI) / 180, sp = (l.spread * Math.PI) / 360;
    const p1 = [l.x + Math.cos(a - sp) * l.len, l.y + Math.sin(a - sp) * l.len];
    const p2 = [l.x + Math.cos(a + sp) * l.len, l.y + Math.sin(a + sp) * l.len];
    return (
      <g>
        <defs>
          <radialGradient id={id} cx={l.x} cy={l.y} r={l.len} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={l.color} stopOpacity={l.a * flick} />
            <stop offset="0.6" stopColor={l.color} stopOpacity={l.a * 0.35} />
            <stop offset="1" stopColor={l.color} stopOpacity={0} />
          </radialGradient>
        </defs>
        <polygon points={`${l.x - 10},${l.y} ${l.x + 10},${l.y} ${p2[0]},${p2[1]} ${p1[0]},${p1[1]}`} fill={`url(#${id})`} />
      </g>
    );
  }
  const [a0, a1, a2, a3] = l.pts;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1={a0[0]} y1={a0[1]} x2={(a2[0] + a3[0]) / 2} y2={(a2[1] + a3[1]) / 2} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={l.color} stopOpacity={l.a * 1.2} />
          <stop offset="1" stopColor={l.color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={[a0, a1, a2, a3].map((q) => q.join(",")).join(" ")} fill={`url(#${id})`} />
    </g>
  );
};

export const Scene: React.FC<{ shot: ResolvedShot; cast: Record<string, CharDef>; frame: number; fps: number }> = ({ shot, cast, frame, fps }) => {
  const t = frame / fps;
  const seed = hashStr(shot.say + shot.index);
  const E = buildEnv(shot.bg, { time: shot.time, t, wallColor: shot.wall, seed });
  const dur = shot.duration;
  const actors = resolveActors(shot, E, frame, dur);
  const cam = cameraFor(shot, E, actors, frame, dur);
  const dof = DOF[shot.framing];
  const st = stageOf(E);

  // ------------------------------------------------ world items
  const items: Placed[] = [];
  const allProps: Partial<PropSpec>[] = [...E.set.map((p) => ({ ...p, _set: true })), ...shot.props];
  const extraLights: Light[] = [];
  allProps.forEach((p, pi) => {
    const count = p.count ?? 1;
    for (let i = 0; i < count; i++) {
      const perRow = Math.min(count, 6);
      const row = Math.floor(i / perRow), col = i % perRow;
      const dx = count > 1 ? (col - (Math.min(count - row * perRow, perRow) - 1) / 2) * 0.13 : 0;
      const pp = { ...p, x: (p.x ?? 0.5) + dx * (p.scale ?? 1), z: clamp((p.z ?? 0.45) - row * 0.06, 0, 1) };
      const b = propBox(pp, E);
      let sMul = 1, yOff = 0, op = 1, xOff = 0;
      const ent = p.enter ?? "none";
      const delay = i * 2;
      if (ent === "pop") sMul = easeOutBack(clamp((frame - delay) / 10));
      else if (ent === "drop") { const q = clamp((frame - delay) / 12); yOff = -(1 - q * q) * 1000; }
      else if (ent === "fade") op = clamp((frame - delay) / 10);
      else if (ent === "left") xOff = -(1 - easeOut(clamp(frame / 14))) * 900;
      else if (ent === "right") xOff = (1 - easeOut(clamp(frame / 14))) * 900;
      if (p.float) yOff += Math.sin(t * 2.4 + i) * 14;
      const node = (
        <g key={`p${pi}-${i}`} opacity={op} transform={`translate(${b.x + xOff} ${b.y + yOff}) scale(${b.s * Math.max(0.001, sMul)}) rotate(${p.rotate ?? 0})`}>
          {drawProp(p.type as PropType, { color: p.color, label: p.label, t, seed: rand(pi * 13 + i) })}
        </g>
      );
      items.push({ kind: "prop", z: pp.z, node });
      if (p.glow) extraLights.push({ kind: "glow", x: b.x + xOff, y: b.y + yOff - 110 * b.s, r: 380 * b.s, color: p.color ?? "#ffe28a", a: 0.65 + 0.15 * Math.sin(t * 5) });
    }
  });

  actors.forEach((s, i) => {
    const ch = cast[s.a.id];
    if (!ch) return;
    const lightSide = clamp(E.rim.side + (s.x < W / 2 ? 0.25 : -0.25), -1, 1);
    let held: React.ReactNode = null;
    if (s.a.holding) {
      const h = HELD[s.a.holding as PropType] ?? { s: 0.6, dy: 40 };
      held = <g transform={`scale(${h.s}) translate(0 ${h.dy})`}>{drawProp(s.a.holding as PropType, { label: s.a.holdingLabel, t, seed: i })}</g>;
    }
    const talking = s.a.talking ?? shot.quote === s.a.id;
    const node = (
      <g key={`a${i}`} opacity={s.opacity} transform={`translate(${s.x} ${s.y}) scale(${s.s}) ${s.a.flip ? `rotate(${t * 400})` : ""}`}>
        <Character
          ch={ch} id={s.a.id} pose={s.pose} prevPose={s.prevPose} poseT={s.poseAge / 7}
          expression={s.expression} exprAge={s.exprAge} facing={s.facing} talking={talking}
          t={t} frame={frame} walking={s.walking} held={held}
          light={{ side: lightSide, color: E.rim.color, strength: E.rim.strength }}
        />
      </g>
    );
    items.push({ kind: "actor", z: s.a.z + 0.001, node });
  });
  items.sort((a, b) => a.z - b.z);
  // soft back-light behind the subject so characters pop off the background (like a rim/key light pass)
  {
    const fa = actors.find((a) => a.a.id === shot.focus) ?? actors[0];
    if (fa) extraLights.push({ kind: "glow", x: fa.x, y: fa.y - CHAR_H * fa.s * 0.75, r: 560 * fa.s, color: E.rim.color, a: 0.2 });
  }

  // focus point in screen space for fx
  const focusWorld = (() => {
    const fa = actors.find((a) => a.a.id === shot.focus) ?? actors[0];
    if (shot.focus?.startsWith("prop:")) {
      const pr = shot.props[parseInt(shot.focus.slice(5), 10) || 0];
      if (pr) { const b = propBox(pr, E); return { x: b.x, y: b.y - 120 * b.s, head: b.y - 200 * b.s }; }
    }
    if (fa) return { x: fa.x, y: fa.y - CHAR_H * fa.s * 0.55, head: fa.y - CHAR_H * fa.s * 1.05 };
    return { x: W / 2, y: H / 2, head: H / 2 - 300 };
  })();
  const toScreen = (x: number, y: number) => ({ x: (x - cam.cx) * cam.zoom + W / 2, y: (y - cam.cy) * cam.zoom + H / 2 });
  const fScreen = toScreen(focusWorld.x, focusWorld.y);
  const hScreen = toScreen(focusWorld.x, focusWorld.head);

  const T1 = layerTransform(cam, 1);
  const hasInsert = shot.insert && shot.insert.type !== "none";

  return (
    <AbsoluteFill>
    <AbsoluteFill style={{ backgroundColor: "#000", filter: `saturate(1.14) contrast(1.06)${hasInsert ? " blur(9px) brightness(0.8)" : ""}` }}>
      {E.sky && <Layer blur={dof[0]}><g transform={layerTransform(cam, 0.15)}>{E.sky}</g></Layer>}
      {E.far && <Layer blur={dof[1]}><g transform={layerTransform(cam, 0.45)}>{E.far}</g></Layer>}
      <Layer blur={dof[2]}>
        <g transform={T1}>
          {E.wall}
          {E.floor}
        </g>
      </Layer>
      <Layer>
        <g transform={T1}>{items.map((it) => it.node)}</g>
      </Layer>
      {E.fore && <Layer blur={4}><g transform={layerTransform(cam, 1.35)}>{E.fore}</g></Layer>}
      <Layer blend="screen">
        <g transform={T1}>
          {[...E.lights, ...extraLights].map((l, i) => <LightShape key={i} l={l} t={t} />)}
        </g>
      </Layer>
      {E.ambient.map((a, i) => (
        <AbsoluteFill key={i} style={{ backgroundColor: a.color, opacity: a.a, mixBlendMode: a.mode }} />
      ))}
      {shot.tint && <AbsoluteFill style={{ backgroundColor: shot.tint, opacity: 0.22, mixBlendMode: "soft-light" }} />}
      <Fx shot={shot} frame={frame} fps={fps} focus={fScreen} head={hScreen} zoom={cam.zoom} />
    </AbsoluteFill>
      {hasInsert && <InsertGraphic insert={shot.insert!} frame={frame} fps={fps} />}
    </AbsoluteFill>
  );
};

export const PostFX: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {/* vignette */}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 62% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)" }} />
    {/* soft glow / contrast */}
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,240,220,0.05), rgba(0,0,0,0.06))", mixBlendMode: "overlay" }} />
    {/* film grain (Img makes Remotion wait for the texture; the div tiles it) */}
    <Img src={staticFile("grain.png")} style={{ display: "none" }} />
    <AbsoluteFill style={{
      opacity: 0.08, mixBlendMode: "overlay",
      backgroundImage: `url(${staticFile("grain.png")})`, backgroundRepeat: "repeat",
      backgroundPosition: `${-Math.floor(rand(frame * 1.3) * 512)}px ${-Math.floor(rand(frame * 2.7) * 512)}px`,
    }} />
  </>
);
