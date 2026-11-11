// Dev helper: render stills of a composition at given frames (or at the middle of every shot).
// usage: tsx scripts/stills.ts <CompositionId> <outDir> [frames comma list | "shots"] [scale] [propsJson]
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import type { Timeline } from "../src/schema";

const [id = "EnvTest", outDir = "out/dev/stills", which = "shots", scaleS = "0.5", propsPath] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, "..");
const inputProps = propsPath ? JSON.parse(fs.readFileSync(propsPath, "utf8")) : undefined;
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const comp = await selectComposition({ serveUrl, id, inputProps });
const props = comp.props as unknown as Timeline;
const frames = which === "shots"
  ? props.shots.map((s) => s.from + Math.floor(s.duration * 0.6))
  : which.split(",").map(Number);
fs.mkdirSync(outDir, { recursive: true });
for (const [i, f] of frames.entries()) {
  const out = path.join(outDir, `s${String(i).padStart(2, "0")}_f${f}.png`);
  await renderStill({ composition: comp, serveUrl, frame: f, output: out, scale: Number(scaleS), inputProps });
  process.stdout.write(`${out}\n`);
}
