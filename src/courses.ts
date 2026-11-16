export type Item = { id: string; name: string };

export type Course = {
  id: CourseId;
  name: string;
  emoji: string;
  spots: Item[];
  souvenirs: Item[];
};

type WorldCourseId = "nature" | "show" | "adventure" | "gourmet" | "ancient";
type JapanCourseId = "festival" | "castle" | "food" | "onsen" | "scenic";
export type CourseId = WorldCourseId | JapanCourseId;

export type BoardId = "world" | "japan";

export type Board = {
  id: BoardId;
  storageKey: string;
  courseIds: CourseId[];
};

export const BOARDS: Record<BoardId, Board> = {
  world: {
    id: "world",
    storageKey: "sugoroku:players",
    courseIds: ["nature", "show", "adventure", "gourmet", "ancient"],
  },
  japan: {
    id: "japan",
    storageKey: "sugoroku:japan:players",
    courseIds: ["festival", "castle", "food", "onsen", "scenic"],
  },
};

export const isBoardId = (value: unknown): value is BoardId =>
  typeof value === "string" && Object.hasOwn(BOARDS, value);

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
    souvenirs: SOUVENIRS,
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
    souvenirs: SOUVENIRS,
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
    souvenirs: SOUVENIRS,
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
    souvenirs: SOUVENIRS,
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
    souvenirs: SOUVENIRS,
  },
  festival: {
    id: "festival",
    name: "お祭{まつ}りめぐりコース",
    emoji: "🏮",
    spots: [
      { id: "nagasaki-kunchi", name: "長崎{ながさき} 長崎{ながさき}くんち" },
      { id: "awa-odori", name: "徳島{とくしま} 阿波{あわ}踊{おど}り" },
      { id: "takayama-matsuri", name: "高山{たかやま} 高山祭{たかやままつり}" },
      { id: "sendai-tanabata", name: "仙台{せんだい} 仙台{せんだい}七夕{たなばた}まつり" },
      { id: "aomori-nebuta", name: "青森{あおもり} 青森{あおもり}ねぶた祭{まつり}" },
      { id: "sapporo-snow", name: "札幌{さっぽろ} さっぽろ雪{ゆき}まつり" },
    ],
    souvenirs: [],
  },
  castle: {
    id: "castle",
    name: "お城{しろ}めぐりコース",
    emoji: "🏯",
    spots: [
      { id: "kumamoto-castle", name: "熊本{くまもと} 熊本城{くまもとじょう}" },
      { id: "kochi-castle", name: "高知{こうち} 高知城{こうちじょう}" },
      { id: "himeji-castle", name: "姫路{ひめじ} 姫路城{ひめじじょう}" },
      { id: "inuyama-castle", name: "犬山{いぬやま} 犬山城{いぬやまじょう}" },
      { id: "wakamatsu-castle", name: "会津若松{あいづわかまつ} 若松城{わかまつじょう}" },
      { id: "matsumae-castle", name: "松前{まつまえ} 松前城{まつまえじょう}" },
    ],
    souvenirs: [],
  },
  food: {
    id: "food",
    name: "おいしいものコース",
    emoji: "🍜",
    spots: [
      { id: "naha-champuru", name: "那覇{なは} チャンプルー" },
      { id: "sanuki-udon", name: "高松{たかまつ} 讃岐{さぬき}うどん" },
      { id: "azumino-oyaki", name: "安曇野{あづみの} おやき" },
      { id: "niigata-hegisoba", name: "新潟{にいがた} へぎそば" },
      { id: "hanamaki-wankosoba", name: "花巻{はなまき} わんこそば" },
      { id: "obihiro-butadon", name: "帯広{おびひろ} 豚丼{ぶたどん}" },
    ],
    souvenirs: [],
  },
  onsen: {
    id: "onsen",
    name: "温泉{おんせん}めぐりコース",
    emoji: "♨️",
    spots: [
      { id: "beppu-onsen", name: "別府{べっぷ} 別府{べっぷ}温泉{おんせん}" },
      { id: "dogo-onsen", name: "松山{まつやま} 道後{どうご}温泉{おんせん}" },
      { id: "tamatsukuri-onsen", name: "松江{まつえ} 玉造{たまつくり}温泉{おんせん}" },
      { id: "arima-onsen", name: "神戸{こうべ} 有馬{ありま}温泉{おんせん}" },
      { id: "kusatsu-onsen", name: "草津{くさつ} 草津{くさつ}温泉{おんせん}" },
      { id: "zao-onsen", name: "山形{やまがた} 蔵王{ざおう}温泉{おんせん}" },
    ],
    souvenirs: [],
  },
  scenic: {
    id: "scenic",
    name: "映{ば}えスポットコース",
    emoji: "📸",
    spots: [
      { id: "sakurajima", name: "鹿児島{かごしま} 桜島{さくらじま}" },
      { id: "tottori-dunes", name: "鳥取{とっとり} 鳥取砂丘{とっとりさきゅう}" },
      { id: "nachi-falls", name: "那智勝浦{なちかつうら} 那智{なち}の滝{たき}" },
      { id: "lake-yamanaka", name: "山中湖村{やまなかこむら} 山中湖{やまなかこ}" },
      { id: "omagari-fireworks", name: "大仙{だいせん} 大曲{おおまがり}の花火{はなび}" },
      { id: "lake-mashu", name: "弟子屈{てしかが} 摩周湖{ましゅうこ}" },
    ],
    souvenirs: [],
  },
};

export const isCourseId = (value: unknown): value is CourseId =>
  typeof value === "string" && Object.hasOwn(COURSES, value);

export const itemsOf = (courseId: CourseId): Item[] => [
  ...COURSES[courseId].spots,
  ...COURSES[courseId].souvenirs,
];
