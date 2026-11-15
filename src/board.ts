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

export type LatLon = readonly [lat: number, lon: number];

type Base = { name: string; region: Region; at?: LatLon };
type Located = Base & { at: LatLon };

export type Square =
  | (Located & { kind: "start" | "city" | "airport" })
  | (Base & { kind: "blank" | "again" | "hotel" | "meetup" | "strike" })
  | (Located & { kind: "point"; label: string; courseId: CourseId; itemId: string })
  | (Base & { kind: "souvenir"; itemId: string });

const city = (region: Region, name: string, at: LatLon): Square => ({ kind: "city", region, name, at });
const airport = (region: Region, name: string, at: LatLon): Square => ({ kind: "airport", region, name, at });
const blank = (region: Region): Square => ({ kind: "blank", region, name: "空欄" });
const again = (region: Region): Square => ({ kind: "again", region, name: "もう1回" });
const hotel = (region: Region, name = "ホテル", at?: LatLon): Square => ({ kind: "hotel", region, name, ...(at && { at }) });
const meetup = (region: Region): Square => ({ kind: "meetup", region, name: "まちあわせ" });
const strike = (region: Region): Square => ({ kind: "strike", region, name: "ストライキ" });
const point = (
  region: Region,
  courseId: CourseId,
  itemId: string,
  name: string,
  label: string,
  at: LatLon,
): Square => ({ kind: "point", region, courseId, itemId, name, label, at });
const souvenir = (region: Region, itemId: string, name: string): Square => ({
  kind: "souvenir",
  region,
  itemId,
  name,
});

const FROM_TOKYO: Square[] = [
  { kind: "start", region: "asia", name: "東京", at: [35.68, 139.69] },
  airport("asia", "ソウル", [37.46, 126.44]),
  point("asia", "ancient", "beijing", "北京 万里の長城", "万里の長城", [40.43, 116.57]),
  city("asia", "青島", [36.07, 120.38]),
  city("asia", "南京", [32.06, 118.8]),
  city("asia", "上海", [31.23, 121.47]),
];

const VIA_TAIPEI: Square[] = [
  blank("asia"),
  city("asia", "台北", [25.03, 121.57]),
  city("asia", "マニラ", [14.6, 120.98]),
  point("asia", "show", "bali", "バリ島 ガムラン", "ガムラン", [-8.41, 115.19]),
  blank("asia"),
  city("asia", "シンガポール", [1.35, 103.82]),
  city("asia", "クアラルンプール", [3.14, 101.69]),
];

const VIA_HONG_KONG: Square[] = [
  again("asia"),
  hotel("asia", "香港", [22.32, 114.17]),
  city("asia", "ハノイ", [21.03, 105.85]),
  meetup("asia"),
];

const FROM_BANGKOK: Square[] = [
  city("asia", "バンコク", [13.76, 100.5]),
  hotel("asia"),
  point("asia", "nature", "everest", "エベレスト", "エベレスト", [27.99, 86.93]),
  point("asia", "adventure", "ganges", "ガンジス川", "ガンジス川", [25.32, 83.01]),
  airport("asia", "デリー", [28.61, 77.21]),
  point("asia", "gourmet", "delhi-curry", "デリー インドカレー", "カレー", [28.65, 77.23]),
  point("asia", "adventure", "silk-road", "シルクロードドライブ", "シルクロード", [39.65, 66.96]),
  city("asia", "ドバイ", [25.2, 55.27]),

  city("europe", "イスタンブール", [41.01, 28.98]),
  point("europe", "gourmet", "istanbul-kebab", "イスタンブール ケバブサンド", "ケバブ", [41.02, 28.97]),
  point("europe", "show", "vienna", "ウィーン クラシック音楽", "クラシック", [48.21, 16.37]),
  point("europe", "ancient", "rome", "ローマ コロッセオ", "コロッセオ", [41.89, 12.49]),
  meetup("europe"),
  souvenir("europe", "tshirt", "Tシャツ"),
  point("europe", "nature", "matterhorn", "マッターホルン", "マッターホルン", [45.98, 7.66]),
  strike("europe"),
  city("europe", "パリ", [48.86, 2.35]),
  point("europe", "gourmet", "paris-galette", "パリ ガレット", "ガレット", [48.85, 2.34]),
  point("europe", "ancient", "stonehenge", "ツールズベリー ストーンヘンジ", "ストーンヘンジ", [51.18, -1.83]),
  airport("europe", "ロンドン", [51.51, -0.13]),

  city("africa", "カイロ", [30.04, 31.24]),
  point("africa", "ancient", "giza", "ギザ ピラミッド", "ピラミッド", [29.98, 31.13]),
  again("africa"),
  point("africa", "show", "marrakech", "マラケシュ ベリーダンス", "ベリーダンス", [31.63, -7.99]),
  hotel("africa"),
  souvenir("africa", "mug", "マグカップ"),
  point("africa", "nature", "kilimanjaro", "キリマンジャロ", "キリマンジャロ", [-3.07, 37.35]),
  point("africa", "adventure", "victoria-falls", "ビクトリアの滝", "ビクトリア", [-17.92, 25.86]),
  point("africa", "gourmet", "cape-town-game-meat", "ケープタウン ゲームミート", "ゲームミート", [-33.93, 18.42]),
  airport("africa", "ケープタウン", [-33.92, 18.42]),

  city("south-america", "リオデジャネイロ", [-22.91, -43.17]),
  point("south-america", "gourmet", "rio-churrasco", "リオデジャネイロ シュラスコ", "シュラスコ", [-22.9, -43.18]),
  point("south-america", "adventure", "iguazu", "イグアスの滝", "イグアス", [-25.69, -54.44]),
  souvenir("south-america", "cookie", "クッキー"),
  point("south-america", "adventure", "amazon", "アマゾン川", "アマゾン", [-3.12, -60.02]),
  point("south-america", "nature", "guiana", "ギアナ高地", "ギアナ高地", [5.14, -60.76]),
  meetup("south-america"),
  city("south-america", "リマ", [-12.05, -77.04]),
  point("south-america", "ancient", "nazca", "ナスカ ナスカの地上絵", "地上絵", [-14.74, -75.13]),
  airport("south-america", "ボゴタ", [4.71, -74.07]),

  city("north-america", "メキシコシティ", [19.43, -99.13]),
  point("north-america", "ancient", "chichen-itza", "メリダ チチェン・イッツァ", "チチェン・イッツァ", [20.68, -88.57]),
  point("north-america", "show", "las-vegas", "ラスベガス マジックショー", "マジック", [36.17, -115.14]),
  hotel("north-america"),
  again("north-america"),
  point("north-america", "nature", "canadian-rockies", "カナディアンロッキー", "ロッキー", [51.43, -116.18]),
  city("north-america", "シカゴ", [41.88, -87.63]),
  point("north-america", "gourmet", "chicago-burger", "シカゴ ハンバーガー", "バーガー", [41.89, -87.62]),
  point("north-america", "adventure", "niagara", "ナイアガラの滝", "ナイアガラ", [43.08, -79.07]),
  point("north-america", "show", "new-york", "ニューヨーク ミュージカル", "ミュージカル", [40.71, -74.01]),
  souvenir("north-america", "tshirt", "Tシャツ"),
  meetup("north-america"),
  airport("north-america", "ロサンゼルス", [34.05, -118.24]),

  city("oceania", "オークランド", [-36.85, 174.76]),
  point("oceania", "nature", "uluru", "ウルル（エアーズロック）", "ウルル", [-25.34, 131.04]),
  souvenir("oceania", "mug", "マグカップ"),
  hotel("oceania"),
  point("oceania", "show", "sydney", "シドニー オペラ", "オペラ", [-33.86, 151.21]),
  strike("oceania"),
  city("oceania", "ケアンズ", [-16.92, 145.77]),
  airport("oceania", "ブリスベン", [-27.47, 153.03]),
];

export const BOARD: readonly Square[] = [...FROM_TOKYO, ...VIA_TAIPEI, ...VIA_HONG_KONG, ...FROM_BANGKOK];

const buildNext = (): number[][] => {
  const taipei = FROM_TOKYO.length;
  const hongKong = taipei + VIA_TAIPEI.length;
  const bangkok = hongKong + VIA_HONG_KONG.length;
  const next = BOARD.map((_, i) => [i + 1]);
  next[taipei - 1] = [taipei, hongKong];
  next[hongKong - 1] = [bangkok];
  next[BOARD.length - 1] = [0];
  return next;
};

export const NEXT: readonly (readonly number[])[] = buildNext();

export const PREV: readonly (readonly number[])[] = BOARD.map((_, i) =>
  NEXT.flatMap((targets, from) => (targets.includes(i) ? [from] : [])),
);

export const isPosition = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) < BOARD.length;

export const squareAt = (position: number): Square => {
  const square = BOARD[position];
  if (!square) throw new RangeError(`マスがありません: ${position}`);
  return square;
};

export const nextOf = (position: number): readonly number[] => {
  const targets = NEXT[position];
  if (!targets) throw new RangeError(`マスがありません: ${position}`);
  return targets;
};

export const nearestWithin = (from: number, range: number, matches: (square: Square) => boolean): number | null => {
  const seen = new Set([from]);
  let frontier = [from];
  for (let d = 1; d <= range; d++) {
    frontier = [...new Set(frontier.flatMap((p) => [...nextOf(p), ...(PREV[p] ?? [])]))].filter((p) => !seen.has(p));
    frontier.forEach((p) => seen.add(p));
    const found = frontier.find((p) => matches(squareAt(p)));
    if (found !== undefined) return found;
  }
  return null;
};

export const directionName = (position: number): string => {
  let p = position;
  for (let i = 0; i < BOARD.length; i++) {
    const square = squareAt(p);
    if (square.at) return square.name;
    p = nextOf(p)[0]!;
  }
  throw new Error(`行き先の地名が見つかりません: ${position}`);
};
