import { BACKGROUNDS } from "../catalog";
import type { StoryInput } from "../schema";

const times = ["day", "night", "sunset", "day"] as const;
const framings = ["full", "medium", "close", "wide"] as const;
export const envTestStory: StoryInput = {
  title: "env test",
  cast: {
    hero: { color: "#f2b632", hair: "parted", tie: "#3b5bb5", badge: true },
    cop: { color: "#1f2e5e", outfit: "uniform", hat: "police", mustache: true },
  },
  shots: BACKGROUNDS.map((bg, i) => ({
    say: `This is the ${bg} background number ${i} shown here.`,
    bg,
    time: times[i % 4],
    framing: framings[i % 4],
    camera: "pushIn",
    actors: [
      { id: "hero", x: 0.38, z: 0.5, pose: "talk", expression: "smug" },
      { id: "cop", x: 0.68, z: 0.4, pose: "crossed", expression: "suspicious", facing: "left" },
    ],
  })),
};
