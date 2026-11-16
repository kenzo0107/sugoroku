import { beforeEach, describe, expect, it } from "vitest";
import { BOARD, nearestWithin, type Square } from "./board";
import { itemsOf } from "./courses";
import {
  chooseAirport,
  chooseFork,
  chooseMeetup,
  type Game,
  type GamePlayer,
  isStrikeActive,
  loadGame,
  newGame,
  roll,
  saveGame,
} from "./game";

const indexWhere = (pred: (s: Square) => boolean): number => {
  const i = BOARD.findIndex(pred);
  if (i < 0) throw new Error("該当するマスがありません");
  return i;
};
const at = (id: string) => indexWhere((s) => s.id === id);
const kindIndex = (kind: Square["kind"]) => indexWhere((s) => s.kind === kind);

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
    const game = roll(twoPlayers(), 2);
    expect(game.players[0]?.position).toBe(at("qingdao"));
    expect(game.current).toBe(1);
  });

  it("自分のコースの未チェックの行き先は、目があまっても止まってチャレンジになる", () => {
    const game = roll(patch(twoPlayers(), 0, { position: at("hotel_oceania_1") }), 6);
    expect(game.players[0]?.position).toBe(at("uluru"));
    expect(game.phase).toEqual({ type: "point", itemId: "uluru" });
    expect(game.current).toBe(0);
  });

  it("他のコースの行き先は通り過ぎる", () => {
    const game = roll(patch(twoPlayers(), 0, { position: at("singapore") }), 2);
    expect(game.players[0]?.position).toBe(at("darwin"));
  });

  it("ホノルルから先は東京へ戻る", () => {
    const game = roll(patch(twoPlayers(), 0, { position: at("honolulu") }), 1);
    expect(game.players[0]?.position).toBe(0);
  });
});

describe("分かれ道", () => {
  const atSeoul = () => patch(twoPlayers(), 0, { position: at("seoul") });

  it("青島を通り過ぎるときは、残りの目の数を持ったまま道を選ぶ", () => {
    const game = roll(atSeoul(), 3);
    expect(game.players[0]?.position).toBe(at("qingdao"));
    expect(game.phase).toEqual({ type: "fork", steps: 2 });
    expect(game.current).toBe(0);
  });

  it("選んだ道を残りの目の数だけ進む", () => {
    const forked = roll(atSeoul(), 3);
    const game = chooseFork(forked, at("shanghai"));
    expect(game.players[0]?.position).toBe(at("again_asia_1"));
  });

  it("選んだ道の途中でまた分かれ道に来たら、残りの目の数でまた選ぶ", () => {
    const forked = roll(atSeoul(), 3);
    const game = chooseFork(forked, at("nanjing"));
    expect(game.players[0]?.position).toBe(at("nanjing"));
    expect(game.phase).toEqual({ type: "fork", steps: 1 });
  });

  it("分かれ道にちょうど止まったときは選ばず、次の番に出発するときに選ぶ", () => {
    const stopped = roll(atSeoul(), 1);
    expect(stopped.players[0]?.position).toBe(at("qingdao"));
    expect(stopped.current).toBe(1);

    const departing = roll(patch(twoPlayers(), 0, { position: at("qingdao") }), 4);
    expect(departing.phase).toEqual({ type: "fork", steps: 4 });
  });

  it("選んだ道の先に自分のコースの行き先があれば、目があまっても止まる", () => {
    const forked = roll(patch(twoPlayers(), 0, { position: at("great_wall") }), 6);
    const game = chooseFork(forked, at("everest"));
    expect(game.players[0]?.position).toBe(at("everest"));
    expect(game.phase).toEqual({ type: "point", itemId: "everest" });
  });

  it("分かれ道の先にない方向や、選択待ちでないときは選べない", () => {
    const forked = roll(atSeoul(), 3);
    expect(() => chooseFork(forked, at("bangkok"))).toThrow();
    expect(() => chooseFork(twoPlayers(), at("shanghai"))).toThrow();
  });
});

describe("行き先のチャレンジ", () => {
  const atUluru = () => roll(patch(twoPlayers(), 0, { position: at("hotel_oceania_1") }), 1);

  it.each([3, 4, 5])("%i が出たらチェックされる", (value) => {
    const game = roll(atUluru(), value);
    expect(game.players[0]?.checked).toContain("uluru");
    expect(game.current).toBe(1);
  });

  it.each([1, 2, 6])("%i ではチェックされない", (value) => {
    const game = roll(atUluru(), value);
    expect(game.players[0]?.checked).not.toContain("uluru");
    expect(game.current).toBe(1);
  });
});

describe("特別なマス", () => {
  it("おみやげマスでおみやげをゲットする", () => {
    const game = roll(patch(twoPlayers(), 0, { position: at("ahmedabad") }), 1);
    expect(game.players[0]?.checked).toEqual(["cookie"]);
  });

  it("もう1回マスでは同じ人がもう一度ふれる", () => {
    const game = roll(patch(twoPlayers(), 0, { position: at("shanghai") }), 1);
    expect(game.players[0]?.position).toBe(at("again_asia_1"));
    expect(game.current).toBe(0);
    expect(game.phase).toEqual({ type: "move" });
  });

  describe("空港", () => {
    const landed = () => chooseFork(roll(patch(twoPlayers(), 0, { position: at("qingdao") }), 1), at("airport_asia_east"));

    it("決まった行き先から選んで飛ぶか、とどまるかを選べる", () => {
      expect(landed().phase).toEqual({ type: "airport" });
      expect(chooseAirport(landed(), at("honolulu")).players[0]?.position).toBe(at("honolulu"));
      expect(chooseAirport(landed(), at("los_angeles")).players[0]?.position).toBe(at("los_angeles"));
      expect(chooseAirport(landed(), null).players[0]?.position).toBe(at("airport_asia_east"));
    });

    it("行き先にない空港へは飛べない", () => {
      expect(() => chooseAirport(landed(), at("airport_oceania"))).toThrow();
    });

    it("行き先が決まっていない空港では飛べずに次の人の番になる", () => {
      const forked = roll(patch(twoPlayers(), 0, { position: at("great_wall") }), 1);
      const game = chooseFork(forked, at("airport_asia_north"));
      expect(game.phase).toEqual({ type: "move" });
      expect(game.current).toBe(1);
      expect(game.log[0]).toContain("この空港から出る便はない");
    });

    it("誰かがストライキマスにいると飛べない", () => {
      const game = patch(patch(twoPlayers(), 1, { position: kindIndex("strike") }), 0, { position: at("qingdao") });
      expect(isStrikeActive(game)).toBe(true);
      const next = chooseFork(roll(game, 1), at("airport_asia_east"));
      expect(next.phase).toEqual({ type: "move" });
      expect(next.current).toBe(1);
    });
  });

  it("ホテルに止まると、5マス以内の人はホテルへ移動し、遠い人は動かない", () => {
    const hotel = at("hotel_asia_4");
    const players = newGame([
      { name: "A", courseId: "nature" },
      { name: "B", courseId: "show" },
      { name: "C", courseId: "show" },
    ]);
    let game = patch(players, 0, { position: at("again_asia_4") });
    game = patch(game, 1, { position: at("chennai") });
    const far = BOARD.findIndex((_, i) => nearestWithin(i, 5, (s) => s.kind === "hotel") === null);
    game = patch(game, 2, { position: far });
    const next = roll(game, 1);
    expect(next.players.map((p) => p.position)).toEqual([hotel, hotel, far]);
  });

  it("まちあわせでは他の人のマスへ移動できる", () => {
    const meetup = at("meetup_asia_1");
    let game = patch(twoPlayers(), 0, { position: at("bangkok") });
    game = patch(game, 1, { position: 30 });
    const landed = roll(game, 1);
    expect(landed.phase).toEqual({ type: "meetup" });
    expect(chooseMeetup(landed, "p2").players[0]?.position).toBe(30);
    expect(chooseMeetup(landed, null).players[0]?.position).toBe(meetup);
  });
});

describe("ホノルルチャレンジ", () => {
  const complete = (position: number) => patch(twoPlayers(), 0, { checked: allItems("nature"), position });
  const ready = () => complete(at("honolulu"));

  it("全部そろった人は、ホノルルへ向かう途中で目があまってもホノルルで止まり、続けてチャレンジする", () => {
    const game = roll(complete(at("los_angeles")), 6);
    expect(game.players[0]?.position).toBe(at("honolulu"));
    expect(game.phase).toEqual({ type: "honolulu" });
    expect(game.current).toBe(0);
    expect(roll(game, 3).players[0]?.rank).toBe(1);
  });

  it("全部そろっていても、ホノルル以外では普通に進む", () => {
    const game = roll(complete(at("seoul")), 1);
    expect(game.players[0]).toMatchObject({ position: at("qingdao"), rank: null });
  });

  it("全部そろっていない人がホノルルに止まっても何も起きず、次の人の番になる", () => {
    const game = roll(patch(twoPlayers(), 0, { position: at("los_angeles") }), 1);
    expect(game.players[0]?.position).toBe(at("honolulu"));
    expect(game.phase).toEqual({ type: "move" });
    expect(game.current).toBe(1);
  });

  it.each([1, 3, 5])("ホノルルにいる全部そろった人は %i で東京に帰ってゴールし、残り1人は自動で最下位になる", (value) => {
    const game = roll(ready(), value);
    expect(game.players[0]?.position).toBe(at("tokyo"));
    expect(game.players.map((p) => p.rank)).toEqual([1, 2]);
    expect(game.phase).toEqual({ type: "over" });
  });

  it.each([2, 4, 6])("%i では失敗して、ホノルルから動かない", (value) => {
    const game = roll(ready(), value);
    expect(game.players[0]).toMatchObject({ rank: null, position: at("honolulu") });
    expect(game.current).toBe(1);
  });

  it("ホノルルで待っている全部そろった人は、夜になってもホテルへ移されない", () => {
    const night = roll({ ...patch(ready(), 1, { position: at("again_asia_4") }), current: 1 }, 1);
    expect(night.players.map((p) => p.position)).toEqual([at("honolulu"), at("hotel_asia_4")]);
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
    const start = three.players.reduce((g, _, i) => patch(g, i, { position: at("seoul") }), three);
    const game = roll(patch(start, 0, { checked: allItems("nature"), position: at("honolulu") }), 1);
    const afterB = roll(game, 1);
    expect(afterB.current).toBe(2);
    expect(roll(afterB, 1).current).toBe(1);
  });

  it("1人で遊ぶときはゴールでゲーム終了", () => {
    const solo = newGame([{ name: "A", courseId: "show" }]);
    const game = roll({ ...solo, players: [{ ...solo.players[0]!, checked: allItems("show"), position: at("honolulu") }] }, 5);
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
    expect(() => chooseAirport(twoPlayers(), null)).toThrow();
    expect(() => chooseMeetup(twoPlayers(), null)).toThrow();
  });
});

describe("保存と読み込み", () => {
  beforeEach(() => localStorage.clear());

  it("分かれ道を選ぶ途中のゲームも読み込める", () => {
    const game = roll(patch(twoPlayers(), 0, { position: at("qingdao") }), 5);
    saveGame(game);
    expect(loadGame()).toEqual(game);
  });

  it("盤面にない位置のデータは読み込まない", () => {
    saveGame(patch(twoPlayers(), 0, { position: BOARD.length }));
    expect(loadGame()).toBeNull();
  });

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
    localStorage.setItem("sugoroku:game:v3", "{broken");
    expect(loadGame()).toBeNull();
  });
});
