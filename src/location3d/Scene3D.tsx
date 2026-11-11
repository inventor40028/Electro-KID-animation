// A story shot set in a 3D location: the world is three.js, the stickmen are the same 2D drawings as before,
// placed by projecting their feet through the world camera.
import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Character } from "../character/Character";
import { Fx } from "../fx/Fx";
import { InsertGraphic } from "../fx/Insert";
import { LightShape, resolveActors } from "../scene/Scene";
import { drawProp, HELD, type PropType } from "../scene/props/Props";
import type { Character as CharDef, ResolvedShot } from "../schema";
import { H, W, clamp, easeOut, easeOutBack, hashStr, rand } from "../theme";
import { CANVAS, Location3D } from "./Location3D";
import type { LocationData, Objects } from "./schema";
import { axesOf, METRE, object3dFor, OVERSCAN, projector, shotView, worldOf, type Extra } from "./stage";
import { StickShadow, type Figure } from "./StickShadow";

const CHAR_H = 362;
const BLUR = { wide: 0, full: 0.8, medium: 2, close: 4, extreme: 6 } as const; // background out of focus on tighter shots
const FLAT_FLOOR = { horizon: 1000 };

type Item = { depth: number; node: React.ReactNode };

export const Scene3D: React.FC<{ shot: ResolvedShot; cast: Record<string, CharDef>; location: LocationData; objects: Objects; frame: number; fps: number }> = ({ shot, cast, location, objects, frame, fps }) => {
  const t = frame / fps;
  const axes = axesOf(location);
  const view = shotView(shot, location, axes, frame, shot.duration);
  const project = projector(view);
  const camTurn = (Math.atan2(axes.back[0], axes.back[2]) * 180) / Math.PI;
  const sun = location.sun;
  const sunLen = Math.hypot(sun.dir[0], sun.dir[2]) || 1;
  const sunSide = clamp((sun.dir[0] * axes.right[0] + sun.dir[2] * axes.right[2]) / sunLen, -1, 1);

  const items: Item[] = [];
  const extras: Extra[] = [];
  const glows: React.ComponentProps<typeof LightShape>["l"][] = [];

  // ------------------------------------------------ props: 3D if the library has one, otherwise the 2D drawing
  shot.props.forEach((p, pi) => {
    const object = object3dFor(p.type, objects, !p.label && !p.glow);
    for (let i = 0; i < p.count; i++) {
      const perRow = Math.min(p.count, 6), row = Math.floor(i / perRow), col = i % perRow;
      const dx = p.count > 1 ? (col - (Math.min(p.count - row * perRow, perRow) - 1) / 2) * 0.13 : 0;
      const z = clamp(p.z - row * 0.06, 0, 1);
      const delay = i * 2;
      let sMul = 1, drop = 0, op = 1, slide = 0;
      if (p.enter === "pop" || (object && p.enter === "fade")) sMul = easeOutBack(clamp((frame - delay) / 10));
      else if (p.enter === "drop") { const q = clamp((frame - delay) / 12); drop = (1 - q * q) * 1000; }
      else if (p.enter === "fade") op = clamp((frame - delay) / 10);
      else if (p.enter === "left") slide = -(1 - easeOut(clamp(frame / 14))) * 900;
      else if (p.enter === "right") slide = (1 - easeOut(clamp(frame / 14))) * 900;
      const lift = (p.y ?? 0) + drop + (p.float ? Math.sin(t * 2.4 + i) * 14 : 0);
      const at = worldOf(axes, p.x + dx * p.scale + slide / W, z, lift / METRE);
      if (object) {
        extras.push({ use: object, at, turn: camTurn + p.rotate, scale: p.scale * Math.max(0.001, sMul), color: p.color });
        continue;
      }
      const s = project(at);
      items.push({
        depth: s.depth,
        node: (
          <g key={`p${pi}-${i}`} opacity={op} transform={`translate(${s.x} ${s.y}) scale(${s.s * p.scale * Math.max(0.001, sMul)}) rotate(${p.rotate})`}>
            {drawProp(p.type as PropType, { color: p.color, label: p.label, t, seed: rand(pi * 13 + i) })}
          </g>
        ),
      });
      if (p.glow) glows.push({ kind: "glow", x: s.x, y: s.y - 110 * s.s, r: 380 * s.s, color: p.color ?? "#ffe28a", a: 0.65 + 0.15 * Math.sin(t * 5) });
    }
  });

  // ------------------------------------------------ stickmen
  const actors = resolveActors(shot, FLAT_FLOOR, frame, shot.duration);
  const placed = actors.map((s) => {
    const foot = worldOf(axes, s.x / W, s.a.z, -s.yOff / METRE);
    return { state: s, foot, screen: project(foot) };
  });
  const shadows = placed.flatMap(({ state: s, foot }) => {
    const ch = cast[s.a.id];
    if (!ch || s.a.flip || s.opacity < 0.4) return [];
    const figure: Figure = { ch, id: s.a.id, pose: s.pose, prevPose: s.prevPose, poseAge: s.poseAge, walking: s.walking, facing: s.facing, t };
    return [<StickShadow key={s.a.id} figure={figure} foot={foot} right={axes.right} scale={s.a.scale * s.sMul} />];
  });
  placed.forEach(({ state: s, screen }, i) => {
    const ch = cast[s.a.id];
    if (!ch) return;
    const held = s.a.holding ? (() => {
      const h = HELD[s.a.holding as PropType] ?? { s: 0.6, dy: 40 };
      return <g transform={`scale(${h.s}) translate(0 ${h.dy})`}>{drawProp(s.a.holding as PropType, { label: s.a.holdingLabel, t, seed: i })}</g>;
    })() : null;
    const scale = screen.s * s.a.scale * s.sMul;
    items.push({
      depth: screen.depth,
      node: (
        <g key={`a${i}`} opacity={s.opacity} transform={`translate(${screen.x} ${screen.y}) scale(${scale}) ${s.a.flip ? `rotate(${t * 400})` : ""}`}>
          <Character
            ch={ch} id={s.a.id} pose={s.pose} prevPose={s.prevPose} poseT={s.poseAge / 7}
            expression={s.expression} exprAge={s.exprAge} facing={s.facing} talking={s.a.talking ?? shot.quote === s.a.id}
            t={t} frame={frame} walking={s.walking} held={held}
            light={{ side: clamp(sunSide + (screen.x < W / 2 ? 0.25 : -0.25), -1, 1), color: sun.color, strength: 0.9 }}
          />
        </g>
      ),
    });
  });
  items.sort((a, b) => b.depth - a.depth);

  // ------------------------------------------------ where effects like "?" and sparkles appear
  const lead = placed.find((p) => p.state.a.id === shot.focus) ?? placed[0];
  const scaleOf = (p: (typeof placed)[number]) => p.screen.s * p.state.a.scale;
  const focusProp = shot.focus?.startsWith("prop:") ? shot.props[parseInt(shot.focus.slice(5), 10) || 0] : undefined;
  let focus = { x: W / 2, y: H / 2 }, head = { x: W / 2, y: H / 2 - 300 }, charScale = 1.25;
  if (focusProp) {
    const s = project(worldOf(axes, focusProp.x, focusProp.z, (focusProp.y ?? 0) / METRE));
    focus = { x: s.x, y: s.y - 120 * s.s }; head = { x: s.x, y: s.y - 200 * s.s }; charScale = s.s;
  } else if (lead) {
    const s = scaleOf(lead);
    focus = { x: lead.screen.x, y: lead.screen.y - CHAR_H * s * 0.55 }; head = { x: lead.screen.x, y: lead.screen.y - CHAR_H * s * 1.05 }; charScale = s;
  }

  const hasInsert = shot.insert && shot.insert.type !== "none";
  const blur = BLUR[shot.framing];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#000", filter: `saturate(1.14) contrast(1.06)${hasInsert ? " blur(9px) brightness(0.8)" : ""}` }}>
        <AbsoluteFill style={{ transform: `scale(${OVERSCAN})`, filter: blur ? `blur(${blur}px)` : undefined }}>
          <ThreeCanvas width={W} height={H} {...CANVAS}>
            <Location3D location={location} objects={objects} view={view} extras={extras} t={t} />
            {shadows}
          </ThreeCanvas>
        </AbsoluteFill>
        <AbsoluteFill>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: "visible" }}>
            {items.map((it) => it.node)}
          </svg>
        </AbsoluteFill>
        {glows.length > 0 && (
          <AbsoluteFill style={{ mixBlendMode: "screen" }}>
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>{glows.map((l, i) => <LightShape key={i} l={l} t={t + hashStr(shot.say)} />)}</svg>
          </AbsoluteFill>
        )}
        {shot.tint && <AbsoluteFill style={{ backgroundColor: shot.tint, opacity: 0.22, mixBlendMode: "soft-light" }} />}
        <Fx shot={shot} frame={frame} fps={fps} focus={focus} head={head} zoom={charScale / 1.25} />
      </AbsoluteFill>
      {hasInsert && <InsertGraphic insert={shot.insert!} frame={frame} fps={fps} />}
    </AbsoluteFill>
  );
};
