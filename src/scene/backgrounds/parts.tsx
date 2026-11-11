import React from "react";
import { INK, W, hashStr, mix, rand, shade } from "../../theme";

// The world canvas is larger than the frame so the camera can move.
export const X0 = -500, X1 = W + 500, Y0 = -700, Y1 = 2600;
export const VPX = W / 2;

export type Time = "day" | "sunset" | "night" | "dawn";

export const SKY: Record<Time, [string, string, string]> = {
  day: ["#3d8fe0", "#7cc0f2", "#cfeaff"],
  sunset: ["#3a3f8f", "#e2717a", "#ffc27a"],
  night: ["#0a1030", "#1b2a63", "#33467e"],
  dawn: ["#6f8fd0", "#f2a7a0", "#ffe2b0"],
};

let uidc = 0;
const uid = (p: string) => `${p}${++uidc}`;

export const Sky: React.FC<{ time: Time; horizon: number; t: number; clouds?: boolean; stars?: boolean; sun?: boolean }> = ({ time, horizon, t, clouds = true, stars, sun = true }) => {
  const [a, b, c] = SKY[time];
  const id = React.useMemo(() => uid("sky"), []);
  const night = time === "night";
  return (
    <g>
      <defs>
        <linearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor={a} />
          <stop offset="0.6" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <radialGradient id={id + "s"}>
          <stop offset="0" stopColor={night ? "#fffbe8" : "#fff8d8"} stopOpacity={1} />
          <stop offset="0.25" stopColor={night ? "#e8f0ff" : "#fff2b0"} stopOpacity={0.9} />
          <stop offset="1" stopColor={night ? "#9fb6ff" : "#ffd27a"} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={X0} y={Y0} width={X1 - X0} height={horizon - Y0 + 40} fill={`url(#${id})`} />
      {(stars ?? night) &&
        Array.from({ length: 140 }).map((_, i) => {
          const x = X0 + rand(i * 3.1) * (X1 - X0), y = Y0 + rand(i * 7.7) * (horizon - Y0 - 200);
          const tw = 0.5 + 0.5 * Math.sin(t * (1 + rand(i) * 3) + i);
          return <circle key={i} cx={x} cy={y} r={1.5 + rand(i * 1.3) * 2.5} fill="#fff" opacity={0.3 + 0.7 * tw} />;
        })}
      {sun && (
        <g>
          <circle cx={night ? 820 : time === "day" ? 240 : 540} cy={night ? 260 : time === "day" ? 180 : horizon - 120} r={night ? 260 : 340} fill={`url(#${id}s)`} />
          <circle cx={night ? 820 : time === "day" ? 240 : 540} cy={night ? 260 : time === "day" ? 180 : horizon - 120} r={night ? 70 : 90} fill={night ? "#f4f6ff" : time === "day" ? "#fff8d0" : "#ffe08a"} />
          {night && <><circle cx={800} cy={240} r={12} fill="#d9def0" /><circle cx={845} cy={285} r={8} fill="#d9def0" /></>}
        </g>
      )}
      {clouds && !night &&
        Array.from({ length: 7 }).map((_, i) => {
          const sp = 6 + rand(i * 9) * 10;
          const x = X0 + ((rand(i * 4.2) * (X1 - X0) + t * sp) % (X1 - X0));
          const y = Y0 + 300 + rand(i * 2.7) * (horizon - Y0 - 600);
          const s = 0.7 + rand(i * 5.5) * 1.1;
          return <Cloud key={i} x={x} y={y} s={s} tint={time === "sunset" ? "#ffd6c0" : time === "dawn" ? "#ffe6e0" : "#ffffff"} />;
        })}
    </g>
  );
};

export const Cloud: React.FC<{ x: number; y: number; s: number; tint?: string }> = ({ x, y, s, tint = "#fff" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -120 30 Q -130 -10 -80 -14 Q -70 -60 -20 -50 Q 10 -90 60 -60 Q 110 -70 110 -20 Q 150 -10 130 30 Z" fill={tint} />
    <path d="M -120 30 L 130 30 Q 90 44 -100 44 Z" fill={shade(tint, -0.08)} />
  </g>
);

export const Hills: React.FC<{ horizon: number; colors: string[]; seed?: number }> = ({ horizon, colors, seed = 1 }) => (
  <g>
    {colors.map((c, i) => {
      const y = horizon - 260 + i * 110;
      const pts: string[] = [];
      for (let k = 0; k <= 12; k++) {
        const x = X0 + (k / 12) * (X1 - X0);
        pts.push(`${x},${y - 40 - Math.sin(k * 0.9 + i * 2 + seed) * 70 - rand(k + i * 13 + seed) * 50}`);
      }
      return <polygon key={i} points={`${X0},${Y1} ${X0},${horizon + 80} ${pts.join(" ")} ${X1},${horizon + 80} ${X1},${Y1}`} fill={c} />;
    })}
  </g>
);

export const Mountains: React.FC<{ horizon: number; color: string; snow?: boolean }> = ({ horizon, color, snow = true }) => (
  <g>
    <rect x={X0} y={horizon} width={X1 - X0} height={Y1 - horizon} fill={color} />
    {[0, 1].map((layer) => {
      const peaks = layer === 0 ? [[-300, 520], [100, 700], [520, 560], [900, 760], [1350, 600]] : [[-150, 380], [300, 460], [760, 420], [1200, 480]];
      const c = layer === 0 ? mix(color, "#ffffff", 0.35) : color;
      return (
        <g key={layer}>
          {peaks.map(([x, h], i) => (
            <g key={i}>
              <path d={`M ${x - h * 0.9} ${horizon + 40} L ${x} ${horizon - h} L ${x + h * 0.9} ${horizon + 40} Z`} fill={c} />
              <path d={`M ${x} ${horizon - h} L ${x + h * 0.9} ${horizon + 40} L ${x + h * 0.2} ${horizon + 40} Z`} fill={shade(c, -0.12)} />
              {snow && <path d={`M ${x - h * 0.22} ${horizon - h * 0.75} L ${x} ${horizon - h} L ${x + h * 0.22} ${horizon - h * 0.75} L ${x + h * 0.1} ${horizon - h * 0.7} L ${x} ${horizon - h * 0.78} L ${x - h * 0.1} ${horizon - h * 0.68} Z`} fill="#ffffff" />}
            </g>
          ))}
        </g>
      );
    })}
  </g>
);

export const Skyline: React.FC<{ horizon: number; night: boolean; color: string; seed?: number; tall?: number; windows?: boolean }> = ({ horizon, night, color, seed = 3, tall = 1, windows = true }) => (
  <g>
    {[0, 1].map((layer) => {
      const n = layer === 0 ? 14 : 10;
      const c = layer === 0 ? mix(color, night ? "#000820" : "#ffffff", 0.35) : color;
      return Array.from({ length: n }).map((_, i) => {
        const w = 120 + rand(i + layer * 50 + seed) * 140;
        const x = X0 + (i / n) * (X1 - X0) + rand(i * 3 + seed) * 60;
        const h = (250 + rand(i * 7 + layer + seed) * 600) * tall * (layer === 0 ? 1.1 : 0.8);
        return (
          <g key={`${layer}-${i}`}>
            <rect x={x} y={horizon - h} width={w} height={h + 60} fill={c} />
            {layer === 1 && i === 0 && <rect x={X0} y={horizon} width={X1 - X0} height={Y1 - horizon} fill={c} />}
            {windows &&
              Array.from({ length: Math.floor(h / 60) }).map((__, r) =>
                Array.from({ length: Math.floor(w / 40) }).map((___, k) => {
                  const lit = rand(i * 100 + r * 10 + k + seed + layer) > (night ? 0.55 : 0.8);
                  return (
                    <rect key={`${r}-${k}`} x={x + 12 + k * 40} y={horizon - h + 20 + r * 60} width={20} height={30}
                      fill={lit ? (night ? "#ffd77a" : shade(c, 0.35)) : shade(c, -0.15)} opacity={layer === 0 ? 0.6 : 0.9} />
                  );
                }),
              )}
          </g>
        );
      });
    })}
  </g>
);

export const Sea: React.FC<{ horizon: number; time: Time; t: number; stormy?: boolean }> = ({ horizon, time, t, stormy }) => {
  const id = React.useMemo(() => uid("sea"), []);
  const top = time === "night" ? "#1b3a6b" : time === "sunset" ? "#d88a8a" : "#5fb6e8";
  const bot = time === "night" ? "#0c1f40" : "#1f6fb8";
  const amp = stormy ? 26 : 8;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect x={X0} y={horizon} width={X1 - X0} height={Y1 - horizon} fill={`url(#${id})`} />
      {Array.from({ length: 18 }).map((_, i) => {
        const y = horizon + 10 + Math.pow(i / 17, 1.6) * 1300;
        const ph = t * (1.5 + (i % 3) * 0.4) + i;
        const len = 60 + (i / 17) * 220;
        return Array.from({ length: 6 }).map((__, k) => {
          const x = X0 + ((k * 330 + i * 97 + Math.sin(ph) * 40) % (X1 - X0));
          return (
            <path key={`${i}-${k}`} d={`M ${x} ${y} q ${len / 2} ${-amp * (0.4 + i / 17)} ${len} 0`} stroke="rgba(255,255,255,0.55)" strokeWidth={2 + (i / 17) * 6} fill="none" strokeLinecap="round" />
          );
        });
      })}
    </g>
  );
};

export type FloorKind = "wood" | "tile" | "carpet" | "concrete" | "checker" | "grass" | "sand" | "dirt" | "road" | "snow" | "deck" | "moon" | "stone" | "water";

export const Floor: React.FC<{ horizon: number; kind: FloorKind; color: string; t?: number }> = ({ horizon, kind, color, t = 0 }) => {
  const id = React.useMemo(() => uid("fl"), []);
  const vpy = horizon - 900;
  const far = shade(color, -0.12), near = shade(color, 0.06);
  const conv = (x: number) => {
    // line from vanishing point through (x, horizon) extended to Y1
    const k = (Y1 - vpy) / (horizon - vpy);
    return `M ${VPX + (x - VPX)} ${horizon} L ${VPX + (x - VPX) * k} ${Y1}`;
  };
  const rowY = (i: number, n: number) => horizon + Math.pow(i / n, 2.1) * (Y1 - horizon);
  const lines: React.ReactNode[] = [];
  if (kind === "wood" || kind === "deck") {
    for (let x = X0 - 600; x <= X1 + 600; x += kind === "deck" ? 70 : 90) lines.push(<path key={`v${x}`} d={conv(x)} stroke={shade(color, -0.28)} strokeWidth={3} />);
    for (let i = 1; i < 30; i++) {
      const y = rowY(i, 30);
      const off = (i % 2) * 45;
      for (let x = X0 - 600 + off; x < X1 + 600; x += 270) {
        const k = (y - vpy) / (horizon - vpy);
        const xa = VPX + (x - VPX) * k;
        lines.push(<line key={`h${i}-${x}`} x1={xa} y1={y} x2={xa} y2={y + 4 + i * 0.6} stroke={shade(color, -0.3)} strokeWidth={3} />);
      }
    }
  } else if (kind === "tile" || kind === "checker" || kind === "stone") {
    for (let x = X0 - 900; x <= X1 + 900; x += 120) lines.push(<path key={`v${x}`} d={conv(x)} stroke={shade(color, -0.2)} strokeWidth={3} />);
    for (let i = 1; i < 16; i++) lines.push(<line key={`h${i}`} x1={X0} y1={rowY(i, 16)} x2={X1} y2={rowY(i, 16)} stroke={shade(color, -0.2)} strokeWidth={3} />);
  } else if (kind === "road") {
    lines.push(<path key="c" d={`M ${VPX} ${horizon} L ${VPX} ${Y1}`} stroke="#f2d23a" strokeWidth={14} strokeDasharray="60 70" />);
    lines.push(<path key="l" d={conv(VPX - 420)} stroke="#e8e8e8" strokeWidth={10} />);
    lines.push(<path key="r" d={conv(VPX + 420)} stroke="#e8e8e8" strokeWidth={10} />);
  } else if (kind === "grass") {
    for (let i = 0; i < 160; i++) {
      const y = horizon + 20 + Math.pow(rand(i * 3.3), 1.4) * (Y1 - horizon - 200);
      const x = X0 + rand(i * 9.1) * (X1 - X0);
      const sc = 0.4 + ((y - horizon) / (Y1 - horizon)) * 2;
      lines.push(<path key={`g${i}`} d={`M ${x} ${y} l ${-6 * sc} ${-18 * sc} M ${x} ${y} l ${2 * sc} ${-22 * sc} M ${x} ${y} l ${9 * sc} ${-16 * sc}`} stroke={shade(color, -0.22)} strokeWidth={3 * sc} strokeLinecap="round" />);
    }
  } else if (kind === "sand" || kind === "dirt" || kind === "moon" || kind === "snow" || kind === "concrete") {
    for (let i = 0; i < 70; i++) {
      const y = horizon + 20 + Math.pow(rand(i * 5.3), 1.3) * (Y1 - horizon - 200);
      const x = X0 + rand(i * 2.9) * (X1 - X0);
      const sc = 0.3 + ((y - horizon) / (Y1 - horizon)) * 2;
      lines.push(kind === "moon"
        ? <ellipse key={i} cx={x} cy={y} rx={40 * sc} ry={12 * sc} fill={shade(color, -0.15)} stroke={shade(color, -0.25)} strokeWidth={2} />
        : <ellipse key={i} cx={x} cy={y} rx={14 * sc} ry={4 * sc} fill={shade(color, kind === "snow" ? -0.06 : -0.14)} />);
    }
  } else if (kind === "carpet") {
    lines.push(<rect key="r" x={X0} y={horizon} width={X1 - X0} height={14} fill={shade(color, -0.3)} />);
  }
  return (
    <g>
      <defs>
        <linearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor={far} />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={near} />
        </linearGradient>
      </defs>
      <rect x={X0} y={horizon} width={X1 - X0} height={Y1 - horizon} fill={`url(#${id})`} />
      {kind === "checker" &&
        Array.from({ length: 15 }).map((_, i) =>
          Array.from({ length: 24 }).map((__, k) => {
            if ((i + k) % 2) return null;
            const y0 = rowY(i, 16), y1 = rowY(i + 1, 16);
            const x = X0 - 900 + k * 120;
            const k0 = (y0 - vpy) / (horizon - vpy), k1 = (y1 - vpy) / (horizon - vpy);
            const p = (xx: number, kk: number) => VPX + (xx - VPX) * kk;
            return <polygon key={`${i}-${k}`} points={`${p(x, k0)},${y0} ${p(x + 120, k0)},${y0} ${p(x + 120, k1)},${y1} ${p(x, k1)},${y1}`} fill={shade(color, -0.35)} />;
          }),
        )}
      {lines}
      {kind === "water" && <Sea horizon={horizon} time="day" t={t} />}
      <rect x={X0} y={horizon} width={X1 - X0} height={18} fill="rgba(0,0,0,0.12)" />
    </g>
  );
};

export type WallKind = "paint" | "brick" | "tile" | "wood" | "panel" | "concrete" | "stripes" | "stone" | "metal" | "cinder";

export const Wall: React.FC<{ horizon: number; kind: WallKind; color: string; wainscot?: string; top?: number }> = ({ horizon, kind, color, wainscot, top = Y0 }) => {
  const id = React.useMemo(() => uid("wl"), []);
  const pat: React.ReactNode[] = [];
  const h = horizon - top;
  if (kind === "brick" || kind === "cinder" || kind === "stone") {
    const bh = kind === "cinder" ? 70 : kind === "stone" ? 90 : 46, bw = kind === "cinder" ? 150 : kind === "stone" ? 170 : 110;
    for (let r = 0; r * bh < h; r++) {
      const y = horizon - (r + 1) * bh;
      pat.push(<line key={`r${r}`} x1={X0} y1={y} x2={X1} y2={y} stroke={shade(color, -0.18)} strokeWidth={4} />);
      for (let x = X0 + (r % 2) * (bw / 2); x < X1; x += bw) {
        pat.push(<line key={`b${r}-${x}`} x1={x} y1={y} x2={x} y2={y + bh} stroke={shade(color, -0.18)} strokeWidth={4} />);
        if (rand(r * 31 + x) > 0.82) pat.push(<rect key={`s${r}-${x}`} x={x + 4} y={y + 4} width={bw - 8} height={bh - 8} fill={shade(color, rand(x + r) > 0.5 ? 0.06 : -0.06)} />);
      }
    }
  } else if (kind === "tile") {
    for (let y = horizon; y > top; y -= 80) pat.push(<line key={`r${y}`} x1={X0} y1={y} x2={X1} y2={y} stroke={shade(color, -0.12)} strokeWidth={3} />);
    for (let x = X0; x < X1; x += 80) pat.push(<line key={`c${x}`} x1={x} y1={top} x2={x} y2={horizon} stroke={shade(color, -0.12)} strokeWidth={3} />);
  } else if (kind === "wood" || kind === "panel") {
    for (let x = X0; x < X1; x += kind === "wood" ? 70 : 220) pat.push(<line key={x} x1={x} y1={top} x2={x} y2={horizon} stroke={shade(color, -0.25)} strokeWidth={kind === "wood" ? 3 : 6} />);
  } else if (kind === "stripes") {
    for (let x = X0; x < X1; x += 90) pat.push(<rect key={x} x={x} y={top} width={40} height={h} fill={shade(color, 0.07)} />);
  } else if (kind === "metal") {
    for (let x = X0; x < X1; x += 240) {
      pat.push(<line key={x} x1={x} y1={top} x2={x} y2={horizon} stroke={shade(color, -0.25)} strokeWidth={5} />);
      for (let y = top + 40; y < horizon; y += 120) pat.push(<circle key={`${x}-${y}`} cx={x + 14} cy={y} r={5} fill={shade(color, -0.3)} />);
    }
  } else if (kind === "concrete") {
    for (let i = 0; i < 40; i++) pat.push(<ellipse key={i} cx={X0 + rand(i * 3.7) * (X1 - X0)} cy={top + rand(i * 8.1) * h} rx={60 + rand(i) * 120} ry={30 + rand(i * 2) * 60} fill={shade(color, rand(i * 5) > 0.5 ? 0.04 : -0.05)} />);
  }
  return (
    <g>
      <defs>
        <linearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor={shade(color, -0.22)} />
          <stop offset="0.7" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -0.08)} />
        </linearGradient>
      </defs>
      <rect x={X0} y={top} width={X1 - X0} height={h + 4} fill={`url(#${id})`} />
      {pat}
      {wainscot && (
        <g>
          <rect x={X0} y={horizon - 300} width={X1 - X0} height={300} fill={wainscot} />
          <rect x={X0} y={horizon - 310} width={X1 - X0} height={20} fill={shade(wainscot, 0.15)} stroke={INK} strokeWidth={3} />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={X0 + 40 + i * 170} y={horizon - 270} width={130} height={220} rx={6} fill="none" stroke={shade(wainscot, -0.2)} strokeWidth={5} />
          ))}
        </g>
      )}
      <rect x={X0} y={horizon - 22} width={X1 - X0} height={22} fill={shade(color, -0.4)} />
    </g>
  );
};

export const Window: React.FC<{ x: number; y: number; w: number; h: number; time: Time; view?: "sky" | "city" | "trees" | "sea"; bars?: boolean; blinds?: boolean; frame?: string }> = ({
  x, y, w, h, time, view = "city", bars, blinds, frame = "#efe6d6",
}) => {
  const id = React.useMemo(() => uid("win"), []);
  const [a, b, c] = SKY[time];
  const night = time === "night";
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x - w / 2} y={y - h} width={w} height={h} />
        </clipPath>
        <linearGradient id={id + "g"} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor={a} />
          <stop offset="0.7" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect x={x - w / 2 - 18} y={y - h - 18} width={w + 36} height={h + 36} rx={4} fill={frame} stroke={INK} strokeWidth={5} />
      <g clipPath={`url(#${id})`}>
        <rect x={x - w / 2} y={y - h} width={w} height={h} fill={`url(#${id}g)`} />
        {night && <circle cx={x + w * 0.25} cy={y - h * 0.75} r={22} fill="#f4f6ff" />}
        {view === "city" &&
          Array.from({ length: 8 }).map((_, i) => {
            const bw = w / 6, bh = h * (0.25 + rand(i * 3 + x) * 0.45);
            const bx = x - w / 2 + i * (w / 7) - 10;
            return (
              <g key={i}>
                <rect x={bx} y={y - bh} width={bw} height={bh} fill={night ? "#1d2a4f" : "#8fa6c4"} />
                {Array.from({ length: Math.floor(bh / 26) }).map((__, r) => (
                  <rect key={r} x={bx + 8} y={y - bh + 10 + r * 26} width={bw - 16} height={10} fill={night ? (rand(i + r + x) > 0.4 ? "#ffd77a" : "#2a3a66") : "#b8cce4"} />
                ))}
              </g>
            );
          })}
        {view === "trees" && [0, 1, 2, 3].map((i) => <circle key={i} cx={x - w / 2 + i * (w / 3)} cy={y - 10} r={w / 4} fill={night ? "#1d3a2a" : "#5aa85a"} />)}
        {view === "sea" && <rect x={x - w / 2} y={y - h * 0.35} width={w} height={h * 0.35} fill={night ? "#16305a" : "#3f9ad8"} />}
        {blinds && Array.from({ length: Math.floor(h / 26) }).map((_, i) => <rect key={i} x={x - w / 2} y={y - h + i * 26} width={w} height={13} fill="#f2ead8" opacity={0.92} />)}
        <path d={`M ${x - w / 2 + 20} ${y - h + 30} l ${w * 0.35} ${h * 0.35} M ${x - w / 2 + 20} ${y - h + 80} l ${w * 0.18} ${h * 0.18}`} stroke="rgba(255,255,255,0.35)" strokeWidth={10} strokeLinecap="round" />
      </g>
      {bars
        ? Array.from({ length: 6 }).map((_, i) => <line key={i} x1={x - w / 2 + (i + 0.5) * (w / 6)} y1={y - h} x2={x - w / 2 + (i + 0.5) * (w / 6)} y2={y} stroke="#4a4f58" strokeWidth={12} />)
        : <path d={`M ${x} ${y - h} L ${x} ${y} M ${x - w / 2} ${y - h / 2} L ${x + w / 2} ${y - h / 2}`} stroke={frame} strokeWidth={14} />}
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill="none" stroke={INK} strokeWidth={4} />
      <rect x={x - w / 2 - 30} y={y + 14} width={w + 60} height={18} rx={4} fill={shade(frame, -0.08)} stroke={INK} strokeWidth={4} />
    </g>
  );
};

export const Frame: React.FC<{ x: number; y: number; w: number; h: number; seed: number }> = ({ x, y, w, h, seed }) => {
  const hue = ["#e8a23a", "#4fa8e8", "#d8342c", "#5fbf5a", "#7a4fd6"][Math.floor(hashStr("f" + seed) * 5)];
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#8a5a32" stroke={INK} strokeWidth={4} />
      <rect x={x - w / 2 + 10} y={y - h / 2 + 10} width={w - 20} height={h - 20} fill={mix(hue, "#ffffff", 0.45)} />
      <path d={`M ${x - w / 2 + 10} ${y + h / 2 - 10} L ${x - w * 0.1} ${y - h * 0.05} L ${x + w * 0.1} ${y + h * 0.15} L ${x + w * 0.25} ${y - h * 0.15} L ${x + w / 2 - 10} ${y + h / 2 - 10} Z`} fill={hue} />
      <circle cx={x + w * 0.22} cy={y - h * 0.22} r={Math.min(w, h) * 0.09} fill="#fff4b0" />
    </g>
  );
};

export const CeilingLights: React.FC<{ y: number; count: number; on?: boolean }> = ({ y, count, on = true }) => (
  <g>
    {Array.from({ length: count }).map((_, i) => {
      const x = X0 + 300 + (i * (X1 - X0 - 600)) / Math.max(1, count - 1);
      return (
        <g key={i}>
          <line x1={x} y1={Y0} x2={x} y2={y - 20} stroke={INK} strokeWidth={4} />
          <rect x={x - 110} y={y - 24} width={220} height={28} rx={6} fill="#c9ced6" stroke={INK} strokeWidth={4} />
          <rect x={x - 100} y={y} width={200} height={10} rx={4} fill={on ? "#fffbe6" : "#9aa0a8"} />
        </g>
      );
    })}
  </g>
);
