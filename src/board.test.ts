import { describe, expect, it } from "vitest";
import { BOARD, directionName, NEXT, nearestWithin, nextOf, squareAt } from "./board";
import { COURSES, SOUVENIRS } from "./courses";

const indexOfName = (name: string): number => {
  const i = BOARD.findIndex((s) => s.name === name);
  if (i < 0) throw new Error(`マスがありません: ${name}`);
  return i;
};

const namesAlong = (from: number, to: number): string[] => {
  const names = [];
  for (let p = from; p !== to; p = nextOf(p)[0]!) names.push(squareAt(p).name);
  return [...names, squareAt(to).name];
};

const reachable = (from: number, edges: readonly (readonly number[])[]): Set<number> => {
  const seen = new Set([from]);
  const stack = [from];
  while (stack.length > 0) {
    for (const to of edges[stack.pop()!] ?? []) {
      if (!seen.has(to)) {
        seen.add(to);
        stack.push(to);
      }
    }
  }
  return seen;
};

describe("盤面", () => {
  it("東京から飛行機でソウルの空港へ行き、青島・南京・上海と続く", () => {
    expect(BOARD[0]).toMatchObject({ kind: "start", name: "東京", at: [35.68, 139.69] });
    expect(namesAlong(0, indexOfName("上海"))).toEqual(["東京", "ソウル", "青島", "南京", "上海"]);
    expect(squareAt(indexOfName("ソウル")).kind).toBe("airport");
  });

  it("上海で台北方面と香港方面に分かれ、どちらもバンコクで合流する", () => {
    const [viaTaipei, viaHongKong] = nextOf(indexOfName("上海"));
    const bangkok = indexOfName("バンコク");
    expect(nextOf(indexOfName("上海"))).toHaveLength(2);
    expect(namesAlong(viaTaipei!, bangkok)).toEqual([
      "空欄", "台北", "マニラ", "バリ島 ガムラン", "空欄", "シンガポール", "クアラルンプール", "バンコク",
    ]);
    expect(namesAlong(viaHongKong!, bangkok)).toEqual(["もう1回", "香港", "ハノイ", "まちあわせ", "バンコク"]);
    expect(squareAt(indexOfName("香港")).kind).toBe("hotel");
    expect(directionName(viaTaipei!)).toBe("台北");
    expect(directionName(viaHongKong!)).toBe("香港");
  });

  it("分かれ道は上海だけで、すべてのマスが東京から行けて東京へ戻れる", () => {
    expect(NEXT.filter((targets) => targets.length > 1)).toHaveLength(1);
    const reverse = BOARD.map((_, i) => NEXT.flatMap((targets, from) => (targets.includes(i) ? [from] : [])));
    expect(reachable(0, NEXT).size).toBe(BOARD.length);
    expect(reachable(0, reverse).size).toBe(BOARD.length);
  });

  it("都市・空港・行き先マスは実在の緯度経度を持つ", () => {
    for (const square of BOARD) {
      if (square.kind !== "city" && square.kind !== "airport" && square.kind !== "point") continue;
      const [lat, lon] = square.at;
      expect(Math.abs(lat), square.name).toBeLessThanOrEqual(90);
      expect(Math.abs(lon), square.name).toBeLessThanOrEqual(180);
    }
  });

  it("各コースの行き先がちょうど1マスずつある", () => {
    for (const course of Object.values(COURSES)) {
      for (const spot of course.spots) {
        const squares = BOARD.filter((s) => s.kind === "point" && s.courseId === course.id && s.itemId === spot.id);
        expect(squares, spot.name).toHaveLength(1);
      }
    }
  });

  it("どのおみやげも1マス以上ある", () => {
    for (const item of SOUVENIRS) {
      expect(BOARD.filter((s) => s.kind === "souvenir" && s.itemId === item.id).length, item.name).toBeGreaterThan(0);
    }
  });

  it("空港はどの地域にもある", () => {
    const regions = new Set(BOARD.filter((s) => s.kind === "airport").map((s) => s.region));
    expect(regions.size).toBe(6);
  });

  it("盤面の外の位置はエラーになる", () => {
    expect(() => squareAt(BOARD.length)).toThrow(RangeError);
    expect(() => squareAt(-1)).toThrow(RangeError);
  });
});

describe("nearestWithin", () => {
  it("前後どちらの方向にも、分かれ道をまたいで探す", () => {
    const hongKongHotel = indexOfName("香港");
    expect(nearestWithin(indexOfName("上海"), 2, (s) => s.kind === "hotel")).toBe(hongKongHotel);
    expect(nearestWithin(indexOfName("台北"), 3, (s) => s.kind === "hotel")).toBeNull();
    expect(nearestWithin(indexOfName("台北"), 4, (s) => s.kind === "hotel")).toBe(hongKongHotel);
  });
});
