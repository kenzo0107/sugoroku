import { readFileSync } from "node:fs";
import { beforeEach, expect, it, vi } from "vitest";
import { BOARD, FLIGHTS } from "./board";
import { newGame, saveGame } from "./game";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: () => {} }));
  const html = readFileSync("index.html", "utf8");
  document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
});

const join = (name: string, courseId: string) => {
  document.querySelector<HTMLInputElement>(".add-player input")!.value = name;
  document.querySelector<HTMLSelectElement>(".add-player select")!.value = courseId;
  document.querySelector<HTMLFormElement>(".add-player")!.requestSubmit();
};

const clickButton = (text: string) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.includes(text));
  if (!b) throw new Error(`ボタンがありません: ${text}`);
  b.click();
};

it("参加者を登録して出発すると、全マスの盤面と全員のコマが東京に並ぶ", async () => {
  await import("./main");
  join("たろう", "nature");
  join("はなこ", "show");
  clickButton("東京から出発");

  expect(document.querySelectorAll(".square")).toHaveLength(BOARD.length);
  expect(document.querySelectorAll(".kind-start .token")).toHaveLength(2);
  expect(document.querySelector(".turn")?.textContent).toContain("たろう さんの番");
  expect(document.querySelectorAll(".sheet")).toHaveLength(2);
});

it("サイコロをふるとコマが進み、リロードしても続きから遊べる", async () => {
  await import("./main");
  join("たろう", "nature");
  clickButton("東京から出発");
  clickButton("サイコロをふる");

  expect(document.querySelectorAll(".kind-start .token")).toHaveLength(0);
  expect(document.querySelector(".dice-number")?.textContent).toMatch(/^[1-6]$/);

  const html = document.querySelector(".board")?.innerHTML;
  vi.resetModules();
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync("index.html", "utf8"), "text/html").body.innerHTML;
  await import("./main");
  expect(document.querySelector(".board")?.innerHTML.replace(" rolling", "")).toBe(html?.replace(" rolling", ""));
});

it("参加者がいないと出発できない", async () => {
  await import("./main");
  const start = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("東京から出発"));
  expect(start?.disabled).toBe(true);
});

it("盤面は世界地図の上に描かれ、手番の人がいるマスが目立つ", async () => {
  await import("./main");
  join("たろう", "nature");
  clickButton("東京から出発");

  expect(document.querySelector(".board .land")?.getAttribute("d")).toMatch(/^M/);
  expect(document.querySelector(".board .route")?.getAttribute("d")).toMatch(/^M/);
  expect(document.querySelectorAll(".board .flight[marker-end]")).toHaveLength(FLIGHTS.flat().length);
  expect(document.querySelector(".square.current")?.classList.contains("kind-start")).toBe(true);
});

it("青島の分かれ道では、行き先の方面を選んで進める", async () => {
  const qingdao = BOARD.findIndex((s) => s.id === "qingdao");
  const game = newGame([{ name: "たろう", courseId: "nature" }]);
  saveGame({ ...game, players: [{ ...game.players[0]!, position: qingdao }] });
  vi.spyOn(Math, "random").mockReturnValue(0);
  await import("./main");
  clickButton("サイコロをふる");

  const choices = [...document.querySelectorAll(".panel button")].map((b) => b.textContent);
  expect(choices).toEqual(["➡️ 上海方面へ", "➡️ 南京方面へ", "➡️ エアポート（中国東部）方面へ"]);
  clickButton("上海方面へ");
  expect(document.querySelector(".square .token")?.closest(".square")?.getAttribute("title")).toMatch(/^上海/);
});

it("空港では決まった行き先ごとに飛ぶボタンが出る", async () => {
  const qingdao = BOARD.findIndex((s) => s.id === "qingdao");
  const game = newGame([{ name: "たろう", courseId: "nature" }]);
  saveGame({ ...game, players: [{ ...game.players[0]!, position: qingdao }] });
  vi.spyOn(Math, "random").mockReturnValue(0);
  await import("./main");
  clickButton("サイコロをふる");
  clickButton("エアポート（中国東部）方面へ");

  const choices = [...document.querySelectorAll(".panel button")].map((b) => b.textContent);
  expect(choices).toEqual(["✈️ ホノルルへ飛ぶ", "✈️ ロサンゼルスへ飛ぶ", "とどまる"]);
});
