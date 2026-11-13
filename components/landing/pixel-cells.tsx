import { memo } from "react";

/*
 * The site's illustration grid, shared by every drawing made in code: shapes
 * resolve to whole cells, outlines are solid cells in the drawing's ink, and
 * faces are filled with one of a few dot-screen materials. A drawing sets
 * --hf-ink on an ancestor; paper is the page's canvas and amber is the one
 * accent fill.
 */

export type Point = readonly [number, number];
export type Tone = "dots" | "cross" | "check" | "deep" | "amber" | "solid" | null;
export const INK = "var(--hf-ink)";
export const PAPER = "var(--canvas)";
export const AMBER = "var(--amber-fill)";

// Resolve silhouettes and outlines to whole cells, so the dither and stepped
// edges belong to the same drawing grid as the site's other illustrations.
export function run([x0, y0]: Point, [tx, ty]: Point, cells = new Set<string>()) {
  let x = x0, y = y0;
  const dx = Math.abs(tx - x), dy = -Math.abs(ty - y), sx = x < tx ? 1 : -1, sy = y < ty ? 1 : -1;
  let error = dx + dy;
  for (;;) {
    cells.add(`${x},${y}`);
    if (x === tx && y === ty) return cells;
    const next = error * 2;
    if (next >= dy) { error += dy; x += sx; }
    if (next <= dx) { error += dx; y += sy; }
  }
}
export function cellPath(cells: Set<string>) {
  const rows = new Map<number, number[]>();
  for (const cell of cells) {
    const [x, y] = cell.split(",").map(Number);
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y)!.push(x);
  }
  let d = "";
  for (const [y, xs] of [...rows].sort((a, b) => a[0] - b[0])) {
    xs.sort((a, b) => a - b);
    let a = xs[0], b = a;
    for (const x of [...xs.slice(1), Infinity]) {
      if (x === b + 1) b = x;
      else { d += `M${a} ${y}h${b - a + 1}v1h${a - b - 1}z`; a = b = x; }
    }
  }
  return d;
}
export function shape(points: readonly Point[]) {
  const edge = new Set<string>();
  points.forEach((p, i) => run(p, points[(i + 1) % points.length], edge));
  const fill = new Set(edge), ys = points.map((p) => p[1]);
  for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
    const xs: number[] = [];
    points.forEach(([x0, y0], i) => {
      const [x1, y1] = points[(i + 1) % points.length];
      if ((y0 <= y && y < y1) || (y1 <= y && y < y0)) xs.push(x0 + (y - y0) * (x1 - x0) / (y1 - y0));
    });
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i]); x <= Math.floor(xs[i + 1]); x++) fill.add(`${x},${y}`);
  }
  return { edge: cellPath(edge), fill: cellPath(fill) };
}
export function drawing(prefix: string) {
  const face = (points: readonly Point[], tone: Tone = "dots", outline = true) => {
    const s = shape(points);
    return <><path d={s.fill} fill={PAPER} />{tone && <path d={s.fill} fill={tone === "solid" ? INK : `url(#${prefix}-${tone})`} />}{outline && <path d={s.edge} fill={INK} />}</>;
  };
  const line = (points: readonly Point[], color = INK) => {
    const cells = new Set<string>();
    points.slice(1).forEach((p, i) => run(points[i], p, cells));
    return <path d={cellPath(cells)} fill={color} />;
  };
  const box = (x: number, y: number, w: number, h: number, depth = 3, tone: Tone = "cross") => <>
    {face([[x, y], [x + w, y], [x + w + depth * 2, y - depth], [x + depth * 2, y - depth]], "dots")}
    {face([[x + w, y], [x + w + depth * 2, y - depth], [x + w + depth * 2, y + h - depth], [x + w, y + h]], "deep")}
    {face([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], tone)}
  </>;
  const shadow = (x: number, y: number, w: number) => face([[x, y], [x + w, y], [x + w + 5, y + 3], [x + 4, y + 3]], "cross", false);
  return { face, line, box, shadow };
}
export type Drawing = ReturnType<typeof drawing>;

export const Materials = memo(function Materials({ prefix }: { prefix: string }) {
  return <defs>
    <pattern id={`${prefix}-dots`} width="2" height="2" patternUnits="userSpaceOnUse"><path d="M.25 .25h.3v.3h-.3zM1.25 1.25h.3v.3h-.3z" fill={INK} /></pattern>
    <pattern id={`${prefix}-cross`} width="2" height="2" patternUnits="userSpaceOnUse"><path d="M.1 .35h.8v.2h-.8zM.4 .05h.2v.8h-.2zM1.1 1.35h.8v.2h-.8zM1.4 1.05h.2v.8h-.2zM1.3 .3h.25v.25H1.3zM.3 1.3h.25v.25H.3z" fill={INK} /></pattern>
    <pattern id={`${prefix}-check`} width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 0h.5v.5H0zM.5 .5h.5v.5H.5z" fill={INK} /></pattern>
    <pattern id={`${prefix}-deep`} width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 0h.65v1H0zM.65 .4H1v.6H.65z" fill={INK} /></pattern>
    <pattern id={`${prefix}-amber`} width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 0h.5v.5H0zM.5 .5h.5v.5H.5z" fill={AMBER} /></pattern>
  </defs>;
});
