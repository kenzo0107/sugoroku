const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"] as const;

export const rollDie = (random: () => number = Math.random): number =>
  Math.floor(random() * 6) + 1;

export const faceOf = (value: number): string => {
  const face = FACES[value - 1];
  if (face === undefined) throw new RangeError(`サイコロの目は1〜6です: ${value}`);
  return face;
};
