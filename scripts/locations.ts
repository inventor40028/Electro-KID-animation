// Checks and previews the JSON locations in locations/.
//
//   npx tsx scripts/locations.ts --list               every location, object and prop that exists
//   npx tsx scripts/locations.ts --check              validate only
//   npx tsx scripts/locations.ts --stills             one picture per location, plus sheet.png input
//   npx tsx scripts/locations.ts --stills --only=barn just that location
//   npx tsx scripts/locations.ts                      540x960 preview video of all of them
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { PROPS } from "../src/catalog";
import { loadLibrary } from "./location-lib";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith("--only="))?.split("=")[1]?.split(",");
const SHOT_FRAMES = 120;

const { locations, objects, errors } = loadLibrary();
if (errors.length) { errors.forEach((e) => console.error(`\x1b[31m${e}\x1b[0m`)); process.exit(1); }
console.log(`ok: ${locations.length} locations, ${Object.keys(objects).length} objects`);
if (args.includes("--list")) {
  console.log(`\nLOCATIONS (3D, for "location"):\n  ${locations.map((l) => l.name).join(", ")}`);
  console.log(`\nOBJECTS (3D, for a prop "type" in a 3D location):\n  ${Object.keys(objects).join(", ")}`);
  console.log(`\n2D PROPS (for a prop "type" or for "holding"):\n  ${PROPS.join(", ")}`);
  process.exit(0);
}
if (args.includes("--check")) process.exit(0);

const picked = only ? locations.filter((l) => only.includes(l.name)) : locations;
if (!picked.length) { console.error("no location matches --only"); process.exit(1); }
const outDir = path.join(root, "out/locations");
fs.mkdirSync(outDir, { recursive: true });

const inputProps = { locations: picked, objects };
const chromiumOptions = { gl: "angle" as const };
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const browser = await openBrowser("chrome", { chromiumOptions });
const composition = await selectComposition({ serveUrl, id: "LocationsPreview", inputProps, puppeteerInstance: browser, chromiumOptions });

if (args.includes("--stills")) {
  for (const [i, l] of picked.entries()) {
    await renderStill({ composition, serveUrl, inputProps, frame: i * SHOT_FRAMES + 60, output: path.join(outDir, `${l.name}.png`), scale: 0.5, puppeteerInstance: browser, chromiumOptions });
    console.log(`out/locations/${l.name}.png`);
  }
} else {
  const output = path.join(outDir, "locations.mp4");
  await renderMedia({ composition, serveUrl, inputProps, codec: "h264", outputLocation: output, scale: 0.5, crf: 18, muted: true, concurrency: 2, puppeteerInstance: browser, chromiumOptions });
  console.log(`out/locations/locations.mp4`);
}
await browser.close({ silent: true });
process.exit(0);
