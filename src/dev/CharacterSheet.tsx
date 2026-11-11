import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Character } from "../character/Character";
import { EXPRESSIONS, POSES } from "../catalog";
import { CharacterSchema } from "../schema";

const cast = [
  CharacterSchema.parse({ color: "#f2b632", hair: "parted", tie: "#3b5bb5", badge: true }),
  CharacterSchema.parse({ color: "#1f2e5e", outfit: "uniform", hat: "police", hair: "short", mustache: true }),
  CharacterSchema.parse({ color: "#ffffff", outfit: "apron", hat: "chef", hair: "none" }),
  CharacterSchema.parse({ color: "#5fc9b0", outfit: "vest", hat: "bowler", bowtie: "#d8342c", hair: "none", build: "skinny" }),
  CharacterSchema.parse({ color: "#e0533d", outfit: "overalls", hat: "cap", build: "big" }),
  CharacterSchema.parse({ color: "#7a4fd6", outfit: "dress", hair: "long", hairColor: "#3a2414", lashes: true }),
  CharacterSchema.parse({ color: "#ff8a2a", outfit: "prisoner", hair: "spiky", build: "big" }),
  CharacterSchema.parse({ color: "#3a8ad6", outfit: "labcoat", hair: "old", glasses: "round", tie: "#2a2a2a" }),
];

export const CharacterSheet: React.FC<{ mode: "expr" | "pose" | "cast" }> = ({ mode }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  if (mode === "cast")
    return (
      <AbsoluteFill style={{ background: "#cfd8e6" }}>
        <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
          {cast.map((ch, i) => (
            <g key={i} transform={`translate(${150 + (i % 4) * 260} ${700 + Math.floor(i / 4) * 800}) scale(1.05)`}>
              <Character ch={ch} id={`c${i}`} pose="stand" expression={(["smug", "neutral", "happy", "grin", "surprised", "laugh", "angry", "suspicious"] as const)[i]} facing="front" talking={false} t={t} frame={frame} />
            </g>
          ))}
        </svg>
      </AbsoluteFill>
    );
  const items = mode === "expr" ? EXPRESSIONS : POSES;
  return (
    <AbsoluteFill style={{ background: "#e9e2d6" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        {items.map((it, i) => (
          <g key={it} transform={`translate(${120 + (i % 4) * 280} ${330 + Math.floor(i / 4) * 330}) scale(0.62)`}>
            <Character
              ch={cast[i % cast.length]}
              id={`s${i}`}
              pose={mode === "pose" ? (it as never) : "stand"}
              expression={mode === "expr" ? (it as never) : "neutral"}
              facing={mode === "pose" && i % 3 === 1 ? "right" : "front"}
              talking={false}
              t={t}
              frame={frame}
            />
            <text x={0} y={60} textAnchor="middle" fontSize={34} fontFamily="Arial" fontWeight={700} fill="#333">{it}</text>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
