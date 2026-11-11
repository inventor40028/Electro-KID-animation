import { StorySchema, type ResolvedShot, type SfxCue, type Story, type StoryInput, type Timeline, type Word } from "./schema";

export const FPS = 30;
const TAIL = 0.6; // seconds held after the last word

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
export const tokenize = (s: string) => s.split(/\s+/).map((w) => w.trim()).filter((w) => norm(w).length > 0);

// Fake word timings (used for previews before TTS exists): ~3.7 words/sec, pauses on punctuation.
export const estimateWords = (story: Story): Word[] => {
  const out: Word[] = [];
  let t = 0.05;
  for (const shot of story.shots) {
    for (const w of tokenize(shot.say)) {
      const d = 0.16 + Math.min(0.28, norm(w).length * 0.035);
      out.push({ text: w, start: t, end: t + d });
      t += d + (/[.!?]$/.test(w) ? 0.22 : /[,;:]$/.test(w) ? 0.1 : 0.02);
    }
  }
  return out;
};

// Match TTS words to the script tokens in order, so every shot knows which spoken words are its own.
// TTS word boundaries can split/merge tokens ("don't" vs "don" "'t", numbers spoken as words),
// so we align greedily on normalized text and fall back to proportional mapping.
const alignShots = (story: Story, words: Word[]) => {
  const tokens = story.shots.map((s) => tokenize(s.say));
  const total = tokens.reduce((n, t) => n + t.length, 0);
  const starts: number[] = [];
  let wi = 0;
  let consumed = 0;
  for (let si = 0; si < tokens.length; si++) {
    const first = norm(tokens[si][0] ?? ""), second = norm(tokens[si][1] ?? "");
    // expected position by proportion
    const expected = Math.round((consumed / Math.max(1, total)) * words.length);
    const lo = Math.max(wi, expected - 6), hi = Math.min(words.length, expected + 10);
    let found = -1;
    // two words first, so a shot starting with a common word like "The" can't match too early
    if (second) for (let k = lo; k < hi && found < 0; k++) if (norm(words[k].text) === first && norm(words[k + 1]?.text ?? "") === second) found = k;
    for (let k = lo; k < hi && found < 0; k++) if (norm(words[k].text) === first) found = k;
    if (found < 0) found = Math.min(Math.max(wi, expected), Math.max(0, words.length - 1));
    starts.push(found);
    wi = found + 1;
    consumed += tokens[si].length;
  }
  return starts;
};

const findBeatTime = (shotWords: Word[], at: string | number, shotStart: number): number => {
  if (typeof at === "number") return shotStart + at;
  const target = norm(at.split(/\s+/)[0] ?? "");
  const hit = shotWords.find((w) => norm(w.text) === target) ?? shotWords.find((w) => norm(w.text).startsWith(target));
  return hit ? hit.start : shotStart;
};

// automatic sound design so every video sounds produced even if the story lists no sfx
const AUTO_FX_SFX: Record<string, string> = {
  sparkle: "sparkle", glow: "chime", flash: "whoosh", explosion: "boom", debris: "crash", cracks: "glass", rage: "rumble",
  confetti: "success", money: "cash", lightning: "thunder", rain: "rain", speedlines: "swoosh", exclaim: "pop", question: "boing",
  hearts: "chime", zzz: "squeak", stars: "boing", ripples: "water", fire: "fire", smoke: "wind", shake: "impact",
};

export const buildTimeline = (input: StoryInput | Story, words: Word[] | null, voiceSrc: string | null, musicSrc: string | null): Timeline => {
  const story = StorySchema.parse(input);
  const w = words && words.length ? words : estimateWords(story);
  const starts = alignShots(story, w);
  const lastEnd = w[w.length - 1]?.end ?? 1;
  const totalFrames = Math.ceil((lastEnd + TAIL) * FPS);

  const shots: ResolvedShot[] = story.shots.map((s, i) => {
    const startSec = i === 0 ? 0 : w[starts[i]]?.start ?? 0;
    const from = i === 0 ? 0 : Math.round(startSec * FPS) - 2; // cut a hair before the first word
    return { ...s, from, duration: 0, words: [], beatsResolved: [], index: i };
  });
  for (let i = 0; i < shots.length; i++) {
    const end = i < shots.length - 1 ? shots[i + 1].from : totalFrames;
    shots[i].duration = Math.max(8, end - shots[i].from);
    const wEnd = i < shots.length - 1 ? starts[i + 1] : w.length;
    shots[i].words = w.slice(starts[i], wEnd);
    const shotStart = shots[i].from / FPS;
    shots[i].beatsResolved = shots[i].beats.map((b) => ({
      ...b,
      frame: Math.max(0, Math.round((findBeatTime(shots[i].words, b.at, shotStart) - shotStart) * FPS)),
    }));
  }

  const sfx: SfxCue[] = [];
  shots.forEach((s, i) => {
    if (i > 0) {
      const tr = s.transition;
      if (tr === "whip" || tr === "zoom") sfx.push({ name: "swoosh", frame: s.from - 3, volume: 0.35 });
      else if (tr === "flash") sfx.push({ name: "impact", frame: s.from, volume: 0.4 });
      else if (tr === "iris") sfx.push({ name: "magic", frame: s.from, volume: 0.3 });
      else if (tr === "dissolve" && i % 2 === 0) sfx.push({ name: "whoosh", frame: s.from - 4, volume: 0.12 });
    }
    s.sfx.forEach((n) => sfx.push({ name: n, frame: s.from, volume: 0.5 }));
    s.fx.forEach((f) => { const n = AUTO_FX_SFX[f]; if (n && !s.sfx.includes(n as never)) sfx.push({ name: n, frame: s.from + 2, volume: 0.32 }); });
    s.beatsResolved.forEach((b) => {
      if (b.sfx) sfx.push({ name: b.sfx, frame: s.from + b.frame, volume: 0.5 });
      else if (b.fx && AUTO_FX_SFX[b.fx]) sfx.push({ name: AUTO_FX_SFX[b.fx], frame: s.from + b.frame, volume: 0.35 });
      else if (b.expression && ["shocked", "surprised", "scared"].includes(b.expression)) sfx.push({ name: "pop", frame: s.from + b.frame, volume: 0.25 });
    });
    s.actors.forEach((a) => {
      if (a.enter === "pop") sfx.push({ name: "pop", frame: s.from, volume: 0.3 });
      if (a.enter === "drop") sfx.push({ name: "thud", frame: s.from + 11, volume: 0.4 });
      if (a.enter === "left" || a.enter === "right") sfx.push({ name: "slide", frame: s.from, volume: 0.2 });
    });
    s.props.forEach((p) => {
      if (p.enter === "pop") sfx.push({ name: "pop", frame: s.from, volume: 0.25 });
      if (p.enter === "drop") sfx.push({ name: "thud", frame: s.from + 11, volume: 0.35 });
    });
    if (s.insert && s.insert.type !== "none") sfx.push({ name: s.insert.type === "counter" ? "riser" : "paper", frame: s.from, volume: 0.3 });
  });
  // de-duplicate cues that land on (almost) the same frame
  sfx.sort((a, b) => a.frame - b.frame);
  const dedup = sfx.filter((c, i) => !sfx.slice(0, i).some((d) => d.name === c.name && Math.abs(d.frame - c.frame) < 4));

  return { story, fps: FPS, durationInFrames: totalFrames, voiceSrc, musicSrc, words: w, shots, sfx: dedup.filter((c) => c.frame < totalFrames) };
};
