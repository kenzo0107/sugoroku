import "./style.css";
import { COURSES, type Item, isCourseId, SOUVENIRS } from "./courses";
import {
  addPlayer,
  loadPlayers,
  type Player,
  progress,
  removePlayer,
  savePlayers,
  toggleCheck,
} from "./state";

let players = loadPlayers();

const $ = <T extends HTMLElement>(selector: string): T => {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`要素が見つかりません: ${selector}`);
  return found;
};

const form = $<HTMLFormElement>("#add-player");
const nameInput = $<HTMLInputElement>("#player-name");
const courseSelect = $<HTMLSelectElement>("#player-course");
const playersSection = $<HTMLElement>("#players");

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const update = (next: Player[]): void => {
  players = next;
  savePlayers(players);
  render();
};

const checklist = (player: Player, title: string, items: Item[]) =>
  el(
    "fieldset",
    { className: "checklist" },
    el("legend", {}, title),
    ...items.map((item) => {
      const checkbox = el("input", {
        type: "checkbox",
        checked: player.checked.includes(item.id),
      });
      checkbox.addEventListener("change", () =>
        update(toggleCheck(players, player.id, item.id)),
      );
      return el("label", { className: "item" }, checkbox, el("span", {}, item.name));
    }),
  );

const playerCard = (player: Player) => {
  const course = COURSES[player.courseId];
  const { done, total } = progress(player);
  const complete = done === total;

  const removeButton = el("button", { type: "button", className: "remove" }, "削除");
  removeButton.addEventListener("click", () => {
    if (confirm(`${player.name} さんを削除しますか？`)) {
      update(removePlayer(players, player.id));
    }
  });

  return el(
    "article",
    { className: `card course-${course.id}${complete ? " complete" : ""}` },
    el(
      "header",
      {},
      el("h2", {}, player.name),
      el("p", { className: "course-name" }, `${course.emoji} ${course.name}`),
      el(
        "p",
        { className: "progress" },
        complete ? "🎉 コンプリート！" : `${done} / ${total}`,
      ),
      el("progress", { max: total, value: done }),
    ),
    checklist(player, "行き先", course.spots),
    checklist(player, "おみやげ", SOUVENIRS),
    removeButton,
  );
};

const render = (): void => {
  playersSection.replaceChildren(
    ...(players.length === 0
      ? [el("p", { className: "empty" }, "なまえとコースを選んで参加しよう！")]
      : players.map(playerCard)),
  );
};

courseSelect.append(
  ...Object.values(COURSES).map((c) =>
    el("option", { value: c.id }, `${c.emoji} ${c.name}`),
  ),
);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const courseId = courseSelect.value;
  if (!name || !isCourseId(courseId)) return;
  update(addPlayer(players, name, courseId));
  form.reset();
  nameInput.focus();
});

render();
