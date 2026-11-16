import { describe, expect, it } from "vitest";
import { BOARD, isChecklistSquare, NEXT, type Square } from "./board";
import { anchorPoints, boardLayout, flightPath, MAP, project, routePath, spreadOut } from "./mapLayout";
import { projection } from "./worldMap";

const city = (name: string, at: [number, number]): Square => ({ id: name, kind: "city", region: "asia", name, at });
const hotel: Square = { id: "hotel", kind: "hotel", region: "asia", name: "ホテル" };
const ring = (length: number) => Array.from({ length }, (_, i) => [(i + 1) % length]);

describe("project", () => {
  it("地図の描画と同じ位置にマスを置く", () => {
    for (const at of [[35.68, 139.69], [51.51, -0.13], [-33.92, 18.42], [-22.91, -43.17]] as const) {
      const [x, y] = projection([at[1], at[0]])!;
      const p = project(at);
      expect(p.x).toBeCloseTo(x, 6);
      expect(p.y).toBeCloseTo(y, 6);
    }
  });

  it("太平洋が中央にくる", () => {
    expect(project([0, MAP.centerLon]).x).toBe(MAP.width / 2);
    expect(project([0, 139.69]).x).toBeGreaterThan(project([0, 0]).x);
    expect(project([0, -100]).x).toBeGreaterThan(project([0, 139.69]).x);
  });
});

describe("anchorPoints", () => {
  it("座標のないマスは前後の都市の間に等間隔で置く", () => {
    const points = anchorPoints([city("A", [0, 100]), hotel, hotel, city("B", [30, 130])], ring(4));
    expect(points[1]!.x).toBeCloseTo(points[0]!.x + 10);
    expect(points[1]!.y).toBeCloseTo(points[0]!.y - 10);
    expect(points[2]!.x).toBeCloseTo(points[0]!.x + 20);
  });

  it("地図の端をまたぐ区間は、地図を横断せず端の外回りで補間する", () => {
    const points = anchorPoints([city("A", [0, -25]), hotel, city("B", [0, -35])], ring(3));
    const [a, mid, b] = points as [typeof points[0], typeof points[0], typeof points[0]];
    expect(a.x).toBeLessThan(10);
    expect(b.x).toBeGreaterThan(MAP.width - 10);
    expect(Math.min(mid.x, MAP.width - mid.x)).toBeLessThan(1e-9);
  });

  it("分かれ道では、それぞれの道の中で前後の都市の間に置く", () => {
    const board = [city("分岐", [0, 100]), hotel, city("北", [20, 110]), hotel, city("南", [-20, 110]), city("合流", [0, 120])];
    const next = [[1, 3], [2], [5], [4], [5], [0]];
    const points = anchorPoints(board, next);
    expect(points[1]).toEqual({ x: (points[0]!.x + points[2]!.x) / 2, y: (points[0]!.y + points[2]!.y) / 2 });
    expect(points[3]).toEqual({ x: (points[0]!.x + points[4]!.x) / 2, y: (points[0]!.y + points[4]!.y) / 2 });
  });
});

describe("spreadOut", () => {
  it("重なった点を最小距離まで離す", () => {
    const points = spreadOut([{ x: 100, y: 50 }, { x: 100, y: 50 }, { x: 101, y: 50 }], 6);
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(Math.hypot(points[i]!.x - points[j]!.x, points[i]!.y - points[j]!.y)).toBeGreaterThan(5.9);
      }
    }
  });

  it("大きさの違う点は、それぞれの半径の和まで離す", () => {
    const [a, b] = spreadOut([{ x: 100, y: 50 }, { x: 100, y: 50 }], [6, 10]) as [{ x: number; y: number }, { x: number; y: number }];
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(7.9);
  });

  it("十分離れた点は動かさない", () => {
    const anchors = [{ x: 10, y: 10 }, { x: 100, y: 50 }];
    expect(spreadOut(anchors, 6)).toEqual(anchors);
  });
});

describe("boardLayout", () => {
  const sizeOf = (s: Square) => (isChecklistSquare(s) ? 12 : 8);
  const layout = boardLayout(BOARD, NEXT, sizeOf);

  it("全マスが地図の中に収まり、互いに重ならない", () => {
    expect(layout).toHaveLength(BOARD.length);
    for (const p of layout) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(MAP.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(MAP.height);
    }
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        const d = Math.hypot(layout[i]!.x - layout[j]!.x, layout[i]!.y - layout[j]!.y);
        expect(d).toBeGreaterThan(((sizeOf(BOARD[i]!) + sizeOf(BOARD[j]!)) / 2) * 0.95);
      }
    }
  });

  it("都市のマスは実際の場所の近くに置く", () => {
    BOARD.forEach((square, i) => {
      if (!square.at) return;
      const anchor = project(square.at);
      expect(Math.hypot(layout[i]!.x - anchor.x, layout[i]!.y - anchor.y), square.name).toBeLessThan(15);
    });
  });
});

describe("routePath", () => {
  it("分かれ道では両方の道に線を引く", () => {
    const path = routePath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }], [[1, 2], [], []]);
    expect(path).toBe("M0.00 0.00L10.00 0.00M0.00 0.00L0.00 10.00");
  });

  it("地図の端をまたぐ区間は左右の端で折り返して描く", () => {
    const path = routePath([{ x: 350, y: 10 }, { x: 10, y: 30 }], [[1], []]);
    expect(path).toContain(`L${MAP.width} 20.00M0 20.00L10.00 30.00`);
  });
});

describe("flightPath", () => {
  it("航路は弧で描き、矢印が行き先のマスに隠れないよう手前で止める", () => {
    const path = flightPath({ x: 0, y: 50 }, { x: 100, y: 50 }, 5);
    expect(path).toMatch(/^M0\.00 50\.00Q50\.00 70\.00 /);
    const [x, y] = path.split(" ").slice(-2).map(Number) as [number, number];
    expect(Math.hypot(100 - x, 50 - y)).toBeCloseTo(5, 1);
  });

  it("地図の端をまたぐ航路は、反対側の端から行き先へ向かって描く", () => {
    const path = flightPath({ x: 350, y: 10 }, { x: 10, y: 30 }, 0);
    expect(path).toBe(`M350.00 10.00L${MAP.width} 20.00M0.00 20.00L10.00 30.00`);
  });
});
