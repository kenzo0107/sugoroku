import { describe, expect, it } from "vitest";
import { BOARD, directionName, FLIGHTS, NEXT, nearestWithin, nextOf, type Square, squareAt } from "./board";
import { COURSES, SOUVENIRS } from "./courses";
import source from "./fixtures/asia-oceania.json";

type SourceNode = { id: string; name: string; type: string; next: string[]; flight_to?: string[] };
const NODES: SourceNode[] = source.nodes;

const indexOfId = (id: string): number => {
  const i = BOARD.findIndex((s) => s.id === id);
  if (i < 0) throw new Error(`マスがありません: ${id}`);
  return i;
};

const idsOf = (positions: readonly number[]): string[] => positions.map((p) => squareAt(p).id).sort();

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

const KIND_OF_TYPE: Record<string, Partial<Square>> = {
  start_goal: { kind: "start" },
  special_hawaii: { kind: "honolulu" },
  normal: { kind: "city" },
  airport: { kind: "airport" },
  again: { kind: "again" },
  hotel: { kind: "hotel" },
  meetup: { kind: "meetup" },
  point_history: { kind: "point", courseId: "ancient" },
  point_activity: { kind: "point", courseId: "adventure" },
  point_nature: { kind: "point", courseId: "nature" },
  point_gourmet: { kind: "point", courseId: "gourmet" },
  point_culture: { kind: "point", courseId: "show" },
  souvenir_cookie: { kind: "souvenir", itemId: "cookie" },
  souvenir_tshirt: { kind: "souvenir", itemId: "tshirt" },
};

const ALIASES: Record<string, string> = {
  airport_eu_east: "istanbul",
  airport_me: "dubai",
  airport_na_west: "los_angeles",
};

describe("アジア・オセアニアの盤面（JSON から）", () => {
  it.each(NODES)("$id は JSON の種類のマスになる", (node) => {
    expect(squareAt(indexOfId(node.id))).toMatchObject(KIND_OF_TYPE[node.type]!);
  });

  it("JSON でつながったマスどうしは、どちらか一方の向きにだけ進める", () => {
    for (const node of NODES) {
      for (const neighbor of node.next) {
        const a = indexOfId(node.id);
        const b = indexOfId(ALIASES[neighbor] ?? neighbor);
        const forward = nextOf(a).includes(b);
        const backward = nextOf(b).includes(a);
        if ([node.id, neighbor].sort().join() === "airport_asia_east,qingdao") {
          expect(forward && backward, "青島の空港は行って戻る寄り道").toBe(true);
        } else {
          expect(forward !== backward, `${node.id} - ${neighbor}`).toBe(true);
        }
      }
    }
  });

  it("JSON のマスどうしに、JSON にないつながりはない", () => {
    const adjacent = (a: string, b: string) =>
      NODES.some((n) => (n.id === a && n.next.includes(b)) || (n.id === b && n.next.includes(a)));
    const extra = NODES.flatMap((node) =>
      nextOf(indexOfId(node.id))
        .map((to) => squareAt(to).id)
        .filter((to) => NODES.some((n) => n.id === to) && !adjacent(node.id, to))
        .map((to) => [node.id, to]),
    );
    expect(extra).toEqual([]);
  });

  it("飛行機は実物の盤面の矢印どおり一方通行で、ホノルルからは飛べない", () => {
    const flights = Object.fromEntries(
      BOARD.flatMap((s, i) => (FLIGHTS[i]!.length > 0 ? [[s.id, idsOf(FLIGHTS[i]!)]] : [])),
    );
    expect(flights).toEqual({
      airport_asia_east: ["honolulu", "los_angeles"],
      airport_oceania: ["bogota"],
      london: ["cape_town"],
      cape_town: ["bogota"],
      bogota: ["los_angeles"],
    });
    for (const [from, targets] of Object.entries(flights)) {
      for (const to of targets) expect(flights[to] ?? [], `${from} ⇄ ${to}`).not.toContain(from);
    }
  });

  it("シドニーの空港からは、歩いても飛行機でも南米北部のボゴタへ進む", () => {
    expect(idsOf(nextOf(indexOfId("airport_oceania")))).toEqual(["bogota"]);
  });

  it("東京からソウル・青島へ進み、ホノルルから東京へ戻る", () => {
    expect(BOARD[0]).toMatchObject({ id: "tokyo", kind: "start" });
    expect(idsOf(nextOf(0))).toEqual(["seoul"]);
    expect(idsOf(nextOf(indexOfId("seoul")))).toEqual(["qingdao"]);
    expect(idsOf(nextOf(indexOfId("honolulu")))).toEqual(["tokyo"]);
  });

  it("タシケントからヨーロッパへ、カラチから中東へ、北米からホノルルへつながる", () => {
    expect(squareAt(nextOf(indexOfId("tashkent"))[0]!).name).toBe("イスタンブール");
    expect(nextOf(indexOfId("karachi")).map((p) => squareAt(p).name)).toContain("ドバイ");
    expect(idsOf(nextOf(indexOfId("los_angeles")))).toEqual(["honolulu"]);
  });
});

describe("盤面全体", () => {
  it("すべてのマスが東京から行けて東京へ戻れる", () => {
    const reverse = BOARD.map((_, i) => NEXT.flatMap((targets, from) => (targets.includes(i) ? [from] : [])));
    expect(reachable(0, NEXT).size).toBe(BOARD.length);
    expect(reachable(0, reverse).size).toBe(BOARD.length);
  });

  it("マスの id は重ならない", () => {
    expect(new Set(BOARD.map((s) => s.id)).size).toBe(BOARD.length);
  });

  it("分かれ道の方面は、その先で最初に着く地名で示す", () => {
    const [toShanghai, toNanjing, toAirport] = nextOf(indexOfId("qingdao"));
    expect([toShanghai, toNanjing, toAirport].map((p) => directionName(p!))).toEqual(["上海", "南京", "エアポート（中国東部）"]);
    expect(directionName(nextOf(indexOfId("nanjing"))[1]!)).toBe("ハノイ");
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

  it("盤面の外の位置はエラーになる", () => {
    expect(() => squareAt(BOARD.length)).toThrow(RangeError);
    expect(() => squareAt(-1)).toThrow(RangeError);
  });
});

describe("nearestWithin", () => {
  it("前後どちらの方向にも、分かれ道をまたいで探す", () => {
    const southChinaHotel = indexOfId("hotel_asia_1");
    expect(nearestWithin(indexOfId("nanjing"), 1, (s) => s.kind === "hotel")).toBe(southChinaHotel);
    expect(nearestWithin(indexOfId("manila"), 1, (s) => s.kind === "hotel")).toBeNull();
    expect(nearestWithin(indexOfId("manila"), 2, (s) => s.kind === "hotel")).toBe(southChinaHotel);
  });
});
