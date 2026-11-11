import React from "react";
import { AbsoluteFill } from "remotion";
import { H, INK, W, clamp, easeOut, easeOutBack, mix, shade } from "../theme";
import type { Insert } from "../schema";
import { FONT } from "../scene/props/Props";

const T: React.FC<{ x: number; y: number; size: number; children: React.ReactNode; color?: string; stroke?: string; anchor?: "middle" | "start" | "end"; weight?: number; maxW?: number }> = ({
  x, y, size, children, color = INK, stroke, anchor = "middle", weight = 900, maxW,
}) => {
  const txt = String(children ?? "");
  const fs = maxW ? Math.min(size, (maxW / Math.max(1, txt.length)) * 1.8) : size;
  return (
    <text x={x} y={y} fontFamily={FONT} fontWeight={weight} fontSize={fs} textAnchor={anchor} dominantBaseline="central" fill={color}
      stroke={stroke} strokeWidth={stroke ? fs * 0.14 : 0} paintOrder="stroke" style={{ letterSpacing: -1 }}>
      {txt}
    </text>
  );
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export const InsertGraphic: React.FC<{ insert: Insert; frame: number; fps: number }> = ({ insert, frame }) => {
  const pop = easeOutBack(clamp(frame / 12));
  const accent = insert.color ?? "#f2c230";
  const lines = insert.lines ?? [];
  const reveal = (i: number, step = 9, start = 8) => clamp((frame - start - i * step) / 8);
  const card = (children: React.ReactNode) => (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "rgba(10,12,24,0.55)" }} />
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute" }}>
        <g transform={`translate(${W / 2} ${H * 0.44}) scale(${pop}) rotate(${(1 - clamp(frame / 12)) * -4})`}>{children}</g>
      </svg>
    </AbsoluteFill>
  );
  switch (insert.type) {
    case "document":
      return card(
        <g>
          <rect x={-380} y={-520} width={760} height={1040} rx={18} fill="#fbfaf4" stroke={INK} strokeWidth={8} />
          <rect x={-380} y={-520} width={760} height={150} rx={18} fill={accent} stroke={INK} strokeWidth={8} />
          <T x={0} y={-445} size={64} maxW={680}>{insert.title}</T>
          {lines.map((l, i) => {
            const r = reveal(i);
            const y = -300 + i * 110;
            const hl = insert.highlight === i;
            return (
              <g key={i} opacity={r}>
                {hl && <rect x={-330} y={y - 40} width={660 * easeOut(clamp((frame - 30) / 14))} height={80} fill="#ffe24a" opacity={0.85} />}
                <T x={-320} y={y} size={50} anchor="start" weight={800} maxW={640}>{l}</T>
              </g>
            );
          })}
          {lines.length === 0 && [0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-320} y={-300 + i * 100} width={i === 5 ? 300 : 640} height={26} rx={13} fill="#d6d2c4" />)}
        </g>,
      );
    case "phone":
      return card(
        <g>
          <rect x={-300} y={-600} width={600} height={1200} rx={70} fill="#1d1f26" stroke={INK} strokeWidth={8} />
          <rect x={-270} y={-570} width={540} height={1140} rx={50} fill="#f2f4f8" />
          <rect x={-80} y={-560} width={160} height={36} rx={18} fill="#1d1f26" />
          <rect x={-270} y={-510} width={540} height={110} fill="#ffffff" />
          <circle cx={-200} cy={-455} r={34} fill={accent} stroke={INK} strokeWidth={4} />
          <T x={-150} y={-455} size={40} anchor="start" maxW={380}>{insert.title ?? "Messages"}</T>
          {lines.map((l, i) => {
            const r = reveal(i, 14);
            const mine = i % 2 === 1;
            const y = -330 + i * 150;
            const w = Math.min(440, 60 + l.length * 19);
            return (
              <g key={i} opacity={r} transform={`translate(0 ${(1 - r) * 30})`}>
                <rect x={mine ? 240 - w : -240} y={y - 52} width={w} height={104} rx={40} fill={mine ? "#2f8af5" : "#ffffff"} stroke={mine ? "none" : "#d6d8de"} strokeWidth={3} />
                <T x={mine ? 240 - w / 2 : -240 + w / 2} y={y} size={36} color={mine ? "#fff" : INK} weight={700} maxW={w - 40}>{l}</T>
              </g>
            );
          })}
        </g>,
      );
    case "chart": {
      const data = insert.data.length ? insert.data : [3, 5, 4, 8, 10];
      const max = Math.max(...data, 1);
      const bw = 640 / data.length;
      return card(
        <g>
          <rect x={-420} y={-480} width={840} height={960} rx={24} fill="#ffffff" stroke={INK} strokeWidth={8} />
          <T x={0} y={-400} size={58} maxW={740}>{insert.title}</T>
          <line x1={-340} y1={330} x2={340} y2={330} stroke={INK} strokeWidth={8} strokeLinecap="round" />
          {data.map((v, i) => {
            const g = easeOut(clamp((frame - 8 - i * 5) / 14));
            const h = (v / max) * 560 * g;
            const hl = insert.highlight === i;
            return (
              <g key={i}>
                <rect x={-320 + i * bw + bw * 0.15} y={330 - h} width={bw * 0.7} height={h} rx={8} fill={hl ? accent : "#9fb6d6"} stroke={INK} strokeWidth={5} />
                <T x={-320 + i * bw + bw / 2} y={330 - h - 40} size={38} maxW={bw}>{g > 0.9 ? fmt(v) : ""}</T>
                <T x={-320 + i * bw + bw / 2} y={385} size={32} weight={700} maxW={bw}>{lines[i] ?? ""}</T>
              </g>
            );
          })}
        </g>,
      );
    }
    case "map": {
      const draw = easeOut(clamp((frame - 6) / 30));
      const pts = lines.map((_, i) => [-280 + (i / Math.max(1, lines.length - 1)) * 560, (i % 2 ? -1 : 1) * 160 - 60 + i * 20] as const);
      const d = pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
      return card(
        <g>
          <path d="M -440 -440 L -150 -470 L 150 -440 L 440 -470 L 440 440 L 150 470 L -150 440 L -440 470 Z" fill="#f4e3b8" stroke={INK} strokeWidth={8} />
          <path d="M -150 -470 L -150 440 M 150 -440 L 150 470" stroke="#d9c08a" strokeWidth={5} />
          <path d="M -440 120 Q -200 60 -60 200 Q 100 330 440 260" stroke="#7fc0e8" strokeWidth={40} fill="none" opacity={0.7} />
          <T x={0} y={-380} size={56} maxW={760}>{insert.title}</T>
          {pts.length > 1 && <path d={d} stroke={accent === "#f2c230" ? "#d8342c" : accent} strokeWidth={12} fill="none" strokeDasharray="30 20" pathLength={1000} strokeDashoffset={0} style={{ strokeDasharray: `${draw * 1000} 1000` }} />}
          {pts.map((p, i) => (
            <g key={i} opacity={clamp(draw * pts.length - i + 0.5)}>
              <circle cx={p[0]} cy={p[1]} r={22} fill="#d8342c" stroke={INK} strokeWidth={5} />
              <T x={p[0]} y={p[1] + 60} size={36} stroke="#f4e3b8" maxW={300}>{lines[i]}</T>
            </g>
          ))}
        </g>,
      );
    }
    case "counter": {
      const from = insert.from ?? 0, to = insert.value ?? 100;
      const v = from + (to - from) * easeOut(clamp((frame - 4) / 36));
      const big = `${insert.prefix ?? ""}${fmt(v)}${insert.suffix ?? ""}`;
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ backgroundColor: "rgba(10,12,24,0.6)" }} />
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute" }}>
            <g transform={`translate(${W / 2} ${H * 0.42}) scale(${pop})`}>
              <T x={0} y={-170} size={60} color="#ffffff" stroke={INK} maxW={900}>{insert.title}</T>
              <T x={0} y={0} size={210} color={accent} stroke={INK} maxW={980}>{big}</T>
              {lines[0] && <T x={0} y={170} size={54} color="#ffffff" stroke={INK} maxW={900}>{lines[0]}</T>}
            </g>
          </svg>
        </AbsoluteFill>
      );
    }
    case "bigtext":
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ backgroundColor: "rgba(10,12,24,0.5)" }} />
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute" }}>
            <g transform={`translate(${W / 2} ${H * 0.4})`}>
              {[insert.title, ...lines].filter(Boolean).map((l, i) => {
                const r = easeOutBack(clamp((frame - i * 8) / 10));
                return (
                  <g key={i} transform={`translate(0 ${i * 170}) scale(${r})`}>
                    <T x={0} y={0} size={i === 0 ? 150 : 90} color={i === 0 ? accent : "#ffffff"} stroke={INK} maxW={960}>{l}</T>
                  </g>
                );
              })}
            </g>
          </svg>
        </AbsoluteFill>
      );
    case "versus": {
      const sl = easeOut(clamp(frame / 12));
      const c2 = insert.color ?? "#2a6fd6";
      const vs = (s: string) => (s.length > 9 ? 66 : s.length > 7 ? 76 : 90);
      return (
        <AbsoluteFill>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute" }}>
            <polygon points={`${-W * (1 - sl)},0 ${W * 0.62 - W * (1 - sl)},0 ${W * 0.38 - W * (1 - sl)},${H} ${-W * (1 - sl)},${H}`} fill="#d8342c" opacity={0.92} />
            <polygon points={`${W * 0.62 + W * (1 - sl)},0 ${W * 2},0 ${W * 2},${H} ${W * 0.38 + W * (1 - sl)},${H}`} fill={c2} opacity={0.92} />
            <T x={W * 0.27} y={H * 0.36} size={vs(lines[0] ?? "")} color="#fff" stroke={INK} maxW={500}>{lines[0]}</T>
            <T x={W * 0.73} y={H * 0.56} size={vs(lines[1] ?? "")} color="#fff" stroke={INK} maxW={500}>{lines[1]}</T>
            <g transform={`translate(${W / 2} ${H * 0.46}) scale(${easeOutBack(clamp((frame - 8) / 10))})`}>
              <circle r={110} fill="#ffd23a" stroke={INK} strokeWidth={10} />
              <T x={0} y={4} size={110} stroke={undefined}>VS</T>
            </g>
            {insert.title && <T x={W / 2} y={H * 0.16} size={70} color="#fff" stroke={INK} maxW={960}>{insert.title}</T>}
          </svg>
        </AbsoluteFill>
      );
    }
    case "timeline":
      return card(
        <g>
          <rect x={-440} y={-520} width={880} height={1040} rx={24} fill="#ffffff" stroke={INK} strokeWidth={8} />
          <T x={0} y={-440} size={58} maxW={780}>{insert.title}</T>
          <line x1={-300} y1={-340} x2={-300} y2={-340 + 760 * easeOut(clamp(frame / 30))} stroke={INK} strokeWidth={10} strokeLinecap="round" />
          {lines.map((l, i) => {
            const y = -320 + (i * 760) / Math.max(1, lines.length);
            const r = reveal(i, 10);
            const hl = insert.highlight === i;
            return (
              <g key={i} opacity={r}>
                <circle cx={-300} cy={y} r={28 * easeOutBack(r)} fill={hl ? accent : "#9fb6d6"} stroke={INK} strokeWidth={6} />
                <T x={-240} y={y} size={46} anchor="start" weight={800} maxW={620}>{l}</T>
              </g>
            );
          })}
        </g>,
      );
    case "list":
      return card(
        <g>
          <rect x={-440} y={-520} width={880} height={1040} rx={24} fill="#fbfaf4" stroke={INK} strokeWidth={8} />
          <T x={0} y={-440} size={60} maxW={780}>{insert.title}</T>
          {lines.map((l, i) => {
            const y = -310 + i * 130;
            const r = reveal(i, 10);
            const chk = clamp((frame - 14 - i * 10) / 6);
            return (
              <g key={i} opacity={r}>
                <rect x={-370} y={y - 36} width={72} height={72} rx={12} fill="#fff" stroke={INK} strokeWidth={6} />
                <path d={`M ${-356} ${y} L ${-338} ${y + 20} L ${-306} ${y - 22}`} stroke={insert.highlight === i ? "#d8342c" : "#2fa84f"} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ strokeDasharray: `${chk} 1` }} />
                <T x={-270} y={y} size={50} anchor="start" weight={800} maxW={680}>{l}</T>
              </g>
            );
          })}
        </g>,
      );
  }
  void mix; void shade;
  return null;
};
