import type { LatLon, Square } from "./board";

export const MAP = {
  centerLon: 150,
  north: 72,
  south: -48,
  width: 360,
  height: 72 - -48,
} as const;

export type Point = { x: number; y: number };

const wrap = (value: number, size: number): number => ((value % size) + size) % size;

export const project = ([lat, lon]: LatLon): Point => ({
  x: wrap(lon - MAP.centerLon + 180, MAP.width),
  y: MAP.north - lat,
});

export const crossesEdge = (a: Point, b: Point): boolean => Math.abs(b.x - a.x) > MAP.width / 2;

const shortestDx = (from: Point, to: Point): number => {
  const dx = to.x - from.x;
  return crossesEdge(from, to) ? dx - Math.sign(dx) * MAP.width : dx;
};

export type Graph = readonly (readonly number[])[];

export const anchorPoints = (board: readonly Square[], next: Graph): Point[] => {
  const walk = (from: number, step: (p: number) => number | undefined) => {
    let p = from;
    for (let count = 1; count <= board.length; count++) {
      const to = step(p);
      if (to === undefined || to < 0) break;
      const at = board[to]?.at;
      if (at) return { point: project(at), count };
      p = to;
    }
    throw new Error(`座標を持つマスにたどり着けません: ${from}`);
  };
  return board.map((square, i) => {
    if (square.at) return project(square.at);
    const back = walk(i, (p) => next.findIndex((targets) => targets.includes(p)));
    const ahead = walk(i, (p) => next[p]?.[0]);
    const a = back.point;
    const b = ahead.point;
    const t = back.count / (back.count + ahead.count);
    return { x: wrap(a.x + shortestDx(a, b) * t, MAP.width), y: a.y + (b.y - a.y) * t };
  });
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const spreadOut = (anchors: readonly Point[], sizes: number | readonly number[], iterations = 400): Point[] => {
  const points = anchors.map((p) => ({ ...p }));
  const sizeOf = (i: number): number => (typeof sizes === "number" ? sizes : sizes[i]!);
  for (let it = 0; it < iterations; it++) {
    const settling = it >= iterations * 0.75;
    if (!settling) {
      points.forEach((p, i) => {
        p.x += (anchors[i]!.x - p.x) * 0.02;
        p.y += (anchors[i]!.y - p.y) * 0.02;
      });
    }
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i]!;
        const b = points[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const minDistance = (sizeOf(i) + sizeOf(j)) / 2;
        if (d >= minDistance) continue;
        // 完全に重なった2点は方向が決まらないので、添字から決まる向きに押し出して結果を毎回同じにする
        const [ux, uy] = d === 0 ? [Math.cos(i + j), Math.sin(i + j)] : [dx / d, dy / d];
        const push = (minDistance - d) / 2;
        a.x -= ux * push;
        a.y -= uy * push;
        b.x += ux * push;
        b.y += uy * push;
      }
    }
    points.forEach((p, i) => {
      const r = sizeOf(i) / 2;
      p.x = clamp(p.x, r, MAP.width - r);
      p.y = clamp(p.y, r, MAP.height - r);
    });
  }
  return points;
};

export const boardLayout = (board: readonly Square[], next: Graph, sizeOf: (square: Square) => number): Point[] =>
  spreadOut(anchorPoints(board, next), board.map(sizeOf));

const fmt = (n: number): string => n.toFixed(2);

const segment = (a: Point, b: Point): string => {
  if (!crossesEdge(a, b)) return `M${fmt(a.x)} ${fmt(a.y)}L${fmt(b.x)} ${fmt(b.y)}`;
  const dx = shortestDx(a, b);
  const edge = dx > 0 ? MAP.width : 0;
  const y = a.y + ((b.y - a.y) * (edge - a.x)) / dx;
  return `M${fmt(a.x)} ${fmt(a.y)}L${edge} ${fmt(y)}M${MAP.width - edge} ${fmt(y)}L${fmt(b.x)} ${fmt(b.y)}`;
};

export const routePath = (points: readonly Point[], next: Graph): string =>
  points.flatMap((a, i) => (next[i] ?? []).map((j) => segment(a, points[j]!))).join("");

const ARC_BEND = 0.2;

const towards = (from: Point, to: Point, distance: number): Point => {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  return d === 0 ? to : { x: to.x + ((from.x - to.x) * distance) / d, y: to.y + ((from.y - to.y) * distance) / d };
};

export const flightPath = (a: Point, b: Point, inset: number): string => {
  if (crossesEdge(a, b)) {
    const dx = shortestDx(a, b);
    const edge = dx > 0 ? MAP.width : 0;
    const y = a.y + ((b.y - a.y) * (edge - a.x)) / dx;
    const entry = { x: MAP.width - edge, y };
    const end = towards(entry, b, inset);
    return `M${fmt(a.x)} ${fmt(a.y)}L${edge} ${fmt(y)}M${fmt(entry.x)} ${fmt(entry.y)}L${fmt(end.x)} ${fmt(end.y)}`;
  }
  const control = {
    x: (a.x + b.x) / 2 - (b.y - a.y) * ARC_BEND,
    y: (a.y + b.y) / 2 + (b.x - a.x) * ARC_BEND,
  };
  const end = towards(control, b, inset);
  return `M${fmt(a.x)} ${fmt(a.y)}Q${fmt(control.x)} ${fmt(control.y)} ${fmt(end.x)} ${fmt(end.y)}`;
};

export const flightPaths = (points: readonly Point[], flights: Graph, inset: number): string[] =>
  points.flatMap((a, i) => (flights[i] ?? []).map((j) => flightPath(a, points[j]!, inset)));
