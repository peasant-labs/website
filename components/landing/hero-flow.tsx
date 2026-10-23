"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { HERO } from "@/lib/landing";
import { Pause, Play } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * The hero's picture, told without words and drawn the way the site's
 * pictures are: low-poly shapes in a fine halftone dot screen, warm-grey
 * hairline edges, soft dotted shadows on a ground of scattered dots, and one
 * amber accent.
 *
 * A transcript card lifts out of a laptop that runs the agents, glides through
 * a sieve that sweeps its secret line amber, is stamped as it is published,
 * and slides down onto the shared stack, which eases down a notch to make room
 * while one of the people standing at it lights up. Its accessible name tells
 * the same story.
 *
 * Every card makes the same journey, one cycle after the last, so the loop
 * never resets: a card lands on top, sinks one notch a cycle and slips behind
 * the base after four, and comes back out of the laptop on its next turn.
 *
 * Everything is placed on one cell grid, and every drawing uses the cell as its
 * unit, so one set of dot patterns fills them all, pinned to each object: the
 * screen travels with a card instead of shimmering across it. The picture
 * shows at fixed widths where a cell is a whole number of pixels (3px on a
 * phone and a mid-size screen, 4px on a wide one). A card moves on two nested
 * layers, across and down, each with its own curve, which bends its path. Only
 * transform, opacity and clip-path move; z-index steps a card behind the one
 * that lands on it. The resting state is one finished frame, and the loop is
 * laid over it only when motion is allowed.
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

/* ---------- the drawing's grid ---------- */

/* a card, in cells: the same drawing in every layout */
const CARD = { w: 48, h: 34 } as const;
/* inside a card: its mark, three lines (the middle one the secret), the amber block over it, the stamp */
const ON_CARD = {
  mark: [5, 4, 9] as const,
  lines: [
    [5, 17, 33],
    [5, 22, 25],
    [5, 27, 29],
  ] as const,
  mask: [4, 21, 27, 4] as const,
  stamp: [35, 3, 10] as const,
} as const;

type Point = readonly [x: number, y: number];
type Rect = readonly [x: number, y: number, w: number, h: number];
type Person = readonly [x: number, height: number];

/** One layout, every measure in cells. */
type Layout = Readonly<{
  width: number;
  height: number;
  ground: number;
  /** the laptop: its screen, and the deck's depth and reach past the screen */
  screen: Rect;
  deck: readonly [depth: number, reach: number];
  /** the three marks on the screen: centres and one size */
  marks: readonly Point[];
  mark: number;
  /** centres: lifted out of the laptop, held in the sieve, stamped above the stack */
  lifted: Point;
  atSieve: Point;
  stamped: Point;
  /** a wide screen reads left to right; a phone top to bottom */
  travel: "across" | "down";
  /** the sieve: a short framed mesh across the card's path */
  sieve: Rect;
  /** the stack: its left edge, the base's top and the step between cards */
  stack: readonly [left: number, baseTop: number, notch: number];
  /** the people at the stack: each one's centre and height, and one half width */
  people: readonly Person[];
  halfWidth: number;
}>;

/*
 * A wide screen: the laptop and the commons on one ground, an even gap between
 * the groups and the same margin outside, the screen's top level with the
 * stack's. The card travels on a shallow arc above them, through the sieve
 * standing in the gap, and the base under the stack is the cards' width.
 */
const WIDE: Layout = {
  width: 250,
  height: 156,
  ground: 122,
  screen: [20, 71, 72, 43],
  deck: [8, 4],
  marks: [36, 56, 76].map((x) => [x, 92] as const),
  mark: 15,
  lifted: [56, 52],
  atSieve: [115, 46],
  stamped: [158, 52],
  travel: "across",
  sieve: [112, 25, 6, 42],
  stack: [134, 114, 3],
  people: [
    [197, 38],
    [208, 43],
    [219, 35],
    [230, 41],
  ],
  halfWidth: 8,
};

/* a phone: the laptop on top, the sieve under it, the stack and the people on the ground */
const PHONE: Layout = {
  width: 100,
  height: 152,
  ground: 145,
  screen: [26, 6, 48, 26],
  deck: [5, 4],
  marks: [36, 50, 64].map((x) => [x, 19] as const),
  mark: 10,
  lifted: [50, 42],
  atSieve: [50, 66],
  stamped: [28, 80],
  travel: "down",
  sieve: [12, 70, 76, 4],
  stack: [4, 140, 3],
  people: [
    [63, 31],
    [72, 35],
    [81, 28],
    [90, 33],
  ],
  halfWidth: 6.5,
};

/* the person who lights up as each card lands: the tallest, nearest the stack */
const NOTICER = 1;

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
const stackTop = (layout: Layout) => layout.stack[1] - CARD.h - (DEPTH - 1) * layout.stack[2];

/** the card's centre across (0) or down (1), in cells, for a card that starts on one of the three marks */
function track(layout: Layout, slot: number, axis: 0 | 1): Track {
  const from = layout.marks[slot]![axis];
  const [stackLeft, , notch] = layout.stack;
  const rest = axis === 0 ? stackLeft + CARD.w / 2 : stackTop(layout) + CARD.h / 2;
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
  const half = axis === 0 ? CARD.w / 2 : CARD.h / 2;
  return stops.map(([ms, value, ease]) => [
    ms,
    `transform: ${axis === 0 ? "translateX" : "translateY"}(${cq(value - half)})`,
    ease,
  ]);
}

/*
 * The secret line turns amber where the sieve meets it, sampled from the
 * card's own path so the sweep stays under the mesh: on a wide screen from the
 * line's right end as the card crosses sideways, on a phone from its lower
 * edge as the card crosses downwards.
 */
function sweepStops(layout: Layout): Stop[] {
  const x = track(layout, 1, 0);
  const y = track(layout, 1, 1);
  const [sx, sy, sw, sh] = layout.sieve;
  const [mx, my, mw, mh] = ON_CARD.mask;
  const shown = (fraction: number) => {
    const hidden = n((1 - Math.min(1, Math.max(0, fraction))) * 100);
    return layout.travel === "across" ? `clip-path: inset(0 0 0 ${hidden}%)` : `clip-path: inset(${hidden}% 0 0 0)`;
  };
  const fraction = (ms: number) =>
    layout.travel === "across"
      ? (valueAt(x, ms) - CARD.w / 2 + mx + mw - (sx + sw / 2)) / mw
      : (valueAt(y, ms) - CARD.h / 2 + my + mh - (sy + sh / 2)) / mh;
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
  const [sx, sy, sw, sh] = layout.sieve;
  return [
    `.hf { aspect-ratio: ${layout.width} / ${layout.height} }`,
    ...layout.marks.flatMap(([x, y], slot) =>
      AGENTS.map((_, index) => index)
        .filter((index) => index % SHOWN === slot)
        .map((index) => `.hf-m${index} { left: ${cq(x - half)}; top: ${cq(y - half)}; width: ${cq(layout.mark)}; height: ${cq(layout.mark)} }`),
    ),
    `.hf-card { width: ${cq(CARD.w)}; height: ${cq(CARD.h)} }`,
    `.hf-mesh-${layout.travel} { left: ${cq(sx)}; top: ${cq(sy)}; width: ${cq(sw)}; height: ${cq(sh)} }`,
    `.hf-base-${layout.travel} { left: ${cq(layout.stack[0] - 1)}; top: ${cq(layout.stack[1])}; width: ${cq(CARD.w + 4)}; height: ${cq(layout.ground - layout.stack[1])} }`,
    ...AGENTS.map((_, index) => {
      const rest = at(index);
      return `.hf-x${index} { transform: translateX(${cq(rest.x - CARD.w / 2)}) }\n.hf-y${index} { transform: translateY(${cq(rest.y - CARD.h / 2)}) }`;
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
 * Three sizes, each a whole number of pixels per cell: a phone shows the tall
 * layout 300px wide (3px cells), a mid-size screen the wide one 750px wide
 * (3px), a wide screen 1000px wide (4px). The dots in each pattern are drawn in
 * thirds or quarters of a cell, so each set lands on whole pixels.
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

/* ---------- the dot screens ---------- */

/*
 * A fine, regular halftone: one dot per cell, its size the tone. Paper is a
 * dot in every other cell, light a small dot in every cell, mid a larger one,
 * dark the largest; shade is the soft screen of a contact shadow, and amber
 * the mid screen in amber. The ground is a sparse scatter over a large tile.
 */
type Grid = 3 | 4;

const SCATTER = [
  [1, 2], [7, 1], [13, 4], [19, 2], [26, 3], [31, 1], [4, 8], [10, 10], [17, 7], [23, 9], [29, 11], [2, 14],
  [8, 16], [15, 13], [21, 17], [27, 15], [33, 18], [5, 21], [12, 22], [18, 20], [25, 23], [31, 22], [9, 26], [22, 27],
] as const;

function Patterns({ grid }: { grid: Grid }) {
  const p = 1 / grid;
  /* a square dot of `size` pixels, centred in its cell as nearly as whole pixels allow */
  const dot = (x: number, y: number, size: number, key: string, className = "hf-dot") => {
    const start = Math.floor((grid - size) / 2) * p;
    return <rect key={key} className={className} x={x + start} y={y + start} width={size * p} height={size * p} />;
  };
  const tile = (id: string, w: number, h: number, children: ReactNode) => (
    <pattern id={`hf-${id}-${grid}`} patternUnits="userSpaceOnUse" width={w} height={h}>
      {children}
    </pattern>
  );
  const large = grid === 4 ? 3 : 2;
  const medium = 2;
  return (
    <>
      {tile("paper", 2, 2, [dot(0, 0, 1, "a")])}
      {tile("light", 1, 1, [dot(0, 0, 1, "a")])}
      {tile("mid", 1, 1, [dot(0, 0, medium, "a")])}
      {tile("dark", 1, 1, [dot(0, 0, large, "a")])}
      {tile("shade", 2, 1, [dot(0, 0, 1, "a")])}
      {tile("amber", 1, 1, [dot(0, 0, medium, "a", "hf-amber")])}
      {tile("ground", 36, 30, SCATTER.map(([x, y], index) => dot(x, y, 1, String(index))))}
    </>
  );
}

/* ---------- the drawings ---------- */

type Tone = "paper" | "light" | "mid" | "dark" | "amber" | "none";

/** a closed face: filled with the panel to cover what is behind it, screened, then edged with a hairline */
function Face({ d, tone, edge = true }: { d: string; tone: Tone; edge?: boolean }) {
  return (
    <>
      <path className="hf-fill" d={d} />
      {tone === "none" ? null : <path className={`hf-tone-${tone}`} d={d} />}
      {edge ? <path className="hf-out" d={d} /> : null}
    </>
  );
}

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
const poly = (points: readonly Point[]) => `M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

/* which of the two layouts a drawing belongs to; the stylesheet shows one */
const sizeClass = (layout: Layout) => (layout.travel === "across" ? "hf-wide" : "hf-phone");

/** A person seen from the front, low-poly: a pointed hood over a body that widens to the ground. */
function personFaces([x, height]: Person, halfWidth: number, ground: number) {
  const top = ground - height;
  const hood = halfWidth * 0.85;
  const neck = top + height * 0.36;
  const hoodFace = poly([
    [x, top],
    [x + hood, top + hood * 0.9],
    [x + hood * 0.8, neck],
    [x - hood * 0.8, neck],
    [x - hood, top + hood * 0.9],
  ]);
  const body = poly([
    [x - hood * 0.8, neck],
    [x + hood * 0.8, neck],
    [x + halfWidth, ground],
    [x - halfWidth, ground],
  ]);
  /* the body's shaded half: light falls from the left */
  const shadow = poly([
    [x, neck],
    [x + hood * 0.8, neck],
    [x + halfWidth, ground],
    [x, ground],
  ]);
  return { hoodFace, body, shadow };
}

/** The still parts: the ground's scatter, the shadows, the laptop and the people. */
function Scene({ layout }: { layout: Layout }) {
  const [sx, sy, sw, sh] = layout.screen;
  const [depth, reach] = layout.deck;
  const { ground, halfWidth } = layout;
  const deckTop = sy + sh;
  const deck = poly([
    [sx, deckTop],
    [sx + sw, deckTop],
    [sx + sw + reach, deckTop + depth],
    [sx - reach, deckTop + depth],
  ]);
  const lip = poly([
    [sx - reach, deckTop + depth - 1],
    [sx + sw + reach, deckTop + depth - 1],
    [sx + sw + reach, deckTop + depth],
    [sx - reach, deckTop + depth],
  ]);
  const side = poly([
    [sx + sw, sy],
    [sx + sw + 2, sy + 1],
    [sx + sw + 2, deckTop],
    [sx + sw, deckTop],
  ]);
  const inset = layout.travel === "across" ? 3 : 2;
  const peopleLeft = layout.people[0]![0] - halfWidth;
  const peopleRight = layout.people[layout.people.length - 1]![0] + halfWidth;
  const ordered = layout.people
    .map((person, index) => ({ person, index }))
    .sort((a, b) => Number(a.index === NOTICER) - Number(b.index === NOTICER));
  return (
    <svg className={`hf-art ${sizeClass(layout)}`} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-ground" d={rect(0, 0, layout.width, layout.height)} />
      <path className="hf-tone-shade" d={ellipse(sx + sw / 2 + 6, ground, sw / 2 + reach + 4, depth * 0.6)} />
      <path className="hf-tone-shade" d={ellipse((peopleLeft + peopleRight) / 2 + 4, ground, (peopleRight - peopleLeft) / 2 + 4, depth * 0.6)} />
      <Face d={side} tone="dark" />
      <Face d={rect(sx, sy, sw, sh)} tone="mid" />
      <Face d={rect(sx + inset, sy + inset, sw - 2 * inset, sh - 2 * inset)} tone="paper" />
      <Face d={deck} tone="light" />
      <Face d={lip} tone="dark" edge={false} />
      <path className="hf-out" d={deck} />
      {ordered.map(({ person, index }) => {
        const faces = personFaces(person, halfWidth, ground);
        return (
          <g key={person[0]}>
            <Face d={faces.body} tone="mid" edge={false} />
            <path className="hf-tone-dark" d={faces.shadow} />
            <path className="hf-out" d={faces.body} />
            <Face d={faces.hoodFace} tone="light" />
            {index === NOTICER ? <path className="hf-notice hf-tone-amber" d={faces.body} /> : null}
            {index === NOTICER ? <path className="hf-notice hf-out" d={faces.body} /> : null}
          </g>
        );
      })}
    </svg>
  );
}

/** The base the stack stands on, a low box as wide as the cards, drawn over the cards that have sunk into it. */
function Base({ layout }: { layout: Layout }) {
  const w = CARD.w + 4;
  const h = layout.ground - layout.stack[1];
  return (
    <svg className={`hf-base hf-base-${layout.travel} ${sizeClass(layout)}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-shade" d={ellipse(w / 2 + 3, h, w / 2 + 2, 1.5)} />
      <Face d={rect(0, 0, w - 2, 2)} tone="light" />
      <Face d={rect(0, 2, w - 2, h - 2)} tone="mid" />
      <Face d={poly([[w - 2, 0], [w, 1], [w, h], [w - 2, h]])} tone="dark" />
    </svg>
  );
}

/** The sieve: a framed mesh of hairlines, drawn over the card passing through it. */
function Mesh({ layout }: { layout: Layout }) {
  const [, , w, h] = layout.sieve;
  const step = 2;
  const across = layout.travel === "across";
  const wires = [];
  for (let at = step; at < (across ? h : w); at += step) {
    wires.push(
      across ? (
        <line key={at} className="hf-wire" x1={0} y1={at} x2={w} y2={at} />
      ) : (
        <line key={at} className="hf-wire" x1={at} y1={0} x2={at} y2={h} />
      ),
    );
  }
  return (
    <svg className={`hf-mesh hf-mesh-${layout.travel} ${sizeClass(layout)}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-light" d={rect(0, 0, w, h)} />
      {wires}
      <path className="hf-out" d={rect(0, 0, w, h)} />
    </svg>
  );
}

/** A card: paper with a shaded edge, its agent's mark, three lines, and the amber block and the stamp (a seal with its check pressed out) laid over it. */
function Card({ mark, index }: { mark: string; index: number }) {
  const [markX, markY, markSize] = ON_CARD.mark;
  const [maskX, maskY, maskW, maskH] = ON_CARD.mask;
  const [stampX, stampY, stampSize] = ON_CARD.stamp;
  const box = (x: number, y: number, w: number, h: number) => ({
    left: `${(x / CARD.w) * 100}%`,
    top: `${(y / CARD.h) * 100}%`,
    width: `${(w / CARD.w) * 100}%`,
    height: `${(h / CARD.h) * 100}%`,
  });
  const r = stampSize / 2;
  return (
    <div className={`hf-card hf-c${index}`}>
      <svg className="hf-card-art" viewBox={`0 0 ${CARD.w} ${CARD.h}`} aria-hidden="true" focusable="false">
        <Face d={rect(0, 0, CARD.w, CARD.h)} tone="paper" />
        <path className="hf-tone-mid" d={`M${CARD.w - 2} 1H${CARD.w}V${CARD.h}H1V${CARD.h - 2}H${CARD.w - 2}Z`} />
        {ON_CARD.lines.map(([x, y, w]) => (
          <path key={y} className="hf-line" d={rect(x, y, w, 1.5)} />
        ))}
        <path className="hf-out" d={rect(0, 0, CARD.w, CARD.h)} />
      </svg>
      <span className="hf-card-mark" style={box(markX, markY, markSize, markSize)}>
        <BrandMark name={mark} />
      </span>
      <span className={`hf-mask hf-k${index}`} style={box(maskX, maskY, maskW, maskH)}>
        <svg viewBox={`0 0 ${maskW} ${maskH}`} aria-hidden="true" focusable="false">
          <Face d={rect(0, 0, maskW, maskH)} tone="amber" />
        </svg>
      </span>
      <span className={`hf-stamp hf-t${index}`} style={box(stampX, stampY, stampSize, stampSize)}>
        <svg viewBox={`0 0 ${stampSize} ${stampSize}`} aria-hidden="true" focusable="false">
          <Face d={ellipse(r, r, r, r)} tone="dark" />
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
            <Patterns grid={3} />
            <Patterns grid={4} />
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
                <Card mark={agent.mark} index={index} />
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
