import { beforeEach, describe, expect, it } from "vitest";
import { BOARDS } from "./courses";
import {
  addPlayer,
  loadPlayers,
  progress,
  removePlayer,
  savePlayers,
  toggleCheck,
} from "./state";

describe("プレイヤー管理", () => {
  it("名前の前後の空白を除いてコース付きで追加される", () => {
    const players = addPlayer([], "  たろう ", "nature", "p1");
    expect(players).toEqual([{ id: "p1", name: "たろう", courseId: "nature", checked: [] }]);
  });

  it("指定したプレイヤーだけ削除される", () => {
    const players = addPlayer(addPlayer([], "A", "nature", "a"), "B", "show", "b");
    expect(removePlayer(players, "a").map((p) => p.id)).toEqual(["b"]);
  });
});

describe("チェック", () => {
  const base = addPlayer(addPlayer([], "A", "nature", "a"), "B", "show", "b");

  it("トグルでチェックが付き、再度トグルで外れる", () => {
    const once = toggleCheck(base, "a", "everest");
    expect(once[0]?.checked).toEqual(["everest"]);
    expect(toggleCheck(once, "a", "everest")[0]?.checked).toEqual([]);
  });

  it("他のプレイヤーのチェックには影響しない", () => {
    expect(toggleCheck(base, "a", "everest")[1]?.checked).toEqual([]);
  });
});

describe("進捗", () => {
  it("行き先6つとおみやげ3つの計9項目で数える", () => {
    let players = addPlayer([], "A", "show", "a");
    players = toggleCheck(players, "a", "bali");
    players = toggleCheck(players, "a", "mug");
    expect(progress(players[0]!)).toEqual({ done: 2, total: 9 });
  });

  it("別コースの項目IDは進捗に含めない", () => {
    const players = toggleCheck(addPlayer([], "A", "show", "a"), "a", "everest");
    expect(progress(players[0]!).done).toBe(0);
  });
});

describe("保存と読み込み", () => {
  beforeEach(() => localStorage.clear());

  it("保存した内容を読み込める", () => {
    const players = toggleCheck(addPlayer([], "A", "nature", "a"), "a", "uluru");
    savePlayers(players);
    expect(loadPlayers()).toEqual(players);
  });

  it("壊れたデータは空として扱う", () => {
    localStorage.setItem("sugoroku:players", "{not json");
    expect(loadPlayers()).toEqual([]);
  });

  it("不正な形式のプレイヤーは除外する", () => {
    localStorage.setItem(
      "sugoroku:players",
      JSON.stringify([{ id: "x", name: "X", courseId: "unknown", checked: [] }]),
    );
    expect(loadPlayers()).toEqual([]);
  });

  it("日本一周の盤面は世界の盤面と別々に保存される", () => {
    const japan = toggleCheck(addPlayer([], "J", "onsen", "j"), "j", "kusatsu-onsen");
    savePlayers(japan, BOARDS.japan);
    expect(loadPlayers(BOARDS.japan)).toEqual(japan);
    expect(loadPlayers(BOARDS.world)).toEqual([]);
  });

  it("ほかの盤面のコースのプレイヤーは読み込まない", () => {
    savePlayers(addPlayer([], "J", "onsen", "j"), BOARDS.world);
    expect(loadPlayers(BOARDS.world)).toEqual([]);
  });
});

describe("日本一周のコース", () => {
  it("おみやげはなく行き先6つだけで数える", () => {
    expect(progress(addPlayer([], "A", "castle", "a")[0]!)).toEqual({ done: 0, total: 6 });
  });
});
