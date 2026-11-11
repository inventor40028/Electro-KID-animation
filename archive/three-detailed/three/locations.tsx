// The six 3D locations. Each keeps a clear stage in the middle of frame for 2D stickmen to stand on later.
import React from "react";
import * as THREE from "three";
import {
  AoStrip, B, Ball, Blob, CamPath, Clouds, Cyl, Inst, Motes, Plane, RNG, Shaft, Sky, SoftRay, Sun, V3,
  asphaltTex, canvasTex, carpetTex, concreteTex, detailTex, displace, fbm, instanced, lerp, mat, noise2, once, setSway, smooth, swayMat, terrainGeo, weld, woodTex,
} from "./kit";
import {
  Bed, Bookshelf, Car, Clock, CeilingFan, CeilingPanel, Curtain, Desk, FilingCabinet, FloorLamp, GeoMesh, Hydrant, House, HouseSpec, Mailbox, Nightstand, OakGeo, OfficeChair,
  PicketFence, Poster, PottedPlant, Printer, Rug, StreetLamp, TableLamp, TrashBin, UtilityPole, WallShelf, Wardrobe, WaterCooler, Whiteboard, WoodFence,
  broadleafGeo, cactusGeo, fernGeo, mesaGeo, pineGeo, rockGeo, tuftGeo, vertexMat,
} from "./objects";

export type SceneProps = { t: number; sec: number };
export type Location = { id: string; title: string; cam: CamPath; exposure?: number; Scene: React.FC<SceneProps> };

const col = (h: string) => new THREE.Color(h);
const Prim: React.FC<{ o: THREE.Object3D }> = ({ o }) => <primitive object={o} />;

// ================================================================ interiors
type Win = { x: number; y0: number; y1: number; w: number };
const WindowWall: React.FC<{ z: number; w: number; h: number; wall: string; frame: string; wins: Win[]; mull?: [number, number] }> = ({ z, w, h, wall, frame, wins, mull = [2, 2] }) => {
  const T = 0.26, sorted = [...wins].sort((a, b) => a.x - b.x), out: React.ReactNode[] = [];
  let cur = -w / 2 - T;
  sorted.forEach((n, i) => {
    const l = n.x - n.w / 2, r = n.x + n.w / 2;
    out.push(<B key={`p${i}`} p={[(cur + l) / 2, h / 2, z]} s={[l - cur, h, T]} c={wall} />);
    out.push(<B key={`u${i}`} p={[n.x, n.y0 / 2, z]} s={[n.w, n.y0, T]} c={wall} />);
    out.push(<B key={`o${i}`} p={[n.x, (n.y1 + h) / 2, z]} s={[n.w, h - n.y1, T]} c={wall} />);
    const fw = 0.07, H = n.y1 - n.y0, cy = (n.y0 + n.y1) / 2;
    out.push(<B key={`ft${i}`} p={[n.x, n.y1 - fw / 2, z]} s={[n.w, fw, T + 0.04]} c={frame} />);
    out.push(<B key={`fb${i}`} p={[n.x, n.y0 + fw / 2, z]} s={[n.w, fw, T + 0.04]} c={frame} />);
    out.push(<B key={`sill${i}`} p={[n.x, n.y0 - 0.02, z + 0.16]} s={[n.w + 0.24, 0.05, 0.16]} c={frame} />);
    [-1, 1].forEach((sd) => out.push(<B key={`f${sd}${i}`} p={[n.x + (sd * (n.w - fw)) / 2, cy, z]} s={[fw, H, T + 0.04]} c={frame} />));
    for (let m = 1; m < mull[0]; m++) out.push(<B key={`mx${i}${m}`} p={[l + (n.w * m) / mull[0], cy, z]} s={[0.045, H, 0.05]} c={frame} />);
    for (let m = 1; m < mull[1]; m++) out.push(<B key={`my${i}${m}`} p={[n.x, n.y0 + (H * m) / mull[1], z]} s={[n.w, 0.045, 0.05]} c={frame} />);
    out.push(<Plane key={`g${i}`} p={[n.x, cy, z]} w={n.w} h={H} c="#d4ecf7" o={{ a: 0.1, r: 0.05 }} />);
    cur = r;
  });
  out.push(<B key="last" p={[(cur + w / 2 + T) / 2, h / 2, z]} s={[w / 2 + T - cur, h, T]} c={wall} />);
  return <>{out}</>;
};

const Room: React.FC<{ w: number; back: number; front: number; h: number; wall: string; floor: THREE.Texture; ceil?: string; ceilMap?: THREE.Texture; wins: Win[]; frame?: string; base?: string; mull?: [number, number]; ao?: number }> = ({ w, back, front, h, wall, floor, ceil = "#f1eee7", ceilMap, wins, frame = "#f4f1ea", base = "#f4f1ea", mull, ao = 0.36 }) => {
  const L = front - back, cz = (front + back) / 2, S = 0.9, x = w / 2, PI = Math.PI;
  return (
    <>
      <Plane p={[0, 0, cz]} rot={[-PI / 2, 0, 0]} w={w} h={L} o={{ map: floor, r: 0.55 }} />
      <B p={[0, -0.13, cz]} s={[w + 1, 0.25, L + 1]} c="#332a24" receive={false} />
      <B p={[0, h + 0.14, cz]} s={[w + 1, 0.28, L + 1]} c={ceil} />
      {ceilMap && <Plane p={[0, h - 0.002, cz]} rot={[Math.PI / 2, 0, 0]} w={w} h={L} o={{ map: ceilMap, r: 0.95 }} />}
      <WindowWall z={back - 0.13} w={w} h={h} wall={wall} frame={frame} wins={wins} mull={mull} />
      <B p={[-x - 0.13, h / 2, cz]} s={[0.26, h, L]} c={wall} />
      <B p={[x + 0.13, h / 2, cz]} s={[0.26, h, L]} c={wall} />
      {/* baseboards */}
      <B p={[-x + 0.015, 0.06, cz]} s={[0.03, 0.12, L]} c={base} cast={false} />
      <B p={[x - 0.015, 0.06, cz]} s={[0.03, 0.12, L]} c={base} cast={false} />
      <B p={[0, 0.06, back + 0.015]} s={[w, 0.12, 0.03]} c={base} cast={false} />
      {/* corner occlusion */}
      <AoStrip p={[0, 0.006, back + S / 2]} rot={[-PI / 2, 0, PI]} w={w} h={S} a={ao} />
      <AoStrip p={[-x + S / 2, 0.006, cz]} rot={[-PI / 2, 0, -PI / 2]} w={L} h={S} a={ao} />
      <AoStrip p={[x - S / 2, 0.006, cz]} rot={[-PI / 2, 0, PI / 2]} w={L} h={S} a={ao} />
      <AoStrip p={[0, S / 2, back + 0.006]} rot={[0, 0, 0]} w={w} h={S} a={ao * 0.75} />
      <AoStrip p={[-x + 0.006, S / 2, cz]} rot={[0, PI / 2, 0]} w={L} h={S} a={ao * 0.75} />
      <AoStrip p={[x - 0.006, S / 2, cz]} rot={[0, -PI / 2, 0]} w={L} h={S} a={ao * 0.75} />
      <AoStrip p={[0, h - S / 2, back + 0.006]} rot={[0, 0, PI]} w={w} h={S} a={ao * 0.6} />
      <AoStrip p={[-x + 0.006, h - S / 2, cz]} rot={[0, PI / 2, PI]} w={L} h={S} a={ao * 0.6} />
      <AoStrip p={[x - 0.006, h - S / 2, cz]} rot={[0, -PI / 2, PI]} w={L} h={S} a={ao * 0.6} />
      <AoStrip p={[-x + S / 2, h / 2, back + 0.008]} rot={[0, 0, -PI / 2]} w={h} h={S} a={ao * 0.8} />
      <AoStrip p={[x - S / 2, h / 2, back + 0.008]} rot={[0, 0, PI / 2]} w={h} h={S} a={ao * 0.8} />
      <AoStrip p={[-x + 0.008, h / 2, back + S / 2]} rot={[0, PI / 2, PI / 2]} w={h} h={S} a={ao * 0.8} />
      <AoStrip p={[x - 0.008, h / 2, back + S / 2]} rot={[0, -PI / 2, -PI / 2]} w={h} h={S} a={ao * 0.8} />
      <AoStrip p={[0, h - 0.006, back + S / 2]} rot={[PI / 2, 0, 0]} w={w} h={S} a={ao * 0.6} />
    </>
  );
};

const towerTex = (lit: string, base: string) => canvasTex(`tower${lit}${base}`, 256, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = RNG(lit.length + base.charCodeAt(2));
  for (let j = 0; j < 22; j++) for (let i = 0; i < 9; i++) {
    g.fillStyle = r() > 0.72 ? lit : "rgba(25,50,86,.75)";
    g.fillRect(10 + i * 27, 10 + j * 22.6, 19, 15);
  }
}, [1, 2]);
const Skyline: React.FC<{ z: number }> = ({ z }) => {
  const items = once(`skyline:${z}`, () => {
    const r = RNG(404), out: { x: number; w: number; h: number; d: number; b: number; z: number }[] = [];
    for (let i = 0; i < 46; i++) out.push({ x: -90 + i * 4 + r() * 3, w: 9 + r() * 12, h: 22 + r() * 52, d: 16, b: (r() * 3) | 0, z: z - r() * 80 });
    return out;
  });
  const cols: [string, string][] = [["#fff2c0", "#7a93b4"], ["#ffdf9a", "#90a5bf"], ["#fff8d8", "#6d849f"]];
  return <>{items.map((b, i) => <B key={i} p={[b.x, b.h / 2 - 8, b.z]} s={[b.w, b.h, b.d]} c="#fff" o={{ map: towerTex(cols[b.b][0], cols[b.b][1]), r: 0.4 }} cast={false} receive={false} />)}</>;
};

const ceilingTiles = () => canvasTex("ceilingtile", 256, 256, (g, w, h) => {
  g.fillStyle = "#efece5"; g.fillRect(0, 0, w, h);
  const r = RNG(12);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(90,84,74,${0.1 + r() * 0.25})`; g.fillRect(r() * w, r() * h, 1.6, 1.6); }
  g.strokeStyle = "#b9b4a8"; g.lineWidth = 5; g.strokeRect(0, 0, w, h);
}, [6.7, 12]);
const OFFICE_SUN: V3 = [-2.6, 6.2, -14];
const Office: React.FC<SceneProps> = ({ sec }) => {
  const W = 8, BACK = -4.5, wins: Win[] = [-2.6, 0, 2.6].map((x) => ({ x, y0: 0.8, y1: 2.72, w: 2.0 }));
  return (
    <>
      <fog attach="fog" args={["#c4dcf0", 40, 300]} />
      <Sky top="#3f86d8" mid="#8fc3ec" low="#e5f1f6" sun={OFFICE_SUN} />
      <Clouds t={sec} items={[{ p: [-20, 70, -240], s: 34 }, { p: [34, 92, -270], s: 42, seed: 1 }, { p: [-54, 110, -300], s: 46, seed: 2 }]} />
      <Skyline z={-135} />
      <hemisphereLight args={["#f5f3ee", "#a39a90", 1.5]} />
      <Sun dir={OFFICE_SUN} at={[0, 1.4, 0]} color="#fff0d4" i={4.6} range={12} res={3072} />
      {[[-1.8, 0.2], [1.8, 0.2], [-1.8, -3], [1.8, -3], [0, 3.4]].map(([x, z], i) => <pointLight key={i} position={[x, 2.65, z]} color="#fff4e4" intensity={1.1} distance={7} decay={1.7} />)}
      <Room w={W} back={BACK} front={10} h={3.1} wall="#efe4cf" floor={carpetTex("#7c8798", [5, 9], 2)} ceilMap={ceilingTiles()} wins={wins} frame="#39404c" mull={[2, 1]} />
      {/* rolled blinds */}
      {wins.map((n) => <Cyl key={n.x} p={[n.x, 2.68, BACK + 0.13]} rot={[0, 0, Math.PI / 2]} rt={0.05} h={n.w - 0.1} seg={12} c="#ebe8e0" cast={false} />)}
      {[[-1.9, 0.8], [1.9, 0.8], [-1.9, -2.6], [1.9, -2.6], [0, 3.5]].map(([x, z], i) => <CeilingPanel key={i} p={[x, 3.06, z]} />)}

      {/* workstations, with a clear aisle down the middle */}
      <Blob p={[-2.05, 0, -2.45]} w={3} d={2.3} a={0.46} />
      <Desk p={[-2.05, 0, -2.6]} ry={0} kind={1} />
      <OfficeChair p={[-2.0, 0, -1.72]} ry={Math.PI - 0.3} />
      <Blob p={[2.05, 0, -2.45]} w={3} d={2.3} a={0.46} />
      <Desk p={[2.05, 0, -2.6]} ry={0} kind={0} wood="#a97748" />
      <OfficeChair p={[2.1, 0, -1.72]} ry={Math.PI + 0.45} c="#7b3a35" />
      <Blob p={[-2.4, 0, 1.0]} w={2.3} d={3} a={0.46} />
      <Desk p={[-2.65, 0, 1.0]} ry={Math.PI / 2} kind={2} />
      <OfficeChair p={[-1.72, 0, 1.0]} ry={-Math.PI / 2 + 0.2} />
      <Blob p={[2.4, 0, 1.0]} w={2.3} d={3} a={0.46} />
      <Desk p={[2.65, 0, 1.0]} ry={-Math.PI / 2} kind={1} wood="#a97748" />
      <OfficeChair p={[1.72, 0, 0.9]} ry={Math.PI / 2 + 0.5} c="#2d5a54" />

      {/* walls and corners */}
      <Whiteboard p={[-3.97, 1.68, -1.1]} ry={Math.PI / 2} />
      <Bookshelf p={[3.8, 0, -0.9]} ry={-Math.PI / 2} w={1.5} h={2.15} seed={9} />
      <Clock p={[3.97, 2.45, 1.05]} ry={-Math.PI / 2} r={0.22} />
      <FilingCabinet p={[-3.67, 0, 3.2]} ry={Math.PI / 2} />
      <FilingCabinet p={[-3.67, 0, 3.75]} ry={Math.PI / 2} c="#a08f7f" />
      <Printer p={[3.55, 0, 3.1]} ry={-Math.PI / 2} />
      <WaterCooler p={[-3.55, 0, -3.95]} />
      <PottedPlant p={[0, 0, -4.05]} size={1.35} seed={3} />
      <PottedPlant p={[3.5, 0, -4.0]} size={1.5} seed={5} pot="#f0e9dc" />
      <TrashBin p={[-1.0, 0, -3.15]} />
      <TrashBin p={[3.0, 0, 2.0]} />
      <Poster p={[-3.97, 1.75, 1.6]} kind={1} ry={Math.PI / 2} s={1.15} />
      <Poster p={[3.97, 1.75, 2.1]} kind={0} ry={-Math.PI / 2} s={1.15} />

      {wins.map((n) => <Shaft key={n.x} p={[n.x, 1.76, BACK]} w={n.w - 0.1} h={1.85} dir={[2.6, -6.2, 14]} len={9} color="#ffe9c0" a={0.13} />)}
      <Motes center={[0, 1.6, -0.5]} size={[7, 3, 8]} n={160} t={sec} px={24} a={0.65} />
    </>
  );
};

const BED_SUN: V3 = [-3.3, 3.2, -12];
const GardenTree: React.FC<{ p: V3; s: number; seed: number }> = ({ p, s, seed }) => <GeoMesh g={broadleafGeo(seed, 3, ["#7a5128", "#c07a2b", "#f0b64a"])} p={p} s={s} cast={false} />;
const Bedroom: React.FC<SceneProps> = ({ sec }) => {
  const BACK = -3;
  const wins: Win[] = [{ x: 1.35, y0: 0.85, y1: 2.3, w: 1.7 }];
  return (
    <>
      <fog attach="fog" args={["#f6b67f", 25, 140]} />
      <Sky top="#40568f" mid="#f28f63" low="#ffd18e" sun={BED_SUN} sunColor="#ffcc88" glow={1.3} />
      <Plane p={[0, -1.2, -40]} rot={[-Math.PI / 2, 0, 0]} w={200} h={80} c="#6b7f40" />
      <GardenTree p={[-4, -1.2, -22]} s={1.5} seed={61} />
      <GardenTree p={[8, -1.2, -28]} s={1.8} seed={62} />
      <GardenTree p={[13, -1.2, -48]} s={2.2} seed={63} />
      <hemisphereLight args={["#d6d0e4", "#8a7058", 1.7]} />
      <Sun dir={BED_SUN} at={[0, 1, 0]} color="#ffb06a" i={6.2} range={9} res={3072} />
      <pointLight position={[0.4, 1.7, 1.4]} color="#ffdcb0" intensity={1.2} distance={7} decay={1.6} />
      <Room w={6} back={BACK} front={8} h={2.75} wall="#5e8da6" floor={woodTex("#b47a48", [2.4, 4.4], 9)} wins={wins} frame="#f6efe2" ao={0.42} />

      {/* curtains and rod */}
      <Cyl p={[1.35, 2.46, BACK + 0.13]} rot={[0, 0, Math.PI / 2]} rt={0.02} h={2.7} seg={10} c="#c9a04e" o={{ m: 0.8, r: 0.3 }} />
      {[-1, 1].map((sd) => <Ball key={sd} p={[1.35 + sd * 1.35, 2.46, BACK + 0.13]} r={0.04} seg={10} c="#c9a04e" o={{ m: 0.8, r: 0.3 }} />)}
      <Curtain p={[0.26, 1.28, BACK + 0.15]} w={0.56} h={2.36} c="#e4b04f" seed={1} />
      <Curtain p={[2.44, 1.28, BACK + 0.15]} w={0.56} h={2.36} c="#e4b04f" seed={3} />

      <Bed p={[-1.45, 0, -1.87]} blanket="#d05a48" />
      <Nightstand p={[-2.74, 0, -2.66]} />
      <Nightstand p={[-0.06, 0, -2.66]} />
      <TableLamp p={[-2.74, 0.58, -2.66]} i={2.6} />
      <TableLamp p={[-0.06, 0.58, -2.66]} i={2.2} />
      <B p={[-0.08, 0.59, -2.55]} s={[0.18, 0.025, 0.25]} r={0.006} c="#46689b" />
      <Rug p={[0.5, 0, 0.7]} w={3.1} d={3.1} round a="#3f6a5e" b="#cdbf98" />
      <Wardrobe p={[2.66, 0, 0.75]} ry={-Math.PI / 2} />
      <FloorLamp p={[2.45, 0, -2.3]} i={1.5} on={false} />
      <CeilingFan p={[0.35, 2.75, 0.6]} a={sec * 3.1} />
      <PottedPlant p={[-2.5, 0, 0.3]} size={1.4} seed={7} pot="#f0e9dc" />
      <WallShelf p={[-1.45, 2.14, BACK + 0.13]} w={1.5} seed={6} />
      <Poster p={[-2.9, 1.7, 1.15]} kind={2} ry={Math.PI / 2} s={1.1} />
      <Poster p={[-2.9, 1.7, 2.1]} kind={1} ry={Math.PI / 2} s={0.9} />
      <Clock p={[2.95, 2.22, 2.55]} ry={-Math.PI / 2} r={0.17} />

      {/* a small desk by the door */}
      <Blob p={[-2.3, 0, 3.1]} w={1.8} d={2.4} a={0.42} />
      <Desk p={[-2.45, 0, 3.1]} ry={Math.PI / 2} kind={2} wood="#c49660" mess={false} />
      <OfficeChair p={[-1.64, 0, 3.1]} ry={-Math.PI / 2 + 0.3} c="#39506d" />

      {/* slippers and a book left on the rug */}
      {[-0.1, 0.1].map((x, i) => <group key={x} position={[0.72 + x, 0.03, -0.72]} rotation={[0, 0.3 + i * 0.1, 0]}><B s={[0.11, 0.05, 0.26]} r={0.02} c="#6a90bd" /></group>)}
      <group position={[1.45, 0.045, 1.05]} rotation={[0, 0.7, 0]}><B s={[0.26, 0.04, 0.36]} r={0.008} c="#b23a3a" /></group>

      <Shaft p={[1.35, 1.57, BACK]} w={1.5} h={1.3} dir={[3.3, -3.2, 12]} len={8} color="#ffbf80" a={0.17} />
      <Motes center={[0.6, 1.3, 0]} size={[5, 2.5, 5]} n={110} t={sec} px={22} color="#ffdcae" />
    </>
  );
};

// ================================================================ plains
const plainPath = (z: number) => Math.sin(z * 0.035) * 6.5 + Math.sin(z * 0.013 + 1) * 4;
const plainH = (x: number, z: number) => {
  const d = Math.abs(x - plainPath(z));
  const big = (fbm(x * 0.0065 + 9, z * 0.0065 + 2, 5, 1) - 0.47) * 58;
  const hills = big * smooth(10, 150, d + Math.max(0, -z - 30) * 1.1);
  const small = (fbm(x * 0.06, z * 0.06, 3, 2) - 0.5) * 1.5 * smooth(2.5, 8, d);
  return hills + small - smooth(1.8, 0.3, d) * 0.08;
};
const SKY_PLAINS: V3 = [-0.62, 0.55, -0.56];
const Plains: React.FC<SceneProps> = ({ sec, t }) => {
  const terrain = terrainGeo("plains", 1200, 1200, 520, plainH, (x, z) => {
    const d = Math.abs(x - plainPath(z)), n = fbm(x * 0.022 + 4, z * 0.022, 4, 8), m = fbm(x * 0.15, z * 0.15, 3, 6);
    const c = col("#4d8f2c").lerp(col("#8cb93c"), smooth(0.34, 0.66, n)).lerp(col("#d0c25a"), smooth(0.62, 0.8, n) * 0.55);
    c.multiplyScalar(0.92 + m * 0.2);
    return c.lerp(col("#b8926a").multiplyScalar(0.72 + m * 0.5), smooth(1.9, 0.7, d + (m - 0.5) * 1.1));
  }, [0, -340]);
  const grassM = swayMat("plains", { vertexColors: true, side: THREE.DoubleSide, roughness: 0.96 }, 0.13, 0.6);
  setSway(grassM, sec);
  const grass = instanced("plains-grass", tuftGeo(1, 11, 0.4, 0.027), grassM, once("plains-grass-items", () => {
    const r = RNG(5), out: Inst[] = [], cols = ["#7fb53a", "#6aa533", "#9cc445", "#5a9630", "#b8cf52"];
    for (let i = 0; i < 74000; i++) {
      const z = 30 - Math.pow(r(), 1.7) * 150, half = 8 + (30 - z) * 0.55;
      const x = plainPath(z) + (r() - 0.5) * half * 2;
      if (Math.abs(x - plainPath(z)) < 1.05 + r() * 0.4) continue;
      const big = 1 + Math.max(0, 8 - z) * 0.024;
      out.push({ p: [x, plainH(x, z) - 0.02, z], s: big * (0.75 + r() * 0.6), r: [0, r() * 6.28, 0], c: cols[(r() * cols.length) | 0] });
    }
    return out;
  }), false, true);
  const flowers = instanced("plains-flowers", once("flowergeo", () => new THREE.IcosahedronGeometry(0.075, 1)), mat("#ffffff", { r: 0.7 }), once("plains-flower-items", () => {
    const r = RNG(15), out: Inst[] = [], cs = ["#fdfdf0", "#ffd93d", "#f783ac", "#c6a0ff", "#ff7a4d"];
    for (let i = 0; i < 2600; i++) {
      const z = 28 - r() * 90, x = plainPath(z) + (r() - 0.5) * 34;
      if (Math.abs(x - plainPath(z)) < 1.4) continue;
      const patch = fbm(x * 0.13, z * 0.13, 2, 4);
      if (patch < 0.5) continue;
      out.push({ p: [x, plainH(x, z) + 0.26 + r() * 0.18, z], s: [1, 0.55, 1], c: cs[(r() * cs.length) | 0] });
    }
    return out;
  }), false, false);
  const farTrees = instanced("plains-far", broadleafGeo(5, 2), vertexMat, once("plains-far-items", () => {
    const r = RNG(99), out: Inst[] = [];
    for (let i = 0; i < 160; i++) {
      const z = -60 - r() * 420, x = (r() - 0.5) * 460;
      if (Math.abs(x - plainPath(z)) < 24 || fbm(x * 0.012, z * 0.012, 2, 3) < 0.47) continue;
      out.push({ p: [x, plainH(x, z) - 0.4, z], s: 1.1 + r() * 1.3, r: [0, r() * 6.28, 0] });
    }
    return out;
  }), false, false);
  const mountains = terrainGeo("plains-mts", 1800, 240, 300, (x, z) => {
    const e = smooth(120, 0, Math.abs(z + 740));
    return e * ((1 - Math.abs(2 * fbm(x * 0.0058 + 3, z * 0.009, 5, 4) - 1)) ** 1.6) * 150 - 6;
  }, (x, z, y) => col("#5e7fb0").lerp(col("#7f9ccb"), smooth(20, 85, y)).lerp(col("#f7fbff"), smooth(84, 112, y + (fbm(x * 0.05, z * 0.05, 3, 3) - 0.5) * 26)), [0, -740]);
  const fence = once("plains-fence", () => { const out: V3[] = []; for (let z = 24; z > -66; z -= 3.6) { const x = plainPath(z) - 3.6; out.push([x, plainH(x, z), z]); } return out; });
  const oakZ = -21, oakX = plainPath(oakZ) + 7.5;
  return (
    <>
      <fog attach="fog" args={["#d3e8ee", 120, 1700]} />
      <Sky top="#2a74d3" mid="#7dbdec" low="#e6f1f0" sun={SKY_PLAINS} />
      <hemisphereLight args={["#bfdcf7", "#8a9a50", 1.45]} />
      <Sun dir={SKY_PLAINS} at={[1, 0, 8 - t * 12]} color="#fff0d2" i={3.7} range={46} res={3072} bias={-0.0009} />
      <Clouds t={sec} speed={1.2} items={[
        { p: [-70, 195, -430], s: 46 }, { p: [70, 255, -540], s: 62, seed: 1 }, { p: [-210, 300, -640], s: 76, seed: 2 }, { p: [200, 210, -560], s: 50, seed: 3 },
        { p: [-20, 370, -760], s: 92, seed: 1 }, { p: [30, 160, -360], s: 24, seed: 2 },
      ]} />
      <mesh geometry={mountains} material={vertexMat} />
      <mesh geometry={terrain} receiveShadow material={once("plains-ground", () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: detailTex(160, "grass") }))} />
      <Prim o={grass} />
      <Prim o={flowers} />
      <Prim o={farTrees} />
      <WoodFence pts={fence} />
      <GeoMesh g={OakGeo()} p={[oakX, plainH(oakX, oakZ) - 0.25, oakZ]} s={1.55} />
      <GeoMesh g={rockGeo(2, ["#70706a", "#b8b5a4"])} p={[plainPath(4) + 3.8, plainH(plainPath(4) + 3.8, 4), 4]} s={[0.9, 0.65, 0.75]} />
      <GeoMesh g={rockGeo(4, ["#70706a", "#b8b5a4"])} p={[plainPath(-9) - 5.5, plainH(plainPath(-9) - 5.5, -9), -9]} s={[1.3, 0.8, 1.1]} />
      <House p={[plainPath(-96) - 34, plainH(plainPath(-96) - 34, -96) - 0.3, -96]} ry={0.45} w={15} d={10} wall="#b83a2c" roof="#574c45" shutter="#f3eee2" door="#f3eee2" />
      <Motes center={[1, 1.5, 4]} size={[18, 3.6, 34]} n={100} t={sec} px={18} a={0.6} color="#fff6bd" />
    </>
  );
};

// ================================================================ forest
const forestPath = (z: number) => Math.sin(z * 0.06) * 3.1 + Math.sin(z * 0.023) * 2;
const forestH = (x: number, z: number) => {
  const d = Math.abs(x - forestPath(z));
  return (fbm(x * 0.03 + 5, z * 0.03, 4, 5) - 0.5) * 8 * smooth(1, 16, d) + (fbm(x * 0.2, z * 0.2, 2, 8) - 0.5) * 0.45 * smooth(1.2, 3, d);
};
const FOREST_SUN: V3 = [0.42, 0.72, -0.52];
const pineTall = (seed: number) => once(`pinetall:${seed}`, () => {
  const g = pineGeo(seed, 7).clone();
  // stretch the lower half so canopies start far above head height
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setY(i, y < 1 ? y * 7.5 : y + 6.5);
    const r = 1 - smooth(1, 2, y) * 0;
    pos.setX(i, pos.getX(i) * r); pos.setZ(i, pos.getZ(i) * r);
  }
  g.computeVertexNormals();
  return g;
});
const Forest: React.FC<SceneProps> = ({ sec, t }) => {
  const terrain = terrainGeo("forest", 340, 340, 340, forestH, (x, z) => {
    const d = Math.abs(x - forestPath(z)), n = fbm(x * 0.16, z * 0.16, 4, 1), m = fbm(x * 0.7, z * 0.7, 2, 2);
    const c = col("#5a8030").lerp(col("#97a23a"), smooth(0.4, 0.68, n)).lerp(col("#9a7640"), smooth(0.56, 0.74, m) * 0.5);
    return c.lerp(col("#b58f60").multiplyScalar(0.78 + m * 0.5), smooth(1.9, 0.5, d + (n - 0.5) * 1.6));
  }, [0, -60]);
  const pines = (id: number, seed: number) => instanced(`forest-pines${id}`, pineTall(seed), vertexMat, once(`forest-pine-items${id}`, () => {
    const r = RNG(1000 + id * 7), out: Inst[] = [];
    for (let i = 0; i < 95; i++) {
      const z = 30 - r() * 190, x = forestPath(z) + (r() < 0.5 ? -1 : 1) * (3.8 + Math.pow(r(), 1.2) * 52);
      out.push({ p: [x, forestH(x, z) - 0.2, z], s: [1.12 + r() * 0.5, 1.05 + r() * 0.42, 1.12 + r() * 0.5], r: [0, r() * 6.28, 0] });
    }
    return out;
  }));
  const birch = instanced("forest-broad", broadleafGeo(18, 2, ["#1d4a1f", "#3b7a2a", "#74a636"]), vertexMat, once("forest-broad-items", () => {
    const r = RNG(1303), out: Inst[] = [];
    for (let i = 0; i < 80; i++) {
      const z = 26 - r() * 170, x = forestPath(z) + (r() < 0.5 ? -1 : 1) * (4.5 + r() * 42);
      out.push({ p: [x, forestH(x, z) - 0.2, z], s: 0.95 + r() * 0.7, r: [0, r() * 6.28, 0] });
    }
    return out;
  }));
  const grassM = swayMat("forest", { vertexColors: true, side: THREE.DoubleSide, roughness: 0.96 }, 0.07, 0.6);
  setSway(grassM, sec);
  const undergrowth = instanced("forest-tufts", tuftGeo(4, 7, 0.52, 0.05), grassM, once("forest-tuft-items", () => {
    const r = RNG(22), out: Inst[] = [], cs = ["#62923a", "#4e8034", "#7f9f3f", "#3c6c31"];
    for (let i = 0; i < 18000; i++) {
      const z = 26 - r() * 90, x = forestPath(z) + (r() - 0.5) * 30;
      if (Math.abs(x - forestPath(z)) < 1.35 + r() * 0.6 || fbm(x * 0.16, z * 0.16, 2, 2) < 0.4) continue;
      out.push({ p: [x, forestH(x, z) - 0.02, z], s: 0.85 + r() * 0.8, r: [0, r() * 6.28, 0], c: cs[(r() * 4) | 0] });
    }
    return out;
  }), false, true);
  const fernM = swayMat("fern", { vertexColors: true, side: THREE.DoubleSide, roughness: 0.92 }, 0.05, 0.5);
  setSway(fernM, sec);
  const ferns = instanced("forest-ferns", fernGeo(3), fernM, once("forest-fern-items", () => {
    const r = RNG(32), out: Inst[] = [], cs = ["#6cb84f", "#59a544", "#8ccb56"];
    for (let i = 0; i < 2600; i++) {
      const z = 26 - r() * 80, x = forestPath(z) + (r() - 0.5) * 28;
      if (Math.abs(x - forestPath(z)) < 1.8) continue;
      out.push({ p: [x, forestH(x, z) - 0.04, z], s: 0.5 + r() * 0.65, r: [0, r() * 6.28, 0], c: cs[(r() * 3) | 0] });
    }
    return out;
  }), true, true);
  const rocks = instanced("forest-rocks", rockGeo(9, ["#5e5f5a", "#918f86", "#5f8c3b"]), vertexMat, once("forest-rock-items", () => {
    const r = RNG(42), out: Inst[] = [];
    for (let i = 0; i < 110; i++) {
      const z = 26 - r() * 100, x = forestPath(z) + (r() < 0.5 ? -1 : 1) * (2.3 + r() * 22), s = 0.28 + Math.pow(r(), 2.2) * 1.5;
      out.push({ p: [x, forestH(x, z) + s * 0.1, z], s: [s * 1.1, s * 0.9, s], r: [0, r() * 6.28, 0] });
    }
    return out;
  }));
  const shrooms = once("forest-shrooms", () => { const r = RNG(61), out: { p: V3; s: number; c: string }[] = []; for (let i = 0; i < 26; i++) { const z = 22 - r() * 34, x = forestPath(z) + (r() < 0.5 ? -1 : 1) * (1.5 + r() * 1.5); out.push({ p: [x, forestH(x, z), z], s: 0.7 + r() * 0.9, c: r() > 0.4 ? "#d23a2e" : "#e8a43a" }); } return out; });
  const logZ = 2, logX = forestPath(logZ) - 4;
  const rays: [number, number, number][] = [[-3, -2, 2.6], [3.2, -9, 3.4], [-6, -13, 3], [1.2, -21, 3.8], [6.2, -24, 3.2], [-2.4, -33, 4.4], [4, 6, 2.6], [-5, 6, 2.2]];
  return (
    <>
      <fogExp2 attach="fog" args={["#b3d0a8", 0.0155]} />
      <Sky top="#7fb8d8" mid="#c6e4d5" low="#d6e8c6" sun={FOREST_SUN} glow={1.4} />
      <hemisphereLight args={["#dff3dc", "#7a8a45", 1.95]} />
      <Sun dir={FOREST_SUN} at={[0, 2, 4 - t * 10]} color="#fff2c6" i={7} range={44} res={4096} bias={-0.0008} />
      <mesh geometry={terrain} receiveShadow castShadow={false} material={once("forest-ground", () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: detailTex(70, "dirt") }))} />
      <Prim o={pines(0, 1)} /><Prim o={pines(1, 2)} /><Prim o={pines(2, 3)} />
      <Prim o={birch} /><Prim o={undergrowth} /><Prim o={ferns} /><Prim o={rocks} />
      <group position={[logX, forestH(logX, logZ) + 0.35, logZ]} rotation={[0, 0.75, Math.PI / 2 - 0.02]}>
        <Cyl rt={0.36} rb={0.42} h={6.4} seg={16} c="#5e4230" o={{ r: 1 }} />
        <Cyl p={[0, 3.21, 0]} rt={0.33} h={0.02} seg={16} c="#c99e6c" cast={false} />
        <Cyl p={[0, -3.21, 0]} rt={0.39} h={0.02} seg={16} c="#c99e6c" cast={false} />
        <GeoMesh g={rockGeo(21, ["#4d7b30", "#79a53d"])} p={[0.25, 1, 0]} s={[0.26, 1.2, 0.46]} />
      </group>
      {shrooms.map((m, i) => (
        <group key={i} position={m.p} scale={m.s}>
          <Cyl p={[0, 0.08, 0]} rt={0.025} rb={0.04} h={0.17} seg={10} c="#f1eadb" />
          <Ball p={[0, 0.17, 0]} r={0.1} seg={14} s={[1, 0.62, 1]} c={m.c} o={{ r: 0.42 }} />
        </group>
      ))}
      {rays.map(([x, z, w], i) => <SoftRay key={i} from={[x + 17.5, 32, z - 21.6]} dir={[-FOREST_SUN[0], -FOREST_SUN[1], -FOREST_SUN[2]]} len={46} w={w * 1.9} color="#fff2bd" a={0.15} />)}
      <Motes center={[0.5, 2.1, 2]} size={[12, 5, 22]} n={160} t={sec} px={28} a={0.75} color="#fff3bd" seed={4} />
    </>
  );
};

// ================================================================ desert
const desertH = (x: number, z: number) => {
  const wx = x + (fbm(x * 0.008, z * 0.008, 3, 3) - 0.5) * 50, wz = z + (fbm(x * 0.008 + 7, z * 0.008, 3, 4) - 0.5) * 50;
  const n = fbm(wx * 0.009 + wz * 0.004, wz * 0.014, 4, 9);
  const ridge = (1 - Math.abs(2 * n - 1)) ** 2.3;
  const away = Math.hypot(x, z - 10);
  const small = (fbm(x * 0.07, z * 0.07, 2, 1) - 0.5) * 0.7;
  return ridge * lerp(4, 40, smooth(18, 300, away)) + small;
};
const DES_SUN: V3 = [-0.72, 0.4, -0.58];
const SignBoard: React.FC<{ p: V3; ry?: number; roll?: number }> = ({ p, ry = 0, roll = 0 }) => {
  const tex = canvasTex("desertsign", 512, 256, (g, w, h) => {
    g.fillStyle = "#b08552"; g.fillRect(0, 0, w, h);
    const r = RNG(8);
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(60,34,12,${0.08 + r() * 0.2})`; g.lineWidth = 1 + r() * 3; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + 8, 340, y - 8, w, y + r() * 8); g.stroke(); }
    g.fillStyle = "#2d1a0d"; g.font = "900 72px Arial"; g.textAlign = "center"; g.fillText("NEXT WATER", w / 2, 108); g.font = "900 88px Arial"; g.fillText("90 MILES", w / 2, 208);
  });
  return (
    <group position={p} rotation={[0, ry, roll]}>
      <Blob p={[0, 0, 0]} w={1.5} d={1.1} a={0.3} />
      {[-0.86, 0.86].map((x) => <Cyl key={x} p={[x, 0.92, -0.03]} rt={0.06} rb={0.07} h={2} seg={8} c="#7a5634" o={{ r: 1 }} />)}
      <B p={[0, 1.46, 0]} s={[2.1, 1.04, 0.05]} c="#8a6238" />
      <Plane p={[0, 1.46, 0.027]} w={2.08} h={1.02} o={{ map: tex, r: 1 }} />
    </group>
  );
};
const Tumbleweed: React.FC<{ p: V3; rx: number; s?: number }> = ({ p, rx, s = 1 }) => {
  const g = once("tumble", () => displace(weld(new THREE.IcosahedronGeometry(1, 4)), (v) => v.multiplyScalar(0.72 + noise2(v.x * 3 + v.y, v.z * 3, 2) * 0.55)));
  const m = once("tumblemat", () => new THREE.MeshStandardMaterial({ color: "#8d6b3d", wireframe: true, roughness: 1 }));
  return (
    <group position={p} scale={s}>
      <mesh rotation={[rx, 0, rx * 0.5]} geometry={g} material={m} castShadow scale={0.65} />
      <mesh rotation={[0, rx * 1.2, rx]} geometry={g} material={m} scale={0.46} />
      <Ball r={0.27} seg={8} c="#6a4e2a" cast={false} />
    </group>
  );
};
const Desert: React.FC<SceneProps> = ({ sec, t }) => {
  const terrain = terrainGeo("desert", 1500, 1500, 560, desertH, (x, z, y) => {
    const n = fbm(x * 0.05, z * 0.05, 3, 2);
    return col("#d58d46").lerp(col("#f2bd6d"), smooth(0, 16, y + n * 8)).lerp(col("#f9d695"), smooth(14, 32, y)).multiplyScalar(0.94 + n * 0.12);
  }, [0, -440]);
  const material = once("desert-ground", () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, map: detailTex(300, "sand") }));
  const cacti = instanced("desert-cacti", cactusGeo(2), vertexMat, once("desert-cacti-items", () => {
    const r = RNG(141), out: Inst[] = [];
    for (let i = 0; i < 48; i++) {
      const z = 2 - Math.pow(r(), 0.7) * 170, x = (r() < 0.5 ? -1 : 1) * (7 + r() * 70);
      const s = 1 + r() * 0.95;
      out.push({ p: [x, desertH(x, z) - 0.2, z], s, r: [0, r() * 6.28, 0] });
    }
    return out;
  }));
  const rocks = instanced("desert-rocks", rockGeo(13, ["#8c4c2c", "#d7915c"]), vertexMat, once("desert-rock-items", () => {
    const r = RNG(241), out: Inst[] = [];
    for (let i = 0; i < 240; i++) {
      const z = 18 - r() * 180, x = (r() - 0.5) * 150, s = 0.14 + Math.pow(r(), 2.8) * 2.3;
      if (Math.abs(x) < 2.1) continue;
      out.push({ p: [x, desertH(x, z), z], s: [s * 1.2, s * 0.9, s], r: [0, r() * 6.28, 0] });
    }
    return out;
  }));
  const brushM = swayMat("desert", { vertexColors: true, side: THREE.DoubleSide, roughness: 1 }, 0.05, 0.6);
  setSway(brushM, sec);
  const brush = instanced("desert-brush", tuftGeo(6, 14, 0.75, 0.024), brushM, once("desert-brush-items", () => {
    const r = RNG(341), out: Inst[] = [], cs = ["#9b8a4c", "#a87c40", "#79773f", "#b89a55"];
    for (let i = 0; i < 560; i++) {
      const z = 21 - r() * 120, x = (r() - 0.5) * 90;
      if (Math.abs(x) < 1.8 || fbm(x * 0.09, z * 0.09, 2, 4) < 0.46) continue;
      out.push({ p: [x, desertH(x, z) - 0.02, z], s: 0.75 + r() * 1, r: [0, r() * 6.28, 0], c: cs[(r() * 4) | 0] });
    }
    return out;
  }));
  const sideRocks: [number, number, number][] = [[4.4, 6, 1.6], [-5.3, 1.5, 2.4], [6.6, -8, 3]];
  const mesas: [number, number, number, number, number][] = [[-130, -410, 66, 94, 1], [12, -560, 104, 120, 2], [184, -440, 58, 76, 3], [-280, -620, 104, 132, 4], [320, -640, 120, 118, 5], [66, -330, 28, 54, 6]];
  const poles = [-6, -44, -82, -120, -158, -196, -234, -272];
  const twX = lerp(-11, 5.4, t);
  return (
    <>
      <fog attach="fog" args={["#f7c98e", 130, 1100]} />
      <Sky top="#3478cc" mid="#f6bb8c" low="#ffe0a8" sun={DES_SUN} sunColor="#ffd9a5" glow={1.5} />
      <hemisphereLight args={["#c7d8ee", "#d89f65", 1.85]} />
      <Sun dir={DES_SUN} at={[0, 0, 8 - t * 8]} color="#ffc98f" i={5.2} range={48} res={3072} bias={-0.0012} />
      <Clouds t={sec} speed={0.9} tint="#ffd9c4" items={[{ p: [-110, 330, -560], s: 58 }, { p: [90, 410, -640], s: 76, seed: 1 }, { p: [-320, 500, -780], s: 92, seed: 2 }]} />
      <mesh geometry={terrain} material={material} receiveShadow castShadow />
      {mesas.map(([x, z, r, h, s]) => <GeoMesh key={s} g={mesaGeo(s, r, h)} p={[x, desertH(x, z) - 8, z]} cast={false} />)}
      <Prim o={cacti} /><Prim o={rocks} /><Prim o={brush} />
      {/* hero cacti just off the camera path */}
      <GeoMesh g={cactusGeo(5)} p={[5.2, desertH(5.2, 2.4) - 0.2, 2.4]} s={1.3} r={[0, 0.8, 0]} />
      <GeoMesh g={cactusGeo(8)} p={[-6.4, desertH(-6.4, -8) - 0.2, -8]} s={1.55} r={[0, 2.3, 0]} />
      {sideRocks.map(([x, z, s], i) => <GeoMesh key={i} g={rockGeo(i + 31, ["#8c4c2c", "#dc9a64"])} p={[x, desertH(x, z), z]} s={[s * 1.2, s * 0.9, s]} r={[0, i * 2, 0]} />)}
      <SignBoard p={[-1.75, desertH(-1.75, 6.5), 6.5]} ry={0.28} roll={0.05} />
      {poles.map((z) => <UtilityPole key={z} p={[-13.5, desertH(-13.5, z) - 0.2, z]} />)}
      {[-1.3, 0, 1.3].map((x) => <Cyl key={x} p={[-13.5 + x, 9.86, -133]} rot={[Math.PI / 2, 0, 0]} rt={0.012} h={290} seg={4} c="#2d2622" cast={false} receive={false} />)}
      <Tumbleweed p={[twX, desertH(twX, 3.5) + 0.42 + Math.abs(Math.sin(sec * 3.4)) * 0.14, 3.5]} rx={-sec * 3.6} s={0.92} />
      <Motes center={[0, 0.9, 7]} size={[16, 1.5, 14]} n={120} t={sec * 2.2} px={15} a={0.45} color="#ffdcae" seed={7} />
    </>
  );
};

// ================================================================ street / neighbourhood
const STREET_SUN: V3 = [0.55, 0.62, 0.46];
const HOUSE_SEQ: Omit<HouseSpec, "p" | "ry">[] = [
  { wall: "#e7d4a8", roof: "#6a4a3e", door: "#2f6b5e", shutter: "#2f4f6f", storeys: 2, garage: true, lit: [true, false, true, false, false] },
  { wall: "#b5cfd8", roof: "#4c4e57", door: "#c43d33", shutter: "#f4efe3", storeys: 1, lit: [false, true] },
  { wall: "#c86f4b", roof: "#54423d", door: "#f0d38a", shutter: "#355847", storeys: 2, brick: true, lit: [true, true, false, true, false] },
  { wall: "#f0ede4", roof: "#5e6a7b", door: "#2d5a92", shutter: "#a14336", storeys: 1, garage: true, lit: [true, false] },
  { wall: "#dfb9b9", roof: "#5f4a4b", door: "#f4efe3", shutter: "#70494f", storeys: 2, lit: [false, true, true, false, true] },
  { wall: "#b7c79d", roof: "#574a3e", door: "#d68a34", shutter: "#3b5636", storeys: 1, garage: true, lit: [true, false] },
];
const StreetTree: React.FC<{ p: V3; s: number; seed: number; autumn?: boolean }> = ({ p, s, seed, autumn }) => (
  <>
    <Blob p={[p[0], p[1], p[2]]} w={4.6 * s} a={0.4} />
    <GeoMesh g={broadleafGeo(seed, 3, autumn ? ["#a65125", "#dc8a2d", "#f5c34d"] : ["#2d6626", "#59a033", "#a7d04a"])} p={p} s={s} />
  </>
);
const Street: React.FC<SceneProps> = ({ sec, t }) => {
  const rowZ = Array.from({ length: 13 }, (_, i) => 26 - i * 16);
  const passZ = lerp(-92, 40, t);
  const grassM = swayMat("street", { vertexColors: true, side: THREE.DoubleSide, roughness: 0.96 }, 0.04, 0.3);
  setSway(grassM, sec);
  const lawn = instanced("street-lawn", tuftGeo(8, 8, 0.2, 0.03), grassM, once("street-lawn-items", () => {
    const r = RNG(808), out: Inst[] = [], cs = ["#61a13a", "#4f9033", "#7fb545", "#6ca83c"];
    for (let i = 0; i < 44000; i++) {
      const sd = r() < 0.5 ? -1 : 1, x = sd * (6.7 + r() * 5.3), z = 28 - Math.pow(r(), 1.2) * 92;
      const q = ((z - (sd < 0 ? 26 : 20) + 1600) % 16);
      if (Math.min(q, 16 - q) < 0.95) continue;
      out.push({ p: [x, 0.175, z], s: 0.9 + r() * 0.8, r: [0, r() * 6.28, 0], c: cs[(r() * 4) | 0] });
    }
    return out;
  }), false, true);
  const treeline = instanced("street-treeline", broadleafGeo(9, 2), vertexMat, once("street-treeline-items", () => {
    const r = RNG(909), out: Inst[] = [];
    for (let i = 0; i < 240; i++) { const sd = r() < 0.5 ? -1 : 1, x = sd * (32 + r() * 80), z = 60 - r() * 460; out.push({ p: [x, 0, z], s: 1.2 + r() * 1.3, r: [0, r() * 6.28, 0] }); }
    for (let i = 0; i < 60; i++) { const z = -210 - r() * 60, x = (r() - 0.5) * 170; out.push({ p: [x, 0, z], s: 1.4 + r() * 1.4, r: [0, r() * 6.28, 0] }); }
    return out;
  }), false, false);
  const CARS = ["#3b6cb2", "#e7e4dc", "#2e3640", "#c9a23c", "#b73a33"];
  const ROAD_L = 260, ROAD_C = -100;
  return (
    <>
      <fog attach="fog" args={["#ffd8ae", 45, 340]} />
      <Sky top="#4787d4" mid="#f2c29a" low="#ffe2b4" sun={STREET_SUN} sunColor="#ffd9a5" glow={1.25} />
      <hemisphereLight args={["#d8e3f2", "#a8966c", 1.75]} />
      <Sun dir={STREET_SUN} at={[-1, 0, 2 - t * 8]} color="#ffcf95" i={4.6} range={46} res={4096} bias={-0.0009} />
      <Clouds t={sec} speed={0.7} tint="#ffe8d8" items={[{ p: [-70, 190, -320], s: 40 }, { p: [44, 250, -420], s: 56, seed: 1 }, { p: [-180, 300, -470], s: 66, seed: 2 }, { p: [100, 160, -300], s: 28, seed: 3 }]} />
      <Plane p={[0, -0.03, ROAD_C]} rot={[-Math.PI / 2, 0, 0]} w={700} h={760} c="#ffffff" o={{ map: canvasTexGrass(), r: 1 }} />
      {/* road, curbs and sidewalks */}
      <Plane p={[0, 0.005, ROAD_C]} rot={[-Math.PI / 2, 0, 0]} w={9} h={ROAD_L} o={{ map: asphaltTex([1.6, 44]), r: 0.86 }} />
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <B p={[sd * 4.6, 0.09, ROAD_C]} s={[0.2, 0.18, ROAD_L]} c="#c9c5bb" cast={false} />
          <Plane p={[sd * 5.65, 0.185, ROAD_C]} rot={[-Math.PI / 2, 0, 0]} w={1.95} h={ROAD_L} o={{ map: concreteTex("#c9c4b8", [1, ROAD_L / 1.9]), r: 0.92 }} />
          <Plane p={[sd * 17, 0.15, ROAD_C]} rot={[-Math.PI / 2, 0, 0]} w={21} h={ROAD_L} c="#6fa23f" o={{ r: 1, map: detailTex(24, "grass") }} />
        </group>
      ))}
      {Array.from({ length: 44 }).map((_, i) => <Plane key={i} p={[0, 0.012, 30 - i * 6]} rot={[-Math.PI / 2, 0, 0]} w={0.14} h={3} c="#f2c94a" o={{ r: 0.8 }} />)}
      {[-1, 1].map((sd) => <Plane key={sd} p={[sd * 4.2, 0.012, ROAD_C]} rot={[-Math.PI / 2, 0, 0]} w={0.11} h={ROAD_L} c="#e6e3da" o={{ r: 0.8 }} />)}
      <Prim o={lawn} />
      <Prim o={treeline} />
      {rowZ.map((z, i) => {
        const a = HOUSE_SEQ[i % HOUSE_SEQ.length], b = HOUSE_SEQ[(i + 3) % HOUSE_SEQ.length];
        return (
          <group key={z}>
            <House p={[-15.6, 0.1, z]} ry={Math.PI / 2} {...a} />
            <House p={[15.6, 0.1, z - 6]} ry={-Math.PI / 2} {...b} />
            {/* walkways, drives, boxes */}
            <Plane p={[-9.1, 0.2, z]} rot={[-Math.PI / 2, 0, 0]} w={5.2} h={1.6} o={{ map: concreteTex("#d3cdbf", [5, 1]), r: 0.95 }} />
            <Plane p={[9.1, 0.2, z - 6]} rot={[-Math.PI / 2, 0, 0]} w={5.2} h={1.6} o={{ map: concreteTex("#d3cdbf", [5, 1]), r: 0.95 }} />
            <Mailbox p={[-7, 0.15, z + 1.7]} ry={Math.PI / 2} c={["#2f5f93", "#c43d33", "#2d6b52"][i % 3]} />
            <Mailbox p={[7, 0.15, z - 4.3]} ry={-Math.PI / 2} c={["#3d3d44", "#2f5f93", "#c43d33"][i % 3]} />
            <PicketFence p={[-7.6, 0.15, z + 2.4]} ry={-Math.PI / 2} len={5} />
            <PicketFence p={[7.6, 0.15, z - 8.2]} ry={-Math.PI / 2} len={5} />
            {i > 1 && <StreetTree p={[-7.7, -0.2, z - 8]} s={0.62 + (i % 3) * 0.1} seed={30 + (i % 4)} autumn={i % 5 === 2} />}
            <StreetTree p={[7.7, -0.2, z - 14]} s={0.6 + (i % 4) * 0.09} seed={34 + (i % 4)} autumn={i % 7 === 3} />
          </group>
        );
      })}
      {Array.from({ length: 7 }).map((_, i) => <group key={i}><StreetLamp p={[-5.25, 0.18, 18 - i * 32]} /><StreetLamp p={[5.25, 0.18, 2 - i * 32]} flip /></group>)}
      {Array.from({ length: 7 }).map((_, i) => <UtilityPole key={i} p={[6.1, 0.18, 30 - i * 40]} />)}
      {[-1.3, 0, 1.3].map((x) => <Cyl key={x} p={[6.1 + x, 9.86, -90]} rot={[Math.PI / 2, 0, 0]} rt={0.012} h={260} seg={4} c="#2d2622" cast={false} receive={false} />)}
      <Hydrant p={[-5.2, 0.18, 7]} />
      <Car p={[-3.25, 0, -9]} ry={Math.PI / 2} c={CARS[0]} />
      <Car p={[3.25, 0, -2]} ry={-Math.PI / 2} c={CARS[1]} />
      <Car p={[-3.25, 0, -24]} ry={Math.PI / 2} c={CARS[3]} />
      <Car p={[3.25, 0, -40]} ry={-Math.PI / 2} c={CARS[4]} />
      <Car p={[-3.25, 0, -66]} ry={Math.PI / 2} c={CARS[2]} />
      {/* a car driving down the street */}
      <Car p={[1.7, 0, passZ]} ry={-Math.PI / 2} c="#2fa890" lights roll={sec * 8} />
      <Motes center={[0, 2, 6]} size={[16, 4, 24]} n={70} t={sec} px={16} a={0.45} color="#ffe6bd" seed={3} />
    </>
  );
};
const canvasTexGrass = () => carpetTex("#649a3b", [80, 80]);

// ================================================================ the set list
const ph = (fn: (x: number, z: number) => number, x: number, z: number, up: number) => fn(x, z) + up;
export const LOCATIONS: Location[] = [
  { id: "office", title: "OFFICE", Scene: Office, exposure: 1.02, cam: { from: [0.15, 1.55, 6.6], to: [-0.1, 1.5, 3.9], look0: [0, 1.38, -4.5], look1: [0, 1.4, -4.5], fov: 58 } },
  { id: "bedroom", title: "BEDROOM", Scene: Bedroom, exposure: 1.05, cam: { from: [1.15, 1.52, 5.7], to: [0.62, 1.42, 3.5], look0: [0.05, 0.86, -3], look1: [-0.05, 0.84, -3], fov: 58 } },
  { id: "plains", title: "PLAINS", Scene: Plains, cam: { from: [plainPath(26) + 0.3, ph(plainH, plainPath(26) + 0.3, 26, 1.42), 26], to: [plainPath(10), ph(plainH, plainPath(10), 10, 1.48), 10], look0: [plainPath(-30) + 1, 4.5, -30], look1: [plainPath(-36) + 1, 5.5, -36], fov: 56 } },
  { id: "forest", title: "FOREST", Scene: Forest, cam: { from: [forestPath(24), ph(forestH, forestPath(24), 24, 1.5), 24], to: [forestPath(9), ph(forestH, forestPath(9), 9, 1.5), 9], look0: [forestPath(-14), 5.2, -14], look1: [forestPath(-22), 6.5, -22], fov: 60 } },
  { id: "desert", title: "DESERT", Scene: Desert, exposure: 1.02, cam: { from: [-0.4, ph(desertH, -0.4, 19, 1.35), 19], to: [0.7, ph(desertH, 0.7, 9, 1.5), 9], look0: [0.8, 11, -80], look1: [1.8, 13, -80], fov: 56 } },
  { id: "street", title: "NEIGHBOURHOOD", Scene: Street, exposure: 1.02, cam: { from: [-1.1, 1.7, 15], to: [-1.1, 1.7, 3.8], look0: [-14.5, 3.3, -18], look1: [-13.5, 3.4, -30], fov: 56 } },
];
