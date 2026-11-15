import "./style.css";
import { BOARD, type Cell, REGION_NAMES, ringCells, type Square } from "./board";
import { COURSES, isCourseId, SOUVENIRS } from "./courses";
import { faceOf, rollDie } from "./dice";
import {
  chooseAirport,
  chooseMeetup,
  currentPlayer,
  type Entry,
  type Game,
  type GamePlayer,
  isComplete,
  isStrikeActive,
  loadGame,
  MAX_PLAYERS,
  meetupTargets,
  newGame,
  roll,
  saveGame,
} from "./game";

const PLAYER_COLORS = ["#e53935", "#1e88e5", "#43a047", "#fb8c00"] as const;
const SOUVENIR_ICONS: Record<string, string> = { cookie: "🍪", tshirt: "👕", mug: "☕" };
const SQUARE_ICONS: Record<Square["kind"], string> = {
  start: "🏁",
  city: "",
  point: "",
  souvenir: "",
  again: "⏩",
  airport: "✈️",
  hotel: "🏨",
  meetup: "🤝",
  strike: "🚫",
};
const SQUARE_HELP: Record<Square["kind"], string> = {
  start: "スタート",
  city: "ふつうのマス",
  point: "自分のコースのポイントなら、目があまっても止まれる。サイコロで3〜5が出たらチェック",
  souvenir: "止まったらおみやげをゲット",
  again: "もう1回サイコロをふれる",
  airport: "次の空港へ飛べる（ストライキ中は飛べない）",
  hotel: "夜になる。5マス以内にいる人はホテルへ移動",
  meetup: "ほかの人のいるマスへ移動できる",
  strike: "ここに誰かがいる間は空路・ホノルル行きが使えない",
};

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("#app が見つかりません");

let game: Game | null = loadGame();
let entries: Entry[] = [];
let justRolled = false;

const wide = window.matchMedia("(min-width: 720px)");
const cells = (): Cell[] => (wide.matches ? ringCells(14, 12) : ringCells(8, 18));

type Props<K extends keyof HTMLElementTagNameMap> = Omit<Partial<HTMLElementTagNameMap[K]>, "style"> & {
  style?: string;
};

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  { style, ...props }: Props<K> = {} as Props<K>,
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] => {
  const node = Object.assign(document.createElement(tag), props);
  if (style) node.setAttribute("style", style);
  node.append(...children);
  return node;
};

const button = (label: string, onClick: () => void, className = "action") => {
  const b = el("button", { type: "button", className }, label);
  b.addEventListener("click", onClick);
  return b;
};

const setGame = (next: Game | null, rolled = false): void => {
  game = next;
  justRolled = rolled;
  saveGame(game);
  render();
};

const colorOf = (g: Game, player: GamePlayer): string =>
  PLAYER_COLORS[g.players.indexOf(player)] ?? PLAYER_COLORS[0];

const token = (g: Game, player: GamePlayer) =>
  el("span", { className: "token", title: player.name, style: `background:${colorOf(g, player)}` }, player.name.slice(0, 1));

const squareTile = (g: Game, square: Square, index: number, cell: Cell) => {
  const icon =
    square.kind === "point"
      ? COURSES[square.courseId].emoji
      : square.kind === "souvenir"
        ? (SOUVENIR_ICONS[square.itemId] ?? "🎁")
        : SQUARE_ICONS[square.kind];
  const label = square.kind === "point" ? square.label : square.name;
  const here = g.players.filter((p) => p.rank === null && p.position === index);
  const classes = ["square", `kind-${square.kind}`, `region-${square.region}`];
  if (square.kind === "point") classes.push(`course-${square.courseId}`);
  return el(
    "div",
    {
      className: classes.join(" "),
      title: `${square.name}（${REGION_NAMES[square.region]}）\n${SQUARE_HELP[square.kind]}`,
      style: `grid-row:${cell.row};grid-column:${cell.col}`,
    },
    el("span", { className: "square-icon" }, icon),
    el("span", { className: "square-name" }, label),
    el("span", { className: "tokens" }, ...here.map((p) => token(g, p))),
  );
};

const actions = (g: Game): HTMLElement[] => {
  const player = currentPlayer(g);
  const rollWith = () => setGame(roll(g, rollDie()), true);
  switch (g.phase.type) {
    case "move":
      return isComplete(player)
        ? [button("🌺 ホノルルチャレンジ（1・3・5で成功）", rollWith)]
        : [button("🎲 サイコロをふる", rollWith)];
    case "point":
      return [button("🎲 チャレンジ（3〜5でチェック）", rollWith)];
    case "airport":
      return [
        button("✈️ 次の空港へ飛ぶ", () => setGame(chooseAirport(g, true))),
        button("とどまる", () => setGame(chooseAirport(g, false)), "action secondary"),
      ];
    case "meetup":
      return [
        ...meetupTargets(g).map((t) => button(`🤝 ${t.name} さんのところへ`, () => setGame(chooseMeetup(g, t.id)))),
        button("とどまる", () => setGame(chooseMeetup(g, null)), "action secondary"),
      ];
    case "over":
      return [button("もう一度あそぶ", () => setGame(null))];
  }
};

const ranking = (g: Game) =>
  el(
    "ol",
    { className: "ranking" },
    ...[...g.players]
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
      .map((p) => el("li", {}, token(g, p), ` ${p.rank}位 ${p.name}`)),
  );

const centerPanel = (g: Game, cols: number, rows: number) => {
  const player = currentPlayer(g);
  const over = g.phase.type === "over";
  const dice = el(
    "div",
    { className: `dice-result${justRolled ? " rolling" : ""}`, ariaLive: "polite" },
    ...(g.lastRoll === null
      ? []
      : [el("span", { className: "dice-face" }, faceOf(g.lastRoll)), el("span", { className: "dice-number" }, String(g.lastRoll))]),
  );
  return el(
    "div",
    { className: "center", style: `grid-row:2 / ${rows};grid-column:2 / ${cols}` },
    over
      ? el("h2", {}, "🏆 結果発表")
      : el("h2", { className: "turn" }, token(g, player), ` ${player.name} さんの番`),
    isStrikeActive(g) && !over ? el("p", { className: "strike-banner" }, "🚫 飛行機ストライキ中") : "",
    dice,
    over ? ranking(g) : "",
    el("div", { className: "actions" }, ...actions(g)),
    el("ul", { className: "log" }, ...g.log.slice(0, 6).map((m) => el("li", {}, m))),
  );
};

const playerSheet = (g: Game, player: GamePlayer) => {
  const course = COURSES[player.courseId];
  const items = [...course.spots, ...SOUVENIRS];
  const done = items.filter((i) => player.checked.includes(i.id)).length;
  const isTurn = g.phase.type !== "over" && currentPlayer(g).id === player.id;
  return el(
    "article",
    { className: `sheet course-${course.id}${isTurn ? " active" : ""}` },
    el("h3", {}, token(g, player), ` ${player.name}`),
    el("p", { className: "course-name" }, `${course.emoji} ${course.name}`),
    el("p", { className: "progress" }, player.rank !== null ? `🎉 ${player.rank}位でゴール` : isComplete(player) ? "🌺 ホノルルチャレンジへ！" : `${done} / ${items.length}`),
    el(
      "ul",
      { className: "sheet-items" },
      ...items.map((i) => el("li", { className: player.checked.includes(i.id) ? "done" : "" }, `${player.checked.includes(i.id) ? "✅" : "⬜"} ${i.name}`)),
    ),
  );
};

const gameView = (g: Game) => {
  const layout = cells();
  const cols = Math.max(...layout.map((c) => c.col));
  const rows = Math.max(...layout.map((c) => c.row));
  const board = el(
    "div",
    { className: "board", style: `grid-template-columns:repeat(${cols}, 1fr)` },
    ...BOARD.map((square, i) => {
      const cell = layout[i];
      if (!cell) throw new Error(`盤面の配置が足りません: ${i}`);
      return squareTile(g, square, i, cell);
    }),
    centerPanel(g, cols, rows),
  );
  return [
    board,
    el("section", { className: "sheets" }, ...g.players.map((p) => playerSheet(g, p))),
    el("p", { className: "reset" }, button("ゲームをやめて最初から", () => {
      if (confirm("ゲームをやめて最初からにしますか？")) setGame(null);
    }, "action secondary")),
  ];
};

const setupView = () => {
  const nameInput = el("input", { type: "text", placeholder: "なまえ", maxLength: 20, required: true });
  const courseSelect = el(
    "select",
    { required: true },
    ...Object.values(COURSES).map((c) => el("option", { value: c.id }, `${c.emoji} ${c.name}`)),
  );
  const full = entries.length >= MAX_PLAYERS;
  const form = el("form", { className: "add-player" }, nameInput, courseSelect, el("button", { type: "submit", disabled: full }, "参加する"));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name || !isCourseId(courseSelect.value) || full) return;
    entries = [...entries, { name, courseId: courseSelect.value }];
    render();
    app.querySelector<HTMLInputElement>(".add-player input")?.focus();
  });

  const start = button("🏁 東京から出発！", () => {
    setGame(newGame(entries));
    entries = [];
  });
  start.disabled = entries.length === 0;

  return [
    el(
      "section",
      { className: "setup" },
      el("h2", {}, `参加者を登録（${MAX_PLAYERS}人まで）`),
      form,
      el(
        "ul",
        { className: "entries" },
        ...entries.map((e, i) =>
          el(
            "li",
            {},
            el("span", { className: "token", style: `background:${PLAYER_COLORS[i]}` }, e.name.slice(0, 1)),
            ` ${e.name}（${COURSES[e.courseId].emoji} ${COURSES[e.courseId].name}）`,
            button("×", () => {
              entries = entries.filter((_, j) => j !== i);
              render();
            }, "remove"),
          ),
        ),
      ),
      start,
      el(
        "details",
        { className: "rules" },
        el("summary", {}, "あそびかた"),
        el(
          "ul",
          {},
          ...[
            "東京から出発して世界を旅します。自分のコースの行き先6か所とおみやげ3種を集めよう。",
            "自分のコースの行き先マスは、目があまっても止まれます。止まったらサイコロで3〜5が出ればチェック。",
            "おみやげマスに止まるとおみやげをゲット。",
            "✈️ 空港：次の空港へ飛べます。⏩ もう1回：もう一度サイコロ。🤝 まちあわせ：ほかの人のマスへ移動できます。",
            "🏨 ホテル：夜になり、5マス以内にいる人はホテルへ移動。🚫 ストライキ：誰かがいる間は空路とホノルル行きが使えません。",
            "全部そろったら、次の番からホノルルチャレンジ。1・3・5が出たらゴール！",
          ].map((t) => el("li", {}, t)),
        ),
      ),
    ),
  ];
};

const render = (): void => {
  app.replaceChildren(...(game ? gameView(game) : setupView()));
};

wide.addEventListener("change", render);
render();
