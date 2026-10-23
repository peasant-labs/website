"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { HERO } from "@/lib/landing";
import { Pause, Play } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * The hero's picture, told without words and drawn the way the site's
 * pictures are: low-poly shapes in three-quarter view, shaded with glyphs on a
 * fine grid (dots, plusses, checkers, solid squares), every edge a run of solid
 * squares on the same grid, a sparse dotted ground and patterned contact
 * shadows, in two inks: near-black (light on the dark page) and amber.
 *
 * A transcript card lifts out of a laptop that runs the agents, passes through
 * a sieve standing between the laptop and the commons, which sweeps its secret
 * line amber, is stamped as it is published, and slides down onto the shared
 * stack, which eases down a notch to make room while the people at it notice:
 * one's basket turns amber. Its accessible name tells the same story.
 *
 * Every card makes the same journey, one cycle after the last, so the loop
 * never resets: a card lands on top, sinks one notch a cycle and slips behind
 * the base after four, and comes back out of the laptop on its next turn.
 *
 * The unit of every drawing is one grid cell, and the picture shows at widths
 * where a cell is a whole number of pixels: 3px on a phone and a wide screen,
 * 2px between. Glyph patterns tile from each drawing's own origin, so the
 * texture travels with a card instead of shimmering across it, and edges are
 * worked out here, cell by cell, so they step on the grid like the pictures'.
 * A card moves on two nested layers, across and down, each with its own curve.
 * Only transform, opacity and clip-path move; z-index steps a card behind the
 * one that lands on it. The resting state is one finished frame, and the loop
 * is laid over it only when motion is allowed.
 */

const FLOW = HERO.flow;
const AGENTS = FLOW.agents;
const COUNT = AGENTS.length;
/* the laptop shows three marks at a time: the first three agents, then the other three */
const SHOWN = 3;
/* how many cards show on the stack before one slips behind the base */
const DEPTH = 4;

/* one calm cycle per card; a card's own animation runs for all six cycles */
const CYCLE = 8500;
const LOOP = CYCLE * COUNT;

/* a card's journey, from the start of its cycle: each move eases in and out, and each beat holds */
const BEAT = {
  lifted: 900,
  leave: 1400,
  atSieve: 2500,
  leaveSieve: 3000,
  stamped: 4200,
  settled: 4450,
  drop: 4700,
  landed: 5700,
  /* the stack makes room while the card comes down */
  roomFrom: 4800,
  roomTo: 5600,
  noticed: 6100,
  forgetFrom: 7400,
  forgotten: 8000,
} as const;

/*
 * fairtrade's --ease-out and --ease-in-out, as numbers: a keyframe cannot read
 * a custom property for its timing function, and the sieve's sweep follows the
 * card with the same curves.
 */
const CURVES = {
  out: [0.23, 1, 0.32, 1],
  "in-out": [0.77, 0, 0.175, 1],
} as const;
type Curve = keyof typeof CURVES;

type Point = readonly [x: number, y: number];
type Rect = readonly [x: number, y: number, w: number, h: number];
/** a person at the stack: centre, height, and what they hold */
type Person = readonly [x: number, height: number, holds: "rake" | "basket" | null];

/*
 * The three-quarter view: depth runs up and to the right, a little over half a
 * cell across and a third of a cell up for each cell of depth, so every box
 * shows a lit top, a front and a shaded side.
 */
const DEPTH_X = 0.55;
const DEPTH_Y = -0.35;
const back = ([x, y]: Point, depth: number): Point => [x + DEPTH_X * depth, y + DEPTH_Y * depth];

/** a card's drawing, in cells: its size, its mark, three lines (the middle one the secret), the amber block over it, the stamp */
type CardPlan = Readonly<{
  w: number;
  h: number;
  mark: readonly [x: number, y: number, size: number];
  lines: readonly (readonly [x: number, y: number, w: number])[];
  line: number;
  mask: Rect;
  stamp: readonly [x: number, y: number, size: number];
}>;

const WIDE_CARD: CardPlan = {
  w: 60,
  h: 42,
  mark: [7, 5, 11],
  lines: [
    [7, 21, 42],
    [7, 27, 32],
    [7, 33, 37],
  ],
  line: 2,
  mask: [5, 25, 35, 6],
  stamp: [44, 4, 11],
};

const PHONE_CARD: CardPlan = {
  w: 48,
  h: 34,
  mark: [5, 4, 9],
  lines: [
    [5, 17, 33],
    [5, 22, 25],
    [5, 27, 29],
  ],
  line: 1,
  mask: [4, 21, 27, 4],
  stamp: [35, 3, 10],
};

/** One layout, every measure in cells. */
type Layout = Readonly<{
  name: "phone" | "wide";
  width: number;
  height: number;
  card: CardPlan;
  /** the front edge of the ground the commons stands on */
  ground: number;
  /** the laptop: the deck's front-left corner on its ground, its width, depth and thickness, and the screen's height and lean */
  laptop: Readonly<{ x: number; ground: number; w: number; depth: number; deck: number; screen: number; lean: number }>;
  /** the three marks on the screen: centres and one size */
  marks: readonly Point[];
  mark: number;
  /** centres: lifted out of the laptop, held in the sieve, stamped above the stack */
  lifted: Point;
  atSieve: Point;
  stamped: Point;
  /** the sieve's mesh panel, standing on posts down to its ground */
  sieve: Rect;
  sieveGround: number;
  /** the stack: its cards' left edge, the base's top, the step between cards and the base's depth */
  stack: readonly [left: number, baseTop: number, notch: number, depth: number];
  /** the people at the stack, the half width of a robe at its hem, and the one who notices a card land */
  people: readonly Person[];
  robe: number;
  noticer: number;
}>;

/*
 * A wide screen, at 16:10, laid out like the pictures' village: on one ground
 * seen in three-quarter view, the laptop stands toward the back on the left,
 * the commons toward the front on the right, and the sieve between them on the
 * card's way down from one to the other.
 */
const WIDE: Layout = {
  name: "wide",
  width: 333,
  height: 208,
  card: WIDE_CARD,
  ground: 184,
  laptop: { x: 22, ground: 106, w: 80, depth: 30, deck: 3, screen: 56, lean: 4 },
  marks: [59, 80.5, 102].map((x) => [x, 64.5] as const),
  mark: 17,
  lifted: [80, 66],
  atSieve: [156, 108],
  stamped: [222, 96],
  sieve: [152, 82, 8, 54],
  sieveGround: 150,
  stack: [192, 172, 3, 6],
  people: [
    [281, 58, "rake"],
    [299, 64, "basket"],
    [317, 55, null],
  ],
  robe: 11.5,
  noticer: 1,
};

/*
 * A phone, at 4:5: the laptop above the people on the left, the stack on the
 * right, and the card crossing from one to the other through the sieve.
 */
const PHONE: Layout = {
  name: "phone",
  width: 100,
  height: 125,
  card: PHONE_CARD,
  ground: 118,
  laptop: { x: 3, ground: 40, w: 36, depth: 12, deck: 2, screen: 24, lean: 2 },
  marks: [18, 28.5, 39].map((x) => [x, 22] as const),
  mark: 8,
  lifted: [26, 40],
  atSieve: [52, 44],
  stamped: [73, 52],
  sieve: [48, 26, 4, 36],
  sieveGround: 70,
  stack: [49, 112, 3, 4],
  people: [
    [11, 32, "rake"],
    [24, 36, "basket"],
    [38, 30, null],
  ],
  robe: 6.5,
  noticer: 1,
};

/* ---------- curves ---------- */

/** a CSS cubic-bezier as a function of progress, solved by bisection */
function curve(name: Curve) {
  const [x1, y1, x2, y2] = CURVES[name];
  const axis = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (progress: number) => {
    let lo = 0;
    let hi = 1;
    for (let step = 0; step < 40; step += 1) {
      const mid = (lo + hi) / 2;
      if (axis(x1, x2, mid) < progress) lo = mid;
      else hi = mid;
    }
    return axis(y1, y2, (lo + hi) / 2);
  };
}

/* ---------- the journey, as positions over a card's own time ---------- */

type Track = readonly (readonly [ms: number, value: number, ease?: Curve])[];

/** the top of the stack's top card */
const stackTop = (layout: Layout) => layout.stack[1] - layout.card.h - (DEPTH - 1) * layout.stack[2];

/** the card's centre across (0) or down (1), in cells, for a card that starts on one of the three marks */
function track(layout: Layout, slot: number, axis: 0 | 1): Track {
  const from = layout.marks[slot]![axis];
  const [stackLeft, , notch] = layout.stack;
  const rest = axis === 0 ? stackLeft + layout.card.w / 2 : stackTop(layout) + layout.card.h / 2;
  const sinks: [number, number, Curve?][] = [];
  if (axis === 1) {
    for (let depth = 1; depth <= DEPTH; depth += 1) {
      sinks.push([depth * CYCLE + BEAT.roomFrom, rest + (depth - 1) * notch, "in-out"]);
      sinks.push([depth * CYCLE + BEAT.roomTo, rest + depth * notch]);
    }
  }
  return [
    [0, from, "in-out"],
    [BEAT.lifted, layout.lifted[axis]],
    [BEAT.leave, layout.lifted[axis], "in-out"],
    [BEAT.atSieve, layout.atSieve[axis]],
    [BEAT.leaveSieve, layout.atSieve[axis], "in-out"],
    [BEAT.stamped, layout.stamped[axis]],
    [BEAT.drop, layout.stamped[axis], "in-out"],
    [BEAT.landed, rest],
    ...sinks,
    [LOOP, axis === 1 ? rest + DEPTH * notch : rest],
  ];
}

/** a track's value at a moment, following its curves */
function valueAt(stops: Track, ms: number) {
  for (let index = 0; index < stops.length - 1; index += 1) {
    const [from, start, ease] = stops[index]!;
    const [to, end] = stops[index + 1]!;
    if (ms >= from && ms <= to) {
      const progress = to === from ? 1 : (ms - from) / (to - from);
      return start + (end - start) * (ease ? curve(ease)(progress) : progress);
    }
  }
  return stops[stops.length - 1]![1];
}

/* ---------- the stylesheet ---------- */

const n = (value: number) => Number(value.toFixed(4));

type Stop = readonly [ms: number, declarations: string, ease?: Curve | "linear"];

function keyframes(name: string, length: number, stops: readonly Stop[]) {
  const body = stops
    .map(([ms, declarations, ease]) => {
      const timing = !ease
        ? ""
        : ` animation-timing-function: ${ease === "linear" ? "linear" : `cubic-bezier(${CURVES[ease].join(", ")})`};`;
      return `${n((ms / length) * 100)}% { ${declarations};${timing} }`;
    })
    .join(" ");
  return `@keyframes ${name} { ${body} }`;
}

/** cells to hundredths of the picture's width */
function unit(layout: Layout) {
  return (cells: number) => `${n((cells * 100) / layout.width)}cqw`;
}

/* a layer moves its card's top-left corner; the card is drawn at the origin */
function shiftStops(layout: Layout, stops: Track, axis: 0 | 1): Stop[] {
  const cq = unit(layout);
  const half = axis === 0 ? layout.card.w / 2 : layout.card.h / 2;
  return stops.map(([ms, value, ease]) => [
    ms,
    `transform: ${axis === 0 ? "translateX" : "translateY"}(${cq(value - half)})`,
    ease,
  ]);
}

/*
 * The secret line turns amber where the sieve meets it, sampled from the
 * card's own path so the sweep stays under the mesh: from the line's right end
 * as the card crosses sideways.
 */
function sweepStops(layout: Layout): Stop[] {
  const x = track(layout, 1, 0);
  const [sx, , sw] = layout.sieve;
  const [mx, , mw] = layout.card.mask;
  const shown = (fraction: number) => `clip-path: inset(0 0 0 ${n((1 - Math.min(1, Math.max(0, fraction))) * 100)}%)`;
  const fraction = (ms: number) => (valueAt(x, ms) - layout.card.w / 2 + mx + mw - (sx + sw / 2)) / mw;
  const samples: Stop[] = [[0, shown(0)]];
  for (let ms = BEAT.leave; ms <= BEAT.stamped; ms += 50) samples.push([ms, shown(fraction(ms)), "linear"]);
  samples.push([LOOP, shown(1)]);
  return samples;
}

/* where every card rests in the finished frame: the first card has just landed on the three before it */
function finishedAt(layout: Layout) {
  const moment = BEAT.landed + 200;
  return (index: number) => {
    const local = (moment + ((COUNT - index) % COUNT) * CYCLE) % LOOP;
    return { x: valueAt(track(layout, index % SHOWN, 0), local), y: valueAt(track(layout, index % SHOWN, 1), local) };
  };
}

function layoutRules(layout: Layout) {
  const cq = unit(layout);
  const half = layout.mark / 2;
  const at = finishedAt(layout);
  const { w, h } = layout.card;
  const [sx, sy, sw] = layout.sieve;
  return [
    `.hf { aspect-ratio: ${layout.width} / ${layout.height} }`,
    ...layout.marks.flatMap(([x, y], slot) =>
      AGENTS.map((_, index) => index)
        .filter((index) => index % SHOWN === slot)
        .map((index) => `.hf-m${index} { left: ${cq(x - half)}; top: ${cq(y - half)}; width: ${cq(layout.mark)}; height: ${cq(layout.mark)} }`),
    ),
    `.hf-card { width: ${cq(w)}; height: ${cq(h)} }`,
    `.hf-mesh-${layout.name} { left: ${cq(sx)}; top: ${cq(sy)}; width: ${cq(sw)}; height: ${cq(layout.sieveGround - sy)} }`,
    `.hf-base-${layout.name} { left: ${cq(layout.stack[0] - 1)}; top: ${cq(layout.stack[1])}; width: ${cq(w + 2)}; height: ${cq(layout.ground - layout.stack[1])} }`,
    ...AGENTS.map((_, index) => {
      const rest = at(index);
      return `.hf-x${index} { transform: translateX(${cq(rest.x - w / 2)}) }\n.hf-y${index} { transform: translateY(${cq(rest.y - h / 2)}) }`;
    }),
  ].join("\n");
}

function layoutKeyframes(layout: Layout) {
  const slots = Array.from({ length: SHOWN }, (_, slot) => [
    keyframes(`hf-x-${slot}`, LOOP, shiftStops(layout, track(layout, slot, 0), 0)),
    keyframes(`hf-y-${slot}`, LOOP, shiftStops(layout, track(layout, slot, 1), 1)),
  ]).flat();
  return [...slots, keyframes("hf-sweep", LOOP, sweepStops(layout))].join("\n");
}

/* everything that moves the same way whatever the layout */
function sharedKeyframes() {
  /* a card is drawn above the stack while it travels and lands, then steps behind each card that lands on it */
  const z: Stop[] = [[0, "z-index: 10"]];
  for (let depth = 1; depth <= DEPTH; depth += 1) {
    z.push([depth * CYCLE + BEAT.roomFrom - 1, `z-index: ${depth === 1 ? 10 : 11 - depth}`]);
    z.push([depth * CYCLE + BEAT.roomFrom, `z-index: ${depth === DEPTH ? 1 : 10 - depth}`]);
  }
  z.push([LOOP, "z-index: 1"]);

  const gone = DEPTH * CYCLE + BEAT.roomTo;
  const card = keyframes("hf-card", LOOP, [
    [0, "opacity: 0; transform: scale(0.3)", "in-out"],
    [200, "opacity: 1; transform: scale(0.42)", "in-out"],
    [BEAT.lifted, "opacity: 1; transform: scale(1)"],
    [BEAT.stamped, "opacity: 1; transform: scale(1)", "out"],
    [BEAT.stamped + 100, "opacity: 1; transform: scale(0.96)", "out"],
    [BEAT.settled, "opacity: 1; transform: scale(1)"],
    [gone, "opacity: 1; transform: scale(1)", "out"],
    [gone + 300, "opacity: 0; transform: scale(1)"],
    [LOOP, "opacity: 0; transform: scale(1)"],
  ]);
  const stamp = keyframes("hf-stamp", LOOP, [
    [0, "opacity: 0; transform: scale(1.12)"],
    [BEAT.stamped, "opacity: 0; transform: scale(1.12)", "out"],
    [BEAT.settled, "opacity: 1; transform: scale(1)"],
    [LOOP, "opacity: 1; transform: scale(1)"],
  ]);
  const notice = keyframes("hf-notice", CYCLE, [
    [0, "opacity: 0"],
    [BEAT.landed, "opacity: 0", "out"],
    [BEAT.noticed, "opacity: 1"],
    [BEAT.forgetFrom, "opacity: 1", "out"],
    [BEAT.forgotten, "opacity: 0"],
    [CYCLE, "opacity: 0"],
  ]);
  /* the first three marks show for the first three cycles, the other three for the rest; each dips as its card lifts out */
  const swap = SHOWN * CYCLE;
  const rest = "opacity: 1; transform: scale(1)";
  const dip = "opacity: 1; transform: scale(0.86)";
  const hidden = "opacity: 0; transform: scale(1)";
  const marks = AGENTS.map((_, index) => {
    const t = index * CYCLE;
    const lift: Stop[] = [
      [t, rest, "in-out"],
      [t + 350, dip, "in-out"],
      [t + 1100, rest],
    ];
    const stops: Stop[] =
      index < SHOWN
        ? [
            ...(index === 0 ? [] : ([[0, rest]] as Stop[])),
            ...lift,
            [swap - 500, rest, "out"],
            [swap - 100, hidden],
            [LOOP - 500, hidden, "out"],
            [LOOP - 100, rest],
            [LOOP, rest],
          ]
        : [
            [0, hidden],
            [swap - 500, hidden, "out"],
            [swap - 100, rest],
            ...lift,
            [LOOP - 500, rest, "out"],
            [LOOP - 100, hidden],
            [LOOP, hidden],
          ];
    return keyframes(`hf-mark-${index}`, LOOP, stops);
  });
  return [keyframes("hf-z", LOOP, z), card, stamp, notice, ...marks].join("\n");
}

function motionRules() {
  const run = (name: string, length: number, delay: number) => `animation: ${name} ${length}ms linear ${-delay}ms infinite`;
  /* card i is i cycles into the loop when the page starts, so the stack is already there */
  const offset = (index: number) => ((COUNT - index) % COUNT) * CYCLE;
  return [
    ...AGENTS.flatMap((_, index) => {
      const slot = index % SHOWN;
      const delay = offset(index);
      return [
        `.hf-x${index} { animation: hf-x-${slot} ${LOOP}ms linear ${-delay}ms infinite, hf-z ${LOOP}ms linear ${-delay}ms infinite }`,
        `.hf-y${index} { ${run(`hf-y-${slot}`, LOOP, delay)} }`,
        `.hf-c${index} { ${run("hf-card", LOOP, delay)} }`,
        `.hf-k${index} { ${run("hf-sweep", LOOP, delay)} }`,
        `.hf-t${index} { ${run("hf-stamp", LOOP, delay)} }`,
        `.hf-m${index} { ${run(`hf-mark-${index}`, LOOP, 0)} }`,
      ];
    }),
    `.hf-notice { ${run("hf-notice", CYCLE, 0)} }`,
    `.hf[data-paused=true] * { animation-play-state: paused }`,
  ].join("\n");
}

const RESTING = [
  ...AGENTS.map((_, index) => {
    const depth = (COUNT - index) % COUNT;
    const shown = depth < DEPTH;
    return `.hf-x${index} { z-index: ${shown ? 10 - depth : 1} }\n.hf-c${index} { opacity: ${shown ? 1 : 0} }\n.hf-m${index} { opacity: ${index < SHOWN ? 1 : 0} }`;
  }),
  `.hf-notice { opacity: 1 }`,
].join("\n");

/*
 * Three widths, each a whole number of pixels per cell: a phone shows its
 * layout 300px wide and a wide screen 999px wide, both at 3px a cell; between,
 * the wide layout shows 666px wide, at 2px.
 */
const STYLESHEET = [
  RESTING,
  layoutRules(PHONE),
  layoutKeyframes(PHONE),
  sharedKeyframes(),
  `.hf .hf-wide { display: none }`,
  `@media (min-width: 53rem) {\n.hf .hf-phone { display: none }\n.hf .hf-wide { display: block }\n${layoutRules(WIDE)}\n${layoutKeyframes(WIDE)}\n}`,
  `@media (prefers-reduced-motion: no-preference) {\n${motionRules()}\n}`,
].join("\n");

/* ---------- the glyphs ---------- */

/*
 * One glyph per cell, drawn in thirds of a cell so each lands on whole pixels
 * at 3px. The tones, lightest first: a dot in every other cell, a dot in every
 * cell, plusses with dots between, a checker in every cell, a solid square in
 * every cell. Amber is the checker in amber; the ground is a sparse scatter.
 */
const T = 1 / 3;

function glyph(kind: "dot" | "plus" | "checker" | "solid", x: number, y: number, key: string, className = "hf-ink") {
  switch (kind) {
    case "dot":
      return <rect key={key} className={className} x={x + T} y={y + T} width={T} height={T} />;
    case "solid":
      return <rect key={key} className={className} x={x} y={y} width={2 * T} height={2 * T} />;
    case "plus":
      return <path key={key} className={className} d={`M${x + T} ${y}h${T}v${T}h${T}v${T}h${-T}v${T}h${-T}v${-T}h${-T}v${-T}h${T}z`} />;
    case "checker":
      return <path key={key} className={className} d={`M${x} ${y}h${T}v${T}h${-T}zM${x + 2 * T} ${y}h${T}v${T}h${-T}zM${x + T} ${y + T}h${T}v${T}h${-T}zM${x} ${y + 2 * T}h${T}v${T}h${-T}zM${x + 2 * T} ${y + 2 * T}h${T}v${T}h${-T}z`} />;
  }
}

const SCATTER = [
  [3, 2], [17, 5], [29, 1], [41, 7], [8, 13], [23, 16], [36, 12], [47, 18], [2, 24], [14, 28], [31, 25], [44, 31], [9, 37], [26, 40], [39, 36],
] as const;

function Glyphs() {
  const tile = (id: string, w: number, h: number, children: ReactNode) => (
    <pattern id={`hf-${id}`} patternUnits="userSpaceOnUse" width={w} height={h}>
      {children}
    </pattern>
  );
  const four = (kind: "dot" | "plus" | "checker" | "solid", className?: string) =>
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ].map(([x, y]) => glyph(kind, x!, y!, `${x}${y}`, className));
  return (
    <>
      {tile("light", 2, 2, [glyph("dot", 0, 0, "a"), glyph("dot", 1, 1, "b")])}
      {tile("mid", 2, 2, four("dot"))}
      {tile("plus", 2, 2, [glyph("plus", 0, 0, "a"), glyph("plus", 1, 1, "b"), glyph("dot", 1, 0, "c"), glyph("dot", 0, 1, "d")])}
      {tile("checker", 2, 2, four("checker"))}
      {tile("solid", 2, 2, four("solid"))}
      {tile("amber", 2, 2, four("checker", "hf-amber"))}
      {tile("shade", 2, 2, [glyph("dot", 0, 0, "a"), glyph("dot", 1, 1, "b")])}
      {tile("shade-core", 2, 2, [glyph("plus", 0, 0, "a"), glyph("plus", 1, 1, "b"), glyph("dot", 1, 0, "c"), glyph("dot", 0, 1, "d")])}
      {tile("ground", 50, 44, SCATTER.map(([x, y], index) => glyph("dot", x, y, String(index), "hf-ink hf-scatter")))}
    </>
  );
}

/* ---------- edges, on the grid ---------- */

/** the cells a closed polygon's edges pass through, as one path of unit squares */
function edgeCells(points: readonly Point[]) {
  const cells = new Set<string>();
  for (let index = 0; index < points.length; index += 1) {
    const [x0, y0] = points[index]!;
    const [x1, y1] = points[(index + 1) % points.length]!;
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const x = Math.min(Math.floor(x0 + (x1 - x0) * t), Math.ceil(Math.max(x0, x1)) - 1);
      const y = Math.min(Math.floor(y0 + (y1 - y0) * t), Math.ceil(Math.max(y0, y1)) - 1);
      cells.add(`${x},${y}`);
    }
  }
  return [...cells].map((cell) => {
    const [x, y] = cell.split(",");
    return `M${x} ${y}h1v1h-1z`;
  }).join("");
}

const toPath = (points: readonly Point[]) => `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}Z`;
const rectPoints = (x: number, y: number, w: number, h: number): Point[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
function ellipsePoints(cx: number, cy: number, rx: number, ry: number, sides = 20): Point[] {
  return Array.from({ length: sides }, (_, index) => {
    const angle = (index / sides) * Math.PI * 2;
    return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry] as const;
  });
}

type Tone = "light" | "mid" | "plus" | "checker" | "solid" | "amber" | "none";

/** a closed face: filled with the panel to cover what is behind it, shaded with its glyphs, edged with squares */
function Face({ points, tone, edge = true }: { points: readonly Point[]; tone: Tone; edge?: boolean }) {
  const d = toPath(points);
  return (
    <>
      <path className="hf-fill" d={d} />
      {tone === "none" ? null : <path className={`hf-tone-${tone}`} d={d} />}
      {edge ? <path className="hf-ink" d={edgeCells(points)} /> : null}
    </>
  );
}

/** a contact shadow: a glyph ellipse, its core darker */
function Shadow({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <>
      <path className="hf-tone-shade" d={toPath(ellipsePoints(cx, cy, rx, ry))} />
      <path className="hf-tone-shade-core" d={toPath(ellipsePoints(cx - rx * 0.12, cy, rx * 0.72, ry * 0.6))} />
    </>
  );
}

/** A box in three-quarter view: its lit top, its shaded side and its front, from the front face's corner and size. */
function Box({ x, y, w, h, depth, front = "plus", top = "light", side = "checker" }: {
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  front?: Tone;
  top?: Tone;
  side?: Tone;
}) {
  const [bx, by] = back([x, y], depth);
  const [rx, ry] = back([x + w, y], depth);
  return (
    <>
      <Face points={[[x, y], [x + w, y], [rx, ry], [bx, by]]} tone={top} />
      <Face points={[[x + w, y], [rx, ry], [rx, ry + h], [x + w, y + h]]} tone={side} />
      <Face points={rectPoints(x, y, w, h)} tone={front} />
    </>
  );
}

/* which of the two layouts a drawing belongs to; the stylesheet shows one */
const sizeClass = (layout: Layout) => `hf-${layout.name}`;

/*
 * One of the people, low-poly like the pictures' peasants: a pointed hood on a
 * narrow neck over a robe that widens to the hem, each split into a lit face
 * and a shaded one, and maybe a rake, or an arm carrying a basket.
 */
function Peasant({ person: [x, height, holds], robe, ground, lit }: { person: Person; robe: number; ground: number; lit: boolean }) {
  const top = ground - height;
  const hood = height * 0.26;
  const wide = robe * 0.74;
  const neck = top + hood;
  const nape = robe * 0.24;
  const shoulder = robe * 0.44;
  const hoodLit: Point[] = [[x, top], [x, neck], [x - nape, neck], [x - wide * 0.86, top + hood * 0.74], [x - wide, top + hood * 0.52]];
  const hoodShade: Point[] = [[x, top], [x + wide, top + hood * 0.52], [x + wide * 0.86, top + hood * 0.74], [x + nape, neck], [x, neck]];
  const seam = x + robe * 0.18;
  const bodyLit: Point[] = [[x - shoulder, neck], [seam - robe * 0.1, neck], [seam, ground], [x - robe, ground], [x - robe * 0.86, ground - height * 0.3]];
  const bodyShade: Point[] = [[seam - robe * 0.1, neck], [x + shoulder, neck], [x + robe * 0.84, ground - height * 0.24], [x + robe, ground], [seam, ground]];
  const pole = x - robe - 1.5;
  const elbow: Point = [x + robe * 0.95, neck + height * 0.24];
  const arm: Point[] = [
    [x + shoulder * 0.7, neck + 1],
    [x + shoulder + 1.5, neck + 1],
    [elbow[0] + 1.5, elbow[1] + 1],
    [elbow[0] - 0.5, elbow[1] + 2],
  ];
  const basketTop = elbow[1] + 1.5;
  const basket: Point[] = [
    [x + robe * 0.45, basketTop],
    [x + robe * 1.75, basketTop],
    [x + robe * 1.55, basketTop + robe * 0.85],
    [x + robe * 0.65, basketTop + robe * 0.85],
  ];
  return (
    <g>
      <Shadow cx={x + 2.5} cy={ground + 0.5} rx={robe + 4} ry={2.4} />
      {holds === "rake" ? (
        <>
          <Face points={[[pole, ground], [pole + 1.2, ground], [pole + 4.6, top - 6], [pole + 3.4, top - 6]]} tone="plus" />
          <Face points={[[pole - 1, top - 7], [pole + 9, top - 5.6], [pole + 8.8, top - 4.2], [pole - 1.2, top - 5.6]]} tone="checker" />
        </>
      ) : null}
      <Face points={bodyLit} tone="plus" />
      <Face points={bodyShade} tone="checker" />
      <Face points={hoodLit} tone="light" />
      <Face points={hoodShade} tone="checker" />
      {holds === "basket" ? (
        <>
          <Face points={arm} tone="checker" />
          <Face points={basket} tone="plus" />
          {lit ? (
            <g className="hf-notice">
              <path className="hf-tone-amber" d={toPath(basket)} />
              <path className="hf-ink" d={edgeCells(basket)} />
            </g>
          ) : null}
        </>
      ) : null}
    </g>
  );
}

/** The still parts: the ground's scatter and plane, the laptop and the people. */
function Scene({ layout }: { layout: Layout }) {
  const { x, ground: lg, w, depth, deck, screen, lean } = layout.laptop;
  const deckTop = lg - deck;
  const [blx, bly] = back([x, deckTop], depth);
  const [brx, bry] = back([x + w, deckTop], depth);
  const screenTop = bly - screen;
  const face: Point[] = [[blx, bly], [brx, bry], [brx + lean, screenTop], [blx + lean, screenTop]];
  const inset = layout.name === "wide" ? 4 : 2;
  const display: Point[] = [
    [blx + inset * 0.8, bly - inset * 0.7],
    [brx - inset * 0.8, bry - inset * 0.7],
    [brx + lean - inset * 0.8, screenTop + inset],
    [blx + lean + inset * 0.8, screenTop + inset],
  ];
  const [ex, ey] = back([0, 0], layout.name === "wide" ? 2.5 : 1.5);
  const keys: Point[] = [
    back([x + w * 0.1, deckTop], depth * 0.18),
    back([x + w * 0.9, deckTop], depth * 0.18),
    back([x + w * 0.9, deckTop], depth * 0.72),
    back([x + w * 0.1, deckTop], depth * 0.72),
  ];
  return (
    <svg className={`hf-art ${sizeClass(layout)}`} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-ground" d={toPath(rectPoints(0, 0, layout.width, layout.height))} />
      <Shadow cx={x + w / 2 + depth * 0.4} cy={lg + 0.5} rx={w / 2 + depth * 0.3} ry={layout.name === "wide" ? 4 : 2.4} />
      <Face points={[[brx, bry], [brx + ex, bry + ey], [brx + lean + ex, screenTop + ey], [brx + lean, screenTop]]} tone="solid" />
      <Face points={[[blx + lean, screenTop], [brx + lean, screenTop], [brx + lean + ex, screenTop + ey], [blx + lean + ex, screenTop + ey]]} tone="mid" />
      <Face points={face} tone="checker" />
      <Face points={display} tone="light" />
      <Box x={x} y={deckTop} w={w} h={deck} depth={depth} front="solid" top="mid" side="solid" />
      <Face points={keys} tone="plus" />
      {layout.people
        .map((person, index) => ({ person, index }))
        .sort((a, b) => Number(a.index === layout.noticer) - Number(b.index === layout.noticer))
        .map(({ person, index }) => (
          <Peasant key={person[0]} person={person} robe={layout.robe} ground={layout.ground} lit={index === layout.noticer} />
        ))}
    </svg>
  );
}

/** The base the stack stands on: a low box as wide as the cards, drawn over the cards that have sunk into it. */
function Base({ layout }: { layout: Layout }) {
  const w = layout.card.w + 2;
  const h = layout.ground - layout.stack[1];
  const depth = layout.stack[3];
  return (
    <svg className={`hf-base hf-base-${layout.name} ${sizeClass(layout)}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <Shadow cx={w / 2 + 4} cy={h + 0.5} rx={w / 2 + 6} ry={layout.name === "wide" ? 4 : 2.4} />
      <Box x={0} y={0} w={w} h={h} depth={depth} front="checker" top="light" side="solid" />
    </svg>
  );
}

/** The sieve: a framed mesh with a little depth on two posts down to the ground, drawn over the card passing through it. */
function Mesh({ layout }: { layout: Layout }) {
  const [, sy, w, h] = layout.sieve;
  const tall = layout.sieveGround - sy;
  const post = layout.name === "wide" ? 1.5 : 1;
  const [dx, dy] = back([0, 0], layout.name === "wide" ? 3 : 2);
  const wires = [];
  for (let at = 2; at < h; at += 2) wires.push(<rect key={`r${at}`} className="hf-ink" x={0} y={at} width={w} height={T} />);
  for (let at = 2; at < w; at += 2) wires.push(<rect key={`c${at}`} className="hf-ink" x={at} y={0} width={T} height={h} />);
  return (
    <svg className={`hf-mesh hf-mesh-${layout.name} ${sizeClass(layout)}`} viewBox={`0 0 ${w} ${tall}`} aria-hidden="true" focusable="false">
      <Shadow cx={w / 2 + 3} cy={tall + 0.5} rx={w + 3} ry={layout.name === "wide" ? 3 : 2} />
      <Face points={rectPoints(0, h, post, tall - h)} tone="solid" />
      <Face points={rectPoints(w - post, h, post, tall - h)} tone="solid" />
      <Face points={[[w, 0], [w + dx, dy], [w + dx, h + dy], [w, h]]} tone="solid" />
      <Face points={[[0, 0], [w, 0], [w + dx, dy], [dx, dy]]} tone="mid" />
      {wires}
      <path className="hf-ink" d={edgeCells(rectPoints(0, 0, w, h))} />
    </svg>
  );
}

/** A card: a slab of paper with a lit top edge and a shaded side, its agent's mark, three lines, and the amber block and the stamp laid over it. */
function CardArt({ plan, mark, index, className }: { plan: CardPlan; mark: string; index: number; className: string }) {
  const [markX, markY, markSize] = plan.mark;
  const [maskX, maskY, maskW, maskH] = plan.mask;
  const [stampX, stampY, stampSize] = plan.stamp;
  const box = (x: number, y: number, w: number, h: number) => ({
    left: `${(x / plan.w) * 100}%`,
    top: `${(y / plan.h) * 100}%`,
    width: `${(w / plan.w) * 100}%`,
    height: `${(h / plan.h) * 100}%`,
  });
  const r = stampSize / 2;
  const [dx, dy] = back([0, 0], plan.w > 60 ? 3 : 2);
  return (
    <div className={`hf-card-face ${className}`}>
      <svg className="hf-card-art" viewBox={`0 0 ${plan.w} ${plan.h}`} aria-hidden="true" focusable="false">
        <Face points={[[0, 0], [plan.w, 0], [plan.w + dx, dy], [dx, dy]]} tone="mid" />
        <Face points={[[plan.w, 0], [plan.w + dx, dy], [plan.w + dx, plan.h + dy], [plan.w, plan.h]]} tone="checker" />
        <Face points={rectPoints(0, 0, plan.w, plan.h)} tone="light" />
        {plan.lines.map(([x, y, w]) => (
          <path key={y} className="hf-ink" d={toPath(rectPoints(x, y, w, plan.line))} />
        ))}
      </svg>
      <span className="hf-card-mark" style={box(markX, markY, markSize, markSize)}>
        <BrandMark name={mark} />
      </span>
      <span className={`hf-mask hf-k${index}`} style={box(maskX, maskY, maskW, maskH)}>
        <svg viewBox={`0 0 ${maskW} ${maskH}`} aria-hidden="true" focusable="false">
          <Face points={rectPoints(0, 0, maskW, maskH)} tone="amber" />
        </svg>
      </span>
      <span className={`hf-stamp hf-t${index}`} style={box(stampX, stampY, stampSize, stampSize)}>
        <svg viewBox={`0 0 ${stampSize} ${stampSize}`} aria-hidden="true" focusable="false">
          <Face points={ellipsePoints(r, r, r, r, 16)} tone="solid" />
          <path className="hf-knock" d={`M${r * 0.5} ${r}L${r * 0.85} ${r * 1.4}L${r * 1.5} ${r * 0.62}`} />
        </svg>
      </span>
    </div>
  );
}

/**
 * The loop holds while the picture is off screen or the tab is behind another,
 * and whenever the reader pauses it. It plays from the first paint: nothing
 * waits for the page's script to start it.
 */
export function HeroFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [held, setHeld] = useState(false);
  const paused = held || !inView || !pageVisible;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? true));
    observer.observe(element);
    const update = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div className="hf-panel">
      <div ref={ref} className="hf" data-paused={paused ? "true" : "false"}>
        <style href="hero-flow" precedence="default">
          {STYLESHEET}
        </style>
        <svg className="hf-defs" aria-hidden="true" focusable="false">
          <defs>
            <Glyphs />
          </defs>
        </svg>
        <div className="hf-stage" role="img" aria-label={FLOW.label}>
          <Scene layout={PHONE} />
          <Scene layout={WIDE} />

          {AGENTS.map((agent, index) => (
            <span key={agent.mark} className={`hf-mark hf-m${index}`}>
              <BrandMark name={agent.mark} />
            </span>
          ))}

          {AGENTS.map((agent, index) => (
            <div key={agent.mark} className={`hf-card-x hf-x${index}`}>
              <div className={`hf-card-y hf-y${index}`}>
                <div className={`hf-card hf-c${index}`}>
                  <CardArt plan={PHONE_CARD} mark={agent.mark} index={index} className="hf-phone" />
                  <CardArt plan={WIDE_CARD} mark={agent.mark} index={index} className="hf-wide" />
                </div>
              </div>
            </div>
          ))}

          <Base layout={PHONE} />
          <Base layout={WIDE} />
          <Mesh layout={PHONE} />
          <Mesh layout={WIDE} />
        </div>
      </div>
      <button
        type="button"
        className="site-icon-btn hf-toggle"
        aria-label={held ? FLOW.play : FLOW.pause}
        onClick={() => setHeld((value) => !value)}
      >
        {held ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>
    </div>
  );
}
