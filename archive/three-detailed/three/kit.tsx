// Shared toolkit for the 3D locations: noise, procedural textures, cached geometry/materials,
// lighting helpers, sky, clouds, instancing. Everything is seeded so that every frame is deterministic.
import React, { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type V3 = [number, number, number];

// Geometry and textures are expensive and each render worker remounts scenes, so keep them per page.
const CACHE = new Map<string, unknown>();
export const once = <T,>(key: string, make: () => T): T => {
  if (!CACHE.has(key)) CACHE.set(key, make());
  return CACHE.get(key) as T;
};

// ---------------------------------------------------------------- noise
export const RNG = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash2 = (x: number, y: number, s: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
export const noise2 = (x: number, y: number, s = 0) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
export const fbm = (x: number, y: number, oct = 4, s = 0) => {
  let sum = 0, amp = 0.5, tot = 0;
  for (let i = 0; i < oct; i++) { sum += noise2(x, y, s + i * 13) * amp; tot += amp; x *= 2.03; y *= 2.03; amp *= 0.5; }
  return sum / tot;
};
export const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const c3 = (hex: string) => new THREE.Color(hex);
export const mixHex = (a: string, b: string, t: number) => "#" + c3(a).lerp(c3(b), t).getHexString();
const jitter = (hex: string, r: () => number, amt: number) => { const c = c3(hex); const k = 1 + (r() - 0.5) * amt; return `rgb(${(c.convertLinearToSRGB().r * 255 * k) | 0},${(c.g * 255 * k) | 0},${(c.b * 255 * k) | 0})`; };

// ---------------------------------------------------------------- procedural textures
type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;
export const canvasTex = (key: string, w: number, h: number, draw: Draw, repeat: [number, number] = [1, 1], srgb = true) =>
  once(`tex:${key}:${repeat}`, () => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d")!, w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = 8;
    return t;
  });

const speckle = (g: CanvasRenderingContext2D, w: number, h: number, n: number, seed: number, a: number, size = 2) => {
  const r = RNG(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a * r()})` : `rgba(0,0,0,${a * r()})`;
    g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size);
  }
};

export const woodTex = (base: string, repeat: [number, number], planks = 8) =>
  canvasTex(`wood${base}${planks}`, 1024, 1024, (g, w, h) => {
    const r = RNG(11), ph = h / planks;
    for (let i = 0; i < planks; i++) {
      let x = -r() * 500;
      while (x < w) {
        const len = 340 + r() * 380;
        g.fillStyle = jitter(base, r, 0.26);
        g.fillRect(x, i * ph, len, ph);
        for (let k = 0; k < 16; k++) {
          g.strokeStyle = `rgba(50,24,8,${0.05 + r() * 0.1})`;
          g.lineWidth = 1 + r() * 1.6;
          const y = i * ph + r() * ph;
          g.beginPath(); g.moveTo(x, y);
          g.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 14, x + len * 0.7, y + (r() - 0.5) * 14, x + len, y + (r() - 0.5) * 6);
          g.stroke();
        }
        g.fillStyle = "rgba(25,12,5,.75)"; g.fillRect(x + len - 2, i * ph, 3, ph);
        x += len;
      }
      g.fillStyle = "rgba(25,12,5,.8)"; g.fillRect(0, i * ph - 1.5, w, 3);
    }
  }, repeat);

export const carpetTex = (base: string, repeat: [number, number], tiles = 0) =>
  canvasTex(`carpet${base}${tiles}`, 512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 26000, 5, 0.16, 2);
    if (tiles) {
      const r = RNG(3), s = w / tiles;
      for (let i = 0; i < tiles; i++) for (let j = 0; j < tiles; j++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.06)"; g.fillRect(i * s, j * s, s, s); }
      g.strokeStyle = "rgba(0,0,0,.2)"; g.lineWidth = 2;
      for (let i = 0; i <= tiles; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
    }
  }, repeat);

export const brickTex = (base: string, repeat: [number, number]) =>
  canvasTex(`brick${base}`, 1024, 1024, (g, w, h) => {
    g.fillStyle = "#cdbfae"; g.fillRect(0, 0, w, h);
    const r = RNG(21), bh = h / 16, bw = w / 8;
    for (let j = 0; j < 16; j++) for (let i = -1; i < 9; i++) {
      g.fillStyle = jitter(base, r, 0.3);
      g.fillRect(i * bw + (j % 2 ? bw / 2 : 0) + 3, j * bh + 3, bw - 6, bh - 6);
    }
    speckle(g, w, h, 12000, 8, 0.1, 3);
  }, repeat);

export const sidingTex = (base: string, repeat: [number, number]) =>
  canvasTex(`siding${base}`, 256, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let j = 0; j < 12; j++) {
      const y = (j * h) / 12;
      const grd = g.createLinearGradient(0, y, 0, y + h / 12);
      grd.addColorStop(0, "rgba(0,0,0,.26)"); grd.addColorStop(0.16, "rgba(255,255,255,.1)"); grd.addColorStop(1, "rgba(0,0,0,.05)");
      g.fillStyle = grd; g.fillRect(0, y, w, h / 12);
    }
  }, repeat);

export const shingleTex = (base: string, repeat: [number, number]) =>
  canvasTex(`shingle${base}`, 512, 512, (g, w, h) => {
    const r = RNG(31), rows = 10, sw = w / 10, sh = h / rows;
    for (let j = 0; j < rows; j++) for (let i = -1; i < 11; i++) {
      g.fillStyle = jitter(base, r, 0.3);
      g.fillRect(i * sw + (j % 2 ? sw / 2 : 0), j * sh, sw - 2, sh - 2);
    }
    speckle(g, w, h, 9000, 4, 0.14, 2);
  }, repeat);

export const asphaltTex = (repeat: [number, number]) =>
  canvasTex("asphalt", 1024, 1024, (g, w, h) => {
    g.fillStyle = "#6b6c73"; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 90000, 9, 0.2, 2.4);
    const r = RNG(77);
    for (let i = 0; i < 7; i++) {
      g.strokeStyle = "rgba(24,24,28,.5)"; g.lineWidth = 1.4 + r() * 2;
      let x = r() * w, y = r() * h;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 12; k++) { x += (r() - 0.5) * 80; y += r() * 40; g.lineTo(x, y); }
      g.stroke();
    }
  }, repeat);

export const concreteTex = (base: string, repeat: [number, number], joints = true) =>
  canvasTex(`concrete${base}${joints}`, 512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 14000, 14, 0.09, 3);
    if (joints) { g.fillStyle = "rgba(40,36,30,.5)"; g.fillRect(0, 0, w, 5); g.fillRect(0, 0, 5, h); }
  }, repeat);

/** Soft mottling that gives terrain vertex colors a surface. Stays neutral so it just multiplies. */
export const detailTex = (repeat: number, kind: "grass" | "sand" | "dirt") =>
  canvasTex(`detail${kind}`, 1024, 1024, (g, w, h) => {
    g.fillStyle = "#e4e4e4"; g.fillRect(0, 0, w, h);
    const r = RNG(kind.length * 7);
    if (kind === "sand") {
      for (let y = 0; y < h; y += 11) {
        g.strokeStyle = `rgba(90,50,10,${0.015 + r() * 0.05})`; g.lineWidth = 3.5;
        g.beginPath();
        for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin((x / w) * Math.PI * 6 + y * 0.09) * 7 + Math.sin((x / w) * Math.PI * 2) * 9);
        g.stroke();
      }
      speckle(g, w, h, 30000, 2, 0.1, 1.6);
    } else {
      speckle(g, w, h, kind === "grass" ? 70000 : 44000, 6, 0.26, kind === "grass" ? 5 : 4);
      if (kind === "grass") for (let i = 0; i < 2200; i++) {
        g.strokeStyle = r() > 0.5 ? "rgba(255,255,190,.17)" : "rgba(0,50,10,.2)"; g.lineWidth = 1.5;
        const x = r() * w, y = r() * h;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 12, y - 8 - r() * 14); g.stroke();
      }
    }
  }, [repeat, repeat]);

const gradientTex = (key: string, draw: (g: CanvasRenderingContext2D, s: number) => void) => canvasTex(key, 128, 128, (g) => draw(g, 128), [1, 1], false);
const blobTex = () => gradientTex("blob", (g, s) => {
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, "#fff"); grd.addColorStop(0.55, "#999"); grd.addColorStop(1, "#000");
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
});
const edgeTex = () => gradientTex("edge", (g, s) => {
  const grd = g.createLinearGradient(0, s, 0, 0); // dark at v=0 (the corner), clear at v=1
  grd.addColorStop(0, "#fff"); grd.addColorStop(0.35, "#6a6a6a"); grd.addColorStop(1, "#000");
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
});

// ---------------------------------------------------------------- materials
export type MatOpts = { r?: number; m?: number; e?: string; ei?: number; map?: THREE.Texture; a?: number; ds?: boolean; flat?: boolean };
export const mat = (c: string, o: MatOpts = {}) =>
  once(`mat:${c}:${o.r}:${o.m}:${o.e}:${o.ei}:${o.map?.uuid}:${o.a}:${o.ds}:${o.flat}`, () =>
    new THREE.MeshStandardMaterial({
      color: c, roughness: o.r ?? 0.82, metalness: o.m ?? 0, emissive: o.e ?? "#000000", emissiveIntensity: o.ei ?? 1, map: o.map ?? null,
      transparent: o.a !== undefined, opacity: o.a ?? 1, depthWrite: o.a === undefined, side: o.ds ? THREE.DoubleSide : THREE.FrontSide, flatShading: !!o.flat,
    }));

type Common = { p?: V3; rot?: V3; c?: string; o?: MatOpts; cast?: boolean; receive?: boolean };

export const B: React.FC<Common & { s: V3; r?: number }> = ({ p, s, r = 0, rot, c = "#ffffff", o, cast = true, receive = true }) => (
  <mesh position={p} rotation={rot} castShadow={cast} receiveShadow={receive} material={mat(c, o)}
    geometry={once(`box:${s}:${r}`, () => (r > 0 ? new RoundedBoxGeometry(s[0], s[1], s[2], 4, Math.min(r, Math.min(...s) / 2 - 0.0005)) : new THREE.BoxGeometry(...s)))} />
);
export const Cyl: React.FC<Common & { rt: number; rb?: number; h: number; seg?: number }> = ({ p, rot, rt, rb, h, seg = 20, c = "#ffffff", o, cast = true, receive = true }) => (
  <mesh position={p} rotation={rot} castShadow={cast} receiveShadow={receive} material={mat(c, o)}
    geometry={once(`cyl:${rt}:${rb}:${h}:${seg}`, () => new THREE.CylinderGeometry(rt, rb ?? rt, h, seg))} />
);
export const Ball: React.FC<Common & { r: number; s?: V3; seg?: number }> = ({ p, rot, r, s, seg = 20, c = "#ffffff", o, cast = true, receive = true }) => (
  <mesh position={p} rotation={rot} scale={s} castShadow={cast} receiveShadow={receive} material={mat(c, o)}
    geometry={once(`ball:${r}:${seg}`, () => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)))} />
);
export const Plane: React.FC<Common & { w: number; h: number }> = ({ p, rot, w, h, c = "#ffffff", o, cast = false, receive = true }) => (
  <mesh position={p} rotation={rot} castShadow={cast} receiveShadow={receive} material={mat(c, o)}
    geometry={once(`plane:${w}:${h}`, () => new THREE.PlaneGeometry(w, h))} />
);

/** Lightweight stand-in for ambient occlusion: a soft dark blob on the ground under an object. */
export const Blob: React.FC<{ p: V3; w: number; d?: number; a?: number }> = ({ p, w, d, a = 0.5 }) => (
  <mesh position={[p[0], p[1] + 0.012, p[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[w, d ?? w, 1]} renderOrder={1}
    material={once(`blob:${a}`, () => new THREE.MeshBasicMaterial({ color: "#000", alphaMap: blobTex(), transparent: true, opacity: a, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }))}
    geometry={once("unitplane", () => new THREE.PlaneGeometry(1, 1))} />
);
/** Dark gradient strip, dark along the edge at local -Y. Used to fake AO in room corners. */
export const AoStrip: React.FC<{ p: V3; rot: V3; w: number; h: number; a?: number }> = ({ p, rot, w, h, a = 0.34 }) => (
  <mesh position={p} rotation={rot} scale={[w, h, 1]} renderOrder={1}
    material={once(`aostrip:${a}`, () => new THREE.MeshBasicMaterial({ color: "#14100e", alphaMap: edgeTex(), transparent: true, opacity: a, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }))}
    geometry={once("unitplane", () => new THREE.PlaneGeometry(1, 1))} />
);

// ---------------------------------------------------------------- geometry building
type XF = { p?: V3; r?: V3; s?: V3 | number };
export const xf = <T extends THREE.BufferGeometry>(g: T, t: XF): T => {
  const s = typeof t.s === "number" ? [t.s, t.s, t.s] : t.s ?? [1, 1, 1];
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...(t.p ?? [0, 0, 0])), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(t.r ?? [0, 0, 0]))), new THREE.Vector3(...(s as V3)));
  g.applyMatrix4(m);
  return g;
};
/** Welds a geometry so displaced vertices stay connected and normals come out smooth. */
export const weld = (g: THREE.BufferGeometry) => {
  const clean = new THREE.BufferGeometry().setAttribute("position", (g.index ? g.toNonIndexed() : g).getAttribute("position"));
  return mergeVertices(clean, 1e-3);
};
export const displace = (g: THREE.BufferGeometry, f: (v: THREE.Vector3) => void) => {
  const pos = g.getAttribute("position"), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); f(v); pos.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  return g;
};
export const paint = (g: THREE.BufferGeometry, c: string | ((v: THREE.Vector3, n: THREE.Vector3) => THREE.Color)) => {
  const pos = g.getAttribute("position");
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  const nor = g.getAttribute("normal"), col = new Float32Array(pos.count * 3), v = new THREE.Vector3(), n = new THREE.Vector3(), fixed = typeof c === "string" ? c3(c) : null;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); n.fromBufferAttribute(nor, i);
    const k = fixed ?? (c as (a: THREE.Vector3, b: THREE.Vector3) => THREE.Color)(v, n);
    col[i * 3] = k.r; col[i * 3 + 1] = k.g; col[i * 3 + 2] = k.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
};
export const merge = (gs: THREE.BufferGeometry[]) =>
  mergeGeometries(gs.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(n.attributes)) if (!["position", "normal", "color"].includes(k)) n.deleteAttribute(k);
    return n;
  }))!;

export const terrainGeo = (key: string, w: number, d: number, seg: number, h: (x: number, z: number) => number, col: (x: number, z: number, y: number) => THREE.Color, center: [number, number] = [0, 0]) =>
  once(`terrain:${key}`, () => {
    const g = new THREE.PlaneGeometry(w, d, seg, seg);
    g.rotateX(-Math.PI / 2);
    g.translate(center[0], 0, center[1]);
    const pos = g.getAttribute("position"), colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = h(x, z);
      pos.setY(i, y);
      const c = col(x, z, y);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  });

// ---------------------------------------------------------------- instancing
export type Inst = { p: V3; s?: V3 | number; r?: V3; c?: string };
export const instanced = (key: string, geo: THREE.BufferGeometry, material: THREE.Material, items: Inst[], cast = true, receive = true) =>
  once(`inst:${key}`, () => {
    const mesh = new THREE.InstancedMesh(geo, material, items.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    items.forEach((it, i) => {
      const s = typeof it.s === "number" ? [it.s, it.s, it.s] : it.s ?? [1, 1, 1];
      m.compose(new THREE.Vector3(...it.p), q.setFromEuler(e.set(...(it.r ?? [0, 0, 0]))), new THREE.Vector3(...(s as V3)));
      mesh.setMatrixAt(i, m);
      if (it.c) mesh.setColorAt(i, c3(it.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = cast; mesh.receiveShadow = receive; mesh.frustumCulled = false;
    return mesh;
  });

/** A material whose vertices sway with height. Drive it by setting `.userData.time` each frame. */
export const swayMat = (key: string, opts: THREE.MeshStandardMaterialParameters, amp: number, heightRef: number) =>
  once(`sway:${key}`, () => {
    const m = new THREE.MeshStandardMaterial(opts);
    const u = { uTime: { value: 0 } };
    m.userData.u = u;
    m.onBeforeCompile = (s) => {
      s.uniforms.uTime = u.uTime;
      s.vertexShader = s.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec2 sw = instanceMatrix[3].xz;
          #else
            vec2 sw = vec2(0.0);
          #endif
          float bend = pow(clamp(position.y / ${heightRef.toFixed(2)}, 0.0, 1.0), 1.6);
          float gust = sin(uTime * 1.5 + sw.x * 0.22 + sw.y * 0.18) * 0.65 + sin(uTime * 3.3 + sw.x * 0.7 - sw.y * 0.5) * 0.35;
          transformed.x += bend * gust * ${amp.toFixed(3)};
          transformed.z += bend * (gust * 0.5 + 0.3) * ${amp.toFixed(3)};`);
    };
    m.customProgramCacheKey = () => `sway${amp}${heightRef}`;
    return m;
  });
export const setSway = (m: THREE.Material, t: number) => { (m.userData.u as { uTime: { value: number } }).uTime.value = t; };

// ---------------------------------------------------------------- camera / renderer
export type CamPath = { from: V3; to: V3; look0: V3; look1: V3; fov?: number; roll?: number };
export const CameraRig: React.FC<{ cam: CamPath; t: number; exposure?: number }> = ({ cam, t, exposure = 1 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = exposure;
  // Near-constant dolly so the camera is still moving through both dissolves, like the references.
  const e = t * 0.86 + (t * t * (3 - 2 * t)) * 0.14;
  const a = new THREE.Vector3(...cam.from).lerp(new THREE.Vector3(...cam.to), e);
  const l = new THREE.Vector3(...cam.look0).lerp(new THREE.Vector3(...cam.look1), e);
  a.y += Math.sin(t * 7.1) * 0.012;
  a.x += Math.sin(t * 5.3 + 1) * 0.012;
  camera.position.copy(a);
  camera.lookAt(l);
  camera.rotateZ(cam.roll ?? 0);
  if (camera.fov !== (cam.fov ?? 42) || camera.far !== 2400) {
    camera.fov = cam.fov ?? 42; camera.near = 0.08; camera.far = 2400;
    camera.updateProjectionMatrix();
  }
  return null;
};

export const Sun: React.FC<{ dir: V3; at?: V3; color?: string; i?: number; range?: number; res?: number; bias?: number }> = ({ dir, at = [0, 0, 0], color = "#fff2dc", i = 3, range = 30, res = 2048, bias = -0.0005 }) => {
  const target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(...at);
  const len = Math.hypot(...dir), dist = 200;
  return (
    <>
      <primitive object={target} />
      <directionalLight target={target} color={color} intensity={i} castShadow
        position={[at[0] + (dir[0] / len) * dist, at[1] + (dir[1] / len) * dist, at[2] + (dir[2] / len) * dist]}
        shadow-mapSize={[res, res]} shadow-bias={bias} shadow-normalBias={0.04} shadow-radius={5}
        shadow-camera-left={-range} shadow-camera-right={range} shadow-camera-top={range} shadow-camera-bottom={-range} shadow-camera-near={1} shadow-camera-far={500} />
    </>
  );
};

// ---------------------------------------------------------------- sky, clouds, atmosphere
export const Sky: React.FC<{ top: string; mid: string; low: string; sun?: V3; sunColor?: string; glow?: number }> = ({ top, mid, low, sun = [0.3, 0.5, -0.8], sunColor = "#fff4d8", glow = 1 }) => {
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { t: { value: c3(top) }, m: { value: c3(mid) }, l: { value: c3(low) }, s: { value: new THREE.Vector3(...sun).normalize() }, sc: { value: c3(sunColor) }, g: { value: glow } },
    vertexShader: "varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `varying vec3 d; uniform vec3 t,m,l,s,sc; uniform float g;
      void main(){ vec3 n = normalize(d); float h = n.y;
        vec3 c = mix(l, m, smoothstep(-0.03, 0.2, h)); c = mix(c, t, smoothstep(0.14, 0.72, h));
        float a = max(dot(n, s), 0.0);
        c += sc * (pow(a, 900.0) * 3.5 + pow(a, 60.0) * 0.5 + pow(a, 6.0) * 0.16) * g;
        gl_FragColor = vec4(c, 1.0);
#include <colorspace_fragment>
      }`,
  }), [top, mid, low, sunColor, glow, sun]);
  return <mesh material={material} scale={1500} renderOrder={-10} frustumCulled={false} geometry={once("skysphere", () => new THREE.SphereGeometry(1, 32, 24))} />;
};

const cloudGeo = (seed: number) => once(`cloudgeo:${seed}`, () => {
  const r = RNG(seed), parts: THREE.BufferGeometry[] = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1), x = (k - 0.5) * 2.2 + (r() - 0.5) * 0.3, size = (0.34 + 0.42 * Math.sin(k * Math.PI)) * (0.8 + r() * 0.35);
    parts.push(xf(new THREE.IcosahedronGeometry(1, 3), { p: [x, size * 0.45 + r() * 0.1, (r() - 0.5) * 0.7], s: [size, size * 0.8, size * 0.9] }));
  }
  const g = merge(parts);
  return paint(g, (v, nn) => c3("#ffffff").lerp(c3("#a9b8d6"), smooth(0.45, -0.7, nn.y + v.y * 0.15)));
});
export const Clouds: React.FC<{ items: { p: V3; s: number; seed?: number }[]; t: number; speed?: number; tint?: string }> = ({ items, t, speed = 0.5, tint = "#ffffff" }) => (
  <>
    {items.map((it, i) => (
      <mesh key={i} position={[it.p[0] + t * speed * (1 + (i % 3) * 0.2), it.p[1], it.p[2]]} scale={[it.s, it.s * 0.75, it.s * 0.6]}
        geometry={cloudGeo(it.seed ?? i % 4)}
        material={once(`cloudmat:${tint}`, () => new THREE.MeshBasicMaterial({ vertexColors: true, color: tint, fog: false }))} />
    ))}
  </>
);

/** Additive volumetric-looking shaft: a rectangle extruded along a direction, fading out along its length. */
export const Shaft: React.FC<{ p: V3; w: number; h: number; dir: V3; len: number; color?: string; a?: number; plane?: "xy" | "xz"; soft?: boolean }> = ({ p, w, h, dir, len, color = "#fff0c8", a = 0.2, plane = "xy", soft = false }) => {
  const { geometry, material } = useMemo(() => {
    const m = Math.hypot(...dir), d = dir.map((v) => (v / m) * len) as V3;
    const corner = (x: number, y: number): V3 => (plane === "xy" ? [p[0] + x, p[1] + y, p[2]] : [p[0] + x, p[1], p[2] + y]);
    const c = [corner(-w / 2, -h / 2), corner(w / 2, -h / 2), corner(w / 2, h / 2), corner(-w / 2, h / 2)];
    const pos: number[] = [], fade: number[] = [];
    for (let i = 0; i < 4; i++) {
      const n0 = c[i], n1 = c[(i + 1) % 4];
      const f0: V3 = [n0[0] + d[0], n0[1] + d[1], n0[2] + d[2]], f1: V3 = [n1[0] + d[0], n1[1] + d[1], n1[2] + d[2]];
      pos.push(...n0, ...n1, ...f1, ...n0, ...f1, ...f0);
      fade.push(1, 1, 0, 1, 0, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("fade", new THREE.Float32BufferAttribute(fade, 1));
    const mt = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { c: { value: c3(color) }, a: { value: a }, b: { value: soft ? 1 : 0 } },
      vertexShader: "attribute float fade; varying float f; void main(){ f = fade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying float f; uniform vec3 c; uniform float a, b; void main(){ gl_FragColor = vec4(c, a * mix(f * f, 4.0 * f * (1.0 - f), b));\n#include <colorspace_fragment>\n }",
    });
    return { geometry: g, material: mt };
  }, [p, w, h, dir, len, color, a, plane, soft]);
  return <mesh geometry={geometry} material={material} renderOrder={5} frustumCulled={false} />;
};

/** Soft-edged light ray: a camera-facing ribbon that fades across its width and along its length. */
export const SoftRay: React.FC<{ from: V3; dir: V3; len: number; w: number; color?: string; a?: number }> = ({ from, dir, len, w, color = "#fff0c8", a = 0.14 }) => {
  const { geometry, material } = useMemo(() => {
    const d = new THREE.Vector3(...dir).normalize(), side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(w / 2);
    const o = new THREE.Vector3(...from), e = o.clone().addScaledVector(d, len);
    const a0 = o.clone().sub(side), a1 = o.clone().add(side), b0 = e.clone().sub(side), b1 = e.clone().add(side);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([...a0.toArray(), ...a1.toArray(), ...b1.toArray(), ...a0.toArray(), ...b1.toArray(), ...b0.toArray()], 3));
    g.setAttribute("q", new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], 2));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { c: { value: c3(color) }, a: { value: a } },
      vertexShader: "attribute vec2 q; varying vec2 v; void main(){ v = q; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `varying vec2 v; uniform vec3 c; uniform float a;
        void main(){ float s = sin(v.x * 3.14159); gl_FragColor = vec4(c, a * s * s * 4.0 * v.y * (1.0 - v.y));
#include <colorspace_fragment>
        }`,
    });
    return { geometry: g, material: m };
  }, [from, dir, len, w, color, a]);
  return <mesh geometry={geometry} material={material} renderOrder={5} frustumCulled={false} />;
};

/** Glow sprite, for lamps, the sun, and anything that should bloom. */
export const Glow: React.FC<{ p: V3; s: number; color: string; a?: number }> = ({ p, s, color, a = 0.7 }) => {
  const material = useMemo(() => new THREE.SpriteMaterial({ map: blobTex(), color, transparent: true, opacity: a, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), [color, a]);
  return <sprite position={p} scale={[s, s, 1]} material={material} renderOrder={6} />;
};

/** Floating dust, seeded, moves with frame time only. */
export const Motes: React.FC<{ center: V3; size: V3; n: number; t: number; color?: string; px?: number; a?: number; seed?: number }> = ({ center, size, n, t, color = "#ffeec8", px = 26, a = 0.75, seed = 1 }) => {
  const { geometry, material } = useMemo(() => {
    const r = RNG(seed), pos = new Float32Array(n * 3), ph = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * size[0]; pos[i * 3 + 1] = (r() - 0.5) * size[1]; pos[i * 3 + 2] = (r() - 0.5) * size[2];
      ph[i] = r() * 6.28;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("ph", new THREE.BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { t: { value: 0 }, c: { value: c3(color) }, px: { value: px }, a: { value: a } },
      vertexShader: `attribute float ph; uniform float t, px; varying float tw;
        void main(){ vec3 q = position; q.x += sin(t*0.5+ph)*0.22; q.y += sin(t*0.37+ph*2.0)*0.16 ; q.z += cos(t*0.43+ph)*0.22;
          vec4 mv = modelViewMatrix * vec4(q,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = px / max(-mv.z, 0.4); tw = 0.5 + 0.5 * sin(t*1.3+ph*3.0); }`,
      fragmentShader: `uniform vec3 c; uniform float a; varying float tw;
        void main(){ float d = length(gl_PointCoord-0.5); float s = smoothstep(0.5,0.05,d); gl_FragColor = vec4(c, s*a*tw);
#include <colorspace_fragment>\n }`,
    });
    return { geometry: g, material: m };
  }, [n, seed, size, color, px, a]);
  material.uniforms.t.value = t;
  return <points position={center} geometry={geometry} material={material} frustumCulled={false} renderOrder={7} />;
};
