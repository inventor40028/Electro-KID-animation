import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { CharacterSheet } from "./dev/CharacterSheet";
import { StoryVideo } from "./Video";
import { W, H, FPS } from "./theme";
import { buildTimeline } from "./timeline";
import { envTestStory } from "./dev/envtest";
import demo from "../stories/demo.json";
import type { Timeline } from "./schema";
import { LocationsPreview, SHOT_FRAMES } from "./location3d/LocationsPreview";
import type { LocationSet } from "./location3d/schema";

const calc: CalculateMetadataFunction<Timeline> = ({ props }) => ({ durationInFrames: Math.max(1, props.durationInFrames), fps: props.fps || FPS });

const calcLocations: CalculateMetadataFunction<LocationSet> = ({ props }) => ({ durationInFrames: Math.max(1, props.locations.length) * SHOT_FRAMES });

export const Root: React.FC = () => (
  <>
    <Composition id="Story" component={StoryVideo} width={W} height={H} fps={FPS} durationInFrames={300}
      defaultProps={buildTimeline(demo as never, null, null, null)} calculateMetadata={calc} />
    <Composition id="EnvTest" component={StoryVideo} width={W} height={H} fps={FPS} durationInFrames={300}
      defaultProps={buildTimeline(envTestStory, null, null, null)} calculateMetadata={calc} />
    <Composition id="LocationsPreview" component={LocationsPreview} width={W} height={H} fps={FPS} durationInFrames={SHOT_FRAMES}
      defaultProps={{ locations: [], objects: {} } as LocationSet} calculateMetadata={calcLocations} />
    <Composition id="SheetExpr" component={CharacterSheet} width={W} height={H} fps={FPS} durationInFrames={60} defaultProps={{ mode: "expr" as const }} />
    <Composition id="SheetPose" component={CharacterSheet} width={W} height={H} fps={FPS} durationInFrames={60} defaultProps={{ mode: "pose" as const }} />
    <Composition id="SheetCast" component={CharacterSheet} width={W} height={H} fps={FPS} durationInFrames={60} defaultProps={{ mode: "cast" as const }} />
  </>
);
