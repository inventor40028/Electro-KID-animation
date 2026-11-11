// Renders the 3D location showcase at half resolution (540x960).
//
//   npx tsx scripts/locations3d.ts            full showcase video
//   npx tsx scripts/locations3d.ts --stills   one still per location
//   npx tsx scripts/locations3d.ts --stills --at=0.9 --only=office,forest
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opt = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const outDir = path.join(root, "out/locations-3d");
fs.mkdirSync(outDir, { recursive: true });

const chromiumOptions = { gl: "angle" as const, ignoreCertificateErrors: false, headless: true };
const SHOT = 135, OVERLAP = 10;
const IDS = ["office", "bedroom", "plains", "forest", "desert", "street"];

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const browser = await openBrowser("chrome", { chromiumOptions });
const composition = await selectComposition({ serveUrl, id: "Locations3D", puppeteerInstance: browser, chromiumOptions });

if (args.includes("--stills")) {
  const at = Number(opt("at") ?? 0.55);
  const only = opt("only")?.split(",") ?? IDS;
  const dir = path.join(outDir, "stills");
  fs.mkdirSync(dir, { recursive: true });
  for (const [i, id] of IDS.entries()) {
    if (!only.includes(id)) continue;
    const started = Date.now();
    const output = path.join(dir, `${id}.png`);
    await renderStill({ composition, serveUrl, frame: i * (SHOT - OVERLAP) + Math.floor(SHOT * at), output, scale: 0.5, puppeteerInstance: browser, chromiumOptions, timeoutInMilliseconds: 240000 });
    console.log(`${id}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
  await browser.close({ silent: true });
  process.exit(0);
}

const started = Date.now();
let last = -1;
const output = path.join(outDir, "locations-3d.mp4");
await renderMedia({
  composition, serveUrl, codec: "h264", outputLocation: output, scale: 0.5, crf: 16, muted: true, imageFormat: "jpeg", jpegQuality: 95,
  concurrency: Number(opt("concurrency") ?? 2), chromiumOptions, timeoutInMilliseconds: 240000, puppeteerInstance: browser,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 20);
    if (p !== last) { last = p; console.log(`${Math.round(progress * 100)}%  ${((Date.now() - started) / 1000).toFixed(0)}s`); }
  },
});
await browser.close({ silent: true });
console.log(`done -> ${path.relative(root, output)} in ${((Date.now() - started) / 1000).toFixed(0)}s`);
