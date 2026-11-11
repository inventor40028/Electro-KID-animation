import React from "react";
import { staticFile } from "remotion";
import { INK, hashStr, mix, shade } from "../../theme";
import type { PROPS } from "../../catalog";
import { Star } from "../../character/headwear";

export type PropType = (typeof PROPS)[number];
export type PropOpts = { color?: string; label?: string; t: number; seed: number };

// All props: origin = bottom-center (where it touches the ground), drawn upward (negative y).
// Sizes are in world px relative to a character ~370px tall.

const SW = 5;
const s = (fill: string, w = SW) => ({ fill, stroke: INK, strokeWidth: w, strokeLinejoin: "round" as const, strokeLinecap: "round" as const });
const ln = (w = 4, c = INK) => ({ stroke: c, strokeWidth: w, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
export const FONT = "Montserrat, 'Arial Black', Arial, sans-serif";

export const Label: React.FC<{ x: number; y: number; text?: string; size?: number; color?: string; w?: number; stroke?: string; weight?: number; anchor?: "middle" | "start" }> = ({
  x, y, text, size = 28, color = INK, w, stroke, weight = 900, anchor = "middle",
}) => {
  if (!text) return null;
  const fs = w ? Math.min(size, (w / Math.max(1, text.length)) * 1.75) : size;
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontFamily={FONT} fontWeight={weight} fontSize={fs} fill={color}
      stroke={stroke} strokeWidth={stroke ? fs * 0.12 : 0} paintOrder="stroke" style={{ letterSpacing: -0.5 }}>
      {text}
    </text>
  );
};

// Plays the v1 screen-recording on a display. mode: "search" | "opened" | "openedEnd" | "both".
const ScreenRec: React.FC<{ t: number; x?: number; y?: number; w?: number; h?: number; mode?: "search" | "opened" | "openedEnd" | "both" }> = ({ t, x = -64, y = -116, w = 128, h = 90, mode = "both" }) => {
  // exact user frames: search f017..f056 (40), opened f017..f031 (15)
  const SEARCH = 40, OPENED = 15, START = 17;
  const ff = (i: number) => `f${String(i).padStart(3, "0")}.jpg`;
  const phase = Math.max(0, t);
  let src: string;
  if (mode === "search") {
    src = staticFile(`screenrec/search/${ff(START + (Math.floor(phase * 45) % SEARCH))}`);
  } else if (mode === "opened") {
    src = staticFile(`screenrec/opened/${ff(START + (Math.floor(phase * 30) % OPENED))}`);
  } else if (mode === "openedEnd") {
    src = staticFile(`screenrec/opened/${ff(START + OPENED - 1)}`);
  } else if (phase < 1.2) {
    src = staticFile(`screenrec/search/${ff(START + (Math.floor(phase * 45) % SEARCH))}`);
  } else {
    src = staticFile(`screenrec/opened/${ff(START + (Math.floor((phase - 1.2) * 30) % OPENED))}`);
  }
  return (
    <g>
      <image href={src} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
      <rect x={x} y={y} width={w} height={h} rx={4} fill="none" stroke={INK} strokeWidth={3} />
    </g>
  );
};

// Readable "typing xqivo.com" browser screen for the laptop.
const TypeXqivo: React.FC<{ t: number }> = ({ t }) => {
  const p = Math.max(0, t);
  const url = "xqivo.com".slice(0, Math.min(9, Math.floor(p * 80))) + (p < 0.15 ? "_" : "");
  return (
    <g>
      <rect x={-64} y={-116} width={128} height={90} rx={4} fill="#f5f6f8" stroke={INK} strokeWidth={3} />
      <rect x={-61} y={-113} width={122} height={13} fill="#f0f0f2" />
      <circle cx={-55} cy={-106.5} r={2.6} fill="#ff5f56" />
      <circle cx={-50} cy={-106.5} r={2.6} fill="#ffbd2e" />
      <circle cx={-45} cy={-106.5} r={2.6} fill="#27c93f" />
      <rect x={-36} y={-110} width={94} height={8} rx={4} fill="#ffffff" stroke="#d6d8dc" strokeWidth={1} />
      <text x={-33} y={-103} fontFamily={FONT} fontSize={6.5} fill="#161e2e">{url}</text>
      <text x={-60} y={-92} fontFamily={FONT} fontWeight={700} fontSize={10} fill="#161e2e">Search</text>
      {[0, 1, 2, 3].map((r) => <rect key={r} x={-60} y={-84 + r * 10} width={84 - r * 4} height={4} fill="#dcdde4" />)}
      {p >= 0.22 && <rect x={-60} y={-55} width={118} height={10} rx={4} fill="#02c9bf" />}
      {p >= 0.22 && <text x={-54} y={-47} fontFamily={FONT} fontSize={6} fill="#ffffff">Xqivo — invoices in seconds</text>}
      {p >= 0.22 && <text x={-60} y={-36} fontFamily={FONT} fontSize={7} fontWeight={700} fill="#02c9bf">xqivo.com</text>}
    </g>
  );
};


const Box: React.FC<{ w: number; h: number; c: string; y?: number; x?: number; r?: number; top?: boolean }> = ({ w, h, c, y = 0, x = 0, r = 4, top = true }) => (
  <g>
    <rect x={x - w / 2} y={y - h} width={w} height={h} rx={r} {...s(c)} />
    {top && <rect x={x - w / 2 + 3} y={y - h + 3} width={w - 6} height={Math.min(14, h * 0.18)} rx={r} fill={shade(c, 0.18)} />}
  </g>
);

const Leg: React.FC<{ x: number; y1: number; y2: number; c?: string; w?: number }> = ({ x, y1, y2, c = INK, w = 8 }) => (
  <line x1={x} y1={y1} x2={x} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" />
);

const Bill: React.FC<{ x?: number; y?: number; r?: number }> = ({ x = 0, y = 0, r = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-34} y={-17} width={68} height={34} rx={3} {...s("#8fd17a", 3.5)} />
    <circle cx={0} cy={0} r={9} fill="#5fa84a" />
    <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={900} fontSize={13} fill="#e8f7df">$</text>
  </g>
);

const CoinG: React.FC<{ x?: number; y?: number; r?: number }> = ({ x = 0, y = 0, r = 20 }) => (
  <g>
    <circle cx={x} cy={y} r={r} {...s("#f2c230", 4)} />
    <circle cx={x} cy={y} r={r * 0.68} fill="none" stroke="#c9961a" strokeWidth={3} />
    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={900} fontSize={r * 0.95} fill="#b8860b">$</text>
  </g>
);

const Animal: React.FC<{ c: string; kind: "horse" | "dog" | "cat" | "cow" | "pig" | "rat"; t: number }> = ({ c, kind, t }) => {
  const big = kind === "horse" || kind === "cow";
  const W = big ? 230 : kind === "rat" ? 70 : kind === "pig" ? 130 : 110;
  const H = big ? 110 : kind === "rat" ? 34 : 64;
  const leg = big ? 120 : kind === "rat" ? 16 : 46;
  const by = -leg - H / 2;
  const sw = Math.sin(t * 10) * 6;
  const head =
    kind === "horse" ? <path d={`M ${W * 0.38} ${by - 10} L ${W * 0.62} ${by - 110} Q ${W * 0.76} ${by - 124} ${W * 0.8} ${by - 98} L ${W * 0.72} ${by - 60} Q ${W * 0.66} ${by - 40} ${W * 0.5} ${by + 10} Z`} {...s(c)} />
    : <ellipse cx={W * 0.5} cy={by - H * 0.35} rx={H * 0.5} ry={H * 0.42} {...s(c)} />;
  return (
    <g>
      {[-0.32, -0.18, 0.2, 0.34].map((f, i) => (
        <Leg key={i} x={W * f + (i % 2 ? sw : -sw) * 0.3} y1={by + H * 0.3} y2={0} w={big ? 10 : 7} />
      ))}
      <ellipse cx={0} cy={by} rx={W / 2} ry={H / 2} {...s(c)} />
      {kind === "cow" && <><circle cx={-30} cy={by - 10} r={20} fill={INK} /><circle cx={40} cy={by + 14} r={14} fill={INK} /></>}
      {head}
      {kind === "horse" && <path d={`M ${W * 0.42} ${by - 30} Q ${W * 0.5} ${by - 100} ${W * 0.66} ${by - 116}`} {...ln(14, shade(c, -0.45))} />}
      {kind === "horse" && <path d={`M ${-W / 2} ${by - 10} Q ${-W / 2 - 40} ${by + 20} ${-W / 2 - 30} ${by + 70}`} {...ln(14, shade(c, -0.45))} />}
      {(kind === "dog" || kind === "cat") && <path d={`M ${-W / 2} ${by} Q ${-W / 2 - 30} ${by - 30 + sw} ${-W / 2 - 20} ${by - 50}`} {...ln(7)} />}
      {kind === "pig" && <ellipse cx={W * 0.5 + H * 0.4} cy={by - H * 0.3} rx={10} ry={13} {...s(shade(c, -0.1), 3)} />}
      {kind === "cat" && <path d={`M ${W * 0.3} ${by - H * 0.6} l 8 -26 l 12 20 M ${W * 0.56} ${by - H * 0.66} l 10 -24 l 8 24`} {...s(c, 4)} />}
      {kind === "rat" && <path d={`M ${-W / 2} ${by} q -40 10 -50 -10`} {...ln(4, "#e79aa8")} />}
      <circle cx={kind === "horse" ? W * 0.7 : W * 0.56} cy={kind === "horse" ? by - 96 : by - H * 0.42} r={5} fill={INK} />
    </g>
  );
};

const Tree: React.FC<{ kind: "tree" | "pinetree" | "palm"; c?: string }> = ({ kind, c }) => {
  if (kind === "pinetree")
    return (
      <g>
        <rect x={-14} y={-60} width={28} height={60} {...s("#7a4a2a")} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M ${-110 + i * 22} ${-50 - i * 90} L 0 ${-200 - i * 90} L ${110 - i * 22} ${-50 - i * 90} Z`} {...s(c ?? shade("#3f8f4a", -i * 0.05))} />
        ))}
      </g>
    );
  if (kind === "palm")
    return (
      <g>
        <path d="M -12 0 Q -6 -160 30 -330 L 46 -326 Q 12 -160 14 0 Z" {...s("#a4733f")} />
        {[-150, -110, -60, -20, 30].map((a, i) => (
          <path key={i} transform={`translate(38 -330) rotate(${a})`} d="M 0 0 Q 70 -40 150 10 Q 70 -10 0 0 Z" {...s(c ?? "#3fa04a")} />
        ))}
      </g>
    );
  const g = c ?? "#4fa24f";
  return (
    <g>
      <path d="M -18 0 L -12 -150 L 12 -150 L 18 0 Z" {...s("#80522f")} />
      <circle cx={-60} cy={-190} r={70} {...s(g)} />
      <circle cx={60} cy={-190} r={70} {...s(g)} />
      <circle cx={0} cy={-260} r={86} {...s(g)} />
      <circle cx={-30} cy={-280} r={30} fill={shade(g, 0.18)} />
    </g>
  );
};

export const drawProp = (type: PropType, o: PropOpts): React.ReactNode => {
  const c = o.color;
  const t = o.t;
  switch (type) {
    // ------------------------------------------------ furniture
    case "desk": {
      const k = c ?? "#a0683a";
      return (
        <g>
          <rect x={-150} y={-176} width={300} height={176} fill={shade(k, -0.25)} stroke={INK} strokeWidth={SW} />
          <rect x={-90} y={-150} width={180} height={150} fill={shade(k, -0.1)} stroke={INK} strokeWidth={4} />
          <line x1={-90} y1={-100} x2={90} y2={-100} {...ln(4)} />
          <line x1={-90} y1={-50} x2={90} y2={-50} {...ln(4)} />
          <circle cx={0} cy={-125} r={5} fill={INK} /><circle cx={0} cy={-75} r={5} fill={INK} /><circle cx={0} cy={-25} r={5} fill={INK} />
          <rect x={-170} y={-196} width={340} height={26} rx={5} {...s(k)} />
          <rect x={-166} y={-193} width={332} height={8} rx={4} fill={shade(k, 0.25)} />
          <Label x={0} y={-60} text={o.label} size={34} color="#fff" w={160} />
        </g>
      );
    }
    case "table": {
      const k = c ?? "#b97a45";
      return (
        <g>
          <Leg x={-120} y1={-170} y2={0} w={14} /><Leg x={120} y1={-170} y2={0} w={14} />
          <rect x={-150} y={-186} width={300} height={24} rx={6} {...s(k)} />
          <rect x={-146} y={-183} width={292} height={7} rx={4} fill={shade(k, 0.25)} />
        </g>
      );
    }
    case "chair": {
      const k = c ?? "#c0392b";
      return (
        <g>
          <Leg x={-50} y1={-90} y2={0} /><Leg x={50} y1={-90} y2={0} />
          <rect x={-60} y={-230} width={120} height={120} rx={14} {...s(k)} />
          <rect x={-66} y={-110} width={132} height={22} rx={8} {...s(shade(k, -0.1))} />
        </g>
      );
    }
    case "stool":
      return (
        <g>
          <Leg x={-34} y1={-120} y2={0} /><Leg x={34} y1={-120} y2={0} />
          <ellipse cx={0} cy={-124} rx={56} ry={14} {...s(c ?? "#c98a4a")} />
        </g>
      );
    case "bed": {
      const k = c ?? "#4f78c9";
      return (
        <g>
          <rect x={-200} y={-200} width={30} height={200} rx={6} {...s("#8a5a32")} />
          <rect x={170} y={-140} width={30} height={140} rx={6} {...s("#8a5a32")} />
          <rect x={-180} y={-110} width={360} height={70} rx={10} {...s("#f4f4f2")} />
          <rect x={-60} y={-120} width={240} height={80} rx={14} {...s(k)} />
          <ellipse cx={-120} cy={-118} rx={50} ry={22} {...s("#ffffff")} />
        </g>
      );
    }
    case "couch": {
      const k = c ?? "#6a8f5a";
      return (
        <g>
          <rect x={-200} y={-200} width={400} height={120} rx={30} {...s(shade(k, -0.08))} />
          <rect x={-180} y={-110} width={360} height={70} rx={14} {...s(k)} />
          <rect x={-220} y={-150} width={60} height={130} rx={24} {...s(k)} />
          <rect x={160} y={-150} width={60} height={130} rx={24} {...s(k)} />
          <Leg x={-170} y1={-20} y2={0} /><Leg x={170} y1={-20} y2={0} />
        </g>
      );
    }
    case "shelf": {
      const k = c ?? "#9a6a3a";
      const cols = ["#d8342c", "#2a6fd6", "#f2c230", "#2fa84f", "#7a4fd6", "#ff8a2a"];
      return (
        <g>
          <rect x={-130} y={-360} width={260} height={360} {...s(shade(k, -0.2))} />
          {[0, 1, 2].map((r) => (
            <g key={r}>
              {Array.from({ length: 7 }).map((_, i) => (
                <rect key={i} x={-114 + i * 32} y={-340 + r * 115 + (i % 3) * 6} width={26} height={88 - (i % 3) * 6} {...s(cols[(i + r * 2) % cols.length], 3)} />
              ))}
              <rect x={-130} y={-250 + r * 115} width={260} height={14} {...s(k, 4)} />
            </g>
          ))}
        </g>
      );
    }
    case "lamp":
      return (
        <g>
          <ellipse cx={0} cy={-8} rx={40} ry={10} {...s("#333")} />
          <path d="M 0 -10 L 0 -110 L 40 -150" {...ln(8)} />
          <path d="M 20 -180 L 76 -150 L 56 -114 Z" {...s(c ?? "#2fb5a0")} />
          <circle cx={62} cy={-128} r={9} fill="#fff7c2" />
        </g>
      );
    case "floorlamp":
      return (
        <g>
          <ellipse cx={0} cy={-8} rx={44} ry={10} {...s("#333")} />
          <Leg x={0} y1={-10} y2={-380} w={8} />
          <path d="M -54 -380 L 54 -380 L 36 -460 L -36 -460 Z" {...s(c ?? "#f4e3b8")} />
        </g>
      );
    case "door": {
      const k = c ?? "#8a5a32";
      return (
        <g>
          <rect x={-100} y={-420} width={200} height={420} {...s(shade(k, -0.3))} />
          <rect x={-86} y={-406} width={172} height={406} {...s(k)} />
          <rect x={-60} y={-370} width={120} height={140} rx={4} fill={shade(k, -0.1)} stroke={INK} strokeWidth={3} />
          <rect x={-60} y={-200} width={120} height={160} rx={4} fill={shade(k, -0.1)} stroke={INK} strokeWidth={3} />
          <circle cx={62} cy={-210} r={10} {...s("#f2c230", 3)} />
          <Label x={0} y={-300} text={o.label} size={34} color="#fff" w={110} />
        </g>
      );
    }
    case "window":
      return (
        <g>
          <rect x={-130} y={-300} width={260} height={300} {...s("#e9e1d2")} />
          <rect x={-114} y={-284} width={228} height={268} fill="#9fd3f5" stroke={INK} strokeWidth={4} />
          <path d="M 0 -284 L 0 -16 M -114 -150 L 114 -150" {...ln(8, "#e9e1d2")} />
          <path d="M -90 -260 L -40 -210 M -80 -200 L -60 -180" {...ln(6, "rgba(255,255,255,0.7)")} />
        </g>
      );
    case "plant":
      return (
        <g>
          {[-40, -15, 10, 35].map((a, i) => (
            <path key={i} d={`M 0 -60 Q ${a * 1.5} -120 ${a * 2.2} ${-170 + Math.abs(a)}`} {...ln(14, "#3f9a4a")} />
          ))}
          <path d="M -40 -70 L 40 -70 L 30 0 L -30 0 Z" {...s(c ?? "#c9673a")} />
        </g>
      );
    case "trashcan":
      return (
        <g>
          <path d="M -46 -120 L 46 -120 L 38 0 L -38 0 Z" {...s(c ?? "#7d8a96")} />
          <rect x={-52} y={-132} width={104} height={16} rx={6} {...s(shade(c ?? "#7d8a96", -0.15))} />
          <path d="M -20 -100 L -16 -20 M 0 -100 L 0 -20 M 20 -100 L 16 -20" {...ln(3)} />
        </g>
      );
    // ------------------------------------------------ objects
    case "box":
    case "crate": {
      const k = c ?? (type === "crate" ? "#b9844a" : "#c9965a");
      return (
        <g>
          <rect x={-80} y={-130} width={160} height={130} rx={4} {...s(k)} />
          {type === "crate" ? (
            <path d="M -76 -126 L 76 -4 M -76 -4 L 76 -126 M -80 -66 L 80 -66" {...ln(5, shade(k, -0.35))} />
          ) : (
            <path d="M -80 -100 L 80 -100 M 0 -130 L 0 -100" {...ln(4, shade(k, -0.3))} />
          )}
          <Label x={0} y={-50} text={o.label} size={26} color={INK} w={140} />
        </g>
      );
    }
    case "barrel": {
      const k = c ?? "#9a6435";
      return (
        <g>
          <path d="M -60 -170 Q -80 -85 -60 0 L 60 0 Q 80 -85 60 -170 Z" {...s(k)} />
          <ellipse cx={0} cy={-170} rx={60} ry={14} {...s(shade(k, 0.12))} />
          <path d="M -72 -120 Q 0 -110 72 -120 M -72 -50 Q 0 -40 72 -50" {...ln(8, "#5a5a5a")} />
        </g>
      );
    }
    case "bag":
    case "moneybag": {
      const k = c ?? (type === "moneybag" ? "#c9a46a" : "#b07a4a");
      return (
        <g>
          <path d="M -30 -150 Q -100 -110 -80 -30 Q -70 0 0 0 Q 70 0 80 -30 Q 100 -110 30 -150 Z" {...s(k)} />
          <path d="M -36 -150 L -50 -176 L 50 -176 L 36 -150 Z" {...s(k)} />
          <path d="M -34 -150 L 34 -150" {...ln(8, shade(k, -0.4))} />
          {type === "moneybag" ? <Label x={0} y={-70} text="$" size={70} color="#5a8a3a" /> : <Label x={0} y={-70} text={o.label} size={26} w={110} />}
        </g>
      );
    }
    case "money":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <Bill key={i} x={(i % 2) * 6 - 3} y={-17 - i * 12} r={(hashStr(o.seed + "m" + i) - 0.5) * 10} />
          ))}
        </g>
      );
    case "coins":
      return (
        <g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse key={i} cx={(i % 2) * 4} cy={-10 - i * 12} rx={36} ry={11} {...s("#f2c230", 4)} />
          ))}
          <CoinG x={52} y={-22} r={22} />
        </g>
      );
    case "coin":
      return <CoinG x={0} y={-36} r={36} />;
    case "gem":
      return <path d="M -50 -80 L -26 -110 L 26 -110 L 50 -80 L 0 0 Z M -50 -80 L 50 -80 M -26 -110 L -12 -80 L 0 0 M 26 -110 L 12 -80" {...s(c ?? "#4fd0f0")} />;
    case "trophy":
      return (
        <g>
          <rect x={-46} y={-30} width={92} height={30} rx={4} {...s("#6a4a2a")} />
          <path d="M -14 -30 L -10 -70 L 10 -70 L 14 -30 Z" {...s(c ?? "#f2c230")} />
          <path d="M -60 -170 L 60 -170 Q 60 -70 0 -66 Q -60 -70 -60 -170 Z" {...s(c ?? "#f2c230")} />
          <path d="M -60 -150 Q -100 -150 -80 -110 Q -70 -96 -50 -100 M 60 -150 Q 100 -150 80 -110 Q 70 -96 50 -100" {...ln(8)} />
          <Star x={0} y={-124} r={18} fill="#fff3b0" />
        </g>
      );
    case "key":
      return (
        <g>
          <circle cx={-40} cy={-30} r={26} {...s(c ?? "#f2c230")} />
          <circle cx={-40} cy={-30} r={10} fill="#fff" stroke={INK} strokeWidth={3} />
          <path d="M -14 -30 L 60 -30 L 60 -10 M 40 -30 L 40 -14" {...ln(10)} />
          <path d="M -14 -30 L 60 -30 L 60 -10 M 40 -30 L 40 -14" {...ln(4, c ?? "#f2c230")} />
        </g>
      );
    case "lock":
      return (
        <g>
          <path d="M -36 -90 L -36 -120 Q -36 -160 0 -160 Q 36 -160 36 -120 L 36 -90" {...ln(14)} />
          <path d="M -36 -90 L -36 -120 Q -36 -160 0 -160 Q 36 -160 36 -120 L 36 -90" {...ln(7, "#b8bec8")} />
          <rect x={-56} y={-100} width={112} height={100} rx={10} {...s(c ?? "#f2c230")} />
          <circle cx={0} cy={-56} r={10} fill={INK} /><rect x={-4} y={-56} width={8} height={26} fill={INK} />
        </g>
      );
    case "book":
      return (
        <g>
          <rect x={-60} y={-24} width={120} height={24} rx={3} {...s("#f4f0e4")} />
          <rect x={-64} y={-34} width={128} height={14} rx={3} {...s(c ?? "#2a6fd6")} />
          <Label x={0} y={-12} text={o.label} size={14} w={110} />
        </g>
      );
    case "paper":
    case "letter":
      return (
        <g transform="translate(0 -110)">
          <rect x={-75} y={-100} width={150} height={200} rx={4} {...s("#fbfaf4", 4)} />
          {type === "letter" ? (
            <path d="M -75 -100 L 0 -30 L 75 -100" {...ln(4)} />
          ) : (
            [0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={-55} y1={-30 + i * 22} x2={i === 5 ? 10 : 55} y2={-30 + i * 22} {...ln(5, "#b8b4a6")} />)
          )}
          <Label x={0} y={-66} text={o.label} size={22} w={130} color={c ?? INK} />
        </g>
      );
    case "card":
    case "ticket": {
      const k = c ?? (type === "ticket" ? "#f2c230" : "#2a2a3a");
      return (
        <g transform="translate(0 -90)">
          <rect x={-60} y={-90} width={120} height={180} rx={8} {...s(k, 4)} />
          <rect x={-48} y={-30} width={96} height={56} rx={4} fill={shade(k, 0.35)} stroke={INK} strokeWidth={3} />
          {[0, 1, 2].map((i) => <CoinG key={i} x={-30 + i * 30} y={-2} r={11} />)}
          <Label x={0} y={-62} text={o.label ?? (type === "ticket" ? "TICKET" : "")} size={22} w={100} color={type === "ticket" ? INK : "#f2c230"} />
          <path d="M -44 50 L 44 50 M -44 66 L 20 66" {...ln(4, shade(k, -0.4))} />
        </g>
      );
    }
    case "phone":
      return (
        <g transform="translate(0 -80)">
          <rect x={-44} y={-80} width={88} height={160} rx={14} {...s("#22252e")} />
          <rect x={-36} y={-66} width={72} height={128} rx={6} fill={c ?? "#7fd0ff"} />
          <Label x={0} y={-4} text={o.label} size={18} w={66} color={INK} />
        </g>
      );
    case "laptop": {
      const recOpnEnd = typeof o.label === "string" && o.label.startsWith("RECOPNEND:");
      const recOpn = typeof o.label === "string" && o.label.startsWith("RECOPN:");
      const rec = typeof o.label === "string" && o.label.startsWith("REC:");
      const typeX = typeof o.label === "string" && o.label.startsWith("TYPE:");
      const mode = recOpnEnd ? "openedEnd" : recOpn ? "opened" : rec ? "both" : undefined;
      return (
        <g>
          <path d="M -90 0 L 90 0 L 76 -16 L -76 -16 Z" {...s("#9aa3ae")} />
          <rect x={-74} y={-126} width={148} height={110} rx={8} {...s("#3a3f4a")} />
          {typeX ? (
            <TypeXqivo t={t} />
          ) : mode ? (
            <ScreenRec t={t} mode={mode} />
          ) : (
            <>
              <rect x={-64} y={-116} width={128} height={90} rx={4} fill={c ?? "#7fd0ff"} />
              <Label x={0} y={-71} text={o.label} size={20} w={120} />
            </>
          )}
        </g>
      );
    }
    case "wtfboard":
      return (
        <g transform="translate(0 -120)">
          <rect x={-42} y={-26} width={84} height={52} rx={9} fill="#0b0b0f" stroke={INK} strokeWidth={4} />
          <text x={0} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={900} fontSize={26} fill="#02c9bf">WTF</text>
        </g>
      );
    case "computer":
    case "tv": {
      const big = type === "tv";
      const w = big ? 300 : 200, h = big ? 190 : 140;
      const rec = typeof o.label === "string" && o.label.startsWith("REC:");
      return (
        <g>
          <rect x={-30} y={-40} width={60} height={40} {...s("#4a4f5a")} />
          <rect x={-70} y={-12} width={140} height={12} rx={4} {...s("#4a4f5a")} />
          <rect x={-w / 2} y={-40 - h} width={w} height={h} rx={10} {...s("#2a2d36")} />
          {rec ? (
            <ScreenRec t={t} mode="search" x={-w / 2 + 12} y={-28 - h} w={w - 24} h={h - 24} />
          ) : (
            <>
              <rect x={-w / 2 + 12} y={-28 - h} width={w - 24} height={h - 24} rx={4} fill={c ?? "#4fb3e8"} />
              <path d={`M ${-w / 2 + 30} ${-h + 0} L ${-w / 2 + 70} ${-h - 10}`} {...ln(8, "rgba(255,255,255,0.4)")} />
              <Label x={0} y={-40 - h / 2} text={o.label} size={34} w={w - 40} color="#fff" stroke={INK} />
            </>
          )}
        </g>
      );
    }
    case "clock":
    case "stopwatch": {
      const sec = t * (type === "stopwatch" ? 6 : 1);
      return (
        <g transform="translate(0 -90)">
          {type === "stopwatch" && <rect x={-14} y={-104} width={28} height={22} rx={4} {...s("#c9ced6")} />}
          <circle cx={0} cy={0} r={86} {...s(c ?? (type === "clock" ? "#d8342c" : "#c9ced6"))} />
          <circle cx={0} cy={0} r={70} fill="#ffffff" stroke={INK} strokeWidth={4} />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={Math.sin(a) * 58} y1={-Math.cos(a) * 58} x2={Math.sin(a) * 66} y2={-Math.cos(a) * 66} {...ln(i % 3 ? 3 : 6)} />;
          })}
          <line x1={0} y1={0} x2={Math.sin(sec / 7) * 34} y2={-Math.cos(sec / 7) * 34} {...ln(8)} />
          <line x1={0} y1={0} x2={Math.sin(sec) * 54} y2={-Math.cos(sec) * 54} {...ln(4, "#d8342c")} />
          <circle cx={0} cy={0} r={7} fill={INK} />
          <Label x={0} y={30} text={o.label} size={20} w={90} />
        </g>
      );
    }
    case "calendar":
      return (
        <g transform="translate(0 -100)">
          <rect x={-80} y={-100} width={160} height={200} rx={10} {...s("#ffffff")} />
          <rect x={-80} y={-100} width={160} height={56} rx={10} {...s(c ?? "#d8342c")} />
          <Label x={0} y={-72} text={(o.label ?? "MON 7").split(" ")[0]} size={32} color="#fff" w={140} />
          <Label x={0} y={30} text={(o.label ?? "MON 7").split(" ").slice(1).join(" ") || "1"} size={84} w={140} />
        </g>
      );
    case "button":
      return (
        <g>
          <path d="M -90 0 L -80 -60 L 80 -60 L 90 0 Z" {...s("#3a3f4a")} />
          <path d="M -80 -60 L 80 -60" {...ln(10, "#f2c230")} />
          <ellipse cx={0} cy={-64} rx={74} ry={22} {...s("#2a2d36")} />
          <path d="M -56 -70 Q -56 -120 0 -120 Q 56 -120 56 -70 Q 0 -54 -56 -70 Z" {...s(c ?? "#e3342c")} />
          <ellipse cx={-18} cy={-104} rx={18} ry={8} fill="rgba(255,255,255,0.55)" />
          <Label x={0} y={-30} text={o.label} size={24} color="#f2c230" w={150} />
        </g>
      );
    case "lever":
      return (
        <g>
          <rect x={-50} y={-50} width={100} height={50} rx={6} {...s("#5a606a")} />
          <path d="M 0 -40 L 50 -160" {...ln(12)} />
          <circle cx={50} cy={-160} r={20} {...s(c ?? "#d8342c")} />
        </g>
      );
    case "lightbulb":
      return (
        <g transform="translate(0 -110)">
          <circle cx={0} cy={-20} r={62} {...s(c ?? "#fff1a0")} />
          <path d="M -30 34 L 30 34 L 26 80 L -26 80 Z" {...s("#b8bec8")} />
          <path d="M -20 30 Q -20 -10 0 -20 Q 20 -10 20 30" {...ln(4, "#d9a520")} />
        </g>
      );
    case "bottle":
      return (
        <g>
          <path d="M -26 0 L -26 -110 Q -26 -130 -12 -140 L -12 -180 L 12 -180 L 12 -140 Q 26 -130 26 -110 L 26 0 Z" {...s(c ?? "#3f9a4a")} />
          <rect x={-26} y={-90} width={52} height={40} fill="#f4ecd0" stroke={INK} strokeWidth={3} />
          <Label x={0} y={-70} text={o.label} size={14} w={48} />
        </g>
      );
    case "potion":
    case "flask":
      return (
        <g>
          <path d="M -16 -170 L -16 -110 L -70 -10 Q -74 0 -60 0 L 60 0 Q 74 0 70 -10 L 16 -110 L 16 -170 Z" {...s("rgba(220,240,255,0.85)")} />
          <path d="M -46 -50 L 46 -50 L 70 -10 Q 74 0 60 0 L -60 0 Q -74 0 -70 -10 Z" fill={c ?? "#4fd07a"} stroke={INK} strokeWidth={4} />
          <circle cx={-10} cy={-30} r={7} fill="#fff" opacity={0.7} /><circle cx={14} cy={-66 - ((t * 40) % 40)} r={5} fill={c ?? "#4fd07a"} />
          <rect x={-22} y={-182} width={44} height={16} rx={4} {...s("#b98a5a", 3)} />
        </g>
      );
    case "cup":
    case "mug":
      return (
        <g>
          <path d="M -36 -90 L 36 -90 L 30 0 L -30 0 Z" {...s(c ?? (type === "mug" ? "#ffffff" : "#d8342c"))} />
          {type === "mug" && <path d="M 34 -70 Q 62 -66 56 -40 Q 50 -22 30 -26" {...ln(8)} />}
          <Label x={0} y={-46} text={o.label} size={16} w={60} />
        </g>
      );
    case "plate":
    case "food":
    case "pizza":
    case "cake":
      if (type === "cake")
        return (
          <g>
            <rect x={-80} y={-110} width={160} height={110} rx={10} {...s(c ?? "#f7c6d9")} />
            <path d="M -80 -80 Q -60 -60 -40 -80 Q -20 -60 0 -80 Q 20 -60 40 -80 Q 60 -60 80 -80" {...ln(10, "#ffffff")} />
            <rect x={-4} y={-150} width={8} height={40} fill="#5fb0f0" stroke={INK} strokeWidth={2} />
            <path d="M 0 -170 Q 10 -158 0 -150 Q -10 -158 0 -170 Z" fill="#ffb02e" />
          </g>
        );
      return (
        <g>
          <ellipse cx={0} cy={-12} rx={90} ry={22} {...s("#ffffff")} />
          {type === "pizza" ? (
            <path d="M -70 -20 L 0 -120 L 70 -20 Z" {...s("#f2c230")} />
          ) : type === "food" ? (
            <ellipse cx={0} cy={-36} rx={56} ry={30} {...s(c ?? "#c9673a")} />
          ) : null}
          {type === "pizza" && [[-20, -50], [16, -72], [10, -36]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill="#d8342c" />)}
        </g>
      );
    case "bucket":
    case "paintcan": {
      const k = c ?? (type === "paintcan" ? "#ff4fa8" : "#9aa3ae");
      return (
        <g>
          <path d="M -60 -130 L 60 -130 L 50 0 L -50 0 Z" {...s(type === "paintcan" ? "#e8eaee" : k)} />
          {type === "paintcan" && <rect x={-58} y={-100} width={116} height={56} fill={k} stroke={INK} strokeWidth={3} />}
          <ellipse cx={0} cy={-130} rx={60} ry={14} {...s(type === "paintcan" ? k : shade(k, -0.2))} />
          <path d="M -58 -128 Q 0 -230 58 -128" {...ln(5)} />
          <Label x={0} y={-72} text={o.label} size={22} w={100} color="#fff" stroke={INK} />
        </g>
      );
    }
    case "hammer":
      return (
        <g>
          <rect x={-8} y={-160} width={16} height={160} rx={6} {...s("#b07a4a")} />
          <path d="M -50 -190 L 40 -190 L 50 -150 L -50 -150 Z" {...s("#8a929e")} />
        </g>
      );
    case "wrench":
      return <path d="M -8 0 L -8 -130 Q -40 -140 -36 -170 L -20 -160 L 0 -176 L 20 -160 L 36 -170 Q 40 -140 8 -130 L 8 0 Z" {...s(c ?? "#a9b1bc")} />;
    case "pencil":
      return (
        <g transform="rotate(-20)">
          <rect x={-12} y={-200} width={24} height={170} {...s(c ?? "#f2c230")} />
          <path d="M -12 -30 L 0 0 L 12 -30 Z" {...s("#f1d2a8")} />
          <path d="M -4 -10 L 0 0 L 4 -10 Z" fill={INK} />
          <rect x={-12} y={-220} width={24} height={22} rx={4} {...s("#f08aa0")} />
        </g>
      );
    case "magnifier":
      return (
        <g>
          <path d="M 30 -60 L 80 0" {...ln(18)} />
          <circle cx={0} cy={-100} r={60} fill="rgba(200,235,255,0.5)" stroke={INK} strokeWidth={12} />
          <path d="M -30 -130 Q -10 -150 14 -146" {...ln(6, "#fff")} />
        </g>
      );
    case "mirror":
      return (
        <g>
          <ellipse cx={0} cy={-200} rx={110} ry={160} {...s(c ?? "#c9963a", 6)} />
          <ellipse cx={0} cy={-200} rx={92} ry={142} fill="#cfe9f7" stroke={INK} strokeWidth={4} />
          <path d="M -50 -270 L 30 -320 M -60 -220 L 50 -290" {...ln(10, "rgba(255,255,255,0.75)")} />
          <path d="M -70 -40 L -90 0 M 70 -40 L 90 0" {...ln(10)} />
        </g>
      );
    case "camera":
      return (
        <g transform="translate(0 -60)">
          <rect x={-70} y={-50} width={140} height={100} rx={12} {...s("#2a2d36")} />
          <rect x={-40} y={-66} width={50} height={20} rx={4} {...s("#2a2d36")} />
          <circle cx={0} cy={0} r={36} {...s("#5a606a")} />
          <circle cx={0} cy={0} r={20} fill="#7fd0ff" stroke={INK} strokeWidth={3} />
        </g>
      );
    case "microphone":
      return (
        <g>
          <rect x={-10} y={-120} width={20} height={120} rx={8} {...s("#2a2d36")} />
          <circle cx={0} cy={-140} r={30} {...s("#a9b1bc")} />
          <path d="M -24 -150 L 24 -150 M -26 -136 L 26 -136" {...ln(3)} />
        </g>
      );
    case "megaphone":
      return (
        <g transform="translate(0 -60)">
          <path d="M -40 -20 L 50 -60 L 50 60 L -40 20 Z" {...s(c ?? "#f2c230")} />
          <rect x={-70} y={-24} width={34} height={48} rx={8} {...s("#e8eaee")} />
        </g>
      );
    case "flag":
      return (
        <g>
          <Leg x={0} y1={0} y2={-320} w={8} />
          <path d={`M 4 -316 Q 60 ${-336 + Math.sin(t * 5) * 10} 120 -316 Q 150 -280 120 -236 Q 60 ${-256 + Math.sin(t * 5 + 1) * 10} 4 -236 Z`} {...s(c ?? "#d8342c")} />
          <Label x={62} y={-276} text={o.label} size={28} color="#fff" w={100} />
        </g>
      );
    case "sign":
    case "board": {
      const k = c ?? (type === "board" ? "#2f4a3a" : "#f4ecd0");
      const w = type === "board" ? 380 : 260, h = type === "board" ? 240 : 140;
      return (
        <g>
          {type === "sign" && <><Leg x={-80} y1={0} y2={-200} w={12} /><Leg x={80} y1={0} y2={-200} w={12} /></>}
          {type === "board" && <path d="M -150 0 L -120 -120 M 150 0 L 120 -120" {...ln(12)} />}
          <rect x={-w / 2} y={(type === "sign" ? -180 : -100) - h} width={w} height={h} rx={10} {...s(type === "board" ? "#8a5a32" : shade(k, -0.25), 6)} />
          <rect x={-w / 2 + 12} y={(type === "sign" ? -180 : -100) - h + 12} width={w - 24} height={h - 24} rx={6} fill={k} />
          <Label x={0} y={(type === "sign" ? -180 : -100) - h / 2} text={o.label} size={type === "board" ? 52 : 44} w={w - 50} color={type === "board" ? "#f4f4f2" : INK} weight={900} />
        </g>
      );
    }
    case "arrowsign":
      return (
        <g>
          <Leg x={0} y1={0} y2={-280} w={12} />
          <path d="M -100 -300 L 90 -300 L 130 -260 L 90 -220 L -100 -220 Z" {...s(c ?? "#f2c230")} />
          <Label x={0} y={-260} text={o.label} size={34} w={180} />
        </g>
      );
    case "chart": {
      const vals = [0.3, 0.5, 0.45, 0.8, 1];
      return (
        <g>
          <rect x={-170} y={-300} width={340} height={300} rx={10} {...s("#ffffff")} />
          {vals.map((v, i) => (
            <rect key={i} x={-140 + i * 60} y={-30 - v * 220} width={40} height={v * 220} {...s(i === 4 ? c ?? "#2fa84f" : "#9fb6d6", 3)} />
          ))}
          <path d="M -150 -30 L 150 -30" {...ln(5)} />
        </g>
      );
    }
    case "map":
      return (
        <g transform="translate(0 -170)">
          <path d="M -200 -150 L -70 -170 L 70 -150 L 200 -170 L 200 150 L 70 170 L -70 150 L -200 170 Z" {...s("#f4e3b8")} />
          <path d="M -70 -170 L -70 150 M 70 -150 L 70 170" {...ln(3, "#c9b07a")} />
          <path d="M -150 100 Q -60 20 0 40 Q 80 60 140 -100" {...ln(7, "#d8342c")} strokeDasharray="14 12" />
          <path d="M 120 -120 l 40 40 M 160 -120 l -40 40" {...ln(9, "#d8342c")} />
        </g>
      );
    case "globe":
      return (
        <g>
          <path d="M -50 0 L 50 0 M 0 0 L 0 -40" {...ln(10)} />
          <circle cx={0} cy={-140} r={100} {...s("#4fa8e8")} />
          <path d="M -60 -200 Q -20 -180 -40 -140 Q -70 -110 -40 -80 M 30 -220 Q 70 -170 40 -130 Q 20 -100 60 -70" fill="#5fbf5a" stroke={INK} strokeWidth={4} />
        </g>
      );
    case "rocket":
      return (
        <g>
          <path d="M 0 -380 Q 70 -300 60 -80 L -60 -80 Q -70 -300 0 -380 Z" {...s(c ?? "#e8eaee")} />
          <circle cx={0} cy={-240} r={30} fill="#7fd0ff" stroke={INK} strokeWidth={5} />
          <path d="M -60 -150 L -110 -40 L -60 -80 Z M 60 -150 L 110 -40 L 60 -80 Z" {...s("#d8342c")} />
          <path d={`M -36 -80 Q 0 ${10 + Math.sin(t * 30) * 14} 36 -80 Z`} fill="#ffb02e" />
        </g>
      );
    case "car":
    case "truck": {
      const k = c ?? (type === "car" ? "#d8342c" : "#2a6fd6");
      const L = type === "truck" ? 360 : 300;
      const sp = t * 30;
      return (
        <g>
          <path d={`M ${-L / 2} -40 L ${-L / 2} -110 L ${-L / 2 + 70} -116 L ${-L / 2 + 110} -180 L ${type === "truck" ? -L / 2 + 190 : L / 2 - 70} -180 L ${type === "truck" ? -L / 2 + 210 : L / 2 - 40} -116 L ${L / 2} -110 L ${L / 2} -40 Z`} {...s(k)} />
          {type === "truck" && <rect x={-L / 2 + 200} y={-220} width={L / 2 - 20} height={180} {...s(shade(k, 0.2))} />}
          <path d={`M ${-L / 2 + 84} -120 L ${-L / 2 + 116} -168 L ${-L / 2 + 170} -168 L ${-L / 2 + 170} -120 Z`} fill="#bfe6ff" stroke={INK} strokeWidth={4} />
          {[-L / 2 + 70, L / 2 - 70].map((x, i) => (
            <g key={i} transform={`translate(${x} -40) rotate(${sp * 20})`}>
              <circle r={40} {...s("#2a2d36")} />
              <circle r={16} fill="#a9b1bc" />
              <line x1={-16} y1={0} x2={16} y2={0} {...ln(4)} />
            </g>
          ))}
          <Label x={type === "truck" ? -L / 2 + 200 + L / 4 - 10 : 0} y={type === "truck" ? -130 : -76} text={o.label} size={30} color="#fff" stroke={INK} w={150} />
        </g>
      );
    }
    case "bike":
      return (
        <g>
          <circle cx={-70} cy={-50} r={48} fill="none" stroke={INK} strokeWidth={8} />
          <circle cx={70} cy={-50} r={48} fill="none" stroke={INK} strokeWidth={8} />
          <path d="M -70 -50 L -20 -130 L 50 -130 L 70 -50 M -20 -130 L 0 -50 L 50 -130 M 0 -50 L -70 -50" {...ln(8, c ?? "#d8342c")} />
          <path d="M 40 -150 L 60 -150 M -36 -146 L -6 -146" {...ln(8)} />
        </g>
      );
    case "train":
      return (
        <g>
          <rect x={-260} y={-230} width={360} height={190} rx={10} {...s(c ?? "#2f6a3a")} />
          <rect x={100} y={-180} width={160} height={140} rx={8} {...s(shade(c ?? "#2f6a3a", -0.15))} />
          <rect x={150} y={-260} width={50} height={80} {...s("#2a2d36")} />
          {[-220, -120, -20].map((x) => <rect key={x} x={x} y={-200} width={70} height={60} rx={4} fill="#ffe7a0" stroke={INK} strokeWidth={4} />)}
          {[-200, -60, 80, 210].map((x, i) => (
            <g key={i} transform={`translate(${x} -40) rotate(${t * 400})`}><circle r={40} {...s("#2a2d36")} /><line x1={-30} y1={0} x2={30} y2={0} {...ln(5, "#a9b1bc")} /></g>
          ))}
        </g>
      );
    case "ship":
    case "boat": {
      const big = type === "ship";
      const k = c ?? (big ? "#8a4a2a" : "#c9673a");
      return (
        <g transform={`rotate(${Math.sin(t * 1.5) * 2})`}>
          <path d={big ? "M -300 -140 L 300 -140 L 240 0 L -240 0 Z" : "M -150 -70 L 150 -70 L 110 0 L -110 0 Z"} {...s(k)} />
          <path d={big ? "M -290 -110 L 290 -110" : "M -140 -50 L 140 -50"} {...ln(10, "#f4ecd0")} />
          {big && (
            <>
              <Leg x={-60} y1={-140} y2={-560} w={14} />
              <Leg x={120} y1={-140} y2={-480} w={12} />
              <path d={`M -56 -540 Q ${60 + Math.sin(t * 3) * 8} -440 -56 -300 Z`} {...s("#f4ecd0")} />
              <path d={`M 124 -460 Q ${210 + Math.sin(t * 3) * 8} -380 124 -260 Z`} {...s("#f4ecd0")} />
              <path d="M -60 -560 L -10 -580 L -60 -600 Z" {...s(o.label ? "#1d1d24" : "#d8342c", 3)} />
            </>
          )}
          {!big && <><Leg x={0} y1={-70} y2={-260} w={8} /><path d="M 4 -250 L 110 -90 L 4 -90 Z" {...s("#f4ecd0")} /></>}
        </g>
      );
    }
    case "plane":
      return (
        <g transform="translate(0 -100)">
          <path d="M -200 0 Q -200 -40 -140 -40 L 160 -40 Q 220 -30 220 0 Q 200 30 160 30 L -140 30 Q -200 30 -200 0 Z" {...s(c ?? "#e8eaee")} />
          <path d="M -20 -10 L -100 -120 L -50 -120 L 60 -10 Z M -20 20 L -100 110 L -50 110 L 60 20 Z" {...s(shade(c ?? "#e8eaee", -0.12))} />
          <path d="M -190 -10 L -230 -90 L -170 -90 L -140 -30 Z" {...s("#d8342c")} />
          {[-80, -40, 0, 40, 80].map((x) => <circle key={x} cx={x} cy={-12} r={9} fill="#7fd0ff" stroke={INK} strokeWidth={3} />)}
        </g>
      );
    case "balloon":
      return (
        <g>
          <path d={`M 0 0 Q 20 -60 ${Math.sin(t * 2) * 10} -140`} {...ln(3)} />
          <ellipse cx={Math.sin(t * 2) * 10} cy={-210} rx={56} ry={70} {...s(c ?? "#e3342c")} />
          <ellipse cx={Math.sin(t * 2) * 10 - 20} cy={-236} rx={12} ry={18} fill="rgba(255,255,255,0.5)" />
        </g>
      );
    case "bomb":
      return (
        <g>
          <circle cx={0} cy={-80} r={80} {...s("#2a2d36")} />
          <rect x={30} y={-180} width={40} height={30} rx={4} transform="rotate(30 50 -165)" {...s("#5a606a")} />
          <path d="M 64 -180 Q 90 -220 120 -210" {...ln(5)} />
          <circle cx={122} cy={-212} r={10 + Math.sin(t * 30) * 4} fill="#ffb02e" />
          <circle cx={-30} cy={-110} r={16} fill="rgba(255,255,255,0.3)" />
        </g>
      );
    case "dynamite":
      return (
        <g>
          {[-34, 0, 34].map((x) => <rect key={x} x={x - 16} y={-150} width={32} height={150} rx={6} {...s("#d8342c")} />)}
          <path d="M 0 -150 Q 10 -190 40 -196" {...ln(4)} />
          <circle cx={42} cy={-198} r={9 + Math.sin(t * 30) * 4} fill="#ffb02e" />
        </g>
      );
    case "fire":
    case "campfire": {
      const fl = (k: number) => Math.sin(t * 12 + k) * 10;
      return (
        <g>
          {type === "campfire" && <path d="M -80 -10 L 80 -40 M -80 -40 L 80 -10" {...ln(18, "#7a4a2a")} />}
          <path d={`M -70 -20 Q -90 ${-110 + fl(1)} -30 ${-160 + fl(2)} Q -20 -100 0 ${-200 + fl(3)} Q 30 -110 40 ${-150 + fl(4)} Q 90 -90 70 -20 Z`} fill="#ff7a1a" stroke={INK} strokeWidth={4} />
          <path d={`M -40 -20 Q -40 ${-80 + fl(5)} -10 ${-110 + fl(6)} Q 10 -70 20 ${-100 + fl(7)} Q 50 -60 40 -20 Z`} fill="#ffd23a" />
        </g>
      );
    }
    case "tree":
    case "pinetree":
    case "palm":
      return <Tree kind={type} c={c} />;
    case "wheat":
      return (
        <g>
          <path d="M -42 0 Q -38 -130 -52 -250" {...ln(6, "#c9a24a")} />
          <path d="M -20 0 Q -14 -150 -24 -292" {...ln(6, "#c9a24a")} />
          <path d="M 2 0 Q 4 -160 10 -318" {...ln(6, "#c9a24a")} />
          <path d="M 24 0 Q 30 -145 40 -278" {...ln(6, "#c9a24a")} />
          <path d="M 44 0 Q 52 -125 62 -242" {...ln(6, "#c9a24a")} />
          <ellipse cx={-53} cy={-282} rx={12} ry={34} transform="rotate(-8 -53 -282)" {...s("#e8c25a", 3)} />
          <ellipse cx={-24} cy={-324} rx={13} ry={38} transform="rotate(-3 -24 -324)" {...s("#e8c25a", 3)} />
          <ellipse cx={10} cy={-352} rx={14} ry={40} transform="rotate(3 10 -352)" {...s("#f0cd68", 3)} />
          <ellipse cx={41} cy={-310} rx={13} ry={37} transform="rotate(6 41 -310)" {...s("#e8c25a", 3)} />
          <ellipse cx={63} cy={-272} rx={12} ry={34} transform="rotate(10 63 -272)" {...s("#dcb44e", 3)} />
          <path d="M -53 -314 L -63 -342 M -53 -314 L -44 -340" {...ln(2.5, "#d8b45a")} />
          <path d="M -24 -360 L -34 -388 M -24 -360 L -14 -386" {...ln(2.5, "#d8b45a")} />
          <path d="M 10 -390 L 2 -420 M 10 -390 L 20 -418" {...ln(2.5, "#d8b45a")} />
          <path d="M 41 -345 L 33 -373 M 41 -345 L 51 -371" {...ln(2.5, "#d8b45a")} />
          <path d="M 63 -304 L 55 -332 M 63 -304 L 73 -330" {...ln(2.5, "#d8b45a")} />
          <path d="M -38 -128 Q 8 -104 54 -118" {...ln(9, "#a53a2c")} />
          <path d="M 8 -118 L -4 -70 M 8 -118 L 26 -64" {...ln(7, "#a53a2c")} />
        </g>
      );
    case "cactus":
      return (
        <g {...s(c ?? "#4f9a4a")}>
          <rect x={-26} y={-260} width={52} height={260} rx={26} />
          <path d="M -26 -120 L -70 -120 Q -84 -120 -84 -140 L -84 -200 Q -84 -214 -70 -214 Q -56 -214 -56 -200 L -56 -150 L -26 -150 Z" />
          <path d="M 26 -150 L 70 -150 Q 84 -150 84 -170 L 84 -220 Q 84 -234 70 -234 Q 56 -234 56 -220 L 56 -180 L 26 -180 Z" />
        </g>
      );
    case "rock":
    case "moonrock":
      return <path d="M -100 0 Q -110 -60 -60 -90 Q -10 -130 50 -100 Q 110 -70 100 0 Z" {...s(c ?? (type === "moonrock" ? "#b8b8c0" : "#8a8f96"))} />;
    case "house": {
      const k = c ?? "#e8c48a";
      return (
        <g>
          <rect x={-150} y={-220} width={300} height={220} {...s(k)} />
          <path d="M -180 -210 L 0 -360 L 180 -210 Z" {...s("#b8473a")} />
          <rect x={-40} y={-120} width={80} height={120} {...s("#8a5a32")} />
          <rect x={-120} y={-170} width={60} height={60} fill="#ffe7a0" stroke={INK} strokeWidth={4} />
          <rect x={60} y={-170} width={60} height={60} fill="#ffe7a0" stroke={INK} strokeWidth={4} />
        </g>
      );
    }
    case "building":
    case "tower": {
      const k = c ?? "#9fb0c8";
      const h = type === "tower" ? 900 : 600;
      const w = type === "tower" ? 200 : 300;
      return (
        <g>
          <rect x={-w / 2} y={-h} width={w} height={h} {...s(k)} />
          {Array.from({ length: Math.floor(h / 90) }).map((_, r) =>
            Array.from({ length: Math.floor(w / 70) }).map((__, cI) => (
              <rect key={`${r}-${cI}`} x={-w / 2 + 22 + cI * 70} y={-h + 30 + r * 90} width={40} height={54} fill={hashStr(o.seed + "w" + r + cI) > 0.6 ? "#ffe7a0" : "#5a7090"} stroke={INK} strokeWidth={3} />
            )),
          )}
          <Label x={0} y={-h + 20} text={o.label} size={30} color="#fff" stroke={INK} w={w - 20} />
        </g>
      );
    }
    case "fence":
      return (
        <g>
          {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M ${-250 + i * 100} 0 L ${-250 + i * 100} -150 L ${-235 + i * 100} -170 L ${-220 + i * 100} -150 L ${-220 + i * 100} 0 Z`} {...s(c ?? "#f4f0e4")} />)}
          <rect x={-270} y={-120} width={540} height={18} {...s(c ?? "#f4f0e4")} />
          <rect x={-270} y={-60} width={540} height={18} {...s(c ?? "#f4f0e4")} />
        </g>
      );
    case "ladder":
      return (
        <g>
          <path d="M -50 0 L -36 -460 M 50 0 L 36 -460" {...ln(14, c ?? "#b98a5a")} />
          {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={-46 + i * 1.5} y1={-30 - i * 56} x2={46 - i * 1.5} y2={-30 - i * 56} {...ln(10, c ?? "#b98a5a")} />)}
        </g>
      );
    case "rope":
      return <path d={`M 0 -500 Q ${20 + Math.sin(t * 2) * 20} -250 0 0`} {...ln(10, c ?? "#c9a46a")} strokeDasharray="14 4" />;
    case "chain":
      return <g>{Array.from({ length: 10 }).map((_, i) => <ellipse key={i} cx={0} cy={-20 - i * 34} rx={i % 2 ? 6 : 14} ry={20} fill="none" stroke={c ?? "#8a929e"} strokeWidth={8} />)}</g>;
    case "cage":
    case "bars":
      return (
        <g>
          {type === "cage" && <path d="M -140 -360 Q 0 -440 140 -360" {...ln(12)} />}
          {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={-140 + i * 40} y1={type === "cage" ? -360 + Math.sin((i / 7) * Math.PI) * -40 : -400} x2={-140 + i * 40} y2={0} {...ln(10, c ?? "#5a606a")} />)}
          <rect x={-150} y={-12} width={300} height={16} {...s(c ?? "#5a606a")} />
          {type === "bars" && <rect x={-150} y={-410} width={300} height={16} {...s(c ?? "#5a606a")} />}
        </g>
      );
    case "glasscase":
      return (
        <g>
          <path d="M -90 0 L -90 -200 Q -90 -260 0 -260 Q 90 -260 90 -200 L 90 0 Z" fill="rgba(200,235,255,0.25)" stroke={INK} strokeWidth={5} />
          <path d="M -60 -200 L -60 -40 M -40 -230 Q -10 -246 20 -240" {...ln(8, "rgba(255,255,255,0.7)")} />
        </g>
      );
    case "pedestal":
      return (
        <g>
          <rect x={-90} y={-30} width={180} height={30} {...s(c ?? "#c9ced6")} />
          <rect x={-60} y={-190} width={120} height={160} {...s(c ?? "#dfe3e8")} />
          <rect x={-80} y={-210} width={160} height={24} {...s(c ?? "#c9ced6")} />
          <Label x={0} y={-110} text={o.label} size={24} w={110} />
        </g>
      );
    case "statue":
      return (
        <g>
          <rect x={-100} y={-120} width={200} height={120} {...s("#8a8f96")} />
          <g transform="translate(0 -120) scale(0.95)" fill={c ?? "#b8864a"}>
            <rect x={-40} y={-260} width={80} height={150} rx={40} {...s(c ?? "#b8864a")} />
            <circle cx={0} cy={-310} r={56} {...s(c ?? "#b8864a")} />
            <path d="M -30 -110 L -30 0 M 30 -110 L 30 0 M 40 -230 L 90 -320" {...ln(12)} />
          </g>
          <Label x={0} y={-60} text={o.label} size={22} color="#f4f4f2" w={180} />
        </g>
      );
    case "gun":
      return (
        <g transform="translate(0 -40)">
          <path d="M -40 -20 L 70 -20 L 70 0 L 0 0 L -10 40 L -40 40 Z" {...s(c ?? "#6a6f78")} />
          <circle cx={-6} cy={-6} r={10} fill="#4a4f58" stroke={INK} strokeWidth={3} />
        </g>
      );
    case "machinegun":
      return (
        <g transform="translate(0 -60)">
          <path d="M -150 18 L -110 -22 L -72 -14 L -80 30 L -126 40 Z" {...s("#7a5230")} />
          <rect x={-84} y={-36} width={144} height={50} rx={8} {...s(c ?? "#5f666f")} />
          <rect x={-80} y={-27} width={116} height={8} rx={4} fill={shade(c ?? "#5f666f", 0.22)} />
          <circle cx={-16} cy={-58} r={38} {...s("#3f454d")} />
          <circle cx={-16} cy={-58} r={22} fill="none" stroke="#9aa1aa" strokeWidth={4} />
          <rect x={58} y={-28} width={160} height={18} rx={7} {...s("#33383f")} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={82 + i * 18} y={-32} width={7} height={26} rx={3} fill="#4a5058" />)}
          <rect x={-26} y={8} width={22} height={54} rx={7} {...s("#4a3a2a")} />
          <path d="M 122 -10 L 96 62 M 122 -10 L 154 62" {...ln(7, "#33383f")} />
        </g>
      );
    case "sword":
      return (
        <g>
          <path d="M -10 -60 L -10 -300 L 0 -330 L 10 -300 L 10 -60 Z" {...s("#d6dbe3")} />
          <rect x={-46} y={-66} width={92} height={16} rx={6} {...s("#f2c230")} />
          <rect x={-8} y={-50} width={16} height={50} rx={4} {...s("#7a4a2a")} />
        </g>
      );
    case "shield":
      return <path d="M -80 -200 L 80 -200 L 80 -100 Q 80 -30 0 0 Q -80 -30 -80 -100 Z" {...s(c ?? "#2a6fd6")} />;
    case "skull":
      return (
        <g transform="translate(0 -70)">
          <path d="M -60 0 Q -70 -70 0 -70 Q 70 -70 60 0 L 40 10 L 40 40 L -40 40 L -40 10 Z" {...s("#f4f0e4")} />
          <circle cx={-24} cy={-10} r={16} fill={INK} /><circle cx={24} cy={-10} r={16} fill={INK} />
        </g>
      );
    case "heart":
      return <path d="M 0 0 C -120 -70 -90 -170 -40 -170 C -16 -170 0 -150 0 -130 C 0 -150 16 -170 40 -170 C 90 -170 120 -70 0 0 Z" {...s(c ?? "#e3342c")} />;
    case "star":
      return <Star x={0} y={-90} r={90} fill={c ?? "#f2c230"} />;
    case "dice":
      return (
        <g>
          <rect x={-60} y={-120} width={120} height={120} rx={18} {...s(c ?? "#ffffff")} />
          {[[-30, -90], [30, -30], [0, -60]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill={INK} />)}
        </g>
      );
    case "cards":
      return (
        <g>
          {[-20, 0, 20].map((r, i) => (
            <g key={i} transform={`rotate(${r} 0 0)`}>
              <rect x={-50} y={-160} width={100} height={140} rx={8} {...s("#ffffff", 4)} />
              <Label x={0} y={-90} text={["A", "K", "Q"][i]} size={44} color={i === 1 ? "#d8342c" : INK} />
            </g>
          ))}
        </g>
      );
    case "syringe":
      return (
        <g transform="rotate(-30)">
          <rect x={-18} y={-180} width={36} height={130} rx={4} {...s("rgba(220,240,255,0.9)")} />
          <rect x={-16} y={-120} width={32} height={68} fill={c ?? "#4fd07a"} />
          <path d="M 0 -50 L 0 0 M -30 -186 L 30 -186 M 0 -186 L 0 -230 M -20 -230 L 20 -230" {...ln(6)} />
        </g>
      );
    case "pill":
      return (
        <g transform="rotate(-30) translate(0 -40)">
          <rect x={-60} y={-26} width={120} height={52} rx={26} {...s("#ffffff")} />
          <path d="M 0 -26 L 34 -26 Q 60 -26 60 0 Q 60 26 34 26 L 0 26 Z" {...s(c ?? "#e3342c")} />
        </g>
      );
    case "atom":
      return (
        <g transform={`translate(0 -130) rotate(${t * 40})`}>
          {[0, 60, 120].map((a) => <ellipse key={a} rx={120} ry={40} transform={`rotate(${a})`} fill="none" stroke={c ?? "#4fb3e8"} strokeWidth={8} />)}
          <circle r={22} {...s("#e3342c")} />
        </g>
      );
    case "magnet":
      return (
        <g transform="translate(0 -20)">
          <path d="M -80 0 L -80 -100 Q -80 -190 0 -190 Q 80 -190 80 -100 L 80 0 L 40 0 L 40 -100 Q 40 -150 0 -150 Q -40 -150 -40 -100 L -40 0 Z" {...s(c ?? "#e3342c")} />
          <rect x={-80} y={-30} width={40} height={30} fill="#d6dbe3" stroke={INK} strokeWidth={4} />
          <rect x={40} y={-30} width={40} height={30} fill="#d6dbe3" stroke={INK} strokeWidth={4} />
        </g>
      );
    case "battery":
      return (
        <g>
          <rect x={-50} y={-180} width={100} height={180} rx={10} {...s("#2a2d36")} />
          <rect x={-20} y={-196} width={40} height={18} rx={4} {...s("#a9b1bc")} />
          <rect x={-38} y={-80} width={76} height={68} rx={4} fill={c ?? "#4fd07a"} />
        </g>
      );
    case "satellite":
      return (
        <g transform={`translate(0 -100) rotate(${Math.sin(t) * 6})`}>
          <rect x={-40} y={-40} width={80} height={80} rx={6} {...s("#d6dbe3")} />
          <rect x={-190} y={-26} width={130} height={52} {...s("#2a5bb8")} />
          <rect x={60} y={-26} width={130} height={52} {...s("#2a5bb8")} />
        </g>
      );
    case "ufo":
      return (
        <g transform={`translate(0 ${-120 + Math.sin(t * 3) * 10})`}>
          <ellipse cx={0} cy={-40} rx={70} ry={56} fill="rgba(170,230,255,0.7)" stroke={INK} strokeWidth={5} />
          <ellipse cx={0} cy={0} rx={170} ry={44} {...s(c ?? "#a9b1bc")} />
          {[-110, -50, 10, 70, 130].map((x, i) => <circle key={x} cx={x - 10} cy={6} r={9} fill={Math.floor(t * 6 + i) % 2 ? "#ffe76a" : "#ff5a5a"} />)}
        </g>
      );
    case "piggybank":
      return (
        <g>
          <Leg x={-50} y1={-40} y2={0} w={18} /><Leg x={50} y1={-40} y2={0} w={18} />
          <ellipse cx={0} cy={-100} rx={110} ry={80} {...s(c ?? "#f79ab4")} />
          <ellipse cx={110} cy={-100} rx={20} ry={26} {...s(shade(c ?? "#f79ab4", -0.08))} />
          <path d="M 40 -170 L 60 -210 L 80 -164 Z" {...s(c ?? "#f79ab4")} />
          <circle cx={70} cy={-120} r={7} fill={INK} />
          <rect x={-30} y={-180} width={50} height={8} rx={4} fill={INK} />
          <ellipse cx={-40} cy={-130} rx={30} ry={14} fill="rgba(255,255,255,0.45)" />
        </g>
      );
    case "safe":
    case "vault": {
      const big = type === "vault";
      const S2 = big ? 1.8 : 1;
      return (
        <g transform={`scale(${S2})`}>
          <rect x={-100} y={-200} width={200} height={200} rx={12} {...s(c ?? "#6a7480")} />
          <circle cx={0} cy={-100} r={58} {...s("#a9b1bc")} />
          <g transform={`translate(0 -100) rotate(${t * 30})`}>
            {[0, 60, 120].map((a) => <line key={a} x1={-44} y1={0} x2={44} y2={0} transform={`rotate(${a})`} {...ln(8)} />)}
            <circle r={14} {...s("#6a7480", 4)} />
          </g>
        </g>
      );
    }
    case "wheel":
    case "steeringwheel":
      return (
        <g transform={`translate(0 -130) rotate(${t * 20})`}>
          <circle r={110} fill="none" stroke={c ?? "#8a5a32"} strokeWidth={22} />
          <circle r={110} fill="none" stroke={INK} strokeWidth={4} />
          {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 4) * 150} y2={Math.sin((i * Math.PI) / 4) * 150} {...ln(12, c ?? "#8a5a32")} />)}
          <circle r={26} {...s(c ?? "#8a5a32")} />
        </g>
      );
    case "gear":
      return (
        <g transform={`translate(0 -120) rotate(${t * 40})`}>
          {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={-16} y={-122} width={32} height={40} transform={`rotate(${i * 36})`} {...s(c ?? "#a9b1bc", 4)} />)}
          <circle r={96} {...s(c ?? "#a9b1bc")} />
          <circle r={30} fill="#5a606a" stroke={INK} strokeWidth={4} />
        </g>
      );
    case "pipe":
      return (
        <g>
          <rect x={-40} y={-500} width={80} height={500} {...s(c ?? "#8a929e")} />
          {[-480, -250, -30].map((y) => <rect key={y} x={-54} y={y} width={108} height={30} rx={4} {...s(shade(c ?? "#8a929e", -0.1))} />)}
        </g>
      );
    case "rail":
      return (
        <g>
          {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={-260 + i * 100} y={-24} width={50} height={24} {...s("#7a4a2a", 3)} />)}
          <rect x={-300} y={-40} width={600} height={14} {...s(c ?? "#9aa3ae", 3)} />
        </g>
      );
    case "bench":
      return (
        <g>
          <Leg x={-150} y1={-80} y2={0} w={12} /><Leg x={150} y1={-80} y2={0} w={12} />
          <rect x={-180} y={-96} width={360} height={22} rx={6} {...s(c ?? "#a9b1bc")} />
        </g>
      );
    case "mat":
    case "rug":
      return <ellipse cx={0} cy={-6} rx={200} ry={40} {...s(c ?? "#c9673a")} />;
    case "tent":
      return (
        <g>
          <path d="M -180 0 L 0 -260 L 180 0 Z" {...s(c ?? "#e8a23a")} />
          <path d="M -40 0 L 0 -150 L 40 0 Z" fill={INK} />
        </g>
      );
    case "anchor":
      return (
        <g {...ln(14, c ?? "#5a606a")}>
          <circle cx={0} cy={-260} r={24} />
          <path d="M 0 -236 L 0 -30 M -50 -190 L 50 -190 M -110 -100 Q -90 -10 0 -20 Q 90 -10 110 -100" />
        </g>
      );
    case "cannon":
      return (
        <g>
          <path d="M -120 -140 L 100 -190 L 112 -130 L -100 -90 Z" {...s(c ?? "#3a3f4a")} />
          <circle cx={-30} cy={-50} r={50} {...s("#8a5a32")} />
          <circle cx={-30} cy={-50} r={14} fill={INK} />
        </g>
      );
    case "horse":
    case "dog":
    case "cat":
    case "cow":
    case "pig":
    case "rat":
      return <Animal kind={type} c={c ?? { horse: "#a0643a", dog: "#d9a066", cat: "#f0a040", cow: "#ffffff", pig: "#f7a8c0", rat: "#a9a9b4" }[type]} t={t} />;
    case "bird":
      return (
        <g transform={`translate(0 -40)`}>
          <ellipse cx={0} cy={0} rx={40} ry={30} {...s(c ?? "#4fb3e8")} />
          <circle cx={30} cy={-24} r={20} {...s(c ?? "#4fb3e8")} />
          <path d="M 48 -26 L 70 -20 L 48 -14 Z" {...s("#f2c230", 3)} />
          <circle cx={34} cy={-28} r={4} fill={INK} />
          <path d={`M -10 -10 Q -30 ${-50 + Math.sin(t * 20) * 20} -50 -20`} {...s(shade(c ?? "#4fb3e8", -0.15), 4)} />
        </g>
      );
    case "fish":
      return (
        <g transform={`translate(0 -50) rotate(${Math.sin(t * 6) * 8})`}>
          <ellipse cx={0} cy={0} rx={70} ry={40} {...s(c ?? "#ff8a2a")} />
          <path d="M -60 0 L -110 -40 L -110 40 Z" {...s(c ?? "#ff8a2a")} />
          <circle cx={36} cy={-8} r={7} fill={INK} />
        </g>
      );
    case "monalisa":
      return (
        <g>
          <rect x={-55} y={-160} width={110} height={160} rx={8} {...s(c ?? "#d4af37", 5)} />
          <rect x={-46} y={-151} width={92} height={142} rx={4} fill="#8a7020" stroke={INK} strokeWidth={3} />
          <rect x={-40} y={-145} width={80} height={130} fill="#1d241c" />
          <path d="M -40 -65 Q -20 -95 0 -85 Q 20 -75 40 -90 L 40 -15 L -40 -15 Z" fill="#3a4a35" />
          <path d="M -32 -15 Q -26 -85 0 -90 Q 26 -85 32 -15 Z" {...s("#2b3325", 3.5)} />
          <path d="M -16 -88 Q 0 -70 16 -88" fill="#e8cbb0" stroke={INK} strokeWidth={3} />
          <ellipse cx={0} cy={-102} rx={18} ry={22} {...s("#ebd0b5", 3)} />
          <path d="M -22 -114 Q 0 -130 22 -114 Q 24 -90 20 -60 Q 15 -78 12 -92 Q -12 -92 -15 -78 Q -20 -90 -22 -114 Z" fill="#181310" stroke={INK} strokeWidth={3} />
          <path d="M -20 -118 Q 0 -126 20 -118" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={4} />
          <circle cx={-6} cy={-106} r={2.5} fill={INK} />
          <circle cx={6} cy={-106} r={2.5} fill={INK} />
          <path d="M 0 -105 L -1 -98 L 1 -97" fill="none" stroke="#ba9578" strokeWidth={2} strokeLinecap="round" />
          <path d="M -7 -92 Q 0 -89 7 -93" fill="none" stroke="#8a4035" strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx={0} cy={-30} rx={18} ry={9} {...s("#ebd0b5", 3)} />
        </g>
      );
    case "broom":
      return (
        <g>
          <line x1={0} y1={0} x2={0} y2={-240} stroke={c ?? "#8b5a2b"} strokeWidth={10} strokeLinecap="round" />
          <line x1={0} y1={0} x2={0} y2={-240} stroke={INK} strokeWidth={2} strokeLinecap="round" />
          <path d="M -28 0 L -18 -80 L 18 -80 L 28 0 Z" {...s("#d4ad3b", 4)} />
          <line x1={-12} y1={0} x2={-8} y2={-75} stroke="#a07a1b" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={0} y1={0} x2={0} y2={-75} stroke="#a07a1b" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={12} y1={0} x2={8} y2={-75} stroke="#a07a1b" strokeWidth={2.5} strokeLinecap="round" />
          <rect x={-20} y={-68} width={40} height={12} rx={3} {...s("#b23326", 3)} />
        </g>
      );
    case "trunk":
      return (
        <g>
          <rect x={-90} y={-110} width={180} height={110} rx={10} {...s(c ?? "#5a3a1f", 4.5)} />
          <line x1={-90} y1={-55} x2={90} y2={-55} stroke={INK} strokeWidth={3} />
          <rect x={-88} y={-108} width={24} height={24} rx={3} fill="#d4af37" stroke={INK} strokeWidth={2} />
          <rect x={64} y={-108} width={24} height={24} rx={3} fill="#d4af37" stroke={INK} strokeWidth={2} />
          <rect x={-88} y={-26} width={24} height={24} rx={3} fill="#d4af37" stroke={INK} strokeWidth={2} />
          <rect x={64} y={-26} width={24} height={24} rx={3} fill="#d4af37" stroke={INK} strokeWidth={2} />
          <rect x={-50} y={-110} width={16} height={110} {...s("#3b2210", 3)} />
          <rect x={34} y={-110} width={16} height={110} {...s("#3b2210", 3)} />
          <rect x={-52} y={-62} width={20} height={14} rx={2} fill="#d4af37" stroke={INK} strokeWidth={2} />
          <rect x={32} y={-62} width={20} height={14} rx={2} fill="#d4af37" stroke={INK} strokeWidth={2} />
          <rect x={-14} y={-65} width={28} height={22} rx={4} fill="#d4af37" stroke={INK} strokeWidth={3} />
          <circle cx={0} cy={-54} r={3} fill={INK} />
          <path d="M -24 -24 Q 0 -38 24 -24" fill="none" stroke="#2a180b" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
  }
  return (
    <g>
      <rect x={-60} y={-120} width={120} height={120} rx={10} {...s(c ?? "#c9ced6")} />
      <Label x={0} y={-60} text={o.label ?? type} size={22} w={110} />
    </g>
  );
};

// how big a prop looks when held in a hand (relative scale) and its anchor offset
export const HELD: Partial<Record<PropType, { s: number; dy: number }>> = {
  phone: { s: 0.55, dy: 40 }, card: { s: 0.6, dy: 50 }, ticket: { s: 0.6, dy: 50 }, paper: { s: 0.55, dy: 60 },
  letter: { s: 0.55, dy: 60 }, coin: { s: 0.6, dy: 20 }, money: { s: 0.8, dy: 30 }, cup: { s: 0.6, dy: 30 },
  mug: { s: 0.6, dy: 30 }, hammer: { s: 0.75, dy: 90 }, wrench: { s: 0.7, dy: 80 }, stopwatch: { s: 0.5, dy: 40 },
  magnifier: { s: 0.65, dy: 60 }, book: { s: 0.9, dy: 10 }, key: { s: 0.6, dy: 20 }, bottle: { s: 0.55, dy: 50 },
  potion: { s: 0.5, dy: 50 }, flask: { s: 0.5, dy: 50 }, gun: { s: 0.7, dy: 30 }, machinegun: { s: 0.5, dy: 40 }, sword: { s: 0.7, dy: 50 },
  microphone: { s: 0.6, dy: 70 }, megaphone: { s: 0.7, dy: 10 }, box: { s: 0.7, dy: 50 }, crate: { s: 0.7, dy: 50 },
  bag: { s: 0.6, dy: 60 }, moneybag: { s: 0.6, dy: 60 }, lightbulb: { s: 0.5, dy: 60 }, pencil: { s: 0.55, dy: 60 },
  flag: { s: 0.6, dy: 120 }, sign: { s: 0.5, dy: 150 }, bucket: { s: 0.6, dy: 40 }, paintcan: { s: 0.6, dy: 40 },
  trophy: { s: 0.6, dy: 50 }, camera: { s: 0.55, dy: 30 }, pizza: { s: 0.6, dy: 20 }, cake: { s: 0.6, dy: 40 },
  bomb: { s: 0.45, dy: 50 }, dynamite: { s: 0.5, dy: 60 }, syringe: { s: 0.5, dy: 60 }, pill: { s: 0.5, dy: 20 },
  calendar: { s: 0.5, dy: 50 }, clock: { s: 0.5, dy: 50 }, piggybank: { s: 0.55, dy: 60 }, gem: { s: 0.6, dy: 40 },
  cards: { s: 0.5, dy: 40 }, dice: { s: 0.5, dy: 30 }, laptop: { s: 0.6, dy: 30 }, plate: { s: 0.6, dy: 20 },
  food: { s: 0.6, dy: 20 }, balloon: { s: 0.7, dy: 0 }, rope: { s: 0.4, dy: 100 }, chain: { s: 0.4, dy: 60 },
  fish: { s: 0.6, dy: 30 }, bird: { s: 0.6, dy: 20 }, lock: { s: 0.5, dy: 40 }, battery: { s: 0.5, dy: 60 },
  shield: { s: 0.6, dy: 80 }, skull: { s: 0.5, dy: 50 }, heart: { s: 0.5, dy: 50 }, star: { s: 0.4, dy: 50 },
  wheat: { s: 0.5, dy: 20 },
  monalisa: { s: 0.65, dy: 30 }, broom: { s: 0.75, dy: 90 }, trunk: { s: 0.7, dy: 50 },
};
export { mix };
