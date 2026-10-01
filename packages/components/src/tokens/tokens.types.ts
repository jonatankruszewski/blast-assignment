/** Colour families available to every toned component. */
export const tones = [
  "neutral",
  "orange",
  "magenta",
  "purple",
  "teal",
  "indigo",
  "red",
  "lime",
  "sky",
  "blue",
] as const;

export type Tone = (typeof tones)[number];

/** Spacing steps accepted by layout props (maps to --blast-space-N). */
export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 6 | 8;
