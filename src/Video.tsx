import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { ResolvedShot, Timeline } from "./schema";
import { Scene, PostFX } from "./scene/Scene";
import { Scene3D } from "./location3d/Scene3D";
import { Captions } from "./captions/Captions";
import { H, W, clamp, easeOut } from "./theme";

export const TRANS = 7;

const ShotWrap: React.FC<{ shot: ResolvedShot; first: boolean; children: React.ReactNode }> = ({ shot, first, children }) => {
  const f = useCurrentFrame();
  if (first) return <AbsoluteFill>{children}</AbsoluteFill>;
  switch (shot.transition) {
    case "cut":
      return <AbsoluteFill>{children}</AbsoluteFill>;
    case "flash":
      return (
        <AbsoluteFill>
          {children}
          <AbsoluteFill style={{ backgroundColor: "#fff", opacity: clamp(1 - f / 6) }} />
        </AbsoluteFill>
      );
    case "iris": {
      const r = easeOut(clamp(f / 12)) * 1300;
      return (
        <AbsoluteFill style={{ clipPath: `circle(${r}px at ${W / 2}px ${H * 0.45}px)` }}>
          {children}
        </AbsoluteFill>
      );
    }
    case "whip": {
      const q = easeOut(clamp(f / 7));
      return (
        <AbsoluteFill style={{ transform: `translateX(${(1 - q) * W}px)`, filter: q < 1 ? `blur(${(1 - q) * 30}px)` : undefined }}>
          {children}
        </AbsoluteFill>
      );
    }
    case "zoom": {
      const q = easeOut(clamp(f / TRANS));
      return <AbsoluteFill style={{ opacity: q, transform: `scale(${1.25 - 0.25 * q})` }}>{children}</AbsoluteFill>;
    }
    default:
      return <AbsoluteFill style={{ opacity: interpolate(f, [0, TRANS], [0, 1], { extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
  }
};

const ShotScene: React.FC<{ shot: ResolvedShot; timeline: Timeline }> = ({ shot, timeline }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cast = timeline.story.cast;
  const location = shot.location ? timeline.locations?.[shot.location] : undefined;
  if (location) return <Scene3D shot={shot} cast={cast} location={location} objects={timeline.objects ?? {}} frame={f} fps={fps} />;
  return <Scene shot={shot} cast={cast} frame={f} fps={fps} />;
};

export const StoryVideo: React.FC<Timeline> = (tl) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { shots } = tl;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {shots.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.duration + (i < shots.length - 1 ? TRANS : 0)} name={`${i}: ${s.say.slice(0, 30)}`}>
          <ShotWrap shot={s} first={i === 0}>
            <ShotScene shot={s} timeline={tl} />
          </ShotWrap>
        </Sequence>
      ))}
      <PostFX frame={frame} />
      <Captions words={tl.words} frame={frame} fps={fps} />
      {tl.voiceSrc && <Audio src={staticFile(tl.voiceSrc)} />}
      {tl.musicSrc && (
        <Audio src={staticFile(tl.musicSrc)} loop volume={(f) => interpolate(f, [0, 15, tl.durationInFrames - 30, tl.durationInFrames], [0, 0.16, 0.16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      )}
      {tl.sfx.map((c, i) => (
        <Sequence key={`sfx${i}`} from={Math.max(0, c.frame)} durationInFrames={Math.max(1, Math.min(4 * fps, tl.durationInFrames - c.frame))} layout="none">
          <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
