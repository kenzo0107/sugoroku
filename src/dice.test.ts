import { describe, expect, it } from "vitest";
import { faceOf, rollDie } from "./dice";

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
