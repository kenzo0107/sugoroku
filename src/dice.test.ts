import { describe, expect, it } from "vitest";
import { faceOf, landingRotationOf, pipsOf, rollDie } from "./dice";

describe("rollDie", () => {
  it("乱数の範囲の両端でも1〜6に収まる", () => {
    expect(rollDie(() => 0)).toBe(1);
    expect(rollDie(() => 0.999999)).toBe(6);
  });

  it("1〜6の目がすべて出る", () => {
    const seen = new Set(Array.from({ length: 600 }, () => rollDie()));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("faceOf", () => {
  it("目に対応するサイコロの絵を返す", () => {
    expect(faceOf(1)).toBe("⚀");
    expect(faceOf(6)).toBe("⚅");
  });

  it("範囲外の目はエラーにする", () => {
    expect(() => faceOf(0)).toThrow(RangeError);
    expect(() => faceOf(7)).toThrow(RangeError);
  });
});

describe("pipsOf", () => {
  it("目の数だけ点が並ぶ", () => {
    for (let v = 1; v <= 6; v++) expect(pipsOf(v)).toHaveLength(v);
  });
});

describe("landingRotationOf", () => {
  it("何回転しても、止まったときの向きは目ごとに決まった向きになる", () => {
    const mod = (deg: number) => ((deg % 360) + 360) % 360;
    const { x, y, z } = landingRotationOf(3, { x: 4, y: 3, z: 2 });
    expect([mod(x), mod(y), mod(z)]).toEqual([0, 270, 0]);
  });

  it("目ごとに違う向きで止まる", () => {
    const keys = [1, 2, 3, 4, 5, 6].map((v) => JSON.stringify(landingRotationOf(v, { x: 0, y: 0, z: 0 })));
    expect(new Set(keys).size).toBe(6);
  });
});
