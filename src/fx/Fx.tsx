import React from "react";
import { AbsoluteFill } from "remotion";
import { H, INK, W, clamp, easeOut, easeOutBack, rand } from "../theme";
import type { ResolvedShot } from "../schema";
import type { FX } from "../catalog";
import { FONT } from "../scene/props/Props";

type FxName = (typeof FX)[number];
type Pt = { x: number; y: number };

const Sparkle: React.FC<{ x: number; y: number; s: number; c?: string }> = ({ x, y, s, c = "#fff8d0" }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M 0 -30 Q 4 -4 30 0 Q 4 4 0 30 Q -4 4 -30 0 Q -4 -4 0 -30 Z" fill={c} />
);

const OneFx: React.FC<{ name: FxName; age: number; fps: number; focus: Pt; head: Pt; zoom: number; seed: number; total: number }> = ({ name, age, fps, focus, head, zoom, seed, total }) => {
  const t = age / fps;
  const R = (i: number) => rand(i * 7.31 + seed * 100);
  const svg = (children: React.ReactNode, blend?: React.CSSProperties["mixBlendMode"]) => (
    <AbsoluteFill style={{ mixBlendMode: blend }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>{children}</svg>
    </AbsoluteFill>
  );
  const sz = Math.min(2.2, Math.max(0.7, zoom * 0.7));
  switch (name) {
    case "sparkle":
      return svg(
        Array.from({ length: 16 }).map((_, i) => {
          const a = R(i) * Math.PI * 2, d = (120 + R(i + 50) * 260) * sz;
          const ph = (t * 2.2 + R(i + 9)) % 1;
          const s = Math.sin(ph * Math.PI) * (0.5 + R(i + 3) * 0.9) * sz;
          return <Sparkle key={i} x={focus.x + Math.cos(a) * d} y={focus.y + Math.sin(a) * d * 0.8} s={s} />;
        }),
        "screen",
      );
    case "glow": {
      const k = 0.55 + 0.25 * Math.sin(t * 5);
      return (
        <AbsoluteFill style={{ mixBlendMode: "screen", background: `radial-gradient(circle at ${focus.x}px ${focus.y}px, rgba(255,226,140,${k}) 0px, rgba(255,200,90,${k * 0.4}) ${260 * sz}px, rgba(0,0,0,0) ${620 * sz}px)` }} />
      );
    }
    case "rain":
      return svg(
        <g>
          <rect width={W} height={H} fill="rgba(20,30,60,0.18)" />
          {Array.from({ length: 140 }).map((_, i) => {
            const x = ((R(i) * (W + 400) - age * 6) % (W + 400) + W + 400) % (W + 400) - 200;
            const y = ((R(i + 300) * H + age * (48 + R(i) * 20)) % (H + 200)) - 100;
            return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 70} stroke="rgba(200,220,255,0.55)" strokeWidth={3} strokeLinecap="round" />;
          })}
        </g>,
      );
    case "snow":
      return svg(
        Array.from({ length: 120 }).map((_, i) => {
          const x = (R(i) * W + Math.sin(t * 1.5 + i) * 30 + W) % W;
          const y = (R(i + 500) * H + age * (2.5 + R(i) * 3)) % H;
          return <circle key={i} cx={x} cy={y} r={3 + R(i + 7) * 7} fill="#fff" opacity={0.85} />;
        }),
      );
    case "dust":
      return svg(
        Array.from({ length: 50 }).map((_, i) => {
          const x = (R(i) * W + Math.sin(t * 0.6 + i) * 60 + age * 0.4) % W;
          const y = (R(i + 70) * H - age * (0.3 + R(i) * 0.6) + H) % H;
          return <circle key={i} cx={x} cy={y} r={2 + R(i + 3) * 4} fill="#fff6d8" opacity={0.25 + 0.4 * Math.abs(Math.sin(t + i))} />;
        }),
        "screen",
      );
    case "confetti":
    case "money":
      return svg(
        Array.from({ length: name === "money" ? 40 : 90 }).map((_, i) => {
          const x = R(i) * W + Math.sin(t * 3 + i) * 50;
          const y = -100 + ((R(i + 90) * 600 + age * (10 + R(i) * 8)) % (H + 300));
          const rot = t * 200 * (R(i + 4) - 0.5) + i * 40;
          if (name === "money")
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${1 + R(i) * 0.6}, ${Math.abs(Math.cos(t * 4 + i))})`}>
                <rect x={-50} y={-24} width={100} height={48} rx={4} fill="#8fd17a" stroke={INK} strokeWidth={4} />
                <circle r={13} fill="#5fa84a" />
              </g>
            );
          return <rect key={i} x={x} y={y} width={18} height={30} transform={`rotate(${rot} ${x} ${y})`} fill={["#ff4a5a", "#ffd23a", "#4ab8ff", "#5fd06a", "#c46aff"][i % 5]} />;
        }),
      );
    case "debris":
    case "explosion": {
      const flash = name === "explosion" ? clamp(1 - age / 10) : 0;
      return svg(
        <g>
          {name === "explosion" && (
            <g>
              <circle cx={focus.x} cy={focus.y} r={easeOut(clamp(age / 12)) * 700} fill="#ffb02e" opacity={clamp(1 - age / 18)} />
              <circle cx={focus.x} cy={focus.y} r={easeOut(clamp(age / 10)) * 420} fill="#fff2a0" opacity={clamp(1 - age / 14)} />
              {Array.from({ length: 10 }).map((_, i) => {
                const a = (i / 10) * Math.PI * 2;
                const d = 200 + easeOut(clamp(age / 30)) * 360;
                return <circle key={i} cx={focus.x + Math.cos(a) * d} cy={focus.y + Math.sin(a) * d - age * 3} r={(90 + R(i) * 60) * clamp(1 - age / 60)} fill="#6a6a72" opacity={0.75} />;
              })}
            </g>
          )}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = R(i) * Math.PI * 2;
            const v = 18 + R(i + 1) * 30;
            const x = focus.x + Math.cos(a) * v * age;
            const y = focus.y + Math.sin(a) * v * age * 0.7 + 0.9 * age * age;
            const c = ["#f79ab4", "#ffffff", "#c9ced6", "#e8c46a", "#a0683a"][i % 5];
            return <path key={i} transform={`translate(${x} ${y}) rotate(${age * 20 * (R(i + 2) - 0.5) * 2})`} d={`M 0 -18 L ${14 + R(i) * 10} 6 L -12 12 Z`} fill={c} stroke={INK} strokeWidth={3} />;
          })}
          <rect width={W} height={H} fill="#fff" opacity={flash * 0.8} />
        </g>,
      );
    }
    case "smoke":
      return svg(
        Array.from({ length: 22 }).map((_, i) => {
          const life = ((t * 0.6 + R(i)) % 1);
          const x = focus.x + (R(i + 3) - 0.5) * 400 + Math.sin(life * 4 + i) * 40;
          const y = focus.y + 200 - life * 900;
          return <circle key={i} cx={x} cy={y} r={60 + life * 160} fill="#8a8f96" opacity={(1 - life) * 0.45} />;
        }),
      );
    case "fire":
      return svg(
        Array.from({ length: 26 }).map((_, i) => {
          const life = ((t * 1.4 + R(i)) % 1);
          const x = (i / 25) * W + Math.sin(t * 6 + i) * 20;
          const y = H + 60 - life * 520;
          return <ellipse key={i} cx={x} cy={y} rx={70 * (1 - life) + 20} ry={110 * (1 - life) + 30} fill={life < 0.4 ? "#ffd23a" : "#ff6a1a"} opacity={(1 - life) * 0.85} />;
        }),
        "screen",
      );
    case "speedlines":
      return svg(
        Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * Math.PI * 2 + R(i) * 0.1;
          const r0 = 380 + R(i + Math.floor(age / 2)) * 200;
          return <line key={i} x1={W / 2 + Math.cos(a) * r0} y1={H / 2 + Math.sin(a) * r0} x2={W / 2 + Math.cos(a) * 1500} y2={H / 2 + Math.sin(a) * 1500} stroke="#fff" strokeWidth={4 + R(i) * 10} opacity={0.6} />;
        }),
      );
    case "flash":
      return <AbsoluteFill style={{ backgroundColor: "#fff", opacity: clamp(1 - age / 9) * 0.9 }} />;
    case "lightning": {
      const on = age < 3 || (age > 6 && age < 9);
      const pts = Array.from({ length: 9 }).map((_, i) => `${W * 0.6 + (R(i + 11) - 0.5) * 300},${i * 140 - 100}`);
      return svg(
        <g>
          <rect width={W} height={H} fill="#e8f0ff" opacity={on ? 0.45 : 0} />
          {on && <polyline points={pts.join(" ")} fill="none" stroke="#fff" strokeWidth={14} strokeLinejoin="bevel" />}
        </g>,
      );
    }
    case "cracks":
    case "rage": {
      const grow = easeOut(clamp(age / 16));
      const col = name === "rage" ? "#e3202a" : "#ffffff";
      return svg(
        <g>
          {name === "rage" && <rect width={W} height={H} fill="#ff1020" opacity={0.18 * grow} style={{ mixBlendMode: "multiply" }} />}
          {Array.from({ length: 9 }).map((_, i) => {
            const a = (i / 9) * Math.PI * 2 + R(i);
            let x = focus.x, y = focus.y;
            const segs: string[] = [`M ${x} ${y}`];
            const n = 6;
            for (let k = 0; k < n * grow; k++) {
              const ang = a + (R(i * 10 + k) - 0.5) * 1.2;
              x += Math.cos(ang) * 70 * sz; y += Math.sin(ang) * 70 * sz;
              segs.push(`L ${x} ${y}`);
            }
            return <path key={i} d={segs.join(" ")} stroke={col} strokeWidth={name === "rage" ? 9 : 6} fill="none" strokeLinecap="round" opacity={0.9} />;
          })}
        </g>,
      );
    }
    case "hearts":
    case "zzz":
    case "question":
    case "exclaim":
      return svg(
        Array.from({ length: name === "exclaim" ? 1 : name === "question" ? 3 : 4 }).map((_, i) => {
          const life = name === "exclaim" || name === "question" ? 0 : (t * 0.7 + i / 4) % 1;
          const x = head.x + (name === "question" ? (i - 1) * 90 * sz : 40 * sz + life * 80 + i * 10);
          const y = head.y - 60 * sz - life * 260 * sz + (name === "question" ? Math.sin(t * 5 + i) * 12 - (i === 1 ? 30 : 0) : 0);
          const s = (name === "exclaim" ? easeOutBack(clamp(age / 8)) : name === "question" ? easeOutBack(clamp((age - i * 3) / 8)) : 1) * sz;
          const op = name === "hearts" || name === "zzz" ? 1 - life : 1;
          const txt = name === "zzz" ? "Z" : name === "question" ? "?" : "!";
          if (name === "hearts")
            return <path key={i} opacity={op} transform={`translate(${x} ${y}) scale(${s})`} d="M 0 20 C -40 -6 -30 -40 -12 -40 C -4 -40 0 -32 0 -26 C 0 -32 4 -40 12 -40 C 30 -40 40 -6 0 20 Z" fill="#ff4a6a" stroke={INK} strokeWidth={4} />;
          return (
            <text key={i} opacity={op} x={x} y={y} transform={`scale(1)`} fontFamily={FONT} fontWeight={900} fontSize={110 * s} textAnchor="middle" fill={name === "exclaim" ? "#ff3b30" : "#ffffff"} stroke={INK} strokeWidth={10 * s} paintOrder="stroke">
              {txt}
            </text>
          );
        }),
      );
    case "sweat":
      return svg(
        Array.from({ length: 4 }).map((_, i) => {
          const life = (t * 1.6 + i / 4) % 1;
          const side = i % 2 ? 1 : -1;
          const x = head.x + side * (90 + life * 120) * sz;
          const y = head.y - 20 * sz - Math.sin(life * Math.PI) * 120 * sz + life * 60;
          return <path key={i} opacity={1 - life} transform={`translate(${x} ${y}) scale(${sz})`} d="M 0 -22 Q -16 2 -10 10 Q 0 18 10 10 Q 16 2 0 -22 Z" fill="#9fd8ff" stroke={INK} strokeWidth={4} />;
        }),
      );
    case "stars":
      return svg(
        Array.from({ length: 5 }).map((_, i) => {
          const a = t * 5 + (i / 5) * Math.PI * 2;
          return <Sparkle key={i} x={head.x + Math.cos(a) * 110 * sz} y={head.y - 40 * sz + Math.sin(a) * 30 * sz} s={0.9 * sz} c="#ffe24a" />;
        }),
      );
    case "ripples":
      return svg(
        Array.from({ length: 4 }).map((_, i) => {
          const life = (t * 0.8 + i / 4) % 1;
          return <ellipse key={i} cx={focus.x} cy={focus.y} rx={life * 700} ry={life * 260} fill="none" stroke="#ffffff" strokeWidth={8} opacity={(1 - life) * 0.8} />;
        }),
        "screen",
      );
    case "redtint":
      return <AbsoluteFill style={{ backgroundColor: "#ff2030", opacity: 0.25 * clamp(age / 8), mixBlendMode: "multiply" }} />;
    case "bluetint":
      return <AbsoluteFill style={{ backgroundColor: "#3050ff", opacity: 0.25 * clamp(age / 8), mixBlendMode: "multiply" }} />;
    case "darken":
      return <AbsoluteFill style={{ backgroundColor: "#000", opacity: 0.45 * clamp(age / 10) }} />;
    case "spotlight":
      return (
        <AbsoluteFill style={{ background: `radial-gradient(circle at ${focus.x}px ${focus.y}px, rgba(0,0,0,0) ${300 * sz}px, rgba(0,0,0,${0.78 * clamp(age / 10)}) ${520 * sz}px)` }} />
      );
    case "godrays":
      return svg(
        <g>
          <defs>
            <linearGradient id="gr" x1={0} y1={0} x2={1} y2={1}>
              <stop offset="0" stopColor="#fff6d8" stopOpacity={0.55} />
              <stop offset="1" stopColor="#fff6d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          {Array.from({ length: 6 }).map((_, i) => (
            <polygon key={i} points={`${-100 + i * 120},-100 ${-20 + i * 120 + Math.sin(t + i) * 10},-100 ${700 + i * 260},${H} ${500 + i * 230},${H}`} fill="url(#gr)" opacity={0.5 + 0.2 * Math.sin(t * 1.3 + i)} />
          ))}
        </g>,
        "screen",
      );
    case "groinspray":
      // two whiter bursts of white droplets spraying UPWARD from between the legs (focus = feet anchor)
      {
        const BURST = 40, GAP = 26, cycle = BURST + GAP;
        const b = Math.floor(age / cycle);
        if (b > 1) return null;
        const local = age - b * cycle;
        if (local > BURST) return null;
        return svg(
          <g>
            {Array.from({ length: 34 }).map((_, i) => {
              const a = -Math.PI / 2 + (R(i + 7) - 0.5) * 1.15;
              const v = 6 + R(i) * 12;
              const x = focus.x + Math.cos(a) * v * local;
              const y = focus.y + Math.sin(a) * v * local + 0.42 * local * local;
              const o = Math.max(0, 1 - local / 40);
              return <circle key={i} cx={x} cy={y} r={3.5 + R(i) * 4} fill="#ffffff" opacity={o} />;
            })}
          </g>,
          "screen",
        );
      }
    case "shake":
      return null;
  }
  void total;
  return null;
};

export const Fx: React.FC<{ shot: ResolvedShot; frame: number; fps: number; focus: Pt; head: Pt; zoom: number }> = ({ shot, frame, fps, focus, head, zoom }) => {
  const list: { name: FxName; at: number }[] = [
    ...shot.fx.map((n) => ({ name: n, at: 0 })),
    ...shot.beatsResolved.filter((b) => b.fx).map((b) => ({ name: b.fx as FxName, at: b.frame })),
  ];
  return (
    <>
      {list.map((f, i) => (frame >= f.at ? <OneFx key={i} name={f.name} age={frame - f.at} fps={fps} focus={focus} head={head} zoom={zoom} seed={i + shot.index} total={shot.duration} /> : null))}
    </>
  );
};
