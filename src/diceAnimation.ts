import { landingRotationOf, pipsOf } from "./dice";

const FACE_TRANSFORMS: Record<number, string> = {
  1: "rotateY(0deg)",
  2: "rotateX(90deg)",
  3: "rotateY(90deg)",
  4: "rotateY(-90deg)",
  5: "rotateX(-90deg)",
  6: "rotateY(180deg)",
};

const DURATION_MS = 1800;

export const createDie = (): HTMLElement => {
  const die = document.createElement("div");
  die.className = "die";
  for (let value = 1; value <= 6; value++) {
    const face = document.createElement("div");
    face.className = `die-face die-face-${value}`;
    face.style.transform = `${FACE_TRANSFORMS[value]} translateZ(var(--half))`;
    const pips = new Set(pipsOf(value));
    for (let cell = 0; cell < 9; cell++) {
      const slot = document.createElement("span");
      if (pips.has(cell)) slot.className = "pip";
      face.append(slot);
    }
    die.append(face);
  }
  return die;
};

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const bounce = (x: number, y: number, offset: number, easing: string): Keyframe => ({
  transform: `translate(${x}vw, ${y}vh)`,
  offset,
  easing,
});

export const playRoll = async (mover: HTMLElement, die: HTMLElement, value: number): Promise<void> => {
  const { x, y, z } = landingRotationOf(value);
  const landing = `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;
  // jsdom には Web Animations API がなく、動きを減らす設定の人には転がす演出が負担になるため、結果だけを即座に見せる
  if (typeof die.animate !== "function" || prefersReducedMotion()) {
    die.style.transform = landing;
    return;
  }
  const up = "ease-out";
  const down = "ease-in";
  const moving = mover.animate(
    [
      bounce(40, 30, 0, up),
      bounce(30, -18, 0.18, down),
      bounce(20, 0, 0.36, up),
      bounce(12, -10, 0.5, down),
      bounce(6, 0, 0.63, up),
      bounce(3, -4, 0.73, down),
      bounce(1, 0, 0.83, "ease-out"),
      bounce(0, 0, 1, "linear"),
    ],
    { duration: DURATION_MS, fill: "forwards" },
  );
  const tumbling = die.animate(
    [{ transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg)" }, { transform: landing }],
    { duration: DURATION_MS, easing: "cubic-bezier(0.15, 0.6, 0.3, 1)", fill: "forwards" },
  );
  await Promise.all([moving.finished, tumbling.finished]);
};
