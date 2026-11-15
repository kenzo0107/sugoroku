export type Item = { id: string; name: string };

export type Course = {
  id: CourseId;
  name: string;
  emoji: string;
  spots: Item[];
};

export type CourseId = "nature" | "show";

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
      { id: "bali", name: "バリ島 ガムラン" },
      { id: "marrakech", name: "マラケシュ ベリーダンス" },
      { id: "vienna", name: "ウィーン クラシック音楽" },
      { id: "las-vegas", name: "ラスベガス マジックショー" },
      { id: "new-york", name: "ニューヨーク ミュージカル" },
      { id: "sydney", name: "シドニー オペラ" },
    ],
  },
};

export const isCourseId = (value: unknown): value is CourseId =>
  typeof value === "string" && Object.hasOwn(COURSES, value);

export const itemsOf = (courseId: CourseId): Item[] => [
  ...COURSES[courseId].spots,
  ...SOUVENIRS,
];
