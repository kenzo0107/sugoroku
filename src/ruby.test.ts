import { describe, expect, it } from "vitest";
import { toBase, toKana, toRubyNodes } from "./ruby";

describe("ふりがな", () => {
  it("漢字のまとまりごとに読みが付き、送り仮名はそのまま残る", () => {
    const span = document.createElement("span");
    span.append(...toRubyNodes("徳島{とくしま} 阿波{あわ}踊{おど}り"));
    expect(span.innerHTML).toBe(
      "<ruby>徳島<rt>とくしま</rt></ruby> <ruby>阿波<rt>あわ</rt></ruby><ruby>踊<rt>おど</rt></ruby>り",
    );
  });

  it("読みのない文字列はそのまま表示される", () => {
    expect(toRubyNodes("シドニー オペラ")).toEqual(["シドニー オペラ"]);
  });

  it("ひらがなだけの表記と漢字だけの表記に変換できる", () => {
    expect(toKana("お城{しろ}めぐりコース")).toBe("おしろめぐりコース");
    expect(toBase("お城{しろ}めぐりコース")).toBe("お城めぐりコース");
  });
});
