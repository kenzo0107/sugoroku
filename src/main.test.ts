import { readFileSync } from "node:fs";
import { beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  localStorage.clear();
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

it("参加者を登録して出発すると、48マスの盤面と全員のコマが東京に並ぶ", async () => {
  await import("./main");
  join("たろう", "nature");
  join("はなこ", "show");
  clickButton("東京から出発");

  expect(document.querySelectorAll(".square")).toHaveLength(48);
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
