import { BOARDS, type Board, type CourseId, isCourseId, itemsOf } from "./courses";

export type Player = {
  id: string;
  name: string;
  courseId: CourseId;
  checked: string[];
};

export const addPlayer = (
  players: Player[],
  name: string,
  courseId: CourseId,
  id: string = crypto.randomUUID(),
): Player[] => [...players, { id, name: name.trim(), courseId, checked: [] }];

export const removePlayer = (players: Player[], playerId: string): Player[] =>
  players.filter((p) => p.id !== playerId);

export const toggleCheck = (
  players: Player[],
  playerId: string,
  itemId: string,
): Player[] =>
  players.map((p) => {
    if (p.id !== playerId) return p;
    const checked = p.checked.includes(itemId)
      ? p.checked.filter((id) => id !== itemId)
      : [...p.checked, itemId];
    return { ...p, checked };
  });

export const progress = (player: Player): { done: number; total: number } => {
  const items = itemsOf(player.courseId);
  return {
    done: items.filter((item) => player.checked.includes(item.id)).length,
    total: items.length,
  };
};

const isPlayerOf = (board: Board) => (value: unknown): value is Player => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    isCourseId(v.courseId) &&
    board.courseIds.includes(v.courseId) &&
    Array.isArray(v.checked) &&
    v.checked.every((c) => typeof c === "string")
  );
};

export const loadPlayers = (
  board: Board = BOARDS.world,
  storage: Storage = localStorage,
): Player[] => {
  const raw = storage.getItem(board.storageKey);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(isPlayerOf(board));
  } catch (e) {
    console.warn("保存データを読み込めなかったため初期化します", e);
  }
  return [];
};

export const savePlayers = (
  players: Player[],
  board: Board = BOARDS.world,
  storage: Storage = localStorage,
): void => {
  storage.setItem(board.storageKey, JSON.stringify(players));
};
