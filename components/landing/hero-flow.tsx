"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { HERO } from "@/lib/landing";
import { memo, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

type Point = readonly [number, number];
type Tone = "dots" | "cross" | "check" | "deep" | "amber" | "solid" | null;
const INK = "var(--hf-ink)";
const PAPER = "var(--canvas)";
const AMBER = "var(--amber-fill)";
const DURATION = 8000;
const REST = 0.9;
const phase = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Resolve silhouettes and outlines to whole cells, so the dither and stepped
// edges belong to the same drawing grid as the site's other illustrations.
function run([x0, y0]: Point, [tx, ty]: Point, cells = new Set<string>()) {
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
function cellPath(cells: Set<string>) {
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
function shape(points: readonly Point[]) {
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
function drawing(prefix: string) {
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
type Drawing = ReturnType<typeof drawing>;

const Materials = memo(function Materials({ prefix }: { prefix: string }) {
  return <defs>
    <pattern id={`${prefix}-dots`} width="2" height="2" patternUnits="userSpaceOnUse"><path d="M.25 .25h.3v.3h-.3zM1.25 1.25h.3v.3h-.3z" fill={INK} /></pattern>
    <pattern id={`${prefix}-cross`} width="2" height="2" patternUnits="userSpaceOnUse"><path d="M.1 .35h.8v.2h-.8zM.4 .05h.2v.8h-.2zM1.1 1.35h.8v.2h-.8zM1.4 1.05h.2v.8h-.2zM1.3 .3h.25v.25H1.3zM.3 1.3h.25v.25H.3z" fill={INK} /></pattern>
    <pattern id={`${prefix}-check`} width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 0h.5v.5H0zM.5 .5h.5v.5H.5z" fill={INK} /></pattern>
    <pattern id={`${prefix}-deep`} width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 0h.65v1H0zM.65 .4H1v.6H.65z" fill={INK} /></pattern>
    <pattern id={`${prefix}-amber`} width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 0h.5v.5H0zM.5 .5h.5v.5H.5z" fill={AMBER} /></pattern>
  </defs>;
});

const Laptop = memo(function Laptop({ compact, draw }: { compact: boolean; draw: Drawing }) {
  const { face, box, shadow } = draw;
  const w = compact ? 47 : 96, h = compact ? 46 : 58, x = compact ? 13 : 30, y = compact ? 43 : 31, d = compact ? 4 : 6;
  const size = compact ? 7 : 10, step = compact ? 13 : 21;
  return <g className="hf-laptop">
    {shadow(x - 6, 105, w + 17)}{box(x, y, w, h, 1, "cross")}
    {face([[x + 4, y + 4], [x + w - 4, y + 4], [x + w - 4, y + h - 4], [x + 4, y + h - 4]], null)}
    <g className="hf-screen-marks">{HERO.flow.agents.map((agent, i) => <g key={agent.mark} transform={`translate(${x + Math.round(w / 2) - step - Math.round(size / 2) + i * step} ${y + Math.round((h - size) / 2)})`}><BrandMark name={agent.mark} size={size} /></g>)}</g>
    {face([[x, y + h + 1], [x + w, y + h + 1], [x + w - 2 * d, y + h + 2 * d + 1], [x - 2 * d, y + h + 2 * d + 1]], "dots")}
    {face([[x - 2 * d, y + h + 2 * d + 1], [x + w - 2 * d, y + h + 2 * d + 1], [x + w - 2 * d, y + h + 2 * d + 4], [x - 2 * d, y + h + 2 * d + 4]], "deep")}
    {face([[x + 9, y + h + 3], [x + w - 9, y + h + 3], [x + w - 15, y + h + 7], [x + 3, y + h + 7]], "check")}
    {face([[x + Math.round(w * .35), y + h + 8], [x + Math.round(w * .6), y + h + 8], [x + Math.round(w * .6) - 3, y + h + 10], [x + Math.round(w * .35) - 3, y + h + 10]], null)}
  </g>;
});

function workshopPlan(compact: boolean) {
  return { x: compact ? 74 : 180, w: compact ? 57 : 66, px: compact ? 9 : 12, pw: compact ? 37 : 43, personX: compact ? 65 : 81 };
}
const Readers = memo(function Readers({ compact, draw }: { compact: boolean; draw: Drawing }) {
  const { face, line } = draw;
  const reader = (rx: number, ground: number, scale: number, hood: boolean, name: string) => <g data-member={name} transform={`translate(${rx} ${ground}) scale(${scale})`}>
    {face([[-5, -25], [-2, -28], [3, -28], [6, -25], [5, -13], [8, -3], [-7, -3], [-5, -13]], "check")}
    {face([[-4, -3], [-1, -3], [-1, 0], [-5, 0]], "deep")}{face([[3, -3], [6, -3], [7, 0], [3, 0]], "deep")}
    {face([[-4, -35], [2, -35], [4, -32], [2, -28], [-3, -28], [-5, -31]], "dots")}
    {face(hood ? [[-6, -32], [-6, -37], [-1, -42], [4, -38], [5, -32], [2, -35], [-3, -35]] : [[-7, -35], [-4, -37], [0, -42], [4, -39], [4, -37], [7, -37], [7, -35]], "cross")}
    <path d="M-3 -32h1v1h-1z" fill={INK} />
    {line([[-5, -13], [5, -13]])}{line([[-5, -24], [-9, -20], [-6, -15]])}{line([[5, -24], [8, -19], [4, -15]])}
    {face([[-6, -20], [4, -20], [5, -14], [-5, -14]], null)}{line([[-3, -18], [2, -18]])}
  </g>;
  return <>{reader(compact ? 52 : 95, compact ? 106 : 105, .69, true, "back-reader")}{reader(compact ? 75 : 111, 115, compact ? .71 : .84, false, "front-reader")}</>;
});
const Printer = memo(function Printer({ x, draw }: { x: number; draw: Drawing }) {
  const { face, line } = draw;
  return <g data-member="printer" transform={`translate(${x} 113)`}>
    {face([[-5, -26], [-2, -29], [3, -29], [6, -26], [5, -13], [9, -3], [-8, -3], [-5, -13]], "check")}
    {face([[-4, -3], [-1, -3], [-1, 0], [-5, 0]], "deep")}{face([[3, -3], [6, -3], [7, 0], [3, 0]], "deep")}
    {face([[-4, -36], [2, -36], [4, -32], [2, -29], [-3, -29], [-5, -32]], "dots")}
    {face([[-7, -36], [-3, -39], [0, -44], [4, -40], [5, -38], [7, -38], [7, -36]], "cross")}
    <path d="M-3 -33h1v1h-1z" fill={INK} />{face([[-4, -30], [2, -30], [1, -27], [-2, -26]], "deep", false)}
    {line([[-5, -14], [5, -14]])}{line([[5, -26], [8, -22], [9, -14]])}
  </g>;
});
const WorkshopTimber = memo(function WorkshopTimber({ compact, draw }: { compact: boolean; draw: Drawing }) {
  const { face, line, box, shadow } = draw;
  const { w, px, pw } = workshopPlan(compact);
  return <>
    {shadow(-2, 111, w + (compact ? 21 : 27))}
    {box(0, 47, 3, 58, 2, "cross")}{box(w - 2, 47, 3, 58, 3, "deep")}
    {face([[-5, 47], [Math.round(w * .5), 17], [w + 4, 47], [w, 50], [Math.round(w * .5), 23], [0, 50]], "cross")}
    {face([[Math.round(w * .5), 17], [Math.round(w * .5) + 11, 11], [w + 15, 40], [w + 4, 47]], "deep")}
    {line([[2, 48], [10, 57], [10, 50]])}{line([[w - 3, 48], [w - 11, 57], [w - 11, 50]])}{box(0, 49, w, 3, 2, "cross")}
    {box(px, 61, 5, 35, 3, "cross")}{box(px + pw, 61, 5, 35, 3, "deep")}{box(px - 2, 57, pw + 8, 6, 3, "cross")}
    <path d={`M${px + 1} 59h2v2h-2zM${px + pw + 1} 59h2v2h-2z`} fill={INK} />
    {box(-3, 101, w + 14, 5, 4, "cross")}{box(1, 107, 4, 6, 2, "deep")}{box(w + 5, 107, 4, 6, 2, "deep")}{box(px - 3, 96, pw + 12, 4, 3, "deep")}
  </>;
});
function Workshop({ compact, draw, progress }: { compact: boolean; draw: Drawing; progress: number }) {
  const { box, line } = draw;
  const { x, w, px, pw, personX } = workshopPlan(compact), center = px + Math.round(pw * .5);
  const pressure = ease(phase(progress, .55, .64)) * (1 - ease(phase(progress, .68, .75)));
  const stamp = ease(phase(progress, .84, .89)) * (1 - ease(phase(progress, .92, .97)));
  const turn = Math.sin(phase(progress, .52, .76) * Math.PI * 2) * 4, drop = Math.round(stamp * 3), reach = ease(phase(progress, .73, .82));
  const handX = Math.round(lerp(px + pw + 12, w + 4, reach)), handY = Math.round(lerp(75 - Math.round(turn), 93 + drop, reach));
  return <g className="hf-workshop" transform={`translate(${x} 0)`}>
    <WorkshopTimber compact={compact} draw={draw} />
    <g data-part="press-screw" transform={`translate(0 ${Math.round(pressure * 6)})`}>{box(center - 2, 64, 5, 23, 1, "dots")}{Array.from({ length: 8 }, (_, i) => <g key={i}>{line([[center - 2, 66 + i * 3], [center + 3, 65 + i * 3]])}</g>)}</g>
    <g data-part="press-platen" transform={`translate(0 ${Math.round(pressure * 8)})`}>{box(px + 7, 85, pw - 9, 5, 3, "cross")}{line([[px + 10, 88], [px + pw - 4, 88]], AMBER)}</g>
    {line([[px - 1, 75 + Math.round(turn)], [px + pw + 13, 75 - Math.round(turn)]])}
    <Readers compact={compact} draw={draw} /><Printer x={personX} draw={draw} />
    {line([[personX - 5, 88], [personX - 10, 85], [handX, handY]])}{line([[personX - 5, 89], [personX - 10, 86], [handX, handY + 1]])}
    <g data-part="approval-stamp" transform={`translate(0 ${drop})`}>{box(w, 96, 7, 2, 1, "deep")}<path d={`M${w + 2} 91h3v5h-3zM${w} 90h7v2h-7z`} fill={INK} /></g>
  </g>;
}
const Ground = memo(function Ground({ compact, draw }: { compact: boolean; draw: Drawing }) {
  const start = compact ? 59 : 120, end = compact ? 91 : 201;
  const dots: ReactNode[] = [];
  for (let x = 7; x < (compact ? 155 : 310); x += 7) dots.push(<path key={x} d={`M${x} ${113 + x % 3}h.3v.3h-.3z`} fill={INK} />);
  return <>{dots}<g className="hf-feed-bench">{draw.box(start, 102, end - start, 3, 3, "dots")}{!compact && <>{draw.box(142, 106, 3, 7, 1, "deep")}{draw.box(184, 106, 3, 7, 1, "deep")}</>}</g></>;
});
const Manuscript = memo(function Manuscript({ draw }: { draw: Drawing }) {
  return <>{draw.face([[0, 0], [27, 0], [35, -5], [8, -5]], null)}{draw.line([[9, -3], [27, -3]])}{draw.line([[5, -1], [23, -1]])}{draw.face([[11, -2], [22, -2], [25, -3], [14, -3]], "amber", false)}</>;
});
function VillageScene({ compact, progress }: { compact: boolean; progress: number }) {
  const id = useId().replace(/:/g, ""), draw = useMemo(() => drawing(id), [id]), shop = workshopPlan(compact);
  const travel = ease(phase(progress, .06, .52)), delivery = ease(phase(progress, .75, .84));
  const x = Math.round(lerp(lerp(compact ? 52 : 111, shop.x + shop.px + 9, travel), shop.x + shop.w - 15, delivery));
  return <svg className={`hf-art ${compact ? "hf-narrow" : "hf-wide"}`} viewBox={compact ? "0 0 480 360" : "0 0 960 360"} aria-hidden="true" focusable="false">
    <Materials prefix={id} />
    <g className="hf-scene" transform={compact ? "scale(3)" : "translate(24 0) scale(3)"} shapeRendering="crispEdges">
      <Ground compact={compact} draw={draw} /><Laptop compact={compact} draw={draw} /><Workshop compact={compact} draw={draw} progress={progress} />
      <g className="hf-manuscript" transform={`translate(${x} 100)`} opacity={progress > .02 ? 1 : 0}>
        <Manuscript draw={draw} /><path data-part="approval-seal" d="M18 -2h3v2h-3z" fill={AMBER} opacity={progress >= .89 ? 1 : 0} />
      </g>
    </g>
  </svg>;
}

/** One bounded, opt-in handoff. The logo-only computer and village stay planted. */
export function HeroFlow() {
  const ref = useRef<HTMLDivElement>(null), frame = useRef(REST), last = useRef(0), raf = useRef(0);
  const [progress, setProgress] = useState(REST), [playing, setPlaying] = useState(false), [played, setPlayed] = useState(false), [reduced, setReduced] = useState(false);
  const update = (value: number) => { frame.current = value; setProgress(value); };
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => { setReduced(media.matches); setPlaying(false); };
    preference(); media.addEventListener("change", preference);
    const visibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setPlaying(false); }, { threshold: 0 });
    if (ref.current) observer.observe(ref.current);
    return () => { media.removeEventListener("change", preference); document.removeEventListener("visibilitychange", visibility); observer.disconnect(); };
  }, []);
  useEffect(() => {
    last.current = 0;
    if (!playing || reduced) return;
    const tick = (now: number) => {
      if (last.current) {
        frame.current = Math.min(1, frame.current + (now - last.current) / DURATION);
        setProgress(frame.current);
      }
      last.current = now;
      if (frame.current >= 1) setPlaying(false);
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, reduced]);
  const activate = () => {
    if (reduced) { setPlaying(false); update(!played ? .2 : frame.current >= .99 ? 0 : Math.min(1, frame.current + .2)); setPlayed(true); }
    else if (playing) setPlaying(false);
    else { if (!played || frame.current >= 1) update(0); setPlayed(true); setPlaying(true); }
  };
  const label = reduced ? "step motion" : playing ? "pause motion" : played && progress >= 1 ? "replay motion" : "play motion";
  return <div className="hf-panel" ref={ref}>
    <div className="hf" data-playing={playing ? "true" : "false"} data-progress={progress.toFixed(3)}>
      <div className="hf-picture" role="img" aria-label={HERO.flow.label}><VillageScene compact={false} progress={progress} /><VillageScene compact progress={progress} /></div>
    </div>
    <button type="button" className="hf-play" aria-pressed={playing} onClick={activate}>{label}</button>
  </div>;
}
