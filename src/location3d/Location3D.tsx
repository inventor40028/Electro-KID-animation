// Draws one location from its JSON: low-poly ground, inked objects, one sun.
import React, { useEffect, useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { INK } from "../theme";
import type { LocationData, Objects, Part } from "./schema";
import type { Extra, View } from "./stage";

/** The settings every location canvas uses. */
export const CANVAS = { shadows: "percentage" as const, flat: true, gl: { antialias: true, preserveDrawingBuffer: true }, camera: { near: 0.1, far: 3000 } };

const CACHE = new Map<string, unknown>();
const once = <T,>(key: string, make: () => T): T => {
  if (!CACHE.has(key)) CACHE.set(key, make());
  return CACHE.get(key) as T;
};

// ---- live search screen: the 3D desktop monitor plays the REAL search frames ----
const LIVE_CANVAS = document.createElement("canvas");
LIVE_CANVAS.width = 360;
LIVE_CANVAS.height = 240;
const LIVE_CTX = LIVE_CANVAS.getContext("2d")!;
const LIVE_TEX = new THREE.CanvasTexture(LIVE_CANVAS);
LIVE_TEX.colorSpace = THREE.SRGBColorSpace;
const SEARCH_IMGS: HTMLImageElement[] = [];
let _searchLoaded = false;
function ensureSearchLoaded() {
  if (_searchLoaded) return;
  _searchLoaded = true;
  for (let i = 0; i < 40; i++) {
    const im = new Image();
    im.src = staticFile(`screenrec/search/f${String(17 + i).padStart(3, "0")}.jpg`);
    SEARCH_IMGS.push(im);
  }
}
function paintLiveScreen(t: number) {
  ensureSearchLoaded();
  const got = SEARCH_IMGS.filter((im) => im.width > 0 && im.naturalWidth > 0);
  const c = LIVE_CTX;
  if (got.length) {
    const idx = Math.floor(Math.max(0, t) * 45) % got.length;
    c.clearRect(0, 0, 360, 240);
    c.drawImage(got[idx], 0, 0, 360, 240);
  } else {
    c.fillStyle = "#111111";
    c.fillRect(0, 0, 360, 240);
  }
  LIVE_TEX.needsUpdate = true;
}
const LiveScreen: React.FC<{ t: number }> = ({ t }) => {
  useEffect(() => { paintLiveScreen(t); }, [t]);
  return null;
};

// ---------------------------------------------------------------- noise
const RNG = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash = (x: number, y: number, s: number) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
const noise = (x: number, y: number, s: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x: number, y: number, s: number) => (noise(x, y, s) * 4 + noise(x * 2.1, y * 2.1, s + 5) * 2 + noise(x * 4.3, y * 4.3, s + 9)) / 7;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- surface patterns: white with ink lines, tinted by the part color
const patternTexture = (pattern: string, tile: number) =>
  once(`pat:${pattern}:${tile}`, () => {
    const S = 512, c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d")!, r = RNG(pattern.length * 17);
    g.fillStyle = "#fff"; g.fillRect(0, 0, S, S);
    const line = "rgba(40,26,18,.55)";
    const shade = (x: number, y: number, w: number, h: number, amt: number) => { g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${r() * amt})` : `rgba(40,26,18,${r() * amt})`; g.fillRect(x, y, w, h); };
    g.fillStyle = line;
    if (pattern === "planks") {
      const rows = 5, h = S / rows;
      for (let j = 0; j < rows; j++) {
        const off = r() * S;
        for (let k = 0; k < 2; k++) { const x = (off + (k * S) / 2) % S; shade(x, j * h, S / 2, h, 0.16); shade(x - S, j * h, S / 2, h, 0.16); g.fillStyle = line; g.fillRect(x, j * h, 4, h); }
        g.fillStyle = line; g.fillRect(0, j * h, S, 4);
      }
    } else if (pattern === "bricks") {
      const rows = 8, h = S / rows, w = S / 4;
      for (let j = 0; j < rows; j++) {
        for (let i = -1; i < 5; i++) { const x = i * w + (j % 2 ? w / 2 : 0); shade(x, j * h, w, h, 0.12); g.fillStyle = line; g.fillRect(x, j * h, 4, h); }
        g.fillStyle = line; g.fillRect(0, j * h, S, 4);
      }
    } else if (pattern === "tiles") {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) shade((i * S) / 2, (j * S) / 2, S / 2, S / 2, 0.07);
      g.fillStyle = line; g.fillRect(0, 0, S, 4); g.fillRect(0, S / 2, S, 4); g.fillRect(0, 0, 4, S); g.fillRect(S / 2, 0, 4, S);
    } else if (pattern === "siding") {
      for (let j = 0; j < 6; j++) { g.fillStyle = "rgba(40,26,18,.34)"; g.fillRect(0, (j * S) / 6, S, 8); }
    } else if (pattern === "shingles") {
      const rows = 6, h = S / rows, w = S / 6;
      for (let j = 0; j < rows; j++) {
        for (let i = -1; i < 7; i++) { const x = i * w + (j % 2 ? w / 2 : 0); shade(x, j * h, w, h, 0.2); g.fillStyle = line; g.fillRect(x, j * h, 4, h); }
        g.fillStyle = line; g.fillRect(0, j * h, S, 5);
      }
    } else { // stripes
      for (let i = 0; i < 4; i++) { g.fillStyle = "rgba(40,26,18,.13)"; g.fillRect((i * S) / 4, 0, S / 8, S); }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / tile, 1 / tile); t.anisotropy = 8;
    return t;
  });

const signTexture = (text: string, bg: string, fg: string, w: number, h: number) =>
  once(`sign:${text}:${bg}:${fg}:${w}:${h}`, () => {
    const c = document.createElement("canvas"); c.height = 256; c.width = Math.max(128, Math.round((256 * w) / h));
    const g = c.getContext("2d")!;
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    const lines = text.split("|");
    let size = 256 / (lines.length * 1.3);
    g.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > c.width * 0.9) size *= (c.width * 0.9) / widest;
    g.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    lines.forEach((l, i) => g.fillText(l, c.width / 2, 128 + (i - (lines.length - 1) / 2) * size * 1.2));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  });

// ---------------------------------------------------------------- shapes. Every shape's origin is its bottom center.
const leafGeometry = (len: number, width: number) => {
  const g = new THREE.PlaneGeometry(1, 1, 2, 8);
  const p = g.getAttribute("position"), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const t = v.y + 0.5, w = Math.sin(Math.pow(t, 0.75) * Math.PI) * (width / 2) * (v.x * 2);
    p.setXYZ(i, w, Math.sin(t * 2.5) * len * 0.5 - Math.abs(w) * 0.25, t * len);
  }
  g.computeVertexNormals();
  return g;
};
const lump = (r: number, detail: number, amount: number) => {
  const base = new THREE.BufferGeometry().setAttribute("position", new THREE.IcosahedronGeometry(1, detail).getAttribute("position"));
  const g = mergeVertices(base, 1e-3), p = g.getAttribute("position"), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.multiplyScalar(r * (1 - amount + amount * 2 * fbm(v.x * 1.6 + 3, v.y * 1.6 + v.z * 1.3, r * 7)));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};
const scaleUv = (g: THREE.BoxGeometry, [w, h, d]: [number, number, number]) => {
  const uv = g.getAttribute("uv"), sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * sizes[f][0], uv.getY(k) * sizes[f][1]); }
  return g;
};

const geometryOf = (p: Part): THREE.BufferGeometry => {
  const key = JSON.stringify([p.box, p.round, p.cyl, p.cone, p.seg, p.ball, p.rock, p.blob, p.roof, p.wall, p.holes, p.profile, p.depth, p.bevel, p.tube, p.r, p.leaf, p.sign]);
  return once(`geo:${key}`, () => {
    if (p.box) {
      const [w, h, d] = p.box;
      const g = p.round ? new RoundedBoxGeometry(w, h, d, 3, Math.min(p.round, Math.min(w, h, d) / 2 - 1e-4)) : scaleUv(new THREE.BoxGeometry(w, h, d), p.box);
      return g.translate(0, h / 2, 0);
    }
    if (p.cyl) { const [a, b, h] = p.cyl.length === 2 ? [p.cyl[0], p.cyl[0], p.cyl[1]] : p.cyl; return new THREE.CylinderGeometry(a, b, h, p.seg ?? 32).translate(0, h / 2, 0); }
    if (p.cone) { const [r, h] = p.cone; return new THREE.ConeGeometry(r, h, p.seg ?? 24).translate(0, h / 2, 0); }
    if (p.ball !== undefined) return new THREE.SphereGeometry(p.ball, 24, 16).translate(0, p.ball, 0);
    if (p.rock !== undefined) return lump(p.rock, 1, 0.35).translate(0, p.rock * 0.65, 0);
    if (p.blob !== undefined) return lump(p.blob, 3, 0.3).translate(0, p.blob * 0.85, 0);
    if (p.roof) {
      const [w, h, d] = p.roof;
      const s = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, h)]);
      return new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-w / 2, 0, 0);
    }
    if (p.wall) {
      const [w, h, t] = p.wall;
      const s = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, h), new THREE.Vector2(-w / 2, h)]);
      for (const [cx, y, hw, hh] of p.holes ?? []) s.holes.push(new THREE.Path([new THREE.Vector2(cx - hw / 2, y), new THREE.Vector2(cx - hw / 2, y + hh), new THREE.Vector2(cx + hw / 2, y + hh), new THREE.Vector2(cx + hw / 2, y)]));
      return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }).translate(0, 0, -t / 2);
    }
    if (p.profile) {
      const s = new THREE.Shape(p.profile.map(([x, y]) => new THREE.Vector2(x, y))), d = p.depth ?? 0.1, b = p.bevel ?? 0;
      return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: b > 0, bevelSize: b, bevelThickness: b, bevelSegments: 2 }).translate(0, 0, -d / 2);
    }
    if (p.tube) return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p.tube.map((v) => new THREE.Vector3(...v))), Math.max(8, p.tube.length * 8), p.r ?? 0.02, 8, false);
    if (p.leaf) return leafGeometry(p.leaf[0], p.leaf[1]);
    const [w, h] = p.sign!;
    return new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);
  });
};

// Outlines need one smooth normal per corner, or they split open on boxes.
const inkGeometryOf = (g: THREE.BufferGeometry) =>
  once(`ink:${g.uuid}`, () => {
    const src = g.index ? g.toNonIndexed() : g;
    const welded = mergeVertices(new THREE.BufferGeometry().setAttribute("position", src.getAttribute("position").clone()), 1e-3);
    welded.computeVertexNormals();
    return welded;
  });
const inkMaterial = once("inkmat", () => new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: { c: { value: new THREE.Color(INK) }, w: { value: 3.0 }, res: { value: new THREE.Vector2(1080, 1920) } },
  vertexShader: `uniform float w; uniform vec2 res;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec4 clip = projectionMatrix * mv;
      vec3 nv = normalize(normalMatrix * normal);
      vec2 dir = normalize((projectionMatrix * vec4(nv.xy, 0.0, 0.0)).xy + vec2(1e-5));
      clip.xy += dir * (w * clamp(16.0 / -mv.z, 0.35, 1.0)) * 2.0 / res * clip.w;
      gl_Position = clip;
    }`,
  fragmentShader: "uniform vec3 c; void main(){ gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}",
}));

const materialOf = (p: Part, color: string, doubleSided: boolean): THREE.Material => {
  const facets = p.flat ?? (p.rock !== undefined || p.blob !== undefined || (p.cone !== undefined && (p.seg ?? 24) < 14));
  const map = p.screen ? LIVE_TEX : p.sign ? signTexture(p.text ?? "", color, p.textColor ?? "#22160e", p.sign[0], p.sign[1]) : p.pattern ? patternTexture(p.pattern, p.tile ?? 1) : null;
  const unlit = !!p.glow || !!p.screen;
  return once(`mat:${color}:${unlit}:${facets}:${map?.uuid}:${p.opacity}:${doubleSided}`, () => {
    const common = { color: p.sign || p.screen ? "#ffffff" : color, map, transparent: p.opacity !== undefined, opacity: p.opacity ?? 1, depthWrite: p.opacity === undefined, side: doubleSided ? THREE.DoubleSide : THREE.FrontSide };
    return unlit ? new THREE.MeshBasicMaterial(common) : new THREE.MeshLambertMaterial({ ...common, flatShading: facets });
  });
};

// ---------------------------------------------------------------- flatten the JSON tree into a list of meshes
type Drawn = { geometry: THREE.BufferGeometry; material: THREE.Material; matrix: THREE.Matrix4; ink: boolean; cast: boolean; color: string };
const rad = (d: number) => (d * Math.PI) / 180;

const flatten = (parts: Part[], objects: Objects, parent: THREE.Matrix4, main: string | undefined, inObject: boolean, out: Drawn[]) => {
  for (const p of parts) {
    const count = p.repeat?.count ?? 1, step = p.repeat?.step ?? [0, 0, 0], spin = p.repeat?.turn ?? 0;
    const turn = typeof p.turn === "number" ? [0, p.turn, 0] : p.turn;
    const sc = typeof p.scale === "number" ? [p.scale, p.scale, p.scale] : p.scale;
    for (let i = 0; i < count; i++) {
      const m = parent.clone().multiply(new THREE.Matrix4().compose(
        new THREE.Vector3(p.at[0] + step[0] * i, p.at[1] + step[1] * i, p.at[2] + step[2] * i),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(turn[0]), rad(turn[1] + spin * i), rad(turn[2]))),
        new THREE.Vector3(sc[0], sc[1], sc[2]),
      ));
      if (p.use) {
        const obj = objects[p.use];
        flatten(obj.parts, objects, m, p.color && p.color !== "main" ? p.color : obj.main, true, out);
        continue;
      }
      const color = p.color === "main" ? main ?? "#cccccc" : p.color!;
      const thin = p.leaf !== undefined || p.sign !== undefined || p.tube !== undefined;
      out.push({
        geometry: geometryOf(p), material: materialOf(p, color, p.leaf !== undefined), matrix: m, color,
        ink: p.ink ?? (inObject && !p.glow && !thin && p.opacity === undefined), cast: p.shadow && !p.glow && p.opacity === undefined,
      });
    }
  }
};

const Mesh: React.FC<{ d: Drawn }> = ({ d }) => (
  <>
    <mesh geometry={d.geometry} material={d.material} matrix={d.matrix} matrixAutoUpdate={false} castShadow={d.cast} receiveShadow={d.material.type === "MeshLambertMaterial"} />
    {d.ink && <mesh geometry={inkGeometryOf(d.geometry)} material={inkMaterial} matrix={d.matrix} matrixAutoUpdate={false} />}
  </>
);

// ---------------------------------------------------------------- terrain
type T = NonNullable<LocationData["terrain"]>;
const groundHeight = (t: T, x: number, z: number) => {
  const k = smooth(t.flat, t.flat + t.rise, Math.abs(x));
  return k * t.height * 1.9 * Math.max(0, fbm(x * t.noise + t.seed * 3, z * t.noise, t.seed) - 0.28);
};
/** Height of the actual facet at x,z, so things sit exactly on the ground. */
const heightOnFacet = (t: T, x: number, z: number) => {
  const gx = Math.floor(x / t.cell), gz = Math.floor(z / t.cell), fx = x / t.cell - gx, fz = z / t.cell - gz;
  const h = (i: number, j: number) => groundHeight(t, (gx + i) * t.cell, (gz + j) * t.cell);
  return fx + fz < 1 ? h(0, 0) + (h(1, 0) - h(0, 0)) * fx + (h(0, 1) - h(0, 0)) * fz : h(1, 1) + (h(0, 1) - h(1, 1)) * (1 - fx) + (h(1, 0) - h(1, 1)) * (1 - fz);
};
const terrainGeometry = (t: T) =>
  once(`terrain:${JSON.stringify(t)}`, () => {
    const cells = Math.round(t.size / t.cell), o = -Math.round(cells / 2), pos: number[] = [], col: number[] = [];
    const palette = t.colors.map((c) => new THREE.Color(c)), c = new THREE.Color(), r = RNG(t.seed + 40);
    const pushTri = (a: number[], b: number[], d: number[]) => {
      pos.push(...a, ...b, ...d);
      const v = fbm((a[0] + b[0] + d[0]) * 0.012 + 8, (a[2] + b[2] + d[2]) * 0.012, t.seed + 2) * (palette.length - 1) * 1.45 - 0.2;
      const i = Math.max(0, Math.min(palette.length - 1, v)), lo = Math.floor(i), hi = Math.min(palette.length - 1, lo + 1);
      c.copy(palette[lo]).lerp(palette[hi], smooth(0.35, 0.65, i - lo)).multiplyScalar(0.95 + r() * 0.1);
      for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
    };
    for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) {
      const v = (a: number, b: number) => { const x = (o + i + a) * t.cell, z = (o + j + b) * t.cell; return [x, groundHeight(t, x, z), z]; };
      const a = v(0, 0), b = v(1, 0), d = v(0, 1), e = v(1, 1);
      pushTri(a, d, b); pushTri(b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  });
const terrainMaterial = once("terrainmat", () => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));

// ---------------------------------------------------------------- scatter: one instanced draw call per object
const Scattered: React.FC<{ s: LocationData["scatter"][number]; objects: Objects; terrain?: T; id: string }> = ({ s, objects, terrain, id }) => {
  const mesh = once(`scatter:${id}:${JSON.stringify(s)}`, () => {
    const drawn: Drawn[] = [];
    flatten(objects[s.use].parts, objects, new THREE.Matrix4(), objects[s.use].main, true, drawn);
    const merged = mergeGeometries(drawn.map((d) => {
      const g = (d.geometry.index ? d.geometry.toNonIndexed() : d.geometry.clone()).applyMatrix4(d.matrix);
      const n = g.getAttribute("position").count, c = new THREE.Color(d.color), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      for (const a of Object.keys(g.attributes)) if (!["position", "normal", "color"].includes(a)) g.deleteAttribute(a);
      return g;
    }))!;
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const r = RNG(s.seed + 7), inst = new THREE.InstancedMesh(merged, m, s.count), o = new THREE.Object3D();
    const [x1, z1, x2, z2] = s.area;
    for (let i = 0; i < s.count; i++) {
      let x = x1 + r() * (x2 - x1);
      if (Math.abs(x) < s.keepOut) x = Math.sign(x || 1) * (s.keepOut + r() * 2);
      const z = z1 + r() * (z2 - z1), k = s.scale[0] + r() * (s.scale[1] - s.scale[0]);
      o.position.set(x, terrain ? heightOnFacet(terrain, x, z) - 0.03 : 0, z);
      o.rotation.y = r() * 6.28; o.scale.setScalar(k); o.updateMatrix();
      inst.setMatrixAt(i, o.matrix);
    }
    inst.castShadow = true; inst.receiveShadow = true; inst.frustumCulled = false;
    return inst;
  });
  return <primitive object={mesh} />;
};

// ---------------------------------------------------------------- sky
const SkyDome: React.FC<{ colors: [string, string, string] }> = ({ colors }) => {
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(colors[0]) }, b: { value: new THREE.Color(colors[1]) }, c: { value: new THREE.Color(colors[2]) } },
    vertexShader: "varying vec3 d; void main(){ d = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying vec3 d; uniform vec3 a, b, c; void main(){ float h = normalize(d).y; vec3 k = mix(c, b, smoothstep(0.0, 0.16, h)); k = mix(k, a, smoothstep(0.12, 0.6, h)); gl_FragColor = vec4(k, 1.0);\n#include <colorspace_fragment>\n}",
  }), [colors]);
  return <mesh material={material} scale={1400} renderOrder={-1} frustumCulled={false}><sphereGeometry args={[1, 24, 16]} /></mesh>;
};

/** Put this inside a ThreeCanvas using CANVAS. Pass `t` (0 to 1) to fly the location's own camera, or `view` to control it. */
export const Location3D: React.FC<{ location: LocationData; objects: Objects; t?: number; view?: View; extras?: Extra[] }> = ({ location, objects, t = 0, view, extras = [] }) => {
  const { name, sky, ground, terrain, haze, sun, ambient, shade, camera: cam, parts, scatter } = location;
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  if (view) camera.position.set(...view.from);
  else camera.position.set(...cam.from).lerp(new THREE.Vector3(...cam.to), t);
  camera.lookAt(...(view?.look ?? cam.look));
  const fov = view?.fov ?? cam.fov;
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const drawn = useMemo(() => { const out: Drawn[] = []; flatten(parts, objects, new THREE.Matrix4(), undefined, false, out); return out; }, [parts, objects]);
  const extraDrawn: Drawn[] = [];
  flatten(extras.map((e) => ({ ...e, glow: false, shadow: true }) as Part), objects, new THREE.Matrix4(), undefined, false, extraDrawn);
  const len = Math.hypot(...sun.dir), r = sun.range;
  const floor = typeof ground === "string" ? { color: ground, pattern: undefined, tile: 1 } : ground;
  const floorSize = 400;
  const floorMap = floor?.pattern ? patternTexture(floor.pattern, floor.tile) : null;
  const floorGeo = once(`floor:${floorSize}`, () => { const g = new THREE.PlaneGeometry(floorSize, floorSize); const uv = g.getAttribute("uv"); for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * floorSize, uv.getY(i) * floorSize); return g; });
  return (
    <>
      {typeof sky === "string" ? <color attach="background" args={[sky]} /> : <SkyDome colors={sky} />}
      {haze && <fog attach="fog" args={[haze[0], haze[1], haze[2]]} />}
      <ambientLight intensity={ambient} color={shade} />
      <directionalLight position={sun.dir.map((v) => (v / len) * 220) as [number, number, number]} intensity={sun.strength} color={sun.color} castShadow
        shadow-mapSize={[4096, 4096]} shadow-bias={-0.0006} shadow-normalBias={0.03}
        shadow-camera-left={-r} shadow-camera-right={r} shadow-camera-top={r} shadow-camera-bottom={-r} shadow-camera-near={10} shadow-camera-far={500} />
      <directionalLight position={[3, 4, 10]} intensity={0.55} color="#ffffff" />
      {floor && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow geometry={floorGeo}>
          <meshLambertMaterial color={floor.color} map={floorMap} />
        </mesh>
      )}
      {terrain && <mesh geometry={terrainGeometry(terrain)} material={terrainMaterial} receiveShadow />}
      {drawn.map((d, i) => <Mesh key={i} d={d} />)}
      {extraDrawn.map((d, i) => <Mesh key={`x${i}`} d={d} />)}
      {scatter.map((s, i) => <Scattered key={i} s={s} objects={objects} terrain={terrain} id={`${name}${i}`} />)}
      <LiveScreen t={t} />
    </>
  );
};
