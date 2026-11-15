import { beforeEach, describe, expect, it } from "vitest";
import { BOARD, type Square } from "./board";
import { itemsOf } from "./courses";
import {
  chooseAirport,
  chooseMeetup,
  type Game,
  type GamePlayer,
  isStrikeActive,
  loadGame,
  newGame,
  roll,
  saveGame,
} from "./game";

const indexWhere = (pred: (s: Square) => boolean, from = 0): number => {
  const i = BOARD.findIndex((s, idx) => idx >= from && pred(s));
  if (i < 0) throw new Error("該当するマスがありません");
  return i;
};
const pointIndex = (itemId: string) => indexWhere((s) => s.kind === "point" && s.itemId === itemId);
const kindIndex = (kind: Square["kind"], from = 0) => indexWhere((s) => s.kind === kind, from);

const twoPlayers = () =>
  newGame([
    { name: "たろう", courseId: "nature" },
    { name: "はなこ", courseId: "show" },
  ]);

const patch = (game: Game, index: number, changes: Partial<GamePlayer>): Game => ({
  ...game,
  players: game.players.map((p, i) => (i === index ? { ...p, ...changes } : p)),
});

const allItems = (courseId: GamePlayer["courseId"]) => itemsOf(courseId).map((i) => i.id);

describe("newGame", () => {
  it("全員が東京から始まり、最初の人の番になる", () => {
    const game = twoPlayers();
    expect(game.players.map((p) => p.position)).toEqual([0, 0]);
    expect(game.current).toBe(0);
    expect(game.phase).toEqual({ type: "move" });
  });

  it("参加人数は1〜4人", () => {
    expect(() => newGame([])).toThrow(RangeError);
    expect(() => newGame(Array.from({ length: 5 }, () => ({ name: "x", courseId: "nature" as const })))).toThrow(RangeError);
  });
});

describe("移動", () => {
  it("出た目の数だけ進み、次の人の番になる", () => {
    const game = roll(twoPlayers(), 1);
    expect(game.players[0]?.position).toBe(1);
    expect(game.current).toBe(1);
  });

  it("自分のコースの未チェックの行き先は、目があまっても止まってチャレンジになる", () => {
    const everest = pointIndex("everest");
    const start = patch(twoPlayers(), 0, { position: everest - 1 });
    const game = roll(start, 6);
    expect(game.players[0]?.position).toBe(everest);
    expect(game.phase).toEqual({ type: "point", itemId: "everest" });
    expect(game.current).toBe(0);
  });

  it("他のコースの行き先は通り過ぎる", () => {
    const bali = pointIndex("bali");
    const game = roll(patch(twoPlayers(), 0, { position: bali - 1 }), 2);
    expect(game.players[0]?.position).toBe(bali + 1);
  });

  it("盤面の最後から先は東京側へ一周する", () => {
    const game = roll(patch(twoPlayers(), 0, { position: BOARD.length - 1 }), 1);
    expect(game.players[0]?.position).toBe(0);
  });
});

describe("行き先のチャレンジ", () => {
  const atEverest = () => roll(patch(twoPlayers(), 0, { position: pointIndex("everest") - 1 }), 1);

  it.each([3, 4, 5])("%i が出たらチェックされる", (value) => {
    const game = roll(atEverest(), value);
    expect(game.players[0]?.checked).toContain("everest");
    expect(game.current).toBe(1);
  });

  it.each([1, 2, 6])("%i ではチェックされない", (value) => {
    const game = roll(atEverest(), value);
    expect(game.players[0]?.checked).not.toContain("everest");
    expect(game.current).toBe(1);
  });
});

describe("特別なマス", () => {
  it("おみやげマスでおみやげをゲットする", () => {
    const cookie = indexWhere((s) => s.kind === "souvenir" && s.itemId === "cookie");
    const game = roll(patch(twoPlayers(), 0, { position: cookie - 1 }), 1);
    expect(game.players[0]?.checked).toEqual(["cookie"]);
  });

  it("もう1回マスでは同じ人がもう一度ふれる", () => {
    const again = kindIndex("again");
    const game = roll(patch(twoPlayers(), 0, { position: again - 1 }), 1);
    expect(game.current).toBe(0);
    expect(game.phase).toEqual({ type: "move" });
  });

  it("空港では次の空港へ飛ぶか選べる", () => {
    const first = kindIndex("airport");
    const second = kindIndex("airport", first + 1);
    const landed = roll(patch(twoPlayers(), 0, { position: first - 1 }), 1);
    expect(landed.phase).toEqual({ type: "airport" });
    expect(chooseAirport(landed, true).players[0]?.position).toBe(second);
    expect(chooseAirport(landed, false).players[0]?.position).toBe(first);
  });

  it("誰かがストライキマスにいると空港から飛べない", () => {
    const airport = kindIndex("airport");
    let game = patch(twoPlayers(), 1, { position: kindIndex("strike") });
    game = patch(game, 0, { position: airport - 1 });
    expect(isStrikeActive(game)).toBe(true);
    const landed = roll(game, 1);
    expect(landed.phase).toEqual({ type: "move" });
    expect(landed.current).toBe(1);
  });

  it("ホテルに止まると、5マス以内の人はホテルへ移動し、遠い人は動かない", () => {
    const hotel = kindIndex("hotel");
    const players = newGame([
      { name: "A", courseId: "nature" },
      { name: "B", courseId: "show" },
      { name: "C", courseId: "show" },
    ]);
    let game = patch(players, 0, { position: hotel - 1 });
    game = patch(game, 1, { position: hotel + 3 });
    const far = BOARD.findIndex((_, i) =>
      Array.from({ length: 11 }, (_, d) => BOARD[(i + d - 5 + BOARD.length) % BOARD.length]).every((s) => s?.kind !== "hotel"),
    );
    game = patch(game, 2, { position: far });
    const next = roll(game, 1);
    expect(next.players.map((p) => p.position)).toEqual([hotel, hotel, far]);
  });

  it("まちあわせでは他の人のマスへ移動できる", () => {
    const meetup = kindIndex("meetup");
    let game = patch(twoPlayers(), 0, { position: meetup - 1 });
    game = patch(game, 1, { position: 30 });
    const landed = roll(game, 1);
    expect(landed.phase).toEqual({ type: "meetup" });
    expect(chooseMeetup(landed, "p2").players[0]?.position).toBe(30);
    expect(chooseMeetup(landed, null).players[0]?.position).toBe(meetup);
  });
});

describe("ホノルルチャレンジ", () => {
  const ready = () => patch(twoPlayers(), 0, { checked: allItems("nature"), position: 1 });

  it.each([1, 3, 5])("全部そろった人は %i でゴールし、残り1人は自動で最下位になる", (value) => {
    const game = roll(ready(), value);
    expect(game.players.map((p) => p.rank)).toEqual([1, 2]);
    expect(game.phase).toEqual({ type: "over" });
  });

  it.each([2, 4, 6])("%i では失敗して、その場から動かない", (value) => {
    const game = roll(ready(), value);
    expect(game.players[0]).toMatchObject({ rank: null, position: 1 });
    expect(game.current).toBe(1);
  });

  it("ストライキ中はチャレンジできない", () => {
    const game = roll(patch(ready(), 1, { position: kindIndex("strike") }), 1);
    expect(game.players[0]?.rank).toBeNull();
  });

  it("ゴールした人は順番から外れる", () => {
    const three = newGame([
      { name: "A", courseId: "nature" },
      { name: "B", courseId: "show" },
      { name: "C", courseId: "show" },
    ]);
    const game = roll(patch(three, 0, { checked: allItems("nature") }), 1);
    const afterB = roll(game, 1);
    expect(afterB.current).toBe(2);
    expect(roll(afterB, 1).current).toBe(1);
  });

  it("1人で遊ぶときはゴールでゲーム終了", () => {
    const solo = newGame([{ name: "A", courseId: "show" }]);
    const game = roll({ ...solo, players: [{ ...solo.players[0]!, checked: allItems("show") }] }, 5);
    expect(game.players[0]?.rank).toBe(1);
    expect(game.phase).toEqual({ type: "over" });
  });
});

describe("不正な操作", () => {
  it("1〜6以外の目は受け付けない", () => {
    expect(() => roll(twoPlayers(), 0)).toThrow(RangeError);
    expect(() => roll(twoPlayers(), 7)).toThrow(RangeError);
  });

  it("選択待ちでないときに空港・まちあわせの選択はできない", () => {
    expect(() => chooseAirport(twoPlayers(), true)).toThrow();
    expect(() => chooseMeetup(twoPlayers(), null)).toThrow();
  });
});

describe("保存と読み込み", () => {
  beforeEach(() => localStorage.clear());

  it("保存したゲームを読み込める", () => {
    const game = roll(twoPlayers(), 3);
    saveGame(game);
    expect(loadGame()).toEqual(game);
  });

  it("null を保存すると削除される", () => {
    saveGame(twoPlayers());
    saveGame(null);
    expect(loadGame()).toBeNull();
  });

  it("手番の番号が参加人数の範囲外のデータは読み込まない", () => {
    saveGame({ ...twoPlayers(), current: 5 });
    expect(loadGame()).toBeNull();
  });

  it("壊れたデータは読み込まない", () => {
    localStorage.setItem("sugoroku:game", "{broken");
    expect(loadGame()).toBeNull();
  });
});
