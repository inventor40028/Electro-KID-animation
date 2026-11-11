// One command: story JSON -> narrated, captioned, sound-designed 1080x1920 MP4.
//
//   npm run make -- stories/my-story.json [--preview] [--stills] [--no-tts]
//
//   --preview  render at 50% resolution (fast check of timing and framing)
//   --stills   only render one QA still per shot to out/<slug>/stills (no video)
//   --no-tts   skip narration (estimated timings, silent voice) for offline work
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { StorySchema, type Word } from "../src/schema";
import { buildTimeline, tokenize } from "../src/timeline";
import { PROPS, SFX } from "../src/catalog";
import { loadLibrary } from "./location-lib";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const storyPath = args.find((a) => !a.startsWith("--"));
const flag = (f: string) => args.includes(f);
if (!storyPath) {
  console.error("usage: npm run make -- stories/<story>.json [--preview] [--stills] [--no-tts]");
  process.exit(1);
}

const log = (s: string) => console.log(`\x1b[36m▸\x1b[0m ${s}`);
const python = process.platform === "win32" ? "python" : "python3";

// ---------------------------------------------------------------- 1. validate
const raw = JSON.parse(fs.readFileSync(storyPath, "utf8"));
const parsed = StorySchema.safeParse(raw);
if (!parsed.success) {
  console.error("\x1b[31mStory JSON is invalid:\x1b[0m");
  for (const issue of parsed.error.issues) console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}
const story = parsed.data;
for (const [i, s] of story.shots.entries()) {
  for (const a of s.actors) if (!story.cast[a.id]) { console.error(`shot ${i}: actor "${a.id}" is not in cast`); process.exit(1); }
  if (s.quote && !story.cast[s.quote]) { console.error(`shot ${i}: quote "${s.quote}" is not in cast`); process.exit(1); }
}
// 3D locations: only what this story uses goes into the render
const usedLocations = [...new Set(story.shots.flatMap((s) => (s.location ? [s.location] : [])))];
const library = usedLocations.length ? loadLibrary() : null;
if (library && library.errors.length) { console.error("\x1b[31mlocations/ has errors:\x1b[0m"); library.errors.forEach((e) => console.error(`  • ${e}`)); process.exit(1); }
for (const name of usedLocations) if (!library!.locations.some((l) => l.name === name)) { console.error(`no location called "${name}". Have: ${library!.locations.map((l) => l.name).join(", ")}`); process.exit(1); }
for (const [i, s] of story.shots.entries()) {
  for (const p of s.props) {
    if ((PROPS as readonly string[]).includes(p.type) || (s.location && library!.objects[p.type])) continue;
    console.error(`shot ${i}: no prop or object called "${p.type}". See: npx tsx scripts/locations.ts --list`);
    if (!s.location && library?.objects[p.type]) console.error("  It is a 3D object, so this shot needs a \"location\".");
    process.exit(1);
  }
}
const chromiumOptions = usedLocations.length ? { gl: "angle" as const } : {};
const missingSfx = SFX.filter((n) => !fs.existsSync(path.join(root, "public/sfx", `${n}.wav`)));
if (missingSfx.length) {
  log("sound library missing — generating it (one time)…");
  execFileSync(python, [path.join(root, "scripts/gen_audio_assets.py")], { stdio: "inherit" });
}

const slug = story.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "story";
const outDir = path.join(root, "out", slug);
fs.mkdirSync(outDir, { recursive: true });
const words = story.shots.reduce((n, s) => n + tokenize(s.say).length, 0);
log(`"${story.title}" — ${story.shots.length} shots, ${words} words (~${Math.round(words / 3.75)}s)`);

// ---------------------------------------------------------------- 2. narration
let wordTimes: Word[] | null = null;
let voiceSrc: string | null = null;
if (!flag("--no-tts")) {
  const voiceDir = path.join(root, "public/voice");
  fs.mkdirSync(voiceDir, { recursive: true });
  const textFile = path.join(outDir, "script.txt");
  fs.writeFileSync(textFile, story.shots.map((s) => s.say.trim()).join(" "));
  const mp3 = path.join(voiceDir, `${slug}.mp3`);
  const wj = path.join(outDir, "words.json");
  // the same words in the same voice don't need the network again, and keep their exact timing
  const keyFile = path.join(outDir, "narration.key");
  const key = JSON.stringify([fs.readFileSync(textFile, "utf8"), story.voice, story.rate]);
  const reusable = fs.existsSync(keyFile) && fs.readFileSync(keyFile, "utf8") === key && fs.existsSync(wj) && fs.existsSync(mp3) && fs.statSync(mp3).size > 0;
  if (reusable) log("narration: unchanged, reusing it");
  else {
    log(`narration: ${story.voice} @ ${story.rate}`);
    execFileSync(python, [path.join(root, "scripts/tts.py"), textFile, mp3, wj, story.voice, story.rate], { stdio: "inherit" });
    fs.writeFileSync(keyFile, key);
  }
  wordTimes = JSON.parse(fs.readFileSync(wj, "utf8"));
  voiceSrc = `voice/${slug}.mp3`;
}

// ---------------------------------------------------------------- 3. timeline
const musicSrc = story.music === "none" ? null : `music/${story.music}.wav`;
const timeline = {
  ...buildTimeline(story, wordTimes, voiceSrc, musicSrc),
  ...(library ? { locations: Object.fromEntries(library.locations.filter((l) => usedLocations.includes(l.name)).map((l) => [l.name, l])), objects: library.objects } : {}),
};
fs.writeFileSync(path.join(outDir, "timeline.json"), JSON.stringify(timeline, null, 1));
log(`timeline: ${(timeline.durationInFrames / timeline.fps).toFixed(1)}s, ${timeline.sfx.length} sound cues`);
for (const s of timeline.shots) {
  const len = s.duration / timeline.fps;
  if (len < 0.8) console.warn(`  ⚠ shot ${s.index} is only ${len.toFixed(2)}s — consider merging it`);
  if (len > 6) console.warn(`  ⚠ shot ${s.index} lasts ${len.toFixed(1)}s — consider splitting it (refs cut every 1.5–4s)`);
}

// ---------------------------------------------------------------- 4. render
log("bundling…");
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const inputProps = timeline as unknown as Record<string, unknown>;
// Captions load a web font, so one dropped connection shouldn't end the run.
const withRetry = async <T>(job: () => Promise<T>, tries = 3): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try { return await job(); } catch (e) {
      if (attempt >= tries) throw e;
      log(`render failed (${(e as Error).message.slice(0, 80)}), retrying…`);
    }
  }
};
const composition = await withRetry(() => selectComposition({ serveUrl, id: "Story", inputProps, chromiumOptions }));

if (flag("--stills")) {
  const dir = path.join(outDir, "stills");
  fs.mkdirSync(dir, { recursive: true });
  for (const s of timeline.shots) {
    const f = s.from + Math.floor(s.duration * 0.6);
    const out = path.join(dir, `shot${String(s.index).padStart(2, "0")}.png`);
    await withRetry(() => renderStill({ composition, serveUrl, frame: f, output: out, inputProps, scale: 0.5, chromiumOptions }));
  }
  log(`stills → ${path.relative(root, dir)}`);
  process.exit(0);
}

const rawOut = path.join(outDir, "raw.mp4");
const preview = flag("--preview");
let last = -1;
const concurrency = usedLocations.length ? 2 : Math.max(2, Math.min(12, (await import("node:os")).cpus().length - 2));
await withRetry(() => renderMedia({
  composition, serveUrl, codec: "h264", outputLocation: rawOut, inputProps, chromiumOptions,
  scale: preview ? 0.5 : 1, crf: preview ? 28 : 18, audioBitrate: "192k", concurrency,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 20);
    if (p !== last) { last = p; process.stdout.write(`\r  rendering ${"█".repeat(p)}${"░".repeat(20 - p)} ${Math.round(progress * 100)}%`); }
  },
}));
process.stdout.write("\n");

// ---------------------------------------------------------------- 5. loudness (-14 LUFS like the references)
const ffmpeg = execFileSync(python, ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim();
const final = path.join(outDir, `${slug}${preview ? "-preview" : ""}.mp4`);
execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", rawOut, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.0:LRA=7", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", final]);
fs.rmSync(rawOut);
log(`done → ${path.relative(root, final)}`);
