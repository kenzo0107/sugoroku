import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const openPage = (file: string) => {
  const body = new DOMParser().parseFromString(readFileSync(file, "utf8"), "text/html").body;
  document.body.innerHTML = body.innerHTML;
  document.body.dataset.board = body.dataset.board ?? "";
};

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  openPage("index.html");
});

const settle = () => new Promise((resolve) => setTimeout(resolve));

const join = (name: string, courseId: string) => {
  document.querySelector<HTMLInputElement>("#player-name")!.value = name;
  document.querySelector<HTMLSelectElement>("#player-course")!.value = courseId;
  document.querySelector<HTMLFormElement>("#add-player")!.requestSubmit();
};

it("参加するとコースの行き先とおみやげがチェックリストで表示される", async () => {
  await import("./checklist");
  join("はなこ", "show");

  const card = document.querySelector(".card")!;
  expect(card.querySelector("h2")?.textContent).toBe("はなこ");
  expect(card.querySelectorAll("input[type=checkbox]")).toHaveLength(9);
  expect(card.textContent).toContain("シドニー オペラ");
  expect(card.textContent).toContain("マグカップ");
});

it("チェックすると進捗が増え、全部チェックでコンプリートになる", async () => {
  await import("./checklist");
  join("たろう", "nature");

  const boxes = () => document.querySelectorAll<HTMLInputElement>(".card input[type=checkbox]");
  boxes()[0]!.click();
  expect(document.querySelector(".progress")?.textContent).toBe("1 / 9");

  for (let i = 1; i < 9; i++) boxes()[i]!.click();
  expect(document.querySelector(".progress")?.textContent).toBe("🎉 コンプリート！");
});

it("名前はHTMLとして解釈されない", async () => {
  await import("./checklist");
  join("<img src=x>", "nature");
  expect(document.querySelector(".card img")).toBeNull();
  expect(document.querySelector(".card h2")?.textContent).toBe("<img src=x>");
});

it("サイコロをふると1〜6の目が表示される", async () => {
  await import("./checklist");
  document.querySelector<HTMLButtonElement>("#roll")!.click();
  await settle();
  const value = Number(document.querySelector(".dice-number")?.textContent);
  expect(value).toBeGreaterThanOrEqual(1);
  expect(value).toBeLessThanOrEqual(6);
  expect(Number.isInteger(value)).toBe(true);
});

it("冒険アクティビティ・世界のグルメ・古代文明ツアーの各コースも選べる", async () => {
  await import("./checklist");
  join("じろう", "adventure");
  join("さくら", "gourmet");
  join("けんた", "ancient");

  const [adventure, gourmet, ancient] = document.querySelectorAll(".card");
  expect(adventure?.textContent).toContain("イグアスの滝");
  expect(gourmet?.textContent).toContain("リオデジャネイロ シュラスコ");
  expect(gourmet?.querySelectorAll("input[type=checkbox]")).toHaveLength(9);
  expect(ancient?.textContent).toContain("ナスカ ナスカの地上絵");
});

it("参加者を何人追加しても、サイコロは1回のクリックで1回だけふられる", async () => {
  await import("./checklist");
  join("たろう", "nature");
  join("はなこ", "show");
  const result = document.querySelector("#dice-result")!;
  let changes = 0;
  new MutationObserver((records) => (changes += records.length)).observe(result, {
    childList: true,
  });
  document.querySelector<HTMLButtonElement>("#roll")!.click();
  await settle();
  expect(changes).toBe(1);
});

describe("日本一周すごろく", () => {
  beforeEach(() => openPage("japan.html"));

  it("日本一周の5コースだけが選べ、名前はひらがなで表示される", async () => {
    await import("./checklist");
    const options = [...document.querySelectorAll("#player-course option")].map((o) => o.textContent);
    expect(options).toEqual([
      "🏮 おまつりめぐりコース",
      "🏯 おしろめぐりコース",
      "🍜 おいしいものコース",
      "♨️ おんせんめぐりコース",
      "📸 ばえスポットコース",
    ]);
  });

  it("行き先6つにふりがなが付き、おみやげ欄はない", async () => {
    await import("./checklist");
    join("けんた", "castle");

    const card = document.querySelector(".card")!;
    expect(card.querySelectorAll("input[type=checkbox]")).toHaveLength(6);
    expect(card.textContent).not.toContain("おみやげ");
    const himeji = [...card.querySelectorAll("ruby")].find((r) => r.firstChild?.textContent === "姫路城");
    expect(himeji?.querySelector("rt")?.textContent).toBe("ひめじじょう");
    expect(document.querySelector(".progress")?.textContent).toBe("0 / 6");
  });

  it("世界のすごろくの参加者とは混ざらない", async () => {
    await import("./checklist");
    join("さくら", "onsen");

    vi.resetModules();
    openPage("index.html");
    await import("./checklist");
    expect(document.querySelectorAll(".card")).toHaveLength(0);
  });
});
