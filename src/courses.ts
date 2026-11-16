export type Item = { id: string; name: string };

export type Course = {
  id: CourseId;
  name: string;
  emoji: string;
  spots: Item[];
};

export type CourseId = "nature" | "show" | "adventure" | "gourmet" | "ancient";

export const SOUVENIRS: Item[] = [
  { id: "cookie", name: "クッキー" },
  { id: "tshirt", name: "Tシャツ" },
  { id: "mug", name: "マグカップ" },
];

export const COURSES: Record<CourseId, Course> = {
  nature: {
    id: "nature",
    name: "大自然満喫コース",
    emoji: "🏔️",
    spots: [
      { id: "everest", name: "エベレスト" },
      { id: "kilimanjaro", name: "キリマンジャロ" },
      { id: "matterhorn", name: "マッターホルン" },
      { id: "canadian-rockies", name: "カナディアンロッキー" },
      { id: "guiana", name: "ギアナ高地" },
      { id: "uluru", name: "ウルル（エアーズロック）" },
    ],
  },
  show: {
    id: "show",
    name: "世界のショーとダンスコース",
    emoji: "💃",
    spots: [
      { id: "bali", name: "ジャカルタ ガムラン" },
      { id: "marrakech", name: "マラケシュ ベリーダンス" },
      { id: "vienna", name: "ウィーン クラシック音楽" },
      { id: "las-vegas", name: "ラスベガス マジックショー" },
      { id: "new-york", name: "ニューヨーク ミュージカル" },
      { id: "sydney", name: "シドニー オペラ" },
    ],
  },
  adventure: {
    id: "adventure",
    name: "冒険アクティビティコース",
    emoji: "🧭",
    spots: [
      { id: "ganges", name: "ガンジス川" },
      { id: "victoria-falls", name: "ビクトリアの滝" },
      { id: "silk-road", name: "シルクロードドライブ" },
      { id: "niagara", name: "ナイアガラの滝" },
      { id: "amazon", name: "アマゾン川" },
      { id: "iguazu", name: "イグアスの滝" },
    ],
  },
  gourmet: {
    id: "gourmet",
    name: "世界のグルメコース",
    emoji: "🍽️",
    spots: [
      { id: "delhi-curry", name: "インドカレー" },
      { id: "cape-town-game-meat", name: "ケープタウン ゲームミート" },
      { id: "paris-galette", name: "パリ ガレット" },
      { id: "istanbul-kebab", name: "イスタンブール ケバブサンド" },
      { id: "chicago-burger", name: "シカゴ ハンバーガー" },
      { id: "rio-churrasco", name: "リオデジャネイロ シュラスコ" },
    ],
  },
  ancient: {
    id: "ancient",
    name: "古代文明ツアーコース",
    emoji: "🏛️",
    spots: [
      { id: "giza", name: "ギザ ピラミッド" },
      { id: "rome", name: "ローマ コロッセオ" },
      { id: "stonehenge", name: "ツールズベリー ストーンヘンジ" },
      { id: "beijing", name: "北京 万里の長城" },
      { id: "chichen-itza", name: "メリダ チチェン・イッツァ" },
      { id: "nazca", name: "ナスカ ナスカの地上絵" },
    ],
  },
};

export const isCourseId = (value: unknown): value is CourseId =>
  typeof value === "string" && Object.hasOwn(COURSES, value);

export const itemsOf = (courseId: CourseId): Item[] => [
  ...COURSES[courseId].spots,
  ...SOUVENIRS,
];
