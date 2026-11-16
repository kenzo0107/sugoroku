import { flightsOf, isPosition, nearestWithin, nextOf, type Square, squareAt } from "./board";
import { type CourseId, isCourseId, itemsOf } from "./courses";

export const MAX_PLAYERS = 4;
export const POINT_SUCCESS: readonly number[] = [3, 4, 5];
export const HONOLULU_SUCCESS: readonly number[] = [1, 3, 5];
const HOTEL_RANGE = 5;
const LOG_LIMIT = 30;
const STORAGE_KEY = "sugoroku:game:v3";

export type Entry = { name: string; courseId: CourseId };

export type GamePlayer = {
  id: string;
  name: string;
  courseId: CourseId;
  position: number;
  checked: string[];
  rank: number | null;
};

export type Phase =
  | { type: "move" }
  | { type: "fork"; steps: number }
  | { type: "point"; itemId: string }
  | { type: "airport" }
  | { type: "honolulu" }
  | { type: "meetup" }
  | { type: "over" };

export type Game = {
  players: GamePlayer[];
  current: number;
  phase: Phase;
  lastRoll: number | null;
  log: string[];
};

export const newGame = (entries: Entry[]): Game => {
  if (entries.length < 1 || entries.length > MAX_PLAYERS) {
    throw new RangeError(`参加人数は1〜${MAX_PLAYERS}人です: ${entries.length}`);
  }
  return {
    players: entries.map((e, i) => ({
      id: `p${i + 1}`,
      name: e.name.trim(),
      courseId: e.courseId,
      position: 0,
      checked: [],
      rank: null,
    })),
    current: 0,
    phase: { type: "move" },
    lastRoll: null,
    log: ["東京から出発！"],
  };
};

export const currentPlayer = (game: Game): GamePlayer => {
  const player = game.players[game.current];
  if (!player) throw new RangeError(`プレイヤーがいません: ${game.current}`);
  return player;
};

export const isComplete = (player: GamePlayer): boolean =>
  itemsOf(player.courseId).every((item) => player.checked.includes(item.id));

const isPlaying = (player: GamePlayer): boolean => player.rank === null;

export const isStrikeActive = (game: Game): boolean =>
  game.players.some((p) => isPlaying(p) && squareAt(p.position).kind === "strike");

export const meetupTargets = (game: Game): GamePlayer[] => {
  const me = currentPlayer(game);
  return game.players.filter((p) => p.id !== me.id && isPlaying(p) && p.position !== me.position);
};

const isOpenPoint = (player: GamePlayer, square: Square): square is Extract<Square, { kind: "point" }> =>
  square.kind === "point" && square.courseId === player.courseId && !player.checked.includes(square.itemId);

const stopsAt = (player: GamePlayer, square: Square): boolean =>
  isOpenPoint(player, square) || (square.kind === "honolulu" && isComplete(player));

const updateCurrent = (game: Game, f: (p: GamePlayer) => GamePlayer): Game => ({
  ...game,
  players: game.players.map((p, i) => (i === game.current ? f(p) : p)),
});

const addLog = (game: Game, message: string): Game => ({
  ...game,
  log: [message, ...game.log].slice(0, LOG_LIMIT),
});

const withCheck = (player: GamePlayer, itemId: string): GamePlayer =>
  player.checked.includes(itemId) ? player : { ...player, checked: [...player.checked, itemId] };

const assertPhase = (game: Game, type: Phase["type"]): void => {
  if (game.phase.type !== type) {
    throw new Error(`今は ${type} の操作はできません（現在: ${game.phase.type}）`);
  }
};

const endTurn = (game: Game): Game => {
  const playing = game.players.filter(isPlaying);
  if (playing.length === 0) return { ...game, phase: { type: "over" } };
  if (playing.length === 1 && game.players.length > 1) {
    const last = game.players.length;
    const players = game.players.map((p) => (isPlaying(p) ? { ...p, rank: last } : p));
    return addLog({ ...game, players, phase: { type: "over" } }, `${playing[0]?.name} さんは ${last}位`);
  }
  let next = game.current;
  do {
    next = (next + 1) % game.players.length;
  } while (!isPlaying(game.players[next] as GamePlayer));
  return { ...game, current: next, phase: { type: "move" } };
};

const isWaitingAtHonolulu = (player: GamePlayer): boolean =>
  squareAt(player.position).kind === "honolulu" && isComplete(player);

const night = (game: Game): Game => {
  const players = game.players.map((p, i) => {
    if (i === game.current || !isPlaying(p) || squareAt(p.position).kind === "hotel" || isWaitingAtHonolulu(p)) return p;
    return { ...p, position: nearestWithin(p.position, HOTEL_RANGE, (s) => s.kind === "hotel") ?? p.position };
  });
  return addLog({ ...game, players }, "🌙 夜になった！近くにいる人はホテルへ");
};

const takeOff = (game: Game): Game => {
  const player = currentPlayer(game);
  if (flightsOf(player.position).length === 0) return endTurn(addLog(game, `${player.name}：この空港から出る便はない`));
  if (isStrikeActive(game)) return endTurn(addLog(game, `${player.name}：ストライキ中で飛行機が飛ばない…`));
  return { ...game, phase: { type: "airport" } };
};

const land = (game: Game): Game => {
  const player = currentPlayer(game);
  const square = squareAt(player.position);
  switch (square.kind) {
    case "point":
      if (!isOpenPoint(player, square)) return endTurn(game);
      return addLog(
        { ...game, phase: { type: "point", itemId: square.itemId } },
        `${player.name}：「${square.name}」に挑戦！3〜5でチェック`,
      );
    case "souvenir":
      if (player.checked.includes(square.itemId)) {
        return endTurn(addLog(game, `${player.name}：${square.name}はもう持っている`));
      }
      return endTurn(
        addLog(updateCurrent(game, (p) => withCheck(p, square.itemId)), `${player.name}：おみやげ「${square.name}」をゲット 🎁`),
      );
    case "again":
      return addLog({ ...game, phase: { type: "move" } }, `${player.name}：もう1回！`);
    case "honolulu":
      if (isComplete(player)) {
        if (isStrikeActive(game)) return endTurn(addLog(game, `${player.name}：ストライキ中でホノルルチャレンジできない…`));
        return addLog({ ...game, phase: { type: "honolulu" } }, `${player.name}：ホノルルに到着！1・3・5でゴール`);
      }
      return endTurn(game);
    case "airport":
      return takeOff(game);
    case "hotel":
      return endTurn(night(game));
    case "meetup":
      return meetupTargets(game).length > 0 ? { ...game, phase: { type: "meetup" } } : endTurn(game);
    case "strike":
      return endTurn(addLog(game, `${player.name}：飛行機ストライキ！しばらく空路は使えない ✈️🚫`));
    default:
      return endTurn(game);
  }
};

const advance = (game: Game, steps: number, firstStep?: number): Game => {
  const player = currentPlayer(game);
  let position = player.position;
  for (let left = steps; left > 0; left--) {
    const targets = left === steps && firstStep !== undefined ? [firstStep] : nextOf(position);
    if (targets.length > 1) {
      return addLog(
        { ...updateCurrent(game, (p) => ({ ...p, position })), phase: { type: "fork", steps: left } },
        `${player.name}：「${squareAt(position).name}」で分かれ道。どちらへ進む？`,
      );
    }
    position = targets[0]!;
    if (stopsAt(player, squareAt(position))) break;
  }
  return land(addLog(updateCurrent(game, (p) => ({ ...p, position })), `${player.name}：「${squareAt(position).name}」へ`));
};

const move = (game: Game, steps: number): Game =>
  advance(addLog(game, `${currentPlayer(game).name}：${steps}が出た`), steps);

const honolulu = (game: Game, value: number): Game => {
  const player = currentPlayer(game);
  if (isStrikeActive(game)) {
    return endTurn(addLog(game, `${player.name}：ストライキ中でホノルルへ行けない…`));
  }
  if (!HONOLULU_SUCCESS.includes(value)) {
    return endTurn(addLog(game, `${player.name}：ホノルルチャレンジ失敗（${value}）`));
  }
  const rank = game.players.filter((p) => !isPlaying(p)).length + 1;
  return endTurn(
    addLog(
      updateCurrent(game, (p) => ({ ...p, position: nextOf(p.position)[0]!, rank })),
      `${player.name}：ホノルルチャレンジ成功！東京に帰って${rank}位でゴール 🎉`,
    ),
  );
};

const pointChallenge = (game: Game, itemId: string, value: number): Game => {
  const player = currentPlayer(game);
  const name = squareAt(player.position).name;
  if (!POINT_SUCCESS.includes(value)) {
    return endTurn(addLog(game, `${player.name}：${value}…「${name}」はチェックならず`));
  }
  return endTurn(addLog(updateCurrent(game, (p) => withCheck(p, itemId)), `${player.name}：${value}！「${name}」にチェック ✅`));
};

export const roll = (game: Game, value: number): Game => {
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    throw new RangeError(`サイコロの目は1〜6です: ${value}`);
  }
  const rolled = { ...game, lastRoll: value };
  switch (game.phase.type) {
    case "move": {
      const player = currentPlayer(game);
      const atHonolulu = squareAt(player.position).kind === "honolulu";
      return isComplete(player) && atHonolulu ? honolulu(rolled, value) : move(rolled, value);
    }
    case "honolulu":
      return honolulu(rolled, value);
    case "point":
      return pointChallenge(rolled, game.phase.itemId, value);
    default:
      throw new Error(`今はサイコロをふれません（現在: ${game.phase.type}）`);
  }
};

export const chooseAirport = (game: Game, to: number | null): Game => {
  assertPhase(game, "airport");
  if (to === null) return endTurn(game);
  const player = currentPlayer(game);
  if (!flightsOf(player.position).includes(to)) throw new Error(`そこへは飛べません: ${to}`);
  return endTurn(addLog(updateCurrent(game, (p) => ({ ...p, position: to })), `${player.name}：✈️ ${squareAt(to).name}へひとっ飛び`));
};

export const chooseFork = (game: Game, to: number): Game => {
  if (game.phase.type !== "fork") throw new Error(`今は分かれ道を選べません（現在: ${game.phase.type}）`);
  if (!nextOf(currentPlayer(game).position).includes(to)) throw new Error(`その方向には進めません: ${to}`);
  return advance({ ...game, phase: { type: "move" } }, game.phase.steps, to);
};

export const chooseMeetup = (game: Game, targetId: string | null): Game => {
  assertPhase(game, "meetup");
  if (targetId === null) return endTurn(game);
  const target = meetupTargets(game).find((p) => p.id === targetId);
  if (!target) throw new Error(`まちあわせできない相手です: ${targetId}`);
  const player = currentPlayer(game);
  return endTurn(
    addLog(updateCurrent(game, (p) => ({ ...p, position: target.position })), `${player.name}：${target.name} さんとまちあわせ 🤝`),
  );
};

const PHASE_TYPES: readonly string[] = ["move", "fork", "point", "airport", "honolulu", "meetup", "over"];

const isGamePlayer = (value: unknown): value is GamePlayer => {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    isCourseId(p.courseId) &&
    isPosition(p.position) &&
    Array.isArray(p.checked) &&
    p.checked.every((c) => typeof c === "string") &&
    (p.rank === null || Number.isInteger(p.rank))
  );
};

const isGame = (value: unknown): value is Game => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const phase = v.phase as Record<string, unknown> | undefined;
  return (
    Array.isArray(v.players) &&
    v.players.length >= 1 &&
    v.players.length <= MAX_PLAYERS &&
    v.players.every(isGamePlayer) &&
    Number.isInteger(v.current) &&
    (v.current as number) >= 0 &&
    (v.current as number) < v.players.length &&
    typeof phase?.type === "string" &&
    PHASE_TYPES.includes(phase.type) &&
    (phase.type !== "point" || typeof phase.itemId === "string") &&
    (phase.type !== "fork" || (Number.isInteger(phase.steps) && (phase.steps as number) >= 1 && (phase.steps as number) <= 6)) &&
    (v.lastRoll === null || Number.isInteger(v.lastRoll)) &&
    Array.isArray(v.log)
  );
};

export const loadGame = (storage: Storage = localStorage): Game | null => {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isGame(parsed)) return parsed;
  } catch (e) {
    console.warn("保存したゲームを読み込めなかったため最初からにします", e);
  }
  return null;
};

export const saveGame = (game: Game | null, storage: Storage = localStorage): void => {
  if (game === null) storage.removeItem(STORAGE_KEY);
  else storage.setItem(STORAGE_KEY, JSON.stringify(game));
};
