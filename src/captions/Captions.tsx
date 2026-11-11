import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import type { Word } from "../schema";
import { clamp } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["800", "900"], subsets: ["latin"] });
export const CAPTION_FONT = fontFamily;

// Group words into short chunks like the references: 1-3 words, max ~14 chars,
// break after punctuation so a sentence end never shares a chunk with the next sentence.
export const chunkWords = (words: Word[]) => {
  const chunks: { text: string; start: number; end: number }[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    chunks.push({ text: cur.map((w) => w.text).join(" "), start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  for (const w of words) {
    const len = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
    if (cur.length && (cur.length >= 3 || len > 14)) flush();
    cur.push(w);
    if (/[.,!?;:]$/.test(w.text) || w.end - w.start > 0.55) flush();
  }
  flush();
  return chunks;
};

export const Captions: React.FC<{ words: Word[]; frame: number; fps: number }> = ({ words, frame, fps }) => {
  const chunks = React.useMemo(() => chunkWords(words), [words]);
  const t = frame / fps;
  let idx = -1;
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].start <= t + 0.02) idx = i;
    else break;
  }
  if (idx < 0) return null;
  const c = chunks[idx];
  const next = chunks[idx + 1];
  // hide during long silences
  if (!next && t > c.end + 0.6) return null;
  if (next && t > c.end + 0.8 && t < next.start) return null;
  const age = t - c.start;
  const s = 1 + 0.06 * (1 - clamp(age / 0.08));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 1255,
          width: 980,
          textAlign: "center",
          fontFamily,
          fontWeight: 900,
          fontSize: 82,
          lineHeight: 1.05,
          color: "#ffffff",
          WebkitTextStroke: "0px",
          textShadow: "0 0 2px #000, 0 6px 0 rgba(0,0,0,0.55), 0 10px 24px rgba(0,0,0,0.45)",
          paintOrder: "stroke fill",
          transform: `scale(${s})`,
          letterSpacing: -1,
        }}
      >
        <span style={{ WebkitTextStroke: "14px #0b0b0f", position: "absolute", left: 0, right: 0, color: "transparent" }}>{c.text}</span>
        <span style={{ position: "relative" }}>{c.text}</span>
      </div>
    </AbsoluteFill>
  );
};
