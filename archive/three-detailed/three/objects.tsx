// Reusable 3D objects: vegetation and rocks (merged, vertex-colored, instancing friendly) and
// furniture / buildings / vehicles (plain meshes).
import React from "react";
import * as THREE from "three";
import {
  B, Ball, Blob, Cyl, Glow, Plane, RNG, V3, brickTex, canvasTex, displace, fbm, merge, mat, noise2, once, paint, shingleTex, sidingTex, smooth, weld, woodTex, xf,
} from "./kit";

const col = (h: string) => new THREE.Color(h);

// ================================================================ vegetation
const lobe = (rad: number, seed: number, detail: number) =>
  displace(weld(new THREE.IcosahedronGeometry(1, detail)), (v) => {
    const n = fbm(v.x * 2.9 + seed * 3.1, v.y * 2.9 + v.z * 2.3, 4, seed);
    v.multiplyScalar(rad * (0.72 + 0.62 * n));
  });

export const broadleafGeo = (seed: number, detail = 4, palette: [string, string, string] = ["#2f6b24", "#5da02f", "#a4cf45"]) =>
  once(`broadleaf:${seed}:${detail}:${palette}`, () => {
    const r = RNG(seed * 97 + 3), parts: THREE.BufferGeometry[] = [];
    const bark = (v: THREE.Vector3) => col("#6a4528").lerp(col("#3a2414"), noise2(v.y * 3, Math.atan2(v.z, v.x) * 3, seed));
    parts.push(paint(xf(new THREE.CylinderGeometry(0.26, 0.5, 4.4, 12, 5), { p: [0, 2.2, 0] }), bark));
    const crown: [number, number, number, number][] = [[0, 7.3, 0, 2.7]];
    const n = 15;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.6, rr = 1.5 + r() * 2.2, y = 4.9 + r() * 3.6, s = 1.05 + r() * 0.75;
      crown.push([Math.cos(a) * rr, y, Math.sin(a) * rr, s]);
      const branch = new THREE.CylinderGeometry(0.07, 0.2, rr * 1.35, 7);
      branch.translate(0, (rr * 1.35) / 2, 0);
      xf(branch, { r: [Math.sin(a) * 0.95, 0, -Math.cos(a) * 0.95], p: [0, 3.7, 0] });
      parts.push(paint(branch, "#5a3a22"));
    }
    crown.forEach(([x, y, z, s], i) => {
      const g = xf(lobe(s, seed + i, detail), { p: [x, y, z] });
      const tone = r();
      parts.push(paint(g, (v, nn) => {
        const top = smooth(-0.55, 0.85, nn.y * 0.8 + (v.y - 7) * 0.13);
        const c = col(palette[0]).lerp(col(palette[1]), smooth(0, 0.6, top)).lerp(col(palette[2]), smooth(0.55, 1, top));
        return c.multiplyScalar(0.94 + tone * 0.28);
      }));
    });
    return merge(parts);
  });

export const pineGeo = (seed: number, tiers = 7, palette: [string, string] = ["#1b5a3a", "#5fae5c"]) =>
  once(`pine:${seed}:${tiers}:${palette}`, () => {
    const r = RNG(seed * 41 + 9), parts: THREE.BufferGeometry[] = [];
    parts.push(paint(xf(new THREE.CylinderGeometry(0.1, 0.46, 15, 10, 3), { p: [0, 7.5, 0] }), (v) => col("#5b3e2a").lerp(col("#2f2016"), noise2(v.y * 2.4, Math.atan2(v.z, v.x) * 3, seed))));
    for (let i = 0; i < tiers; i++) {
      const k = i / (tiers - 1), rad = 3.5 * (1 - k * 0.8) + r() * 0.25, h = 3.9 - k * 1.5, y = 3.4 + k * 11.2;
      const g = weld(new THREE.ConeGeometry(rad, h, 34, 3));
      const off = r() * 6;
      displace(g, (v) => {
        const a = Math.atan2(v.z, v.x), low = smooth(0.1, -0.5, v.y / h);
        const w = 1 + low * (0.22 * Math.sin(a * 7 + off) + 0.1 * Math.sin(a * 13 + off * 2));
        v.x *= w; v.z *= w; v.y -= low * 0.32 * Math.sin(a * 7 + off) ** 2;
      });
      xf(g, { p: [0, y, 0] });
      parts.push(paint(g, (v, nn) => {
        const tip = smooth(0, 1, Math.hypot(v.x, v.z) / rad);
        return col(palette[0]).lerp(col(palette[1]), smooth(-0.2, 0.9, tip * 0.8 + nn.y * 0.35)).multiplyScalar(0.8 + k * 0.32);
      }));
    }
    return merge(parts);
  });

export const rockGeo = (seed: number, palette: [string, string, string?] = ["#6d6a64", "#a5a095"]) =>
  once(`rock:${seed}:${palette}`, () => {
    const g = displace(weld(new THREE.IcosahedronGeometry(1, 4)), (v) => {
      const n = fbm(v.x * 1.5 + seed, v.y * 1.6 + v.z * 1.3, 4, seed);
      const q = Math.round(n * 6) / 6;
      v.multiplyScalar(0.62 + (q * 0.6 + n * 0.3));
      v.y *= 0.72;
    });
    return paint(g, (v, n) => {
      const c = col(palette[0]).lerp(col(palette[1]), smooth(-0.6, 0.7, n.y + fbm(v.x * 3, v.z * 3, 2, seed) - 0.5));
      if (palette[2]) c.lerp(col(palette[2]), smooth(0.45, 0.8, n.y + (fbm(v.x * 5, v.z * 5, 3, seed + 4) - 0.5) * 0.9));
      return c;
    });
  });

export const tuftGeo = (seed: number, blades = 7, height = 0.62, width = 0.052) =>
  once(`tuft:${seed}:${blades}:${height}:${width}`, () => {
    const r = RNG(seed + 200), pos: number[] = [], color: number[] = [], normal: number[] = [];
    const push = (x: number, y: number, z: number, k: number) => { pos.push(x, y, z); color.push(0.42 + k * 0.62, 0.48 + k * 0.56, 0.42 + k * 0.5); normal.push(0.05, 1, 0.1); };
    for (let b = 0; b < blades; b++) {
      const a = r() * 6.28, dist = r() * 0.17, h = height * (0.6 + r() * 0.55), bend = 0.1 + r() * 0.24, w = width * (0.8 + r() * 0.5);
      const dx = Math.cos(a), dz = Math.sin(a), bx = Math.cos(a) * dist, bz = Math.sin(a) * dist, sx = -dz * w, sz = dx * w;
      const pt = (t: number): V3 => [bx + dx * bend * t * t, h * t, bz + dz * bend * t * t];
      const a0 = pt(0), a1 = pt(0.55), a2 = pt(1);
      push(a0[0] - sx, a0[1], a0[2] - sz, 0); push(a0[0] + sx, a0[1], a0[2] + sz, 0); push(a1[0] + sx * 0.7, a1[1], a1[2] + sz * 0.7, 0.55);
      push(a0[0] - sx, a0[1], a0[2] - sz, 0); push(a1[0] + sx * 0.7, a1[1], a1[2] + sz * 0.7, 0.55); push(a1[0] - sx * 0.7, a1[1], a1[2] - sz * 0.7, 0.55);
      push(a1[0] - sx * 0.7, a1[1], a1[2] - sz * 0.7, 0.55); push(a1[0] + sx * 0.7, a1[1], a1[2] + sz * 0.7, 0.55); push(a2[0], a2[1], a2[2], 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
    return g;
  });

export const fernGeo = (seed: number) =>
  once(`fern:${seed}`, () => {
    const r = RNG(seed + 900), pos: number[] = [], color: number[] = [], normal: number[] = [];
    const v = (p: V3, k: number) => { pos.push(...p); color.push(0.5 + k * 0.6, 0.62 + k * 0.5, 0.4 + k * 0.4); normal.push(0.1, 1, 0.1); };
    for (let f = 0; f < 8; f++) {
      const a = (f / 8) * 6.28 + r() * 0.5, len = 0.7 + r() * 0.45, dx = Math.cos(a), dz = Math.sin(a), sx = -dz, sz = dx;
      const pt = (t: number): V3 => [dx * len * t, (Math.sin(t * 2.4) * 0.5 + 0.05) * len, dz * len * t];
      for (let i = 0; i < 12; i++) {
        const t = i / 12, p = pt(t + 0.02), q = pt(t + 0.1), w = 0.17 * Math.sin((t * 0.92 + 0.08) * Math.PI);
        for (const side of [-1, 1]) {
          const tip: V3 = [p[0] + sx * w * side + dx * w * 0.5, p[1] - w * 0.3, p[2] + sz * w * side + dz * w * 0.5];
          v(p, 0.25 + t * 0.4); v(q, 0.25 + t * 0.4); v(tip, 0.75);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
    return g;
  });

/** Ribbed saguaro: a trunk and two elbow arms. */
export const cactusGeo = (seed: number) =>
  once(`cactus:${seed}`, () => {
    const r = RNG(seed + 44);
    const tube = (pts: V3[], rad: number) => {
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      const seg = 22, rs = 20, g = new THREE.TubeGeometry(curve, seg, rad, rs, false);
      const p = g.getAttribute("position"), v = new THREE.Vector3(), c = new THREE.Vector3(), cen = new THREE.Vector3();
      for (let i = 0; i <= seg; i++) {
        curve.getPointAt(i / seg, cen);
        const taper = i === seg ? 0.05 : i === seg - 1 ? 0.62 : i === seg - 2 ? 0.86 : 1;
        for (let j = 0; j <= rs; j++) {
          const idx = i * (rs + 1) + j;
          v.fromBufferAttribute(p, idx); c.subVectors(v, cen).multiplyScalar(taper * (j % 2 ? 0.87 : 1)); v.addVectors(cen, c);
          p.setXYZ(idx, v.x, v.y, v.z);
        }
      }
      g.computeVertexNormals();
      return g;
    };
    const tint = (v: THREE.Vector3, n: THREE.Vector3) => col("#2c6a35").lerp(col("#6da84b"), smooth(-0.7, 0.8, n.y + n.x * 0.3 + noise2(v.y * 0.7, 2, seed) * 0.3));
    const H = 4.6 + r() * 1.6;
    const parts = [
      paint(tube([[0, -0.2, 0], [0, H * 0.5, 0], [0, H, 0]], 0.36), tint),
      paint(tube([[0, H * 0.42, 0], [0.8, H * 0.42, 0.04], [1.08, H * 0.58, 0.04], [1.12, H * 0.82, 0.06]], 0.21), tint),
      paint(tube([[0, H * 0.54, 0], [-0.7, H * 0.54, -0.03], [-0.94, H * 0.66, -0.03], [-0.98, H * 0.92, -0.03]], 0.19), tint),
    ];
    return merge(parts);
  });

/** Layered red butte, with sedimentary color bands. */
export const mesaGeo = (seed: number, rad: number, height: number) =>
  once(`mesa:${seed}:${rad}:${height}`, () => {
    const g = weld(new THREE.CylinderGeometry(1, 1, 1, 96, 56));
    displace(g, (v) => {
      const a = Math.atan2(v.z, v.x), yy = v.y + 0.5, wall = Math.hypot(v.x, v.z);
      const shelf = Math.round(yy * 11) / 11;
      const profile = 1.42 - smooth(0, 1, yy ** 0.36) * 0.58 + (0.5 - shelf) * 0.08;
      const edge = fbm(Math.cos(a) * 3 + seed, Math.sin(a) * 3 + shelf * 7, 4, seed) - 0.5;
      const k = wall > 0.98 ? profile + edge * 0.62 : (profile + edge * 0.5) * wall;
      v.x *= rad * k; v.z *= rad * k; v.y = yy * height;
    });
    return paint(g, (v, n) => {
      const band = fbm(v.y * 0.24, seed, 3, seed + 2) + Math.sin(v.y * 0.65) * 0.1;
      const c = col("#b4482a").lerp(col("#e68a4a"), smooth(0.34, 0.68, band)).lerp(col("#6e2c20"), smooth(0.55, 0.75, 0.5 - band * 0.2 + (1 - Math.abs(n.y)) * 0.1));
      if (n.y > 0.65) c.lerp(col("#d69a5e"), 0.8);
      return c;
    });
  });

export const OakGeo = () => broadleafGeo(777, 5, ["#2a6220", "#62a72c", "#b5d94d"]);

export const vertexMat = once("vc-material", () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94 }));

export const GeoMesh: React.FC<{ g: THREE.BufferGeometry; p?: V3; r?: V3; s?: V3 | number; cast?: boolean; receive?: boolean }> = ({ g, p, r, s, cast = true, receive = true }) => (
  <mesh geometry={g} material={vertexMat} position={p} rotation={r} scale={s as V3} castShadow={cast} receiveShadow={receive} />
);

// ================================================================ screens, posters, labels
const Screen: React.FC<{ tex: THREE.Texture; p: V3; w: number; h: number; rot?: V3 }> = ({ tex, p, w, h, rot }) => (
  <mesh position={p} rotation={rot} geometry={once(`plane:${w}:${h}`, () => new THREE.PlaneGeometry(w, h))}
    material={once(`screen:${tex.uuid}`, () => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }))} />
);
const screenTex = (kind: number) => canvasTex(`screen${kind}`, 512, 300, (g, w, h) => {
  const r = RNG(kind * 7 + 1);
  if (kind === 0) { // code
    g.fillStyle = "#172033"; g.fillRect(0, 0, w, h);
    const cs = ["#7fd1ff", "#ffcf6e", "#a5e887", "#f08fa8", "#dfe7f5"];
    for (let i = 0; i < 18; i++) { let x = 18 + (r() < 0.5 ? 26 : r() < 0.5 ? 52 : 0); for (let k = 0; k < 2 + r() * 5; k++) { const l = 22 + r() * 66; g.fillStyle = cs[(r() * 5) | 0]; g.fillRect(x, 12 + i * 16, l, 7); x += l + 10; } }
  } else if (kind === 1) { // spreadsheet with a chart
    g.fillStyle = "#f4f7fb"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#2c8a5a"; g.fillRect(0, 0, w, 28);
    g.strokeStyle = "#c9d3df"; g.lineWidth = 1;
    for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(0, 28 + i * 18); g.lineTo(250, 28 + i * 18); g.stroke(); }
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(i * 50, 28); g.lineTo(i * 50, h); g.stroke(); }
    g.fillStyle = "#4b5a6c"; for (let i = 0; i < 15; i++) for (let j = 0; j < 5; j++) if (r() > 0.2) g.fillRect(j * 50 + 7, 35 + i * 18, 18 + r() * 22, 5);
    ["#3f7be0", "#e0713f", "#3fb979", "#e0b83f", "#a15ae0"].forEach((c, i) => { const bh = 40 + r() * 160; g.fillStyle = c; g.fillRect(280 + i * 44, h - 30 - bh, 32, bh); });
  } else { // desktop with windows
    const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, "#3a6fd8"); grd.addColorStop(1, "#7b4bd0");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff"; g.fillRect(70, 45, 340, 205); g.fillStyle = "#dfe6f0"; g.fillRect(70, 45, 340, 24);
    g.fillStyle = "#7c8ba1"; for (let i = 0; i < 10; i++) g.fillRect(90, 88 + i * 15, 130 + r() * 170, 6);
    g.fillStyle = "rgba(10,14,30,.6)"; g.fillRect(0, h - 24, w, 24);
  }
}, [1, 1]);

const paperTex = canvasTex("paperlines", 128, 180, (g, w, h) => {
  g.fillStyle = "#fbfaf4"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#8d94a3"; for (let i = 0; i < 14; i++) g.fillRect(12, 14 + i * 11, 70 + (i * 37) % 40, 4);
});
const keysTex = canvasTex("keys", 384, 128, (g, w, h) => {
  g.fillStyle = "#2c2f38"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#e8eaee";
  for (let j = 0; j < 5; j++) for (let i = 0; i < 15; i++) g.fillRect(6 + i * 25, 6 + j * 24, 21, 20);
}, [1, 1]);
const boardTex = canvasTex("whiteboard", 720, 400, (g, w, h) => {
  g.fillStyle = "#f7f9f7"; g.fillRect(0, 0, w, h);
  g.lineWidth = 7; g.strokeStyle = "#2e62c9"; g.beginPath(); g.moveTo(50, 340); g.bezierCurveTo(170, 310, 200, 170, 310, 200); g.bezierCurveTo(400, 225, 420, 90, 520, 60); g.stroke();
  g.lineWidth = 4; g.strokeStyle = "#20242c"; g.beginPath(); g.moveTo(50, 40); g.lineTo(50, 340); g.lineTo(540, 340); g.stroke();
  g.fillStyle = "#d63a3a"; g.beginPath(); g.moveTo(525, 40); g.lineTo(545, 70); g.lineTo(505, 70); g.fill();
  g.fillStyle = "#333"; [90, 150, 210].forEach((y, i) => g.fillRect(590, y, 90 - i * 18, 8));
  ["#ffd65a", "#ff9ac0", "#9be5a6"].forEach((c, i) => { g.fillStyle = c; g.fillRect(590 + (i % 2) * 22, 250 + i * 40, 60, 42); });
});
const clockTex = canvasTex("clock", 256, 256, (g, w) => {
  g.fillStyle = "#fbfbf6"; g.fillRect(0, 0, w, w);
  g.fillStyle = "#222"; for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28; g.fillRect(128 + Math.cos(a) * 100 - 5, 128 + Math.sin(a) * 100 - 5, 10, 10); }
  g.strokeStyle = "#222"; g.lineCap = "round"; g.lineWidth = 11; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 62); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(186, 150); g.stroke();
});
const posterTex = (kind: number) => canvasTex(`poster${kind}`, 300, 420, (g, w, h) => {
  if (kind === 0) { // mountains at dusk
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#28388a"); grd.addColorStop(1, "#f4a35f"); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff3bd"; g.beginPath(); g.arc(205, 150, 44, 0, 7); g.fill();
    g.fillStyle = "#1e2a55"; g.beginPath(); g.moveTo(0, h); g.lineTo(90, 230); g.lineTo(170, 320); g.lineTo(240, 210); g.lineTo(w, 320); g.lineTo(w, h); g.fill();
  } else if (kind === 1) { // abstract
    g.fillStyle = "#f2e9d8"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#d84a3a"; g.beginPath(); g.arc(120, 150, 86, 0, 7); g.fill();
    g.fillStyle = "#28659a"; g.fillRect(60, 240, 190, 120);
    g.fillStyle = "#f0b93a"; g.beginPath(); g.moveTo(170, 90); g.lineTo(270, 250); g.lineTo(100, 250); g.fill();
  } else { // rocket
    g.fillStyle = "#101a3c"; g.fillRect(0, 0, w, h);
    const r = RNG(19); g.fillStyle = "#fff"; for (let i = 0; i < 70; i++) g.fillRect(r() * w, r() * h, 2.6, 2.6);
    g.fillStyle = "#eef1f7"; g.beginPath(); g.ellipse(150, 200, 48, 118, 0, 0, 7); g.fill();
    g.fillStyle = "#d9423a"; g.beginPath(); g.moveTo(150, 72); g.lineTo(192, 150); g.lineTo(108, 150); g.fill();
    g.fillStyle = "#3f8fe0"; g.beginPath(); g.arc(150, 195, 24, 0, 7); g.fill();
    g.fillStyle = "#ffa835"; g.beginPath(); g.moveTo(112, 315); g.lineTo(150, 402); g.lineTo(188, 315); g.fill();
  }
});

// ================================================================ office
export const Monitor: React.FC<{ p: V3; ry?: number; kind?: number }> = ({ p, ry = 0, kind = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <B p={[0, 0.012, 0]} s={[0.24, 0.024, 0.19]} r={0.008} c="#2a2c33" o={{ r: 0.45 }} />
    <B p={[0, 0.17, -0.01]} s={[0.05, 0.3, 0.035]} c="#2f323a" o={{ r: 0.45 }} />
    <B p={[0, 0.41, 0]} s={[0.66, 0.4, 0.035]} r={0.012} c="#1b1d23" o={{ r: 0.35 }} />
    <Screen tex={screenTex(kind)} p={[0, 0.41, 0.0185]} w={0.625} h={0.365} />
  </group>
);
export const Desk: React.FC<{ p: V3; ry?: number; kind?: number; wood?: string; mess?: boolean }> = ({ p, ry = 0, kind = 0, wood = "#b98454", mess = true }) => {
  const legs: V3[] = [[-0.82, 0.36, -0.36], [0.82, 0.36, -0.36], [-0.82, 0.36, 0.36], [0.82, 0.36, 0.36]];
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <B p={[0, 0.745, 0]} s={[1.8, 0.05, 0.86]} r={0.016} c="#ffffff" o={{ map: woodTex(wood, [1, 0.5], 4), r: 0.5 }} />
      {legs.map((l, i) => <B key={i} p={l} s={[0.05, 0.72, 0.05]} c="#3a3d46" o={{ m: 0.5, r: 0.4 }} />)}
      <B p={[0, 0.5, -0.36]} s={[1.6, 0.4, 0.02]} c="#44474f" o={{ r: 0.6 }} />
      <B p={[0.58, 0.46, 0.05]} s={[0.42, 0.52, 0.62]} r={0.012} c="#d7d9de" />
      {[0.62, 0.42, 0.26].map((y, i) => <B key={i} p={[0.58, y, 0.37]} s={[0.36, 0.14, 0.012]} r={0.004} c="#c2c5cc" />)}
      <Monitor p={[0, 0.77, -0.16]} kind={kind} />
      <mesh position={[0, 0.782, 0.16]} rotation={[-Math.PI / 2 + 0.07, 0, 0]} castShadow geometry={once("kbd", () => new THREE.BoxGeometry(0.46, 0.15, 0.02))}
        material={[mat("#2c2f38"), mat("#2c2f38"), mat("#2c2f38"), mat("#2c2f38"), mat("#fff", { map: keysTex, r: 0.5 }), mat("#2c2f38")]} />
      <B p={[0.34, 0.785, 0.16]} s={[0.07, 0.03, 0.11]} r={0.014} c="#e9eaee" o={{ r: 0.4 }} />
      {mess && <>
        <Cyl p={[-0.62, 0.82, 0.2]} rt={0.045} rb={0.04} h={0.1} c="#d9483a" o={{ r: 0.35 }} />
        <Plane p={[-0.5, 0.772, -0.14]} rot={[-Math.PI / 2, 0, 0.25]} w={0.21} h={0.29} o={{ map: paperTex }} />
        <Plane p={[-0.52, 0.775, -0.12]} rot={[-Math.PI / 2, 0, 0.1]} w={0.21} h={0.29} o={{ map: paperTex }} />
        <Cyl p={[0.7, 0.82, -0.2]} rt={0.05} h={0.11} c="#3f6cc4" />
        {[0, 1, 2].map((i) => <Cyl key={i} p={[0.69 + i * 0.012, 0.91, -0.2 + i * 0.01]} rt={0.005} h={0.14} seg={6} rot={[0.1 * i, 0, 0.12 * (i - 1)]} c={["#e7b52e", "#d1433b", "#2c6fbe"][i]} />)}
      </>}
    </group>
  );
};
export const OfficeChair: React.FC<{ p: V3; ry?: number; c?: string }> = ({ p, ry = 0, c = "#2e3442" }) => (
  <group position={p} rotation={[0, ry, 0]}>
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * 6.28;
      return <group key={i} rotation={[0, a, 0]}><B p={[0.17, 0.09, 0]} s={[0.34, 0.035, 0.05]} r={0.012} c="#23252b" o={{ r: 0.4 }} /><Ball p={[0.33, 0.04, 0]} r={0.04} seg={10} c="#17181c" /></group>;
    })}
    <Cyl p={[0, 0.27, 0]} rt={0.028} h={0.36} c="#8f939c" o={{ m: 0.8, r: 0.3 }} />
    <B p={[0, 0.49, 0]} s={[0.5, 0.09, 0.48]} r={0.04} c={c} />
    <B p={[0, 0.84, -0.24]} s={[0.46, 0.58, 0.075]} r={0.035} c={c} />
    <B p={[0, 0.58, -0.235]} s={[0.05, 0.16, 0.03]} c="#23252b" />
    {[-1, 1].map((sd) => <B key={sd} p={[sd * 0.28, 0.65, -0.02]} s={[0.05, 0.03, 0.3]} r={0.012} c="#23252b" />)}
    {[-1, 1].map((sd) => <B key={`s${sd}`} p={[sd * 0.28, 0.56, -0.08]} s={[0.03, 0.17, 0.03]} c="#23252b" />)}
  </group>
);
export const PottedPlant: React.FC<{ p: V3; pot?: string; size?: number; seed?: number }> = ({ p, pot = "#c56b45", size = 1, seed = 1 }) => {
  const g = once(`plantleaves:${seed}`, () => {
    const r = RNG(seed + 55), parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.28, h = 0.45 + r() * 0.75, out = 0.15 + r() * 0.5;
      const leaf = weld(new THREE.SphereGeometry(1, 10, 8));
      xf(leaf, { s: [0.11, 0.02, 0.32] });
      xf(leaf, { p: [0, 0, 0.3] });
      displace(leaf, (v) => { v.y -= v.z * v.z * 0.8; });
      xf(leaf, { r: [-0.55 + r() * 0.7, a, 0], p: [Math.sin(a) * out * 0.15, h, Math.cos(a) * out * 0.15] });
      const tone = r();
      parts.push(paint(leaf, "#" + col("#2f7a3a").lerp(col("#6fb84a"), tone).getHexString()));
    }
    return merge(parts);
  });
  return (
    <group position={p} scale={size}>
      <Blob p={[0, 0, 0]} w={0.8} />
      <Cyl p={[0, 0.17, 0]} rt={0.22} rb={0.15} h={0.34} c={pot} o={{ r: 0.75 }} />
      <Cyl p={[0, 0.335, 0]} rt={0.2} h={0.01} c="#3a2618" />
      <Cyl p={[0, 0.55, 0]} rt={0.018} rb={0.026} h={0.5} c="#4c3620" seg={8} />
      <GeoMesh g={g} />
    </group>
  );
};
const BOOK_COLORS = ["#b23a3a", "#3a6db2", "#e0b23a", "#2f8a5e", "#7a4bb0", "#e6dcc8", "#d0663a", "#31465f"];
export const Books: React.FC<{ p: V3; w: number; seed?: number; h?: number }> = ({ p, w, seed = 1, h = 0.26 }) => {
  const r = RNG(seed * 13 + 5), items: React.ReactNode[] = [];
  let x = -w / 2;
  let i = 0;
  while (x < w / 2 - 0.05) {
    const t = 0.03 + r() * 0.035, hh = h * (0.72 + r() * 0.28), c = BOOK_COLORS[(r() * BOOK_COLORS.length) | 0], skip = r() < 0.08;
    if (!skip) items.push(<B key={i++} p={[x + t / 2, hh / 2, 0]} s={[t, hh, 0.19]} r={0.005} c={c} cast={false} />);
    x += t + (skip ? 0.1 : 0.003);
  }
  return <group position={p}>{items}</group>;
};
export const Bookshelf: React.FC<{ p: V3; ry?: number; w?: number; h?: number; c?: string; seed?: number }> = ({ p, ry = 0, w = 1.4, h = 2.1, c = "#8a5a32", seed = 2 }) => {
  const shelves = 5, gap = (h - 0.1) / shelves;
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Blob p={[0, 0, 0.1]} w={w + 0.6} d={0.85} />
      <B p={[-w / 2, h / 2, 0]} s={[0.05, h, 0.34]} c={c} />
      <B p={[w / 2, h / 2, 0]} s={[0.05, h, 0.34]} c={c} />
      <B p={[0, h / 2, -0.16]} s={[w, h, 0.02]} c={"#" + col(c).multiplyScalar(0.6).getHexString()} />
      {Array.from({ length: shelves + 1 }).map((_, i) => <B key={i} p={[0, 0.05 + i * gap, 0]} s={[w, 0.04, 0.34]} c={c} />)}
      {Array.from({ length: shelves }).map((_, i) => <Books key={`b${i}`} p={[0, 0.07 + i * gap, 0]} w={w - 0.1} seed={seed + i} h={gap * 0.82} />)}
    </group>
  );
};
export const FilingCabinet: React.FC<{ p: V3; ry?: number; c?: string }> = ({ p, ry = 0, c = "#8d97a5" }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Blob p={[0, 0, 0]} w={0.95} d={0.95} />
    <B p={[0, 0.66, 0]} s={[0.5, 1.32, 0.6]} r={0.012} c={c} o={{ m: 0.25, r: 0.5 }} />
    {[0, 1, 2, 3].map((i) => <group key={i}><B p={[0, 0.2 + i * 0.32, 0.302]} s={[0.46, 0.29, 0.012]} r={0.004} c={"#" + col(c).multiplyScalar(1.1).getHexString()} o={{ m: 0.25, r: 0.5 }} /><B p={[0, 0.2 + i * 0.32, 0.32]} s={[0.14, 0.022, 0.03]} r={0.008} c="#dfe2e8" o={{ m: 0.7, r: 0.3 }} /></group>)}
  </group>
);
export const Whiteboard: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <B p={[0, 0, 0]} s={[2.1, 1.2, 0.04]} r={0.01} c="#b4b8c0" o={{ m: 0.5, r: 0.4 }} />
    <Plane p={[0, 0, 0.022]} w={2.02} h={1.12} o={{ map: boardTex, r: 0.25 }} />
    <B p={[0, -0.62, 0.06]} s={[1.3, 0.03, 0.09]} c="#a0a5ae" o={{ m: 0.5, r: 0.4 }} />
    {["#d1433b", "#2c6fbe"].map((m, i) => <Cyl key={i} p={[-0.2 + i * 0.3, -0.59, 0.06]} rot={[0, 0, Math.PI / 2]} rt={0.012} h={0.14} c={m} seg={8} />)}
  </group>
);
export const Clock: React.FC<{ p: V3; ry?: number; r?: number }> = ({ p, ry = 0, r = 0.26 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Cyl rot={[Math.PI / 2, 0, 0]} rt={r} h={0.05} seg={40} c="#2c2f38" />
    <mesh position={[0, 0, 0.026]} geometry={once(`circle:${r}`, () => new THREE.CircleGeometry(r * 0.92, 40))} material={mat("#fff", { map: clockTex })} />
  </group>
);
export const WaterCooler: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Blob p={[0, 0, 0]} w={0.95} />
    <B p={[0, 0.52, 0]} s={[0.36, 1.04, 0.36]} r={0.03} c="#e7e9ee" />
    <B p={[0, 0.82, 0.17]} s={[0.22, 0.14, 0.05]} r={0.01} c="#3b3e47" />
    <Cyl p={[0, 1.33, 0]} rt={0.15} rb={0.16} h={0.46} c="#9ed4f3" o={{ a: 0.55, r: 0.1 }} cast={false} />
    <Ball p={[0, 1.55, 0]} r={0.15} s={[1, 0.34, 1]} c="#9ed4f3" o={{ a: 0.55, r: 0.1 }} cast={false} />
  </group>
);
export const Printer: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Blob p={[0, 0, 0]} w={1.15} d={0.9} />
    <B p={[0, 0.34, 0]} s={[0.7, 0.68, 0.55]} r={0.02} c="#73502f" />
    <B p={[0, 0.84, 0]} s={[0.56, 0.3, 0.46]} r={0.03} c="#e4e6ea" />
    <B p={[0, 1.0, -0.03]} s={[0.46, 0.03, 0.36]} r={0.01} c="#3c3f49" />
    <B p={[0.19, 0.9, 0.235]} s={[0.1, 0.1, 0.006]} c="#46c26e" o={{ e: "#2ec460", ei: 0.8 }} cast={false} />
    <B p={[0, 0.79, 0.26]} s={[0.28, 0.008, 0.2]} c="#fbfaf4" />
  </group>
);
export const CeilingPanel: React.FC<{ p: V3; w?: number; d?: number }> = ({ p, w = 1.5, d = 0.55 }) => (
  <group position={p}>
    <B s={[w + 0.08, 0.06, d + 0.08]} c="#d8dade" cast={false} />
    <B p={[0, -0.033, 0]} s={[w, 0.01, d]} c="#fff" o={{ e: "#fff8ea", ei: 2.2 }} cast={false} />
  </group>
);
export const CeilingFan: React.FC<{ p: V3; a: number }> = ({ p, a }) => (
  <group position={p}>
    <Cyl p={[0, -0.12, 0]} rt={0.022} h={0.26} seg={10} c="#6d5a3a" o={{ m: 0.5, r: 0.4 }} />
    <Cyl p={[0, -0.28, 0]} rt={0.11} rb={0.13} h={0.13} seg={22} c="#8a6a3e" o={{ m: 0.5, r: 0.4 }} />
    <Ball p={[0, -0.38, 0]} r={0.12} seg={20} s={[1, 0.62, 1]} c="#fff" o={{ e: "#ffd9a0", ei: 1.1 }} cast={false} />
    <group rotation={[0, a, 0]} position={[0, -0.3, 0]}>
      {[0, 1, 2, 3].map((i) => <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}><B p={[0.55, 0, 0]} rot={[0.14, 0, 0]} s={[0.84, 0.02, 0.17]} r={0.008} c="#8a5a35" cast={false} /></group>)}
    </group>
  </group>
);
export const TrashBin: React.FC<{ p: V3 }> = ({ p }) => <group position={p}><Blob p={[0, 0, 0]} w={0.55} /><Cyl p={[0, 0.17, 0]} rt={0.145} rb={0.11} h={0.34} c="#52606f" /></group>;

// ================================================================ bedroom
export const Bed: React.FC<{ p: V3; ry?: number; blanket?: string }> = ({ p, ry = 0, blanket = "#4c78b5" }) => {
  // Head at -z. The blanket is a noise-displaced soft box so it reads as cloth.
  const cover = once(`blanket:${blanket}`, () => {
    const g = weld(new THREE.BoxGeometry(1.84, 0.22, 1.72, 46, 6, 44));
    const pos = g.getAttribute("position"), v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const ex = smooth(0.74, 0.92, Math.abs(v.x)), ez = smooth(0.7, 0.86, Math.abs(v.z));
      const top = v.y > 0 ? 1 : 0;
      const wr = (fbm(v.x * 2.2 + 3, v.z * 2 + 1, 3, 3) - 0.5) * 0.15 + Math.sin(v.x * 7 + v.z * 3) * 0.012;
      v.y = v.y - Math.max(ex, ez) * top * 0.09 + wr * top * (1 - Math.max(ex, ez) * 0.8);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Blob p={[0, 0, 0.1]} w={2.7} d={3.1} a={0.55} />
      <B p={[0, 0.2, 0]} s={[1.86, 0.26, 2.14]} r={0.03} c="#8a5a35" />
      {[[-0.86, -1], [0.86, -1], [-0.86, 1], [0.86, 1]].map(([x, z], i) => <B key={i} p={[x, 0.06, z]} s={[0.1, 0.12, 0.1]} c="#5e3c22" />)}
      <B p={[0, 0.66, -1.08]} s={[2.0, 1.32, 0.09]} r={0.04} c="#8a5a35" o={{ map: woodTex("#8f5e37", [0.8, 0.6], 6) }} />
      <B p={[0, 0.45, 0]} s={[1.76, 0.25, 2.05]} r={0.09} c="#f2efe8" />
      <mesh position={[0, 0.62, 0.17]} geometry={cover} material={mat(blanket, { r: 0.94 })} castShadow receiveShadow />
      <B p={[0, 0.735, -0.66]} s={[1.84, 0.05, 0.4]} r={0.022} c="#f2efe8" />
      {[-0.44, 0.44].map((x, i) => <group key={x} position={[x, 0.68, -0.8]} rotation={[0.3, i ? -0.06 : 0.09, 0]}><B s={[0.76, 0.2, 0.44]} r={0.095} c="#f8f6f0" o={{ r: 0.96 }} /></group>)}
      <group position={[0.1, 0.72, -0.52]} rotation={[0.28, 0.12, 0]}><B s={[0.44, 0.17, 0.3]} r={0.08} c="#e8a23a" o={{ r: 0.96 }} /></group>
    </group>
  );
};
export const Nightstand: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Blob p={[0, 0, 0]} w={0.9} />
    <B p={[0, 0.3, 0]} s={[0.52, 0.56, 0.44]} r={0.015} c="#8a5a35" />
    {[0.17, 0.42].map((y) => <group key={y}><B p={[0, y, 0.222]} s={[0.46, 0.21, 0.012]} r={0.004} c="#a26d42" /><Ball p={[0, y, 0.24]} r={0.018} seg={10} c="#e4c07a" o={{ m: 0.6, r: 0.3 }} /></group>)}
  </group>
);
export const TableLamp: React.FC<{ p: V3; on?: boolean; color?: string; i?: number }> = ({ p, on = true, color = "#ffc477", i = 3 }) => (
  <group position={p}>
    <Cyl p={[0, 0.015, 0]} rt={0.09} h={0.03} c="#8e6a3a" o={{ m: 0.4, r: 0.4 }} />
    <Ball p={[0, 0.12, 0]} r={0.075} seg={16} s={[1, 1.15, 1]} c="#d8703c" o={{ r: 0.3 }} />
    <Cyl p={[0, 0.3, 0]} rt={0.1} rb={0.17} h={0.2} c="#fff" o={on ? { e: "#ffc26e", ei: 1.8, ds: true } : { ds: true }} />
    {on && <><pointLight position={[0, 0.3, 0]} color={color} intensity={i} distance={6} decay={1.8} /><Glow p={[0, 0.3, 0]} s={1.4} color="#ffb765" a={0.55} /></>}
  </group>
);
export const FloorLamp: React.FC<{ p: V3; on?: boolean; i?: number }> = ({ p, on = true, i = 5 }) => (
  <group position={p}>
    <Blob p={[0, 0, 0]} w={0.72} />
    <Cyl p={[0, 0.02, 0]} rt={0.17} h={0.04} seg={28} c="#3c3b3f" o={{ m: 0.6, r: 0.35 }} />
    <Cyl p={[0, 0.84, 0]} rt={0.016} h={1.6} seg={10} c="#c9a04e" o={{ m: 0.8, r: 0.3 }} />
    <Cyl p={[0, 1.76, 0]} rt={0.16} rb={0.26} h={0.32} seg={26} c="#fff" o={on ? { e: "#ffc26e", ei: 1.7, ds: true } : { ds: true }} />
    {on && <><pointLight position={[0, 1.72, 0]} color="#ffc27a" intensity={i} distance={7} decay={1.8} /><Glow p={[0, 1.76, 0]} s={1.8} color="#ffb765" a={0.5} /></>}
  </group>
);
export const Wardrobe: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Blob p={[0, 0, 0.1]} w={2.3} d={1.25} />
    <B p={[0, 1.08, 0]} s={[1.6, 2.1, 0.62]} r={0.015} c="#a97544" />
    <B p={[0, 2.16, 0]} s={[1.7, 0.07, 0.68]} r={0.012} c="#8a5a35" />
    <B p={[0, 0.05, 0]} s={[1.66, 0.1, 0.66]} c="#7a4c2c" />
    {[-1, 1].map((sd) => <group key={sd}>
      <B p={[sd * 0.4, 1.08, 0.315]} s={[0.76, 1.94, 0.02]} r={0.006} c="#b98452" />
      <B p={[sd * 0.4, 1.08, 0.328]} s={[0.56, 1.66, 0.006]} c="#ab7648" cast={false} />
      <Ball p={[sd * 0.07, 1.1, 0.35]} r={0.028} seg={12} c="#e4c07a" o={{ m: 0.7, r: 0.3 }} />
    </group>)}
    <B p={[-0.26, 2.33, 0.03]} s={[0.56, 0.27, 0.42]} r={0.015} c="#c9a877" />
    <B p={[0.3, 2.29, 0]} s={[0.46, 0.19, 0.34]} r={0.05} c="#6a8fb3" />
  </group>
);
export const Rug: React.FC<{ p: V3; w: number; d: number; a?: string; b?: string; round?: boolean }> = ({ p, w, d, a = "#c94f3e", b = "#f0e0c0", round }) => {
  const tex = canvasTex(`rug${a}${b}`, 512, 512, (g, W, H) => {
    g.fillStyle = a; g.fillRect(0, 0, W, H);
    g.strokeStyle = b; g.lineWidth = 12; g.strokeRect(30, 30, W - 60, H - 60);
    g.lineWidth = 5; g.strokeRect(58, 58, W - 116, H - 116);
    g.fillStyle = b;
    for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++) { g.save(); g.translate(86 + i * 34, 86 + j * 34); g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.restore(); }
    const r = RNG(2);
    for (let i = 0; i < 25000; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.09)"; g.fillRect(r() * W, r() * H, 2, 2); }
  });
  return round
    ? <mesh position={[p[0], p[1] + 0.012, p[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[w / 2, d / 2, 1]} receiveShadow geometry={once("circle64", () => new THREE.CircleGeometry(1, 64))} material={mat("#fff", { map: tex, r: 1 })} />
    : <B p={[p[0], p[1] + 0.01, p[2]]} s={[w, 0.02, d]} c="#fff" o={{ map: tex, r: 1 }} cast={false} />;
};
export const Curtain: React.FC<{ p: V3; w: number; h: number; c?: string; seed?: number; t?: number }> = ({ p, w, h, c = "#d4553e", seed = 1 }) => {
  const g = once(`curtain:${w}:${h}:${seed}`, () => {
    const pg = new THREE.PlaneGeometry(w, h, 64, 10), pos = pg.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), k = (x / w) * Math.PI * 2 * 7 + seed;
      pos.setZ(i, Math.sin(k) * (0.055 + (0.5 - y / h) * 0.05));
    }
    pg.computeVertexNormals();
    return pg;
  });
  return <mesh position={p} geometry={g} material={mat(c, { r: 0.9, ds: true })} castShadow receiveShadow />;
};
export const Poster: React.FC<{ p: V3; kind: number; ry?: number; s?: number }> = ({ p, kind, ry = 0, s = 1 }) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <B s={[0.68, 0.94, 0.03]} c="#2b2622" />
    <Plane p={[0, 0, 0.0165]} w={0.62} h={0.88} o={{ map: posterTex(kind), r: 0.5 }} />
  </group>
);
export const WallShelf: React.FC<{ p: V3; ry?: number; w?: number; seed?: number }> = ({ p, ry = 0, w = 1.2, seed = 4 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <B p={[0, 0, 0]} s={[w, 0.035, 0.22]} c="#8a5a35" />
    <Books p={[-w * 0.22, 0.018, 0]} w={w * 0.5} seed={seed} h={0.22} />
    <Cyl p={[w * 0.3, 0.09, 0]} rt={0.07} rb={0.05} h={0.14} c="#d9e4ec" />
    <Ball p={[w * 0.3, 0.25, 0]} r={0.12} seg={12} s={[1, 0.9, 1]} c="#4f9a4a" />
  </group>
);

// ================================================================ street
const gableGeo = (w: number, d: number, rh: number) => once(`gable:${w}:${d}:${rh}`, () => {
  const s = new THREE.Shape();
  s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, rh); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
  g.rotateY(Math.PI / 2);
  g.translate(-w / 2, 0, 0);
  return g;
});
const HouseWindow: React.FC<{ p: V3; w?: number; h?: number; lit?: boolean; shutter?: string }> = ({ p, w = 1.1, h = 1.3, lit, shutter }) => (
  <group position={p}>
    <B p={[0, 0, 0.02]} s={[w + 0.18, h + 0.18, 0.08]} c="#f7f4ec" />
    <B p={[0, 0, 0.065]} s={[w, h, 0.012]} c={lit ? "#ffd07a" : "#40597a"} o={lit ? { e: "#ffbf63", ei: 1.45 } : { r: 0.14, m: 0.3 }} cast={false} />
    <B p={[0, 0, 0.08]} s={[0.05, h, 0.02]} c="#f7f4ec" cast={false} />
    <B p={[0, 0, 0.08]} s={[w, 0.05, 0.02]} c="#f7f4ec" cast={false} />
    <B p={[0, -h / 2 - 0.12, 0.09]} s={[w + 0.36, 0.06, 0.2]} c="#f7f4ec" />
    {shutter && [-1, 1].map((sd) => <B key={sd} p={[sd * (w / 2 + 0.26), 0, 0.05]} s={[0.3, h + 0.16, 0.04]} c={shutter} />)}
  </group>
);
export type HouseSpec = { p: V3; ry?: number; w?: number; d?: number; wall?: string; roof?: string; door?: string; shutter?: string; storeys?: 1 | 2; garage?: boolean; brick?: boolean; lit?: boolean[] };
export const House: React.FC<HouseSpec> = ({ p, ry = 0, w = 9, d = 7.4, wall = "#e8dcc6", roof = "#5a4640", door = "#c13f35", shutter = "#37536e", storeys = 1, garage, brick, lit = [] }) => {
  const h = storeys === 2 ? 5.6 : 3;
  const rh = 2.4, slope = Math.hypot(d / 2 + 0.5, rh + 0.25), ang = Math.atan2(rh + 0.25, d / 2 + 0.5);
  const wallMat = brick ? { map: brickTex(wall, [w / 2.4, h / 2.4]), r: 0.92 } : { map: sidingTex(wall, [w / 2, h / 1.1]), r: 0.8 };
  const roofMat = { map: shingleTex(roof, [w / 1.8, slope / 1.8]), r: 0.9 };
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Blob p={[0, 0, 0.3]} w={w + 3.5} d={d + 3.5} a={0.42} />
      <B p={[0, 0.2, 0]} s={[w + 0.2, 0.4, d + 0.2]} c="#a39a8a" />
      <B p={[0, h / 2 + 0.3, 0]} s={[w, h, d]} c="#fff" o={wallMat} />
      <mesh position={[0, h + 0.3, 0]} geometry={gableGeo(w, d, rh)} material={mat(brick ? "#e8dcc6" : wall, { r: 0.85 })} castShadow receiveShadow />
      {[-1, 1].map((sd) => (
        <B key={sd} p={[0, h + 0.3 + (rh + 0.25) / 2 - 0.05, (sd * (d / 2 + 0.5)) / 2]} rot={[sd * ang, 0, 0]} s={[w + 0.9, 0.16, slope + 0.02]} c="#fff" o={roofMat} />
      ))}
      <B p={[0, h + 0.3 + rh + 0.19, 0]} s={[w + 0.9, 0.13, 0.32]} c={"#" + col(roof).multiplyScalar(0.72).getHexString()} />
      {[-1, 1].map((sd) => <B key={`f${sd}`} p={[0, h + 0.22, sd * (d / 2 + 0.47)]} s={[w + 0.9, 0.16, 0.1]} c="#f4f1ea" />)}
      <B p={[w * 0.26, h + rh + 0.9, -0.7]} s={[0.8, 2.2, 0.8]} c="#fff" o={{ map: brickTex("#a24a3a", [0.8, 1.5]), r: 0.92 }} />
      <B p={[w * 0.26, h + rh + 2.02, -0.7]} s={[0.94, 0.12, 0.94]} c="#6a6660" />

      {/* front */}
      <B p={[0, 1.42, d / 2 + 0.03]} s={[1.32, 2.42, 0.08]} c="#f7f4ec" />
      <B p={[0, 1.38, d / 2 + 0.085]} s={[1.08, 2.26, 0.05]} c={door} o={{ r: 0.5 }} />
      {[-0.26, 0.26].map((x) => [0.9, 1.92].map((y) => <B key={`${x}${y}`} p={[x * 0.92, y, d / 2 + 0.12]} s={[0.36, 0.72, 0.02]} c={"#" + col(door).multiplyScalar(0.8).getHexString()} cast={false} />))}
      <Ball p={[0.4, 1.4, d / 2 + 0.16]} r={0.05} seg={12} c="#e8c56e" o={{ m: 0.8, r: 0.3 }} />
      {[0, 1].map((i) => <B key={i} p={[0, 0.1 + i * 0.2, d / 2 + 1.05 - i * 0.28]} s={[2.5 - i * 0.2, 0.2, 2 - i * 0.6]} c="#c8bfae" />)}
      <B p={[0, 3.04, d / 2 + 0.9]} s={[2.9, 0.14, 1.9]} c="#f4f1ea" />
      {[-1.28, 1.28].map((x) => <B key={x} p={[x, 1.7, d / 2 + 1.62]} s={[0.14, 2.7, 0.14]} c="#f7f4ec" />)}
      <HouseWindow p={[-w * 0.3, 1.9, d / 2]} lit={lit[0]} shutter={shutter} w={1.35} h={1.45} />
      {!garage && <HouseWindow p={[w * 0.3, 1.9, d / 2]} lit={lit[1]} shutter={shutter} w={1.35} h={1.45} />}
      {storeys === 2 && [-w * 0.3, 0, w * 0.3].map((x, i) => <HouseWindow key={x} p={[x, 4.5, d / 2]} lit={lit[2 + i]} shutter={shutter} />)}
      {[-d * 0.25, d * 0.25].map((z, i) => <group key={z} position={[w / 2, 1.9, z]} rotation={[0, Math.PI / 2, 0]}><HouseWindow p={[0, 0, 0]} lit={lit[5 + i]} /></group>)}
      {[-d * 0.25, d * 0.25].map((z, i) => <group key={`l${z}`} position={[-w / 2, 1.9, z]} rotation={[0, -Math.PI / 2, 0]}><HouseWindow p={[0, 0, 0]} lit={lit[7 + i]} /></group>)}
      {garage && (
        <group position={[w * 0.3, 0, d / 2]}>
          <B p={[0, 1.15, 0.02]} s={[2.9, 2.3, 0.1]} c="#f4f1ea" />
          <B p={[0, 1.1, 0.08]} s={[2.62, 2.08, 0.04]} c="#fff" o={{ map: sidingTex("#eae6dc", [1, 0.6]), r: 0.5 }} cast={false} />
          {[0, 1, 2].map((i) => <B key={i} p={[-0.8 + i * 0.8, 1.75, 0.105]} s={[0.56, 0.3, 0.012]} c="#415a78" o={{ r: 0.2, m: 0.3 }} cast={false} />)}
        </group>
      )}
      {/* foundation planting */}
      {[-w * 0.3, !garage ? w * 0.3 : -w * 0.42].map((x, i) => <GeoMesh key={i} g={broadleafGeo(40 + i, 2, ["#2c6126", "#4f9436", "#92c653"])} p={[x, -0.7, d / 2 + 0.62]} s={0.22} />)}
    </group>
  );
};

const carBodyGeo = once("carbody", () => {
  const s = new THREE.Shape();
  s.moveTo(-2.2, 0.28);
  s.lineTo(-2.2, 0.62); s.quadraticCurveTo(-2.18, 0.8, -1.98, 0.84);
  s.lineTo(-1.3, 0.92); s.lineTo(1.25, 0.94); s.quadraticCurveTo(2.08, 0.9, 2.2, 0.76);
  s.quadraticCurveTo(2.26, 0.56, 2.2, 0.28);
  s.lineTo(1.68, 0.28); s.absarc(1.3, 0.34, 0.41, 0, Math.PI, false); s.lineTo(-0.87, 0.28);
  s.absarc(-1.28, 0.34, 0.41, 0, Math.PI, false);
  s.lineTo(-2.2, 0.28);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.66, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.07, bevelSegments: 3, curveSegments: 12 });
  g.translate(0, 0, -0.83);
  return g;
});
const carCabin = (inset: number, depth: number) => once(`carcabin:${inset}:${depth}`, () => {
  const s = new THREE.Shape();
  s.moveTo(-1.44 + inset * 1.8, 0.92); s.lineTo(-0.94 + inset, 1.44 - inset); s.lineTo(0.5 - inset, 1.44 - inset); s.lineTo(1.2 - inset * 1.8, 0.92);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
  g.translate(0, 0, -depth / 2);
  return g;
});
export const Car: React.FC<{ p: V3; ry?: number; c?: string; lights?: boolean; roll?: number }> = ({ p, ry = 0, c = "#c9362e", lights, roll = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Blob p={[0, 0, 0]} w={5.3} d={2.7} a={0.62} />
    <mesh geometry={carBodyGeo} material={mat(c, { r: 0.3, m: 0.25 })} castShadow receiveShadow />
    <mesh geometry={carCabin(0, 1.42)} material={mat(c, { r: 0.3, m: 0.25 })} castShadow />
    <mesh geometry={carCabin(0.09, 1.56)} material={mat("#1f2c3c", { r: 0.12, m: 0.4 })} />
    {[-1, 1].map((sd) => <B key={sd} p={[-0.3, 1.14, sd * 0.79]} s={[0.05, 0.5, 0.01]} c={c} cast={false} />)}
    <B p={[1.2, 1.17, 0]} rot={[0, 0, 0.64]} s={[0.02, 0.6, 1.36]} c="#1f2c3c" o={{ r: 0.12, m: 0.4 }} cast={false} />
    <B p={[-1.2, 1.17, 0]} rot={[0, 0, -0.76]} s={[0.02, 0.62, 1.36]} c="#1f2c3c" o={{ r: 0.12, m: 0.4 }} cast={false} />
    {[[1.3, 0.34], [-1.28, 0.34]].map(([x, y]) => [-0.84, 0.84].map((z) => (
      <group key={`${x}${z}`} position={[x, y, z]} rotation={[Math.PI / 2, roll, 0]}>
        <Cyl rt={0.34} h={0.25} seg={24} c="#15161a" o={{ r: 0.8 }} />
        <Cyl p={[0, z > 0 ? -0.13 : 0.13, 0]} rt={0.2} h={0.02} seg={18} c="#c9ccd3" o={{ m: 0.8, r: 0.3 }} cast={false} />
      </group>
    )))}
    {[-0.64, 0.64].map((z) => <B key={z} p={[2.22, 0.68, z]} s={[0.06, 0.15, 0.36]} r={0.015} c="#fff" o={{ e: "#fff2c8", ei: lights ? 2 : 0.35 }} cast={false} />)}
    {[-0.64, 0.64].map((z) => <B key={`r${z}`} p={[-2.23, 0.68, z]} s={[0.05, 0.14, 0.38]} r={0.015} c="#a11" o={{ e: "#ff1a10", ei: 0.9 }} cast={false} />)}
    <B p={[2.22, 0.3, 0]} s={[0.08, 0.16, 1.7]} r={0.03} c="#c3c6cd" o={{ m: 0.7, r: 0.3 }} />
    <B p={[-2.23, 0.32, 0]} s={[0.08, 0.16, 1.7]} r={0.03} c="#c3c6cd" o={{ m: 0.7, r: 0.3 }} />
  </group>
);
export const StreetLamp: React.FC<{ p: V3; flip?: boolean; on?: boolean }> = ({ p, flip, on }) => (
  <group position={p} scale={[flip ? -1 : 1, 1, 1]}>
    <Blob p={[0, 0, 0]} w={1} />
    <Cyl p={[0, 0.3, 0]} rt={0.14} rb={0.18} h={0.6} seg={14} c="#39414d" o={{ m: 0.5, r: 0.45 }} />
    <Cyl p={[0, 3.2, 0]} rt={0.055} rb={0.09} h={6.4} seg={12} c="#39414d" o={{ m: 0.5, r: 0.45 }} />
    <Cyl p={[0.72, 6.5, 0]} rot={[0, 0, Math.PI / 2]} rt={0.04} h={1.5} seg={8} c="#39414d" o={{ m: 0.5, r: 0.45 }} />
    <B p={[1.4, 6.46, 0]} s={[0.6, 0.12, 0.26]} r={0.05} c="#39414d" o={{ m: 0.5, r: 0.45 }} />
    <B p={[1.4, 6.39, 0]} s={[0.46, 0.02, 0.18]} c="#fff" o={{ e: "#ffdca0", ei: on ? 2.6 : 0.5 }} cast={false} />
    {on && <Glow p={[1.4, 6.3, 0]} s={3.4} color="#ffcf88" a={0.55} />}
  </group>
);
export const Mailbox: React.FC<{ p: V3; ry?: number; c?: string }> = ({ p, ry = 0, c = "#2f5f93" }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <B p={[0, 0.55, 0]} s={[0.1, 1.1, 0.1]} c="#7a5230" />
    <B p={[0, 1.2, 0]} s={[0.3, 0.2, 0.56]} r={0.06} c={c} o={{ r: 0.4, m: 0.2 }} />
    <B p={[0.18, 1.32, 0.12]} s={[0.02, 0.24, 0.12]} c="#d63a33" />
  </group>
);
export const Hydrant: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Blob p={[0, 0, 0]} w={0.7} />
    <Cyl p={[0, 0.32, 0]} rt={0.12} rb={0.14} h={0.56} c="#d8352c" o={{ r: 0.4 }} />
    <Ball p={[0, 0.6, 0]} r={0.13} seg={14} s={[1, 0.8, 1]} c="#d8352c" o={{ r: 0.4 }} />
    <Cyl p={[0, 0.74, 0]} rt={0.03} h={0.1} seg={8} c="#d8352c" />
    {[-1, 1].map((sd) => <Cyl key={sd} p={[sd * 0.16, 0.38, 0]} rot={[0, 0, Math.PI / 2]} rt={0.055} h={0.12} seg={10} c="#ece8de" />)}
  </group>
);
export const PicketFence: React.FC<{ p: V3; len: number; ry?: number; h?: number; c?: string }> = ({ p, len, ry = 0, h = 0.95, c = "#f4f1ea" }) => {
  const g = once(`picket:${len}:${h}`, () => {
    const parts: THREE.BufferGeometry[] = [];
    const n = Math.floor(len / 0.2);
    for (let i = 0; i <= n; i++) {
      const s = new THREE.Shape();
      s.moveTo(-0.055, 0); s.lineTo(0.055, 0); s.lineTo(0.055, h - 0.08); s.lineTo(0, h); s.lineTo(-0.055, h - 0.08); s.closePath();
      parts.push(xf(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }), { p: [i * 0.2, 0, 0] }));
    }
    parts.push(xf(new THREE.BoxGeometry(len, 0.07, 0.03), { p: [len / 2, h * 0.3, -0.02] }));
    parts.push(xf(new THREE.BoxGeometry(len, 0.07, 0.03), { p: [len / 2, h * 0.72, -0.02] }));
    return merge(parts);
  });
  return <mesh position={p} rotation={[0, ry, 0]} geometry={g} material={mat(c)} castShadow receiveShadow />;
};
export const WoodFence: React.FC<{ pts: V3[] }> = ({ pts }) => (
  <>
    {pts.map((a, i) => {
      const b = pts[i + 1];
      const items = [<Cyl key="p" p={[a[0], a[1] + 0.62, a[2]]} rt={0.075} rb={0.09} h={1.4} seg={8} c="#7a5a3a" o={{ r: 1 }} />];
      if (b) {
        const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz), ry = -Math.atan2(dz, dx), slope = Math.atan2(b[1] - a[1], len);
        [0.52, 1.02].forEach((y, k) => items.push(
          <group key={k} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + y, (a[2] + b[2]) / 2]} rotation={[0, ry, slope]}>
            <B s={[len + 0.3, 0.1, 0.05]} c="#8c6a46" o={{ r: 1 }} />
          </group>,
        ));
      }
      return <group key={i}>{items}</group>;
    })}
  </>
);
export const UtilityPole: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Cyl p={[0, 5.2, 0]} rt={0.11} rb={0.16} h={10.4} seg={10} c="#5a4432" o={{ r: 1 }} />
    <B p={[0, 9.7, 0]} s={[3, 0.13, 0.13]} c="#5a4432" />
    {[-1.3, 0, 1.3].map((x) => <Cyl key={x} p={[x, 9.86, 0]} rt={0.05} h={0.2} seg={8} c="#cfd6dd" />)}
    <Cyl p={[0.5, 8.6, 0.2]} rt={0.22} h={0.72} seg={14} c="#79808a" o={{ m: 0.4, r: 0.5 }} />
  </group>
);

