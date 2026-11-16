const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"] as const;

export const rollDie = (random: () => number = Math.random): number =>
  Math.floor(random() * 6) + 1;

export const faceOf = (value: number): string => {
  const face = FACES[value - 1];
  if (face === undefined) throw new RangeError(`サイコロの目は1〜6です: ${value}`);
  return face;
};

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export const pipsOf = (value: number): number[] => {
  const pips = PIPS[value];
  if (pips === undefined) throw new RangeError(`サイコロの目は1〜6です: ${value}`);
  return pips;
};

export type Rotation = { x: number; y: number; z: number };

const FRONT_FACING: Record<number, Rotation> = {
  1: { x: 0, y: 0, z: 0 },
  2: { x: -90, y: 0, z: 0 },
  3: { x: 0, y: -90, z: 0 },
  4: { x: 0, y: 90, z: 0 },
  5: { x: 90, y: 0, z: 0 },
  6: { x: 0, y: 180, z: 0 },
};

export const landingRotationOf = (value: number, turns = { x: 3, y: 2, z: 1 }): Rotation => {
  const base = FRONT_FACING[value];
  if (base === undefined) throw new RangeError(`サイコロの目は1〜6です: ${value}`);
  return { x: base.x + turns.x * 360, y: base.y + turns.y * 360, z: base.z + turns.z * 360 };
};
