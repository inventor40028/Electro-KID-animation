// Reads and validates everything in locations/.
import path from "node:path";
import fs from "node:fs";
import { LocationSchema, ObjectsSchema, type LocationData, type Objects, type Part } from "../src/location3d/schema";

const dir = path.resolve(import.meta.dirname, "../locations");
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));

export const loadLibrary = (): { locations: LocationData[]; objects: Objects; errors: string[] } => {
  const errors: string[] = [];
  const report = (file: string, issues: { path: PropertyKey[]; message: string }[]) => {
    for (const i of issues) errors.push(`${file}: ${i.path.map(String).join(".") || "(top)"}: ${i.message}`);
  };

  const parsedObjects = ObjectsSchema.safeParse(read("_objects.json"));
  if (!parsedObjects.success) {
    report("_objects.json", parsedObjects.error.issues);
    return { locations: [], objects: {}, errors };
  }
  const objects = parsedObjects.data;
  const checkUse = (file: string, where: string, parts: Part[], seen: string[]) => parts.forEach((p, i) => {
    if (!p.use) return;
    const obj = objects[p.use];
    if (!obj) report(file, [{ path: [where, i, "use"], message: `no object called "${p.use}" in _objects.json` }]);
    else if (seen.includes(p.use)) report(file, [{ path: [where, i, "use"], message: `"${p.use}" contains itself` }]);
    else checkUse(file, `${where}.${i}>${p.use}`, obj.parts, [...seen, p.use]);
  });
  for (const [name, o] of Object.entries(objects)) checkUse("_objects.json", name, o.parts, [name]);

  const locations: LocationData[] = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort()) {
    const parsed = LocationSchema.safeParse(read(file));
    if (!parsed.success) { report(file, parsed.error.issues); continue; }
    if (parsed.data.name !== file.replace(".json", "")) report(file, [{ path: ["name"], message: "must match the file name" }]);
    checkUse(file, "parts", parsed.data.parts, []);
    for (const [i, s] of parsed.data.scatter.entries()) if (!objects[s.use]) report(file, [{ path: ["scatter", i, "use"], message: `no object called "${s.use}" in _objects.json` }]);
    locations.push(parsed.data);
  }
  return { locations, objects, errors };
};
