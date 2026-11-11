// Plays every location for a few seconds. Only used to look at them.
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { PostFX } from "../scene/Scene";
import { H, W } from "../theme";
import { CANVAS, Location3D } from "./Location3D";
import type { LocationData, LocationSet, Objects } from "./schema";

export const SHOT_FRAMES = 120;

const Shot: React.FC<{ location: LocationData; objects: Objects }> = ({ location, objects }) => {
  const t = useCurrentFrame() / (SHOT_FRAMES - 1);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: "saturate(1.12) contrast(1.05)" }}>
        <ThreeCanvas width={W} height={H} {...CANVAS}>
          <Location3D location={location} objects={objects} t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150 }}>
        <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 64, color: "#fff", textShadow: "0 0 10px #000, 0 3px 0 #000" }}>{location.name}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const LocationsPreview: React.FC<LocationSet> = ({ locations, objects }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {locations.map((location, i) => (
        <Sequence key={location.name} from={i * SHOT_FRAMES} durationInFrames={SHOT_FRAMES} layout="none">
          <Shot location={location} objects={objects} />
        </Sequence>
      ))}
      <PostFX frame={frame} />
    </AbsoluteFill>
  );
};
