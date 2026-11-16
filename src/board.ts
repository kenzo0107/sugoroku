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

type Base = { id: string; name: string; region: Region; at?: LatLon; label?: string };
type Located = Base & { at: LatLon };

export type Square =
  | (Located & { kind: "start" | "city" | "airport" | "honolulu" })
  | (Base & { kind: "blank" | "again" | "hotel" | "meetup" | "strike" })
  | (Located & { kind: "point"; label: string; courseId: CourseId; itemId: string })
  | (Base & { kind: "souvenir"; itemId: string });

type Node = { square: Square; next: readonly string[]; flightTo?: readonly string[] };

const node = (square: Square, next: string[], flightTo?: string[]): Node => ({ square, next, ...(flightTo && { flightTo }) });

const ASIA_OCEANIA: Node[] = [
  node({ id: "tokyo", kind: "start", region: "asia", name: "東京", at: [35.68, 139.69] }, ["seoul"]),
  node({ id: "honolulu", kind: "honolulu", region: "oceania", name: "ホノルル", at: [21.31, -157.86] }, ["tokyo"]),

  node({ id: "seoul", kind: "city", region: "asia", name: "ソウル", at: [37.57, 126.98] }, ["qingdao"]),
  node({ id: "qingdao", kind: "city", region: "asia", name: "青島", at: [36.07, 120.38] }, ["shanghai", "nanjing", "airport_asia_east"]),
  node(
    { id: "airport_asia_east", kind: "airport", region: "asia", name: "エアポート（中国東部）", label: "中国東部", at: [36.65, 117.12] },
    ["qingdao"],
    ["honolulu", "airport_na_west"],
  ),
  node({ id: "shanghai", kind: "city", region: "asia", name: "上海", at: [31.23, 121.47] }, ["again_asia_1"]),
  node({ id: "again_asia_1", kind: "again", region: "asia", name: "もう1回進む（東シナ海）" }, ["taipei"]),
  node({ id: "taipei", kind: "city", region: "asia", name: "台北", at: [25.03, 121.57] }, ["manila"]),
  node({ id: "manila", kind: "city", region: "asia", name: "マニラ", at: [14.6, 120.98] }, ["hanoi"]),
  node({ id: "hanoi", kind: "city", region: "asia", name: "ハノイ", at: [21.03, 105.85] }, ["bangkok"]),
  node({ id: "hotel_asia_1", kind: "hotel", region: "asia", name: "ホテル（華南）" }, ["hanoi"]),
  node({ id: "nanjing", kind: "city", region: "asia", name: "南京", at: [32.06, 118.8] }, ["great_wall", "hotel_asia_1"]),

  node(
    { id: "great_wall", kind: "point", region: "asia", courseId: "ancient", itemId: "beijing", name: "北京 万里の長城", label: "万里の長城", at: [40.43, 116.57] },
    ["airport_asia_north", "everest"],
  ),
  node(
    { id: "airport_asia_north", kind: "airport", region: "asia", name: "エアポート（中国北部）", label: "中国北部", at: [40.84, 111.75] },
    ["again_asia_2"],
  ),
  node({ id: "again_asia_2", kind: "again", region: "asia", name: "もう1回進む（モンゴル東）" }, ["ulaanbaatar"]),
  node({ id: "ulaanbaatar", kind: "city", region: "asia", name: "ウランバートル", at: [47.89, 106.91] }, ["silk_road", "hotel_asia_2"]),
  node({ id: "hotel_asia_2", kind: "hotel", region: "asia", name: "ホテル（シベリア南）" }, ["airport_asia_nw"]),
  node(
    { id: "airport_asia_nw", kind: "airport", region: "asia", name: "エアポート（中央アジア北）", label: "中央アジア北", at: [51.17, 71.45] },
    ["almaty"],
  ),
  node({ id: "almaty", kind: "city", region: "asia", name: "アルマトイ", at: [43.24, 76.95] }, ["bishkek"]),
  node({ id: "bishkek", kind: "city", region: "asia", name: "ビシュケク", at: [42.87, 74.59] }, ["tashkent"]),
  node({ id: "tashkent", kind: "city", region: "asia", name: "タシケント", at: [41.31, 69.24] }, ["airport_eu_east"]),
  node({ id: "samarkand", kind: "city", region: "asia", name: "サマルカンド", at: [39.65, 66.96] }, ["bishkek"]),
  node(
    { id: "silk_road", kind: "point", region: "asia", courseId: "adventure", itemId: "silk-road", name: "シルクロードドライブ", label: "シルクロード", at: [41.0, 85.0] },
    ["samarkand"],
  ),

  node(
    { id: "everest", kind: "point", region: "asia", courseId: "nature", itemId: "everest", name: "エベレスト", label: "エベレスト", at: [27.99, 86.93] },
    ["again_asia_3", "ganges"],
  ),
  node({ id: "again_asia_3", kind: "again", region: "asia", name: "もう1回進む（パキスタン北）" }, ["lahore"]),
  node({ id: "lahore", kind: "city", region: "asia", name: "ラホール", at: [31.55, 74.34] }, ["karachi", "hotel_asia_3"]),
  node({ id: "hotel_asia_3", kind: "hotel", region: "asia", name: "ホテル（北インド）" }, ["indian_curry"]),
  node({ id: "karachi", kind: "city", region: "asia", name: "カラチ", at: [24.86, 67.0] }, ["ahmedabad", "airport_me"]),
  node({ id: "ahmedabad", kind: "city", region: "asia", name: "アフマダーバード", at: [23.02, 72.57] }, ["mumbai"]),
  node({ id: "mumbai", kind: "souvenir", region: "asia", itemId: "cookie", name: "ムンバイ", at: [19.08, 72.88] }, ["again_asia_4"]),
  node({ id: "again_asia_4", kind: "again", region: "asia", name: "もう1回進む（デカン高原）" }, ["hotel_asia_4"]),
  node({ id: "hotel_asia_4", kind: "hotel", region: "asia", name: "ホテル（南インド）" }, ["chennai"]),
  node({ id: "chennai", kind: "city", region: "asia", name: "チェンナイ", at: [13.08, 80.27] }, ["kolkata"]),
  node({ id: "kolkata", kind: "city", region: "asia", name: "コルカタ", at: [22.57, 88.36] }, ["dhaka", "indian_curry"]),
  node(
    { id: "indian_curry", kind: "point", region: "asia", courseId: "gourmet", itemId: "delhi-curry", name: "インドカレー", label: "カレー", at: [28.61, 77.21] },
    ["ganges"],
  ),
  node(
    { id: "ganges", kind: "point", region: "asia", courseId: "adventure", itemId: "ganges", name: "ガンジス川", label: "ガンジス川", at: [25.32, 83.01] },
    ["dhaka"],
  ),
  node({ id: "dhaka", kind: "city", region: "asia", name: "ダッカ", at: [23.81, 90.41] }, ["bangkok"]),

  node({ id: "bangkok", kind: "city", region: "asia", name: "バンコク", at: [13.76, 100.5] }, ["meetup_asia_1"]),
  node({ id: "meetup_asia_1", kind: "meetup", region: "asia", name: "まちあわせ（マレー半島）" }, ["kuala_lumpur"]),
  node({ id: "kuala_lumpur", kind: "city", region: "asia", name: "クアラルンプール", at: [3.14, 101.69] }, ["singapore"]),
  node({ id: "singapore", kind: "city", region: "asia", name: "シンガポール", at: [1.35, 103.82] }, ["gamelan"]),
  node(
    { id: "gamelan", kind: "point", region: "asia", courseId: "show", itemId: "bali", name: "ジャカルタ ガムラン", label: "ガムラン", at: [-6.21, 106.85] },
    ["darwin"],
  ),

  node({ id: "darwin", kind: "city", region: "oceania", name: "ダーウィン", at: [-12.46, 130.84] }, ["again_oceania_1", "uluru"]),
  node({ id: "again_oceania_1", kind: "again", region: "oceania", name: "もう1回進む（豪州北西）" }, ["perth"]),
  node({ id: "perth", kind: "souvenir", region: "oceania", itemId: "tshirt", name: "パース", at: [-31.95, 115.86] }, ["adelaide"]),
  node({ id: "adelaide", kind: "city", region: "oceania", name: "アデレード", at: [-34.93, 138.6] }, ["melbourne", "hotel_oceania_1"]),
  node({ id: "hotel_oceania_1", kind: "hotel", region: "oceania", name: "ホテル（豪州中央）" }, ["uluru"]),
  node(
    { id: "uluru", kind: "point", region: "oceania", courseId: "nature", itemId: "uluru", name: "ウルル（エアーズロック）", label: "ウルル", at: [-25.34, 131.04] },
    ["hotel_oceania_2"],
  ),
  node({ id: "hotel_oceania_2", kind: "hotel", region: "oceania", name: "ホテル（クイーンズランド）" }, ["townsville", "opera"]),
  node({ id: "townsville", kind: "city", region: "oceania", name: "タウンズビル", at: [-19.26, 146.82] }, ["opera"]),
  node({ id: "melbourne", kind: "city", region: "oceania", name: "メルボルン", at: [-37.81, 144.96] }, ["opera"]),
  node(
    { id: "opera", kind: "point", region: "oceania", courseId: "show", itemId: "sydney", name: "シドニー オペラ", label: "オペラ", at: [-33.86, 151.21] },
    ["airport_oceania"],
  ),
  // JSON の行き先サンティアゴではなくボゴタへ飛ぶのは、実物の盤面の矢印がイキトスとパナマの間の空港を指しているため。
  // JSON では行き止まりだが、一方通行の盤面では次のマスが要るので、その空港へ歩いても進めるようにする
  node(
    { id: "airport_oceania", kind: "airport", region: "oceania", name: "エアポート（シドニー）", label: "シドニー", at: [-33.94, 151.18] },
    ["bogota"],
    ["bogota"],
  ),
];

type Draft = Square extends infer S ? (S extends Square ? Omit<S, "id"> & { id?: string } : never) : never;

const WEST_SQUARES: Draft[] = [
  { id: "dubai", kind: "city", region: "asia", name: "ドバイ", at: [25.2, 55.27] },

  { id: "istanbul", kind: "city", region: "europe", name: "イスタンブール", at: [41.01, 28.98] },
  { kind: "point", region: "europe", courseId: "gourmet", itemId: "istanbul-kebab", name: "イスタンブール ケバブサンド", label: "ケバブ", at: [41.02, 28.97] },
  { kind: "point", region: "europe", courseId: "show", itemId: "vienna", name: "ウィーン クラシック音楽", label: "クラシック", at: [48.21, 16.37] },
  { kind: "point", region: "europe", courseId: "ancient", itemId: "rome", name: "ローマ コロッセオ", label: "コロッセオ", at: [41.89, 12.49] },
  { kind: "meetup", region: "europe", name: "まちあわせ" },
  { kind: "souvenir", region: "europe", itemId: "tshirt", name: "Tシャツ" },
  { kind: "point", region: "europe", courseId: "nature", itemId: "matterhorn", name: "マッターホルン", label: "マッターホルン", at: [45.98, 7.66] },
  { kind: "strike", region: "europe", name: "ストライキ" },
  { kind: "city", region: "europe", name: "パリ", at: [48.86, 2.35] },
  { kind: "point", region: "europe", courseId: "gourmet", itemId: "paris-galette", name: "パリ ガレット", label: "ガレット", at: [48.85, 2.34] },
  { kind: "point", region: "europe", courseId: "ancient", itemId: "stonehenge", name: "ツールズベリー ストーンヘンジ", label: "ストーンヘンジ", at: [51.18, -1.83] },
  { id: "london", kind: "airport", region: "europe", name: "ロンドン", at: [51.51, -0.13] },

  { kind: "city", region: "africa", name: "カイロ", at: [30.04, 31.24] },
  { kind: "point", region: "africa", courseId: "ancient", itemId: "giza", name: "ギザ ピラミッド", label: "ピラミッド", at: [29.98, 31.13] },
  { kind: "again", region: "africa", name: "もう1回" },
  { kind: "point", region: "africa", courseId: "show", itemId: "marrakech", name: "マラケシュ ベリーダンス", label: "ベリーダンス", at: [31.63, -7.99] },
  { kind: "hotel", region: "africa", name: "ホテル" },
  { kind: "souvenir", region: "africa", itemId: "mug", name: "マグカップ" },
  { kind: "point", region: "africa", courseId: "nature", itemId: "kilimanjaro", name: "キリマンジャロ", label: "キリマンジャロ", at: [-3.07, 37.35] },
  { kind: "point", region: "africa", courseId: "adventure", itemId: "victoria-falls", name: "ビクトリアの滝", label: "ビクトリア", at: [-17.92, 25.86] },
  { kind: "point", region: "africa", courseId: "gourmet", itemId: "cape-town-game-meat", name: "ケープタウン ゲームミート", label: "ゲームミート", at: [-33.93, 18.42] },
  { id: "cape_town", kind: "airport", region: "africa", name: "ケープタウン", at: [-33.92, 18.42] },

  { kind: "city", region: "south-america", name: "リオデジャネイロ", at: [-22.91, -43.17] },
  { kind: "point", region: "south-america", courseId: "gourmet", itemId: "rio-churrasco", name: "リオデジャネイロ シュラスコ", label: "シュラスコ", at: [-22.9, -43.18] },
  { kind: "point", region: "south-america", courseId: "adventure", itemId: "iguazu", name: "イグアスの滝", label: "イグアス", at: [-25.69, -54.44] },
  { kind: "souvenir", region: "south-america", itemId: "cookie", name: "クッキー" },
  { kind: "point", region: "south-america", courseId: "adventure", itemId: "amazon", name: "アマゾン川", label: "アマゾン", at: [-3.12, -60.02] },
  { kind: "point", region: "south-america", courseId: "nature", itemId: "guiana", name: "ギアナ高地", label: "ギアナ高地", at: [5.14, -60.76] },
  { kind: "meetup", region: "south-america", name: "まちあわせ" },
  { kind: "city", region: "south-america", name: "リマ", at: [-12.05, -77.04] },
  { kind: "point", region: "south-america", courseId: "ancient", itemId: "nazca", name: "ナスカ ナスカの地上絵", label: "地上絵", at: [-14.74, -75.13] },
  { id: "bogota", kind: "airport", region: "south-america", name: "ボゴタ", at: [4.71, -74.07] },

  { kind: "city", region: "north-america", name: "メキシコシティ", at: [19.43, -99.13] },
  { kind: "point", region: "north-america", courseId: "ancient", itemId: "chichen-itza", name: "メリダ チチェン・イッツァ", label: "チチェン・イッツァ", at: [20.68, -88.57] },
  { kind: "point", region: "north-america", courseId: "show", itemId: "las-vegas", name: "ラスベガス マジックショー", label: "マジック", at: [36.17, -115.14] },
  { kind: "hotel", region: "north-america", name: "ホテル" },
  { kind: "again", region: "north-america", name: "もう1回" },
  { kind: "point", region: "north-america", courseId: "nature", itemId: "canadian-rockies", name: "カナディアンロッキー", label: "ロッキー", at: [51.43, -116.18] },
  { kind: "city", region: "north-america", name: "シカゴ", at: [41.88, -87.63] },
  { kind: "point", region: "north-america", courseId: "gourmet", itemId: "chicago-burger", name: "シカゴ ハンバーガー", label: "バーガー", at: [41.89, -87.62] },
  { kind: "point", region: "north-america", courseId: "adventure", itemId: "niagara", name: "ナイアガラの滝", label: "ナイアガラ", at: [43.08, -79.07] },
  { kind: "point", region: "north-america", courseId: "show", itemId: "new-york", name: "ニューヨーク ミュージカル", label: "ミュージカル", at: [40.71, -74.01] },
  { kind: "souvenir", region: "north-america", itemId: "tshirt", name: "Tシャツ" },
  { kind: "meetup", region: "north-america", name: "まちあわせ" },
  { id: "los_angeles", kind: "airport", region: "north-america", name: "ロサンゼルス", at: [34.05, -118.24] },
];

const WEST_FLIGHTS: Record<string, string[]> = {
  london: ["cape_town"],
  cape_town: ["bogota"],
  bogota: ["los_angeles"],
};

const westNodes = (): Node[] => {
  const ids = WEST_SQUARES.map((s, i) => s.id ?? `west_${i}`);
  return WEST_SQUARES.map((s, i) => {
    const flightTo = WEST_FLIGHTS[ids[i]!];
    return node({ ...s, id: ids[i]! } as Square, [ids[i + 1] ?? "honolulu"], flightTo);
  });
};

// JSON で未定義の行き先に仮のマスを新しく置かないのは、残したヨーロッパ〜北米の同じ場所のマスと二重になるため
const ALIASES: Record<string, string> = {
  airport_eu_east: "istanbul",
  airport_me: "dubai",
  airport_na_west: "los_angeles",
};

const NODES: readonly Node[] = [...ASIA_OCEANIA, ...westNodes()];

export const BOARD: readonly Square[] = NODES.map((n) => n.square);

const INDEX = new Map(BOARD.map((s, i) => [s.id, i]));

const resolve = (id: string): number | undefined => INDEX.get(ALIASES[id] ?? id);

const indexOf = (id: string): number => {
  const i = resolve(id);
  if (i === undefined) throw new Error(`マスがありません: ${id}`);
  return i;
};

export const NEXT: readonly (readonly number[])[] = NODES.map((n) => n.next.map(indexOf));

export const FLIGHTS: readonly (readonly number[])[] = NODES.map((n) =>
  (n.flightTo ?? []).flatMap((id) => resolve(id) ?? []),
);

export const PREV: readonly (readonly number[])[] = BOARD.map((_, i) =>
  NEXT.flatMap((targets, from) => (targets.includes(i) ? [from] : [])),
);

export const isChecklistSquare = (square: Square): boolean => square.kind === "point" || square.kind === "souvenir";

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

export const flightsOf = (position: number): readonly number[] => {
  const targets = FLIGHTS[position];
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
