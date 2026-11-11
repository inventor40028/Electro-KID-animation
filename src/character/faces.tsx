import React from "react";
import { INK } from "../theme";
import type { EXPRESSIONS } from "../catalog";

export type Expression = (typeof EXPRESSIONS)[number];

// Head-local coordinates: (0,0) is the head center, radius R = 68.
// `look` shifts features horizontally (-1 left .. 1 right).
type FaceProps = {
  expression: Expression;
  blink: number; // eyelid fraction 0..1 during a blink (old-folder style)
  talk: number; // 0 closed .. 1 open
  look: number;
  t: number; // seconds (for small wobbles)
};

const BW = 7.5; // brow stroke width

const Brow: React.FC<{ x: number; y: number; angle: number; len?: number; flip?: boolean }> = ({ x, y, angle, len = 24 }) => {
  const a = (angle * Math.PI) / 180;
  const dx = (Math.cos(a) * len) / 2, dy = (Math.sin(a) * len) / 2;
  return <line x1={x - dx} y1={y - dy} x2={x + dx} y2={y + dy} stroke={INK} strokeWidth={BW} strokeLinecap="round" />;
};

const Dot: React.FC<{ x: number; y: number; rx?: number; ry?: number }> = ({ x, y, rx = 6.5, ry = 9 }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={INK} />
);

// eye with an eyelid closing the top `lid` fraction (0..1)
const LidEye: React.FC<{ x: number; y: number; lid: number; tilt?: number }> = ({ x, y, lid, tilt = 0 }) => {
  const rx = 7, ry = 9.5;
  const cut = y - ry + lid * ry * 2;
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <clipPath id={`lid${Math.round(x)}${Math.round(y)}${Math.round(lid * 10)}`}>
        <rect x={x - 20} y={cut} width={40} height={40} />
      </clipPath>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={INK} clipPath={`url(#lid${Math.round(x)}${Math.round(y)}${Math.round(lid * 10)})`} />
      <line x1={x - 11} y1={cut} x2={x + 11} y2={cut} stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

const RoundEye: React.FC<{ x: number; y: number; r?: number; p?: number; px?: number; py?: number }> = ({ x, y, r = 15, p = 5.5, px = 0, py = 0 }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#fff" stroke={INK} strokeWidth={4.5} />
    <circle cx={x + px} cy={y + py} r={p} fill={INK} />
  </g>
);

const ClosedArc: React.FC<{ x: number; y: number; up?: boolean; w?: number }> = ({ x, y, up = true, w = 12 }) => (
  <path
    d={up ? `M ${x - w} ${y + 3} Q ${x} ${y - 10} ${x + w} ${y + 3}` : `M ${x - w} ${y - 3} Q ${x} ${y + 9} ${x + w} ${y - 3}`}
    stroke={INK}
    strokeWidth={5.5}
    fill="none"
    strokeLinecap="round"
  />
);

const Teeth: React.FC<{ x: number; y: number; w: number; h: number; rows?: number }> = ({ x, y, w, h, rows = 2 }) => {
  const cols = Math.max(3, Math.round(w / 9));
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h * 0.45} fill="#fff" stroke={INK} strokeWidth={4} />
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <line key={i} x1={x - w / 2 + ((i + 1) * w) / cols} y1={y - h / 2 + 2} x2={x - w / 2 + ((i + 1) * w) / cols} y2={y + h / 2 - 2} stroke={INK} strokeWidth={2.5} />
      ))}
      {rows === 2 && <line x1={x - w / 2 + 3} y1={y} x2={x + w / 2 - 3} y2={y} stroke={INK} strokeWidth={2.5} />}
    </g>
  );
};

const OpenMouth: React.FC<{ x: number; y: number; w: number; h: number; tongue?: boolean; shape?: "d" | "o" | "shout" }> = ({ x, y, w, h, tongue = true, shape = "d" }) => {
  let d: string;
  if (shape === "o") d = `M ${x} ${y - h / 2} C ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y + h / 2} ${x} ${y + h / 2} C ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y - h / 2} ${x} ${y - h / 2} Z`;
  else if (shape === "shout") d = `M ${x - w / 2} ${y - h / 2} L ${x + w / 2} ${y - h / 2} Q ${x + w / 2.6} ${y + h / 2} ${x} ${y + h / 2} Q ${x - w / 2.6} ${y + h / 2} ${x - w / 2} ${y - h / 2} Z`;
  else d = `M ${x - w / 2} ${y - h / 2} Q ${x} ${y - h / 2 + 3} ${x + w / 2} ${y - h / 2} Q ${x + w / 2} ${y + h / 2} ${x} ${y + h / 2} Q ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y - h / 2} Z`;
  const id = `m${Math.round(x)}${Math.round(y)}${Math.round(w)}${Math.round(h)}${shape}`;
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill="#5a1f1a" />
      {tongue && <ellipse cx={x} cy={y + h * 0.42} rx={w * 0.32} ry={h * 0.3} fill="#e0605a" clipPath={`url(#${id})`} />}
      {shape !== "o" && h > 10 && <rect x={x - w / 2} y={y - h / 2} width={w} height={Math.min(7, h * 0.25)} fill="#fff" clipPath={`url(#${id})`} />}
      <path d={d} fill="none" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    </g>
  );
};

const Line: React.FC<{ d: string; w?: number }> = ({ d, w = 5.5 }) => (
  <path d={d} stroke={INK} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
);

export const Face: React.FC<FaceProps> = ({ expression, blink, talk, look, t }) => {
  const ox = look * 16;
  const ex = 23; // eye half-spacing
  const ey = 2;
  const my = 30;
  const L = ox - ex, Rr = ox + ex;
  const wob = Math.sin(t * 40) * 1.2;

  // eyes -------------------------------------------------------------------
  let eyes: React.ReactNode;
  let brows: React.ReactNode;
  let mouth: React.ReactNode;
  let extra: React.ReactNode = null;

  const dots = (
    <>
      <Dot x={L} y={ey} />
      <Dot x={Rr} y={ey} />
    </>
  );
  const blinkEyes = (
    <>
      <Line d={`M ${L - 8} ${ey + 2} Q ${L} ${ey + 6} ${L + 8} ${ey + 2}`} />
      <Line d={`M ${Rr - 8} ${ey + 2} Q ${Rr} ${ey + 6} ${Rr + 8} ${ey + 2}`} />
    </>
  );

  // talking mouth overrides the closed mouth for "talky" expressions
  const talkMouth = (w = 20) =>
    talk > 0.15 ? <OpenMouth x={ox} y={my + 2} w={w} h={6 + talk * 16} tongue={talk > 0.5} /> : null;

  switch (expression) {
    case "smug":
      eyes = (
        <>
          <LidEye x={L} y={ey} lid={0.45} />
          <LidEye x={Rr} y={ey} lid={0.45} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-26} angle={8} />
          <Brow x={Rr} y={-30} angle={-12} />
        </>
      );
      mouth = talkMouth() ?? <Line d={`M ${ox - 10} ${my + 2} Q ${ox + 4} ${my + 8} ${ox + 14} ${my - 4}`} />;
      break;
    case "happy":
      eyes = (
        <>
          <ClosedArc x={L} y={ey} />
          <ClosedArc x={Rr} y={ey} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-28} angle={-10} />
          <Brow x={Rr} y={-28} angle={10} />
        </>
      );
      mouth = talkMouth(24) ?? <Line d={`M ${ox - 16} ${my - 2} Q ${ox} ${my + 14} ${ox + 16} ${my - 2}`} />;
      break;
    case "laugh":
      eyes = (
        <>
          <ClosedArc x={L} y={ey} />
          <ClosedArc x={Rr} y={ey} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-28} angle={-12} />
          <Brow x={Rr} y={-28} angle={12} />
        </>
      );
      mouth = <OpenMouth x={ox} y={my + 4} w={34} h={22 + Math.abs(Math.sin(t * 18)) * 6} />;
      break;
    case "grin":
      eyes = dots;
      brows = (
        <>
          <Brow x={L} y={-27} angle={-6} />
          <Brow x={Rr} y={-27} angle={6} />
        </>
      );
      mouth = <Teeth x={ox} y={my + 2} w={40} h={18} />;
      break;
    case "surprised":
      eyes = (
        <>
          <RoundEye x={L} y={ey - 2} px={look * 4} />
          <RoundEye x={Rr} y={ey - 2} px={look * 4} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-34} angle={-14} len={20} />
          <Brow x={Rr} y={-34} angle={14} len={20} />
        </>
      );
      mouth = talkMouth(16) ?? <OpenMouth x={ox} y={my + 4} w={13} h={15} tongue={false} shape="o" />;
      break;
    case "shocked":
      eyes = (
        <>
          <RoundEye x={L} y={ey - 2} r={16} p={4} />
          <RoundEye x={Rr} y={ey - 2} r={16} p={4} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-36} angle={-18} len={20} />
          <Brow x={Rr} y={-36} angle={18} len={20} />
        </>
      );
      mouth = talkMouth(14) ?? <OpenMouth x={ox} y={my + 4} w={14} h={16} tongue={false} shape="o" />;
      break;
    case "whistle":
      eyes = (
        <>
          <LidEye x={L} y={ey} lid={0.5} />
          <LidEye x={Rr} y={ey} lid={0.5} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-26} angle={2} />
          <Brow x={Rr} y={-28} angle={-4} />
        </>
      );
      mouth = talkMouth(12) ?? <OpenMouth x={ox} y={my + 4} w={12} h={9} tongue={false} shape="o" />;
      break;
    case "smile_closed":
      eyes = (
        <>
          <ClosedArc x={L} y={ey} />
          <ClosedArc x={Rr} y={ey} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-28} angle={-8} />
          <Brow x={Rr} y={-28} angle={8} />
        </>
      );
      mouth = talkMouth(18) ?? <Line d={`M ${ox - 10} ${my + 2} Q ${ox} ${my + 8} ${ox + 10} ${my + 2}`} />;
      break;
    case "relief":
      eyes = (
        <>
          <LidEye x={L} y={ey} lid={0.3} />
          <LidEye x={Rr} y={ey} lid={0.3} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-26} angle={0} />
          <Brow x={Rr} y={-26} angle={0} />
        </>
      );
      mouth = talkMouth(16) ?? <Line d={`M ${ox - 10} ${my + 2} Q ${ox} ${my + 6} ${ox + 10} ${my + 2}`} />;
      break;
    case "relief_open":
      eyes = (
        <>
          <RoundEye x={L} y={ey - 2} r={13} p={4} />
          <RoundEye x={Rr} y={ey - 2} r={13} p={4} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-32} angle={-10} len={20} />
          <Brow x={Rr} y={-32} angle={10} len={20} />
        </>
      );
      mouth = talkMouth(16) ?? <OpenMouth x={ox} y={my + 4} w={16} h={12} tongue={false} shape="o" />;
      break;
    case "lick":
      eyes = dots;
      brows = (
        <>
          <Brow x={L} y={-27} angle={-6} />
          <Brow x={Rr} y={-27} angle={6} />
        </>
      );
      mouth = <OpenMouth x={ox} y={my + 4} w={18} h={14} tongue />;
      break;
    case "nervous":
      eyes = (
        <>
          <RoundEye x={L} y={ey} r={12} p={3} />
          <RoundEye x={Rr} y={ey} r={12} p={3} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-30} angle={-14} len={20} />
          <Brow x={Rr} y={-30} angle={14} len={20} />
        </>
      );
      mouth = talkMouth(16) ?? <Line d={`M ${ox - 12} ${my + 4} q 4 -5 8 0 q 4 5 8 0 q 4 -5 8 0`} />;
      extra = <Sweat />;
      break;
    case "dazed":
      eyes = (
        <>
          <RoundEye x={L} y={ey} r={11} p={3} />
          <RoundEye x={Rr} y={ey} r={11} p={3} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-30} angle={-6} len={16} />
          <Brow x={Rr} y={-30} angle={6} len={16} />
        </>
      );
      mouth = talkMouth(12) ?? <OpenMouth x={ox} y={my + 4} w={12} h={12} tongue={false} shape="o" />;
      extra = (
        <g stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round">
          <path d={`M ${L - 8} ${ey - 12} q 3 -4 7 0 q 4 4 8 0`} />
          <path d={`M ${Rr - 8} ${ey - 12} q 3 -4 7 0 q 4 4 8 0`} />
        </g>
      );
      break;
    case "angry":
      eyes = dots;
      brows = (
        <>
          <Brow x={L + 2} y={-20} angle={24} />
          <Brow x={Rr - 2} y={-20} angle={-24} />
        </>
      );
      mouth = talkMouth(24) ?? <Line d={`M ${ox - 13} ${my + 6} Q ${ox} ${my - 4} ${ox + 13} ${my + 6}`} />;
      break;
    case "furious":
      eyes = dots;
      brows = (
        <>
          <Brow x={L + 3} y={-18} angle={30} len={26} />
          <Brow x={Rr - 3} y={-18} angle={-30} len={26} />
        </>
      );
      mouth = <OpenMouth x={ox + wob} y={my + 5} w={36} h={20 + talk * 6} shape="shout" />;
      extra = (
        <g stroke="#d62b2b" strokeWidth={4} fill="none" strokeLinecap="round">
          <path d={`M 34 -46 q 6 -2 8 4 M 46 -40 q 2 6 -4 8 M 40 -52 q -6 -2 -8 4`} />
        </g>
      );
      break;
    case "sad":
      eyes = (
        <>
          <Dot x={L} y={ey + 3} ry={8} />
          <Dot x={Rr} y={ey + 3} ry={8} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-24} angle={-20} />
          <Brow x={Rr} y={-24} angle={20} />
        </>
      );
      mouth = talkMouth(18) ?? <Line d={`M ${ox - 12} ${my + 8} Q ${ox} ${my - 2} ${ox + 12} ${my + 8}`} />;
      break;
    case "worried":
      eyes = dots;
      brows = (
        <>
          <Brow x={L} y={-26} angle={-18} />
          <Brow x={Rr} y={-26} angle={18} />
        </>
      );
      mouth = talkMouth(18) ?? <Line d={`M ${ox - 14} ${my + 4} q 5 -6 9 0 q 5 6 9 0 q 5 -6 9 0`} w={4.5} />;
      extra = <Sweat />;
      break;
    case "scared":
      eyes = (
        <>
          <RoundEye x={L} y={ey} r={14} p={3.5} px={wob} />
          <RoundEye x={Rr} y={ey} r={14} p={3.5} px={wob} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-30} angle={-22} len={20} />
          <Brow x={Rr} y={-30} angle={22} len={20} />
        </>
      );
      mouth = <OpenMouth x={ox} y={my + 6} w={22} h={12 + talk * 8} tongue={false} shape="shout" />;
      extra = <Sweat />;
      break;
    case "suspicious":
      eyes = (
        <>
          <Line d={`M ${L - 10} ${ey} L ${L + 9} ${ey}`} w={7} />
          <Line d={`M ${Rr - 9} ${ey} L ${Rr + 10} ${ey}`} w={7} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-16} angle={10} />
          <Brow x={Rr} y={-16} angle={-10} />
        </>
      );
      mouth = talkMouth(16) ?? <Line d={`M ${ox + 2} ${my + 4} L ${ox + 16} ${my + 1}`} />;
      break;
    case "determined":
      eyes = (
        <>
          <LidEye x={L} y={ey} lid={0.25} tilt={10} />
          <LidEye x={Rr} y={ey} lid={0.25} tilt={-10} />
        </>
      );
      brows = (
        <>
          <Brow x={L + 2} y={-20} angle={18} />
          <Brow x={Rr - 2} y={-20} angle={-18} />
        </>
      );
      mouth = talkMouth(20) ?? <Line d={`M ${ox - 12} ${my + 2} Q ${ox} ${my + 6} ${ox + 12} ${my}`} />;
      break;
    case "sleepy":
      eyes = (
        <>
          <LidEye x={L} y={ey + 2} lid={0.8} />
          <LidEye x={Rr} y={ey + 2} lid={0.8} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-20} angle={0} />
          <Brow x={Rr} y={-20} angle={0} />
        </>
      );
      mouth = <OpenMouth x={ox} y={my + 4} w={11} h={10} tongue={false} shape="o" />;
      break;
    case "crazy":
      eyes = (
        <>
          <RoundEye x={L} y={ey - 3} r={17} p={3} px={Math.sin(t * 9) * 5} />
          <RoundEye x={Rr} y={ey - 1} r={12} p={3} px={Math.cos(t * 7) * 3} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-34} angle={-20} len={20} />
          <Brow x={Rr} y={-28} angle={28} len={20} />
        </>
      );
      mouth = <Teeth x={ox} y={my + 6} w={48} h={20} />;
      break;
    case "wink":
      eyes = (
        <>
          <Dot x={L} y={ey} />
          <ClosedArc x={Rr} y={ey + 2} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-28} angle={-8} />
          <Brow x={Rr} y={-22} angle={8} />
        </>
      );
      mouth = talkMouth() ?? <Line d={`M ${ox - 14} ${my} Q ${ox} ${my + 12} ${ox + 15} ${my - 3}`} />;
      break;
    case "bored":
      eyes = (
        <>
          <LidEye x={L} y={ey + 1} lid={0.55} />
          <LidEye x={Rr} y={ey + 1} lid={0.55} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-20} angle={2} />
          <Brow x={Rr} y={-20} angle={-2} />
        </>
      );
      mouth = talkMouth(16) ?? <Line d={`M ${ox - 10} ${my + 3} L ${ox + 10} ${my + 3}`} />;
      break;
    case "dead":
      eyes = (
        <>
          <Line d={`M ${L - 8} ${ey - 8} L ${L + 8} ${ey + 8} M ${L + 8} ${ey - 8} L ${L - 8} ${ey + 8}`} w={5.5} />
          <Line d={`M ${Rr - 8} ${ey - 8} L ${Rr + 8} ${ey + 8} M ${Rr + 8} ${ey - 8} L ${Rr - 8} ${ey + 8}`} w={5.5} />
        </>
      );
      brows = null;
      mouth = <Line d={`M ${ox - 14} ${my + 4} q 5 -6 9 0 q 5 6 9 0 q 5 -6 9 0`} w={4.5} />;
      break;
    case "love":
      eyes = (
        <>
          <Heart x={L} y={ey} s={1 + Math.sin(t * 10) * 0.08} />
          <Heart x={Rr} y={ey} s={1 + Math.sin(t * 10) * 0.08} />
        </>
      );
      brows = (
        <>
          <Brow x={L} y={-30} angle={-10} len={18} />
          <Brow x={Rr} y={-30} angle={10} len={18} />
        </>
      );
      mouth = talkMouth(22) ?? <Line d={`M ${ox - 14} ${my} Q ${ox} ${my + 12} ${ox + 14} ${my}`} />;
      break;
    default: // neutral
      eyes = dots;
      brows = (
        <>
          <Brow x={L} y={-26} angle={-3} />
          <Brow x={Rr} y={-26} angle={3} />
        </>
      );
      mouth = talkMouth() ?? <Line d={`M ${ox - 8} ${my + 2} L ${ox + 8} ${my + 2}`} />;
  }

  const canBlink = ["neutral", "smug", "whistle", "happy", "grin", "angry", "sad", "worried", "determined", "bored", "furious", "wink", "suspicious"].includes(expression);
  return (
    <g>
      {blink > 0 && canBlink ? (
        <>
          <LidEye x={L} y={ey} lid={blink} />
          <LidEye x={Rr} y={ey} lid={blink} />
        </>
      ) : eyes}
      {brows}
      {mouth}
      {extra}
    </g>
  );
};

const Sweat: React.FC = () => (
  <path d="M 52 -30 q -9 14 -2 19 q 9 4 9 -6 q -1 -6 -7 -13 Z" fill="#9fd8ff" stroke={INK} strokeWidth={3.5} />
);

const Heart: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M 0 9 C -14 -1 -12 -12 -5 -12 C -2 -12 0 -9 0 -7 C 0 -9 2 -12 5 -12 C 12 -12 14 -1 0 9 Z"
    fill="#e23b4a"
    stroke={INK}
    strokeWidth={3}
  />
);
