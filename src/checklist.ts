import "./style.css";
import { faceOf, rollDie } from "./dice";
import { createDie, playRoll } from "./diceAnimation";
import { BOARDS, COURSES, type Item, isBoardId, isCourseId } from "./courses";
import { toBase, toKana, toRubyNodes } from "./ruby";
import {
  addPlayer,
  loadPlayers,
  type Player,
  progress,
  removePlayer,
  savePlayers,
  toggleCheck,
} from "./state";

const boardId = document.body.dataset.board;
const board = BOARDS[isBoardId(boardId) ? boardId : "world"];

let players = loadPlayers(board);

const $ = <T extends HTMLElement>(selector: string): T => {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`要素が見つかりません: ${selector}`);
  return found;
};

const form = $<HTMLFormElement>("#add-player");
const nameInput = $<HTMLInputElement>("#player-name");
const courseSelect = $<HTMLSelectElement>("#player-course");
const playersSection = $<HTMLElement>("#players");
const rollButton = $<HTMLButtonElement>("#roll");
const diceResult = $<HTMLOutputElement>("#dice-result");
const diceStage = $<HTMLElement>("#dice-stage");
const diceMover = $<HTMLElement>(".dice-mover");
const diceCaption = $<HTMLElement>(".dice-caption");

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
  savePlayers(players, board);
  render();
};

const checklist = (player: Player, title: string, items: Item[]) =>
  el(
    "fieldset",
    { className: "checklist" },
    el("legend", {}, ...toRubyNodes(title)),
    ...items.map((item) => {
      const checkbox = el("input", {
        type: "checkbox",
        checked: player.checked.includes(item.id),
      });
      checkbox.addEventListener("change", () =>
        update(toggleCheck(players, player.id, item.id)),
      );
      return el("label", { className: "item" }, checkbox, el("span", {}, ...toRubyNodes(item.name)));
    }),
  );

const playerCard = (player: Player) => {
  const course = COURSES[player.courseId];
  const { done, total } = progress(player);
  const complete = done === total;

  const removeButton = el("button", { type: "button", className: "remove" }, "けす");
  removeButton.addEventListener("click", () => {
    if (confirm(`${player.name} さんを けしますか？`)) {
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
      el("p", { className: "course-name" }, `${course.emoji} `, ...toRubyNodes(course.name)),
      el(
        "p",
        { className: "progress" },
        complete ? "🎉 コンプリート！" : `${done} / ${total}`,
      ),
      el("progress", { max: total, value: done }),
    ),
    checklist(player, "行{い}き先{さき}", course.spots),
    ...(course.souvenirs.length > 0 ? [checklist(player, "おみやげ", course.souvenirs)] : []),
    removeButton,
  );
};

const render = (): void => {
  playersSection.replaceChildren(
    ...(players.length === 0
      ? [el("p", { className: "empty" }, ...toRubyNodes("なまえとコースを選{えら}んで参加{さんか}しよう！"))]
      : players.map(playerCard)),
  );
};

courseSelect.append(
  ...board.courseIds.map((id) => {
    const { emoji, name } = COURSES[id];
    // <option> の中には <ruby> を置けないため、日本一周の盤面ではひらがなに開いて表示する
    const label = board.id === "japan" ? toKana(name) : toBase(name);
    return el("option", { value: id }, `${emoji} ${label}`);
  }),
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

const die = createDie();
diceMover.append(die);

let hideTimer: ReturnType<typeof setTimeout> | undefined;
const hideStage = () => {
  diceStage.hidden = true;
};
diceStage.addEventListener("click", hideStage);

rollButton.addEventListener("click", async () => {
  const value = rollDie();
  clearTimeout(hideTimer);
  rollButton.disabled = true;
  diceCaption.textContent = "";
  diceStage.hidden = false;
  try {
    await playRoll(diceMover, die, value);
  } finally {
    rollButton.disabled = false;
  }
  diceCaption.textContent = `${value} がでた！`;
  diceResult.replaceChildren(
    el("span", { className: "dice-face" }, faceOf(value)),
    el("span", { className: "dice-number" }, String(value)),
  );
  hideTimer = setTimeout(hideStage, 1500);
});

render();
