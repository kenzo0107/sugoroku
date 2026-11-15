import type { CourseId } from "./courses";

export type Region = "asia" | "europe" | "africa" | "south-america" | "north-america" | "oceania";

export const REGION_NAMES: Record<Region, string> = {
  asia: "アジア",
  europe: "ヨーロッパ",
  africa: "アフリカ",
  "south-america": "南アメリカ",
  "north-america": "北アメリカ",
  oceania: "オセアニア",
};

type Base = { name: string; region: Region };

export type Square =
  | (Base & { kind: "start" | "city" | "again" | "airport" | "hotel" | "meetup" | "strike" })
  | (Base & { kind: "point"; label: string; courseId: CourseId; itemId: string })
  | (Base & { kind: "souvenir"; itemId: string });

const city = (region: Region, name: string): Square => ({ kind: "city", region, name });
const airport = (region: Region, name: string): Square => ({ kind: "airport", region, name });
const again = (region: Region): Square => ({ kind: "again", region, name: "もう1回" });
const hotel = (region: Region): Square => ({ kind: "hotel", region, name: "ホテル" });
const meetup = (region: Region): Square => ({ kind: "meetup", region, name: "まちあわせ" });
const strike = (region: Region): Square => ({ kind: "strike", region, name: "ストライキ" });
const point = (
  region: Region,
  courseId: CourseId,
  itemId: string,
  name: string,
  label: string,
): Square => ({ kind: "point", region, courseId, itemId, name, label });
const souvenir = (region: Region, itemId: string, name: string): Square => ({
  kind: "souvenir",
  region,
  itemId,
  name,
});

export const BOARD: readonly Square[] = [
  { kind: "start", region: "asia", name: "東京" },
  city("asia", "ソウル"),
  souvenir("asia", "cookie", "クッキー"),
  point("asia", "show", "bali", "バリ島 ガムラン", "ガムラン"),
  city("asia", "バンコク"),
  hotel("asia"),
  point("asia", "nature", "everest", "エベレスト", "エベレスト"),
  airport("asia", "デリー"),
  city("asia", "ドバイ"),

  city("europe", "イスタンブール"),
  point("europe", "show", "vienna", "ウィーン クラシック音楽", "クラシック"),
  meetup("europe"),
  souvenir("europe", "tshirt", "Tシャツ"),
  point("europe", "nature", "matterhorn", "マッターホルン", "マッターホルン"),
  strike("europe"),
  city("europe", "パリ"),
  airport("europe", "ロンドン"),

  city("africa", "カイロ"),
  again("africa"),
  point("africa", "show", "marrakech", "マラケシュ ベリーダンス", "ベリーダンス"),
  hotel("africa"),
  souvenir("africa", "mug", "マグカップ"),
  point("africa", "nature", "kilimanjaro", "キリマンジャロ", "キリマンジャロ"),
  airport("africa", "ケープタウン"),

  city("south-america", "リオデジャネイロ"),
  souvenir("south-america", "cookie", "クッキー"),
  point("south-america", "nature", "guiana", "ギアナ高地", "ギアナ高地"),
  meetup("south-america"),
  city("south-america", "リマ"),
  airport("south-america", "ボゴタ"),

  city("north-america", "メキシコシティ"),
  point("north-america", "show", "las-vegas", "ラスベガス マジックショー", "マジック"),
  hotel("north-america"),
  again("north-america"),
  point("north-america", "nature", "canadian-rockies", "カナディアンロッキー", "ロッキー"),
  city("north-america", "シカゴ"),
  point("north-america", "show", "new-york", "ニューヨーク ミュージカル", "ミュージカル"),
  souvenir("north-america", "tshirt", "Tシャツ"),
  meetup("north-america"),
  airport("north-america", "ロサンゼルス"),

  city("oceania", "オークランド"),
  point("oceania", "nature", "uluru", "ウルル（エアーズロック）", "ウルル"),
  souvenir("oceania", "mug", "マグカップ"),
  hotel("oceania"),
  point("oceania", "show", "sydney", "シドニー オペラ", "オペラ"),
  strike("oceania"),
  city("oceania", "ケアンズ"),
  airport("oceania", "ブリスベン"),
];

export const squareAt = (position: number): Square => {
  const square = BOARD[((position % BOARD.length) + BOARD.length) % BOARD.length];
  if (!square) throw new RangeError(`マスがありません: ${position}`);
  return square;
};

export type Cell = { row: number; col: number };

export const ringCells = (cols: number, rows: number): Cell[] => {
  const top = Array.from({ length: cols }, (_, i) => ({ row: 1, col: i + 1 }));
  const right = Array.from({ length: rows - 2 }, (_, i) => ({ row: i + 2, col: cols }));
  const bottom = Array.from({ length: cols }, (_, i) => ({ row: rows, col: cols - i }));
  const left = Array.from({ length: rows - 2 }, (_, i) => ({ row: rows - 1 - i, col: 1 }));
  return [...top, ...right, ...bottom, ...left];
};
