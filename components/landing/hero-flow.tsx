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
/** a person at the stack: centre, height, and what they hold */
type Person = readonly [x: number, height: number, holds: "rake" | "basket" | null];

/*
 * The scene is drawn in a three-quarter view: depth runs up and to the right,
 * a little over half a cell across and a third of a cell up for each cell of
 * depth, so every box shows a lit top, a front and a shaded side.
 */
const DEPTH_X = 0.55;
const DEPTH_Y = -0.35;
const back = ([x, y]: Point, depth: number): Point => [x + DEPTH_X * depth, y + DEPTH_Y * depth];

/** One layout, every measure in cells. */
type Layout = Readonly<{
  name: "phone" | "wide";
  width: number;
  height: number;
  /** the front edge of the ground everything in the commons stands on */
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
  /** which way the card crosses the sieve */
  travel: "across" | "down";
  /** the sieve's front frame: a short mesh across the card's path */
  sieve: Rect;
  /** the stack: its cards' left edge, the base's top, the step between cards and the base's depth */
  stack: readonly [left: number, baseTop: number, notch: number, depth: number];
  /** the people at the stack, the half width of a robe at its hem, and the one who lights up as a card lands */
  people: readonly Person[];
  robe: number;
  noticer: number;
}>;

/*
 * A wide screen, at 16:10: the laptop and the commons on one ground, an even
 * gap between the groups and the same margin outside, the screen's top level
 * with the stack's. The card travels a shallow arc above them, through the
 * sieve standing in the gap, onto a base as wide as the cards.
 */
const WIDE: Layout = {
  name: "wide",
  width: 250,
  height: 156,
  ground: 127,
  laptop: { x: 16, ground: 127, w: 70, depth: 24, deck: 2.5, screen: 40, lean: 3 },
  marks: [48, 66, 84].map((x) => [x, 96] as const),
  mark: 14,
  lifted: [60, 53],
  atSieve: [115, 47],
  stamped: [154, 53],
  travel: "across",
  sieve: [112, 25, 6, 42],
  stack: [130, 119, 3, 8],
  people: [
    [200, 42, "rake"],
    [215, 46, "basket"],
    [232, 40, null],
  ],
  robe: 8,
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
  ground: 118,
  laptop: { x: 3, ground: 40, w: 36, depth: 12, deck: 2, screen: 24, lean: 2 },
  marks: [18, 28.5, 39].map((x) => [x, 22] as const),
  mark: 8,
  lifted: [26, 40],
  atSieve: [52, 44],
  stamped: [73, 52],
  travel: "across",
  sieve: [48, 26, 4, 36],
  stack: [49, 112, 3, 4],
  people: [
    [11, 30, "rake"],
    [24, 34, "basket"],
    [38, 28, null],
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
    `.hf-mesh-${layout.name} { left: ${cq(sx)}; top: ${cq(sy)}; width: ${cq(sw)}; height: ${cq(sh)} }`,
    `.hf-base-${layout.name} { left: ${cq(layout.stack[0] - 1)}; top: ${cq(layout.stack[1])}; width: ${cq(CARD.w + 2)}; height: ${cq(layout.ground - layout.stack[1])} }`,
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
const sizeClass = (layout: Layout) => `hf-${layout.name}`;

/** A box in three-quarter view: its front, its lit top and its shaded side, from the front face's corner and size. */
function Box({ x, y, w, h, depth, front = "mid", top = "light", side = "dark" }: {
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
      <Face d={poly([[x, y], [x + w, y], [rx, ry], [bx, by]])} tone={top} />
      <Face d={poly([[x + w, y], [rx, ry], [rx, ry + h], [x + w, y + h]])} tone={side} />
      <Face d={rect(x, y, w, h)} tone={front} />
    </>
  );
}

/*
 * One of the people, low-poly like the pictures' peasants: a pointed hood on a
 * narrow neck over a robe that widens to the hem, each split into a lit face
 * and a shaded one, and maybe a rake or a basket.
 */
function Peasant({ person: [x, height, holds], robe, ground, lit }: { person: Person; robe: number; ground: number; lit: boolean }) {
  const top = ground - height;
  const hood = height * 0.27;
  const wide = robe * 0.72;
  const neck = top + hood;
  const nape = robe * 0.26;
  const shoulder = robe * 0.42;
  const hoodLit = poly([[x, top], [x, neck], [x - nape, neck], [x - wide * 0.86, top + hood * 0.74], [x - wide, top + hood * 0.52]]);
  const hoodShade = poly([[x, top], [x + wide, top + hood * 0.52], [x + wide * 0.86, top + hood * 0.74], [x + nape, neck], [x, neck]]);
  const hoodAll = poly([[x, top], [x + wide, top + hood * 0.52], [x + wide * 0.86, top + hood * 0.74], [x + nape, neck], [x - nape, neck], [x - wide * 0.86, top + hood * 0.74], [x - wide, top + hood * 0.52]]);
  const seam = x + robe * 0.18;
  const bodyLit = poly([[x - shoulder, neck], [seam - robe * 0.1, neck], [seam, ground], [x - robe, ground], [x - robe * 0.86, ground - height * 0.3]]);
  const bodyShade = poly([[seam - robe * 0.1, neck], [x + shoulder, neck], [x + robe * 0.84, ground - height * 0.24], [x + robe, ground], [seam, ground]]);
  const bodyAll = poly([[x - shoulder, neck], [x + shoulder, neck], [x + robe * 0.84, ground - height * 0.24], [x + robe, ground], [x - robe, ground], [x - robe * 0.86, ground - height * 0.3]]);
  const basketX = x + robe * 0.55;
  const basketY = ground - height * 0.5;
  const basket = poly([[basketX, basketY], [basketX + robe * 1.1, basketY], [basketX + robe * 0.95, basketY + robe * 0.75], [basketX + robe * 0.15, basketY + robe * 0.75]]);
  const pole = x - robe - 1;
  return (
    <g>
      <path className="hf-tone-shade" d={ellipse(x + 2, ground, robe + 3, 1.6)} />
      {holds === "rake" ? (
        <>
          <Face d={poly([[pole, ground], [pole + 0.9, ground], [pole + 3.4, top - 4], [pole + 2.5, top - 4]])} tone="mid" />
          <Face d={poly([[pole - 0.5, top - 4.6], [pole + 6.5, top - 3.6], [pole + 6.4, top - 2.8], [pole - 0.6, top - 3.8]])} tone="dark" />
        </>
      ) : null}
      <Face d={bodyLit} tone="mid" edge={false} />
      <Face d={bodyShade} tone="dark" edge={false} />
      <path className="hf-out" d={bodyAll} />
      <Face d={hoodLit} tone="light" edge={false} />
      <Face d={hoodShade} tone="mid" edge={false} />
      <path className="hf-out" d={hoodAll} />
      {holds === "basket" ? <Face d={basket} tone="mid" /> : null}
      {holds === "basket" && lit ? <path className="hf-notice hf-tone-amber" d={basket} /> : null}
      {holds !== "basket" && lit ? <path className="hf-notice hf-tone-amber" d={hoodAll} /> : null}
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
  const inset = layout.name === "wide" ? 3 : 2;
  const display: Point[] = [
    [blx + inset * 0.6, bly - inset * 0.6],
    [brx - inset * 0.6, bry - inset * 0.6],
    [brx + lean - inset * 0.6, screenTop + inset],
    [blx + lean + inset * 0.6, screenTop + inset],
  ];
  const edge = 1.5;
  const [ex, ey] = back([0, 0], edge);
  const plane = (from: number, to: number, front: number, deep: number) =>
    poly([[from, front], [to, front], back([to, front], deep), back([from, front], deep)]);
  const { ground } = layout;
  return (
    <svg className={`hf-art ${sizeClass(layout)}`} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-ground" d={rect(0, 0, layout.width, layout.height)} />
      <path className="hf-tone-paper" d={plane(layout.width * 0.03, layout.width * 0.9, ground + 3, layout.name === "wide" ? 30 : 16)} />
      <path className="hf-tone-shade" d={ellipse(x + w / 2 + 8, lg + 0.5, w / 2 + 8, 2.4)} />
      <Face d={poly([[brx, bry], [brx + ex, bry + ey], [brx + lean + ex, screenTop + ey], [brx + lean, screenTop]])} tone="dark" />
      <Face d={poly([[blx + lean, screenTop], [brx + lean, screenTop], [brx + lean + ex, screenTop + ey], [blx + lean + ex, screenTop + ey]])} tone="light" />
      <Face d={poly(face)} tone="mid" />
      <Face d={poly(display)} tone="paper" />
      <Box x={x} y={deckTop} w={w} h={deck} depth={depth} front="dark" top="light" side="dark" />
      <path className="hf-tone-mid" d={poly([back([x + w * 0.12, deckTop], depth * 0.2), back([x + w * 0.88, deckTop], depth * 0.2), back([x + w * 0.88, deckTop], depth * 0.75), back([x + w * 0.12, deckTop], depth * 0.75)])} />
      {layout.people.map((person, index) => (
        <Peasant key={person[0]} person={person} robe={layout.robe} ground={ground} lit={index === layout.noticer} />
      ))}
    </svg>
  );
}

/** The base the stack stands on: a low box as wide as the cards, drawn over the cards that have sunk into it. */
function Base({ layout }: { layout: Layout }) {
  const w = CARD.w + 2;
  const h = layout.ground - layout.stack[1];
  const depth = layout.stack[3];
  return (
    <svg className={`hf-base hf-base-${layout.name} ${sizeClass(layout)}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-shade" d={ellipse(w / 2 + 4, h + 0.5, w / 2 + 6, 2)} />
      <Box x={0} y={0} w={w} h={h} depth={depth} />
    </svg>
  );
}

/** The sieve: a framed mesh with a little depth, drawn over the card passing through it. */
function Mesh({ layout }: { layout: Layout }) {
  const [, , w, h] = layout.sieve;
  const step = 2;
  const wires = [];
  for (let at = step; at < h; at += step) wires.push(<line key={`r${at}`} className="hf-wire" x1={0} y1={at} x2={w} y2={at} />);
  for (let at = step; at < w; at += step) wires.push(<line key={`c${at}`} className="hf-wire" x1={at} y1={0} x2={at} y2={h} />);
  const [dx, dy] = back([0, 0], 2);
  return (
    <svg className={`hf-mesh hf-mesh-${layout.name} ${sizeClass(layout)}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <Face d={poly([[w, 0], [w + dx, dy], [w + dx, h + dy], [w, h]])} tone="dark" />
      <Face d={poly([[0, 0], [w, 0], [w + dx, dy], [dx, dy]])} tone="light" />
      {wires}
      <path className="hf-out" d={rect(0, 0, w, h)} />
    </svg>
  );
}

/** A card: a slab of paper with a lit top edge and a shaded side, its agent's mark, three lines, and the amber block and the stamp (a seal with its check pressed out) laid over it. */
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
  const [dx, dy] = back([0, 0], 2);
  return (
    <div className={`hf-card hf-c${index}`}>
      <svg className="hf-card-art" viewBox={`0 0 ${CARD.w} ${CARD.h}`} aria-hidden="true" focusable="false">
        <Face d={poly([[0, 0], [CARD.w, 0], [CARD.w + dx, dy], [dx, dy]])} tone="light" />
        <Face d={poly([[CARD.w, 0], [CARD.w + dx, dy], [CARD.w + dx, CARD.h + dy], [CARD.w, CARD.h]])} tone="dark" />
        <Face d={rect(0, 0, CARD.w, CARD.h)} tone="paper" />
        {ON_CARD.lines.map(([x, y, w]) => (
          <path key={y} className="hf-line" d={rect(x, y, w, 1.5)} />
        ))}
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
