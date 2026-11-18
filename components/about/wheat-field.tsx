"use client";

import { AMBER, INK, Materials, PAPER, cellPath, drawing, run, type Point } from "@/components/landing/pixel-cells";
import { useEffect, useId, useMemo, useRef, useState } from "react";

/*
 * The contributors' field, drawn on the same cell grid and with the same
 * materials as the hero's printing scene: a farm under a starry night, and in
 * front of it one stalk of wheat per contributor, with their name as the ear.
 * The stalks lean in a light wind; a pointer moving through the field pushes
 * the stalks it passes the way it moves, and they swing back.
 *
 * The scene is one SVG at three units per cell. The stalks are redrawn as
 * whole cells every frame, so a bent stalk keeps the stepped edge of the rest
 * of the drawing. The names are SVG links: they read, focus and open like any
 * other link. Under reduced motion the field stands still.
 */

const CELL = 3;
/* the field behind the contributors is drawn a step quieter than their wheat, so their stalks stand out from it */
const FIELD = "var(--wh-field)";
/* the contributors' stalks sit between the field and the page's ink: part of the field, a little clearer than it */
const STALK = "var(--wh-stalk)";
const WIDE = { cells: 320, rows: 132 };
const NARROW = { cells: 160, rows: 150 };

type Plan = {
  cells: number;
  rows: number;
  ground: number;
  /* each contributor's stalk: where it stands, how tall it is, and how large its name is, all by its row's depth */
  stalks: { login: string; x: number; base: number; height: number; size: number }[];
};

function plan(logins: readonly string[], compact: boolean): Plan {
  const { cells, rows } = compact ? NARROW : WIDE;
  const ground = rows - 6;
  const horizon = Math.round(rows * 0.6);
  // every name has a column of its own, so the vertical names never touch however many people join; the columns
  // close up as the patch grows, down to just over a name's height apart, and the patch widens across the field
  const step = Math.max(4, Math.min(9, Math.floor((cells - 8) / Math.max(1, logins.length))));
  const span = step * (logins.length - 1);
  const centre = Math.min(cells - 4 - span / 2, Math.max(4 + span / 2, cells * (compact ? 0.4 : 0.36)));
  const stalks = logins.map((login, index) => {
    // each stalk stands at its own depth in the patch: further back is nearer the horizon, shorter, with a smaller name
    const depth = 0.45 + 0.55 * (((index * 7 + 3) % 11) / 10);
    return {
      login,
      x: Math.round(centre - span / 2 + index * step),
      base: Math.round(horizon + 12 + (ground - horizon - 12) * depth),
      height: Math.round((compact ? 18 : 15) + depth * (compact ? 22 : 20) + ((index * 5) % 4)),
      size: Math.round(8 + depth * 3),
    };
  });
  return { cells, rows, ground, stalks };
}

/* a seeded generator, so the stars and the near field fall in the same places on every visit */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* a name is the ear of its stalk: it runs up from the tip, leaning with it */
function nameAt(tip: Point, angle: number) {
  return `translate(${tip[0] * CELL + 0.5 * CELL} ${(tip[1] - 2) * CELL}) rotate(${-90 + (angle * 180) / Math.PI})`;
}

/* where a stalk is at a fraction of its height: it bends more toward the tip, like a real stem */
function along(x: number, ground: number, height: number, angle: number, s: number): Point {
  return [x + Math.sin(angle) * height * s * s, ground - height * s * (1 - (1 - Math.cos(angle)) * s * 0.5)];
}

/* one contributor's stalk as whole cells: the stem, two leaves, and the awns that open under the name */
function stalkPath(x: number, ground: number, height: number, angle: number) {
  const cells = new Set<string>();
  const points: Point[] = [];
  for (let i = 0; i <= 8; i += 1) {
    const [px, py] = along(x, ground, height, angle, i / 8);
    points.push([Math.round(px), Math.round(py)]);
  }
  points.slice(1).forEach((point, i) => run(points[i]!, point, cells));
  for (const [s, side] of [
    [0.3, -1],
    [0.48, 1],
  ] as const) {
    const [lx, ly] = along(x, ground, height, angle, s);
    const root: Point = [Math.round(lx), Math.round(ly)];
    run(root, [root[0] + side * 4, root[1] - 4], cells);
  }
  const [tx, ty] = along(x, ground, height, angle, 1);
  const tip: Point = [Math.round(tx), Math.round(ty)];
  run([tip[0] - 1, tip[1] + 1], [tip[0] - 4, tip[1] - 2], cells);
  run([tip[0] + 1, tip[1] + 1], [tip[0] + 4, tip[1] - 2], cells);
  return { d: cellPath(cells), tip };
}

/* the still part of the scene: sky, moon, hills, farm, fence, the near field and the ground */
function Backdrop({ layout, prefix }: { layout: Plan; prefix: string }) {
  const { face, line, box, shadow } = useMemo(() => drawing(prefix), [prefix]);
  const { cells, rows, ground } = layout;
  const compact = cells === NARROW.cells;
  const random = seeded(11);

  // the stars: single cells, a few larger crosses, some of them twinkling
  const stars = Array.from({ length: compact ? 46 : 90 }, (_, index) => {
    const x = Math.floor(random() * cells);
    const y = 2 + Math.floor(random() * (rows * 0.42));
    const big = random() < 0.12;
    const twinkle = random() < 0.35;
    return (
      <path
        key={index}
        className={twinkle ? "wh-star wh-twinkle" : "wh-star"}
        style={twinkle ? { animationDelay: `${-random() * 4}s` } : undefined}
        d={big ? `M${x} ${y - 1}h1v1h1v1h-1v1h-1v-1h-1v-1h1z` : `M${x} ${y}h1v1h-1z`}
        fill={INK}
      />
    );
  });

  // two rolling hills along the horizon
  const horizon = Math.round(rows * 0.6);
  const hill = (x: number) => horizon - Math.round(4 + 3 * Math.sin(x / 23) + 2 * Math.sin(x / 9 + 1.3));
  const hillPoints: Point[] = [[0, rows]];
  for (let x = 0; x <= cells; x += 4) hillPoints.push([x, hill(x)]);
  hillPoints.push([cells, rows]);
  // a far ridge behind them, outlined only, so it reads as distance
  const ridge = (x: number) => horizon - Math.round(10 + 4 * Math.sin(x / 41 + 2) + 3 * Math.sin(x / 17));
  const ridgeLine: Point[] = [];
  for (let x = 0; x <= cells; x += 5) ridgeLine.push([x, ridge(x)]);

  // the moon, a crescent in the one accent
  const moon = { x: Math.round(cells * 0.86), y: Math.round(rows * 0.16), r: compact ? 6 : 8 };
  const moonCells = new Set<string>();
  for (let y = -moon.r; y <= moon.r; y += 1) {
    for (let x = -moon.r; x <= moon.r; x += 1) {
      const inside = x * x + y * y <= moon.r * moon.r;
      const bite = (x + moon.r * 0.55) ** 2 + (y - moon.r * 0.15) ** 2 <= (moon.r * 0.85) ** 2;
      if (inside && !bite) moonCells.add(`${moon.x + x},${moon.y + y}`);
    }
  }

  // the farm: a barn with a gable roof and crossed doors, a silo beside it, both drawn as the hero draws its house
  const barnX = Math.round(cells * (compact ? 0.71 : 0.7));
  const w = 24;
  const base = hill(barnX + w / 2) + 1;
  const wall = 11;
  const top = base - wall;
  const peak = top - 8;

  // plowed furrows running from the foot of the farm toward the viewer, in dotted cells, so the field recedes
  const vanish: Point = [Math.round(cells * (compact ? 0.78 : 0.76)), horizon + 2];
  const furrows = new Set<string>();
  for (let i = -6; i <= 16; i += 1) {
    const end: Point = [Math.round(vanish[0] + (i - 5) * (compact ? 22 : 30)), ground];
    const cellsOf = run(vanish, end);
    let step = 0;
    for (const cell of cellsOf) {
      const y = Number(cell.split(",")[1]);
      // sparse near the horizon, closer together toward the viewer
      if (y > horizon + 4 && step++ % Math.max(2, Math.round(6 - ((y - horizon) / (ground - horizon)) * 4)) === 0) furrows.add(cell);
    }
  }

  // wheat in perspective, scattered rather than in columns: a single cell near the horizon, a small fork of awns
  // further down, and a short stem under the fork nearest the viewer, with plenty of empty ground between
  const field = new Set<string>();
  const bands = 6;
  for (let band = 0; band < bands; band += 1) {
    const depth = (band + 1) / bands;
    const top = Math.round(horizon + 6 + (ground - horizon - 6) * ((band + 0.2) / bands) ** 1.4);
    const bottom = Math.round(horizon + 6 + (ground - horizon - 6) * ((band + 1) / bands) ** 1.4);
    const count = Math.round(cells / (4 + depth * 6));
    for (let i = 0; i < count; i += 1) {
      const x = Math.floor(random() * cells);
      const y = top + Math.floor(random() * Math.max(1, bottom - top));
      const lean = random() < 0.6 ? 0 : random() < 0.5 ? -1 : 1;
      if (depth < 0.34) {
        field.add(`${x},${y}`);
        continue;
      }
      const stem = depth < 0.67 ? 1 : Math.round(2 + depth * 4);
      run([x, y], [x + lean, y - stem], field);
      const tip: Point = [x + lean, y - stem];
      const spread = depth < 0.67 ? 1 : 2;
      run(tip, [tip[0] - spread, tip[1] - spread], field);
      run(tip, [tip[0] + spread, tip[1] - spread], field);
      if (depth >= 0.67) run(tip, [tip[0], tip[1] - spread - 1], field);
    }
  }

  // the ground: a dotted line of soil, as under the hero's bench
  const soil = [];
  for (let x = 0; x < cells; x += 2) soil.push(`M${x + (x % 4 ? 0.5 : 0)} ${ground + 2 + (x % 6 === 0 ? 1 : 0)}h.4v.4h-.4z`);

  return (
    <g>
      {stars}
      <path d={cellPath(moonCells)} fill={AMBER} />
      {line(ridgeLine, FIELD)}
      {line(hillPoints.slice(1, -1), FIELD)}
      <path d={cellPath(furrows)} fill={FIELD} />
      {shadow(barnX - 4, base, w + 26)}
      {/* the barn's side wall, its front, the roof's two faces and the doors */}
      {face(
        [
          [barnX + w, base],
          [barnX + w + 8, base - 4],
          [barnX + w + 8, top - 4],
          [barnX + w, top],
        ],
        "deep",
      )}
      {face(
        [
          [barnX, base],
          [barnX + w, base],
          [barnX + w, top],
          [barnX, top],
        ],
        "cross",
      )}
      {face(
        [
          [barnX - 3, top + 1],
          [barnX + w / 2, peak],
          [barnX + w + 3, top + 1],
        ],
        "check",
      )}
      {face(
        [
          [barnX + w / 2, peak],
          [barnX + w / 2 + 8, peak - 4],
          [barnX + w + 11, top - 3],
          [barnX + w + 3, top + 1],
        ],
        "dots",
      )}
      {face(
        [
          [barnX + 8, base],
          [barnX + w - 8, base],
          [barnX + w - 8, base - 7],
          [barnX + 8, base - 7],
        ],
        null,
      )}
      {line([
        [barnX + 8, base - 7],
        [barnX + w - 8, base],
      ])}
      {line([
        [barnX + w - 8, base - 7],
        [barnX + 8, base],
      ])}
      {box(barnX + w + 11, base - 17, 6, 17, 2, "cross")}
      {face(
        [
          [barnX + w + 10, base - 17],
          [barnX + w + 14, base - 21],
          [barnX + w + 18, base - 17],
        ],
        "deep",
      )}
      <path d={cellPath(field)} fill={FIELD} />
      <path d={soil.join("")} fill={FIELD} />
    </g>
  );
}

export function WheatField({ logins }: { logins: readonly string[] }) {
  const prefix = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const stemRefs = useRef<(SVGPathElement | null)[]>([]);
  const nameRefs = useRef<(SVGGElement | null)[]>([]);
  const [compact, setCompact] = useState(false);
  const layout = useMemo(() => plan(logins, compact), [logins, compact]);

  // the narrow drawing once the field is narrower than a tablet
  useEffect(() => {
    const svg = svgRef.current!;
    const observer = new ResizeObserver(() => setCompact(svg.clientWidth < 640));
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stalks = layout.stalks.map((stalk, index) => ({ ...stalk, angle: 0, speed: 0, phase: index * 0.35 }));
    let raf = 0;
    let visible = false;
    let last = 0;

    const paint = () => {
      stalks.forEach((stalk, index) => {
        const { d, tip } = stalkPath(stalk.x, stalk.base, stalk.height, stalk.angle);
        stemRefs.current[index]?.setAttribute("d", d);
        nameRefs.current[index]?.setAttribute("transform", nameAt(tip, stalk.angle));
      });
    };

    // each stalk is a damped spring pulled toward where the wind would lean it
    const tick = (time: number) => {
      const dt = Math.min(0.05, last ? (time - last) / 1000 : 0.016);
      last = time;
      const t = time / 1000;
      for (const stalk of stalks) {
        // the wind moves across the field as one wave, so neighbouring stalks lean together and their names never cross
        const target = 0.07 * Math.sin(t * 0.5 - stalk.phase * 0.5) + 0.025 * Math.sin(t * 1.6 - stalk.phase);
        stalk.speed += ((target - stalk.angle) * 14 - stalk.speed * 2.2) * dt;
        stalk.angle = Math.max(-0.7, Math.min(0.7, stalk.angle + stalk.speed * dt));
      }
      paint();
      raf = visible && !still.matches ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (!raf && visible && !still.matches) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    // a pointer moving through the field pushes the stalks it passes, the way it moves
    const onMove = (event: PointerEvent) => {
      if (still.matches) return;
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const x = point.x / CELL;
      const y = point.y / CELL;
      for (const stalk of stalks) {
        if (y < stalk.base - stalk.height - 6 || y > stalk.base) continue;
        const s = Math.min(1, Math.max(0, (stalk.base - y) / stalk.height));
        const [sx] = along(stalk.x, stalk.base, stalk.height, stalk.angle, s);
        if (Math.abs(sx - x) < 4) stalk.speed += Math.max(-3, Math.min(3, event.movementX * 0.15));
      }
      start();
    };

    paint();
    const seen = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      start();
    });
    seen.observe(svg);
    still.addEventListener("change", start);
    svg.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      seen.disconnect();
      still.removeEventListener("change", start);
      svg.removeEventListener("pointermove", onMove);
    };
  }, [layout]);

  const { cells, rows } = layout;
  return (
    <svg
      ref={svgRef}
      className="wh-art"
      viewBox={`0 0 ${cells * CELL} ${rows * CELL}`}
      role="group"
      aria-label="contributors"
    >
      <Materials prefix={prefix} />
      <g transform={`scale(${CELL})`} shapeRendering="crispEdges" aria-hidden="true">
        <Backdrop layout={layout} prefix={prefix} />
        {layout.stalks.map((stalk, index) => (
          <path
            key={stalk.login}
            ref={(element) => {
              stemRefs.current[index] = element;
            }}
            d={stalkPath(stalk.x, stalk.base, stalk.height, 0).d}
            fill={STALK}
          />
        ))}
      </g>
      {layout.stalks.map((stalk, index) => {
        const tip = stalkPath(stalk.x, stalk.base, stalk.height, 0).tip;
        return (
          <g
            key={stalk.login}
            ref={(element) => {
              nameRefs.current[index] = element;
            }}
            transform={nameAt(tip, 0)}
          >
            <a className="wh-name" href={`https://github.com/${stalk.login}`} aria-label={`${stalk.login} on github`}>
              <text textAnchor="start" dominantBaseline="central" fontSize={stalk.size} stroke={PAPER} strokeWidth={4} paintOrder="stroke">
                {stalk.login}
              </text>
            </a>
          </g>
        );
      })}
    </svg>
  );
}
