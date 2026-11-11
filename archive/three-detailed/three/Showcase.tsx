import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { PostFX } from "../scene/Scene";
import { W, H } from "../theme";
import { CameraRig } from "./kit";
import { LOCATIONS, type Location } from "./locations";

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });

export const SHOT = 135;
export const OVERLAP = 10;
export const SHOWCASE_FRAMES = LOCATIONS.length * (SHOT - OVERLAP) + OVERLAP;
export const shotStart = (i: number) => i * (SHOT - OVERLAP);

const LocationShot: React.FC<{ loc: Location; first: boolean }> = ({ loc, first }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / (SHOT - 1);
  const sec = frame / fps;
  const opacity = first ? 1 : interpolate(frame, [0, OVERLAP], [0, 1], { extrapolateRight: "clamp" });
  const label = interpolate(frame, [10, 22, SHOT - 22, SHOT - 10], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const { Scene, cam, exposure, title } = loc;
  return (
    <AbsoluteFill style={{ opacity }}>
      <ThreeCanvas width={W} height={H} shadows="percentage" gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true }} camera={{ fov: 50, near: 0.08, far: 2400 }}>
        <CameraRig cam={cam} t={t} exposure={exposure} />
        <Scene t={t} sec={sec} />
      </ThreeCanvas>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300, opacity: label }}>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 92, letterSpacing: 4, color: "#fff", textShadow: "0 0 3px #000, 0 3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 -3px 0 #000, 0 7px 0 rgba(0,0,0,.85), 0 0 30px rgba(0,0,0,.6)" }}>
          {title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Locations3D: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ filter: "saturate(1.08) contrast(1.04)" }}>
        {LOCATIONS.map((loc, i) => (
          <Sequence key={loc.id} from={shotStart(i)} durationInFrames={SHOT} layout="none">
            <LocationShot loc={loc} first={i === 0} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <PostFX frame={frame} />
    </AbsoluteFill>
  );
};
