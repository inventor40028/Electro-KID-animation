import React from "react";
import { INK, shade } from "../theme";
import type { HAIR, HATS } from "../catalog";

export type Hair = (typeof HAIR)[number];
export type Hat = (typeof HATS)[number];

const R = 68;
const SW = 5.5;

// Hair is drawn ON TOP of the head circle. Head center (0,0), radius 68.
export const HairShape: React.FC<{ hair: Hair; color: string; look: number; behind?: boolean }> = ({ hair, color, look, behind }) => {
  const dark = shade(color, -0.35);
  const s = { fill: color, stroke: INK, strokeWidth: SW, strokeLinejoin: "round" as const };
  const lx = look * 6;
  if (behind) {
    // parts that sit behind the head (long hair, ponytail, bun)
    if (hair === "long" || hair === "bob")
      return (
        <path
          d={hair === "long" ? `M -66 -10 Q -84 70 -60 96 L 60 96 Q 84 70 66 -10 Z` : `M -66 -10 Q -80 44 -62 62 L 62 62 Q 80 44 66 -10 Z`}
          {...s}
        />
      );
    if (hair === "ponytail") return <path d={`M 50 -40 Q 110 -30 96 40 Q 90 64 74 70 Q 92 20 52 -10 Z`} {...s} />;
    if (hair === "bun") return <circle cx={0} cy={-76} r={26} {...s} />;
    return null;
  }
  switch (hair) {
    case "none":
      return null;
    case "short":
      return (
        <g>
          <path d={`M -67 -8 C -70 -60 -30 -76 0 -76 C 34 -76 72 -58 67 -8 C 54 -26 30 -36 ${8 + lx} -34 C -20 -34 -50 -26 -67 -8 Z`} {...s} />
          <path d={`M -30 -60 Q -10 -66 12 -62`} stroke={dark} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      );
    case "parted":
      return (
        <g>
          <path d={`M -67 -4 C -72 -62 -30 -77 2 -77 C 36 -77 74 -58 67 -4 C 60 -26 44 -42 ${14 + lx} -40 C -8 -40 -44 -30 -67 -4 Z`} {...s} />
          <path d={`M ${-14 + lx} -76 Q ${-20 + lx} -56 ${-12 + lx} -40`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d={`M 18 -68 Q 40 -64 54 -46`} stroke={shade(color, 0.25)} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      );
    case "spiky":
      return (
        <path
          d={`M -66 -14 L -74 -46 L -48 -50 L -52 -84 L -20 -66 L -6 -98 L 12 -68 L 40 -90 L 42 -56 L 74 -60 L 66 -14 C 50 -30 24 -36 0 -36 C -26 -36 -50 -30 -66 -14 Z`}
          {...s}
        />
      );
    case "curly":
      return (
        <g {...s}>
          {[-56, -34, -10, 14, 38, 58].map((x, i) => (
            <circle key={i} cx={x} cy={-50 - (i % 2) * 14 + Math.abs(x) * 0.18} r={22} />
          ))}
          <path d={`M -66 -20 C -40 -34 40 -34 66 -20 L 60 -48 L -60 -48 Z`} stroke="none" />
        </g>
      );
    case "bob":
    case "long":
      return <path d={`M -68 6 C -76 -64 -30 -78 0 -78 C 30 -78 76 -64 68 6 C 62 -20 52 -34 30 -38 C 10 -30 -14 -30 -30 -38 C -52 -34 -62 -20 -68 6 Z`} {...s} />;
    case "ponytail":
      return (
        <g>
          <path d={`M -67 -6 C -72 -64 -30 -78 0 -78 C 34 -78 72 -60 67 -6 C 56 -30 30 -40 0 -40 C -30 -40 -56 -30 -67 -6 Z`} {...s} />
          <circle cx={56} cy={-40} r={8} fill="#e2507a" stroke={INK} strokeWidth={4} />
        </g>
      );
    case "bun":
      return <path d={`M -67 -6 C -72 -64 -30 -78 0 -78 C 34 -78 72 -60 67 -6 C 56 -30 30 -40 0 -40 C -30 -40 -56 -30 -67 -6 Z`} {...s} />;
    case "mohawk":
      return <path d={`M -14 -66 L -10 -110 L 0 -92 L 6 -118 L 14 -94 L 24 -112 L 22 -64 Q 4 -70 -14 -66 Z`} {...s} />;
    case "messy":
      return (
        <path
          d={`M -68 -4 C -80 -40 -64 -70 -40 -72 L -44 -88 L -18 -78 L -10 -96 L 8 -80 L 30 -92 L 32 -74 C 60 -70 80 -40 68 -4 C 58 -24 50 -30 40 -24 L 30 -38 L 16 -28 L 0 -40 L -14 -28 L -30 -38 L -42 -24 C -54 -30 -62 -22 -68 -4 Z`}
          {...s}
        />
      );
    case "old":
      return (
        <g {...s} fill="#e8e8ee">
          <path d={`M -68 4 C -74 -14 -66 -34 -54 -40 C -48 -24 -58 -10 -60 6 Z`} />
          <path d={`M 68 4 C 74 -14 66 -34 54 -40 C 48 -24 58 -10 60 6 Z`} />
        </g>
      );
  }
  return null;
};

export const HatShape: React.FC<{ hat: Hat; color?: string; look: number }> = ({ hat, color, look }) => {
  const s = (fill: string) => ({ fill, stroke: INK, strokeWidth: SW, strokeLinejoin: "round" as const });
  const vis = look * 10;
  switch (hat) {
    case "none":
      return null;
    case "cap": {
      const c = color ?? "#d8342c";
      return (
        <g>
          <path d={`M -64 -26 C -66 -78 -28 -88 0 -88 C 30 -88 66 -78 64 -26 Z`} {...s(c)} />
          <path d={`M ${-40 + vis} -30 Q ${20 + vis} -44 ${90 + vis} -22 Q ${30 + vis} -14 ${-40 + vis} -22 Z`} {...s(shade(c, -0.15))} />
          <path d="M 0 -88 L 0 -30" stroke={shade(c, -0.3)} strokeWidth={3} />
          <circle cx={0} cy={-88} r={5} {...s(c)} />
        </g>
      );
    }
    case "police": {
      const c = color ?? "#1f2e5e";
      return (
        <g>
          <path d={`M -76 -40 C -80 -70 -40 -90 0 -90 C 40 -90 80 -70 76 -40 Q 0 -30 -76 -40 Z`} {...s(c)} />
          <path d="M -62 -38 Q 0 -30 62 -38 L 60 -24 Q 0 -16 -60 -24 Z" {...s(shade(c, -0.25))} />
          <path d={`M -54 -22 Q 0 -6 54 -22 Q 0 0 -54 -22 Z`} {...s("#151515")} />
          <path d="M -40 -78 Q 0 -86 40 -78" stroke={shade(c, 0.25)} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Star x={0} y={-56} r={11} />
        </g>
      );
    }
    case "chef":
      return (
        <g>
          <path d="M -56 -34 L -56 -88 C -90 -96 -86 -148 -44 -142 C -40 -180 30 -184 38 -146 C 84 -156 92 -96 56 -88 L 56 -34 Z" {...s("#ffffff")} />
          <path d="M -56 -52 L 56 -52" stroke="#d8d8d8" strokeWidth={4} />
          <path d="M -20 -88 L -20 -54 M 20 -88 L 20 -54" stroke="#dcdcdc" strokeWidth={4} />
          <path d="M -56 -34 L 56 -34" stroke={INK} strokeWidth={SW} />
        </g>
      );
    case "bowler": {
      const c = color ?? "#3a2a22";
      return (
        <g>
          <ellipse cx={0} cy={-42} rx={74} ry={12} {...s(c)} />
          <path d="M -48 -44 C -50 -100 50 -100 48 -44 Z" {...s(c)} />
          <path d="M -48 -52 Q 0 -44 48 -52 L 48 -44 Q 0 -36 -48 -44 Z" fill={color ? shade(c, 0.3) : "#c8a46a"} stroke={INK} strokeWidth={3} />
        </g>
      );
    }
    case "cowboy": {
      const c = color ?? "#9a6435";
      return (
        <g>
          <path d="M -104 -40 Q -90 -26 0 -28 Q 90 -26 104 -40 Q 96 -60 70 -48 Q 0 -36 -70 -48 Q -96 -60 -104 -40 Z" {...s(c)} />
          <path d="M -50 -44 C -60 -96 -30 -104 -12 -92 Q 0 -100 12 -92 C 30 -104 60 -96 50 -44 Z" {...s(c)} />
          <path d="M -50 -54 Q 0 -46 50 -54 L 50 -44 Q 0 -36 -50 -44 Z" {...s(shade(c, -0.35))} />
        </g>
      );
    }
    case "hardhat": {
      const c = color ?? "#f5c22a";
      return (
        <g>
          <path d="M -60 -34 C -60 -96 60 -96 60 -34 Z" {...s(c)} />
          <path d="M -80 -34 Q 0 -42 80 -34 L 80 -26 Q 0 -32 -80 -26 Z" {...s(shade(c, -0.1))} />
          <path d="M 0 -94 L 0 -36" stroke={shade(c, -0.25)} strokeWidth={8} />
        </g>
      );
    }
    case "tophat": {
      const c = color ?? "#1c1c22";
      return (
        <g>
          <ellipse cx={0} cy={-44} rx={70} ry={12} {...s(c)} />
          <rect x={-44} y={-150} width={88} height={106} rx={6} {...s(c)} />
          <rect x={-44} y={-66} width={88} height={14} fill="#b8302a" stroke={INK} strokeWidth={3} />
        </g>
      );
    }
    case "beanie": {
      const c = color ?? "#d99a2b";
      return (
        <g>
          <path d="M -66 -30 C -70 -96 70 -96 66 -30 Z" {...s(c)} />
          <rect x={-70} y={-40} width={140} height={22} rx={10} {...s(shade(c, -0.15))} />
          {[-50, -30, -10, 10, 30, 50].map((x) => (
            <line key={x} x1={x} y1={-38} x2={x} y2={-21} stroke={shade(c, -0.35)} strokeWidth={3} />
          ))}
          <circle cx={0} cy={-92} r={12} {...s(c)} />
        </g>
      );
    }
    case "straw": {
      const c = color ?? "#f0d27a";
      return (
        <g>
          <ellipse cx={0} cy={-40} rx={104} ry={20} {...s(c)} />
          <path d="M -50 -44 C -54 -96 54 -96 50 -44 Z" {...s(c)} />
          <path d="M -50 -56 Q 0 -48 50 -56 L 50 -44 Q 0 -36 -50 -44 Z" {...s("#2a5bb8")} />
        </g>
      );
    }
    case "captain": {
      const c = color ?? "#21357a";
      return (
        <g>
          <path d="M -100 -36 Q -60 -110 0 -112 Q 60 -110 100 -36 Q 0 -56 -100 -36 Z" {...s(c)} />
          <path d="M -94 -40 Q 0 -60 94 -40" stroke="#e9c04a" strokeWidth={6} fill="none" />
          <circle cx={0} cy={-76} r={14} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={-76} r={7} fill="#d8342c" />
        </g>
      );
    }
    case "pirate": {
      const c = color ?? "#1d1d24";
      return (
        <g>
          <path d="M -104 -34 Q -70 -120 0 -116 Q 70 -120 104 -34 Q 0 -60 -104 -34 Z" {...s(c)} />
          <path d="M -94 -40 Q 0 -64 94 -40" stroke="#e9c04a" strokeWidth={5} fill="none" />
          <circle cx={0} cy={-80} r={11} fill="#fff" stroke={INK} strokeWidth={3} />
          <path d="M -12 -66 L 12 -60 M 12 -66 L -12 -60" stroke="#fff" strokeWidth={4} />
        </g>
      );
    }
    case "crown":
      return (
        <path d="M -50 -40 L -58 -104 L -28 -76 L 0 -114 L 28 -76 L 58 -104 L 50 -40 Z" {...s(color ?? "#f2c230")} />
      );
    case "helmet": {
      const c = color ?? "#6b7a5a";
      return (
        <g>
          <path d="M -74 -24 C -74 -104 74 -104 74 -24 Q 0 -38 -74 -24 Z" {...s(c)} />
          <path d="M -40 -84 Q 0 -94 40 -84" stroke={shade(c, 0.25)} strokeWidth={4} fill="none" />
        </g>
      );
    }
    case "beret": {
      const c = color ?? "#b8263a";
      return <path d="M -70 -42 C -84 -92 50 -104 84 -60 Q 72 -40 -70 -42 Z" {...s(c)} />;
    }
    case "headphones": {
      const c = color ?? "#26304a";
      return (
        <g>
          <path d="M -70 -6 C -82 -110 82 -110 70 -6" stroke={INK} strokeWidth={16} fill="none" />
          <path d="M -70 -6 C -82 -110 82 -110 70 -6" stroke={c} strokeWidth={9} fill="none" />
          <rect x={-86} y={-30} width={26} height={50} rx={12} {...s(c)} />
          <rect x={60} y={-30} width={26} height={50} rx={12} {...s(c)} />
        </g>
      );
    }
    case "graduation":
      return (
        <g>
          <path d="M -58 -40 L -58 -62 Q 0 -74 58 -62 L 58 -40 Z" {...s("#1c1c24")} />
          <path d="M -100 -74 L 0 -100 L 100 -74 L 0 -50 Z" {...s("#1c1c24")} />
          <path d="M 60 -66 L 70 -24" stroke="#f2c230" strokeWidth={4} />
        </g>
      );
    case "nurse":
      return (
        <g>
          <path d="M -48 -50 L -40 -90 L 40 -90 L 48 -50 Z" {...s("#ffffff")} />
          <path d="M -6 -82 h 12 v 8 h 8 v 12 h -8 v 8 h -12 v -8 h -8 v -12 h 8 Z" fill="#e23b4a" />
        </g>
      );
    case "astronaut":
      return (
        <g>
          <circle cx={0} cy={0} r={92} fill="rgba(170,215,255,0.25)" stroke={INK} strokeWidth={SW} />
          <path d="M -60 -50 Q -40 -76 -10 -80" stroke="#ffffff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
        </g>
      );
    case "bandana": {
      const c = color ?? "#2a6fd6";
      return (
        <g>
          <path d="M -68 -18 C -70 -80 70 -80 68 -18 Q 0 -34 -68 -18 Z" {...s(c)} />
          <path d="M 64 -26 L 92 -8 L 80 -36 Z" {...s(c)} />
          {[-40, -10, 20, 46].map((x) => (
            <circle key={x} cx={x} cy={-50} r={4} fill="#fff" />
          ))}
        </g>
      );
    }
  }
  return null;
};

export const Star: React.FC<{ x: number; y: number; r: number; fill?: string }> = ({ x, y, r, fill = "#f2c230" }) => {
  const pts = Array.from({ length: 10 }).map((_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
  });
  return <polygon points={pts.join(" ")} fill={fill} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />;
};
