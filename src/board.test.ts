import { describe, expect, it } from "vitest";
import { BOARD, ringCells, squareAt } from "./board";
import { COURSES, SOUVENIRS } from "./courses";

describe("盤面", () => {
  it("東京スタートの48マスで、画面の外周レイアウトと数が一致する", () => {
    expect(BOARD).toHaveLength(48);
    expect(BOARD[0]).toMatchObject({ kind: "start", name: "東京" });
    expect(ringCells(14, 12)).toHaveLength(BOARD.length);
    expect(ringCells(8, 18)).toHaveLength(BOARD.length);
  });

  it("各コースの行き先がちょうど1マスずつある", () => {
    for (const course of Object.values(COURSES)) {
      for (const spot of course.spots) {
        const squares = BOARD.filter((s) => s.kind === "point" && s.courseId === course.id && s.itemId === spot.id);
        expect(squares, spot.name).toHaveLength(1);
      }
    }
  });

  it("おみやげは各種2マスずつある", () => {
    for (const item of SOUVENIRS) {
      expect(BOARD.filter((s) => s.kind === "souvenir" && s.itemId === item.id)).toHaveLength(2);
    }
  });

  it("空港は各地域に1つずつある", () => {
    const regions = BOARD.filter((s) => s.kind === "airport").map((s) => s.region);
    expect(new Set(regions).size).toBe(6);
    expect(regions).toHaveLength(6);
  });

  it("位置は盤面を一周するように折り返す", () => {
    expect(squareAt(BOARD.length)).toBe(BOARD[0]);
    expect(squareAt(-1)).toBe(BOARD[BOARD.length - 1]);
  });
});

describe("ringCells", () => {
  it("外周のマスを重複なく時計回りに並べる", () => {
    const cells = ringCells(4, 3);
    expect(cells).toEqual([
      { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
      { row: 2, col: 4 },
      { row: 3, col: 4 }, { row: 3, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 1 },
      { row: 2, col: 1 },
    ]);
  });
});
