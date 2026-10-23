"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { HERO } from "@/lib/landing";
import { Pause, Play } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * The hero's picture, told without words and drawn the way the site's
 * pictures are: closed silhouettes with a bold outline, filled with dither
 * marks (dot, plus, square, checker) on a cell grid, lighter on lit faces and
 * denser in shadow, with amber for what is yours or hidden.
 *
 * A transcript card lifts out of a laptop that runs the agents, glides on a
 * gentle arc through a sieve that sweeps its secret line amber, is stamped as
 * it is published, and slides down onto the shared stack, which eases down a
 * notch to make room while one of the people standing at it lights up. Its
 * accessible name tells the same story.
 *
 * Every card makes the same journey, one cycle after the last, so the loop
 * never resets: a card lands on top, sinks one notch a cycle and slips behind
 * the table after four, and comes back out of the laptop on its next turn.
 *
 * Everything is placed on the cell grid, and every drawing uses the cell as
 * its unit, so one set of patterns fills them all, pinned to each object: the
 * texture travels with a card instead of shimmering across it. The picture
 * shows at fixed widths where a cell is a whole number of pixels (3px on a
 * phone and a mid-size screen, 4px on a wide one). A card moves on two nested
 * layers, across and down, each with its own curve, which bends its path into
 * an arc. Only transform, opacity and clip-path move; z-index steps a card
 * behind the one that lands on it. The resting state is one finished frame,
 * and the loop is laid over it only when motion is allowed.
 */

const FLOW = HERO.flow;
const AGENTS = FLOW.agents;
const COUNT = AGENTS.length;
/* the laptop shows three marks at a time: the first three agents, then the other three */
const SHOWN = 3;
/* how many cards show on the stack before one slips behind the table */
const DEPTH = 4;

/* one cycle per card; a card's own animation runs for all six cycles */
const CYCLE = 6000;
const LOOP = CYCLE * COUNT;

/* a card's journey, from the start of its cycle */
const BEAT = {
  lifted: 700,
  crest: 1700,
  glided: 2800,
  pressed: 2900,
  settled: 3150,
  landed: 4100,
  /* the stack makes room while the card comes down */
  roomFrom: 3250,
  roomTo: 4000,
  noticed: 4400,
  forgetFrom: 5200,
  forgotten: 5800,
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
  /** the picture's size */
  width: number;
  height: number;
  ground: number;
  /** the laptop: the screen's outer edge, the display's inset, and the deck's depth and reach past the screen */
  screen: Rect;
  inset: number;
  deck: readonly [depth: number, reach: number];
  /** the three marks on the display: centres and one size */
  marks: readonly Point[];
  mark: number;
  /** centres: lifted out of the laptop, the top of the arc (wide only), stamped above the stack */
  lifted: Point;
  crest: number;
  stamped: Point;
  /** on a wide screen the card travels across and rises then falls; on a phone it travels down and bends across late */
  travel: "across" | "down";
  /** the sieve: a short mesh panel across the card's path */
  sieve: Rect;
  /** the stack: its left edge, the table's top, the step between cards and the table's reach past them */
  stack: readonly [left: number, tableTop: number, notch: number, reach: number];
  /** the people at the stack: each one's centre and height, then the head's radius and the body's half width */
  people: readonly Person[];
  head: number;
  halfWidth: number;
}>;

const PHONE: Layout = {
  width: 100,
  height: 184,
  ground: 180,
  screen: [18, 6, 64, 36],
  inset: 3,
  deck: [6, 5],
  marks: [35, 50, 65].map((x) => [x, 24] as const),
  mark: 12,
  lifted: [50, 62],
  crest: 0,
  stamped: [30, 106],
  travel: "down",
  sieve: [14, 82, 72, 6],
  stack: [6, 170, 3, 4],
  people: [
    [65, 38],
    [73, 44],
    [81, 35],
    [89, 41],
  ],
  head: 4,
  halfWidth: 5,
};

const WIDE: Layout = {
  width: 250,
  height: 118,
  ground: 112,
  screen: [8, 66, 72, 38],
  inset: 3,
  deck: [8, 6],
  marks: [25, 44, 63].map((x) => [x, 85] as const),
  mark: 14,
  lifted: [56, 48],
  crest: 34,
  stamped: [168, 36],
  travel: "across",
  sieve: [100, 12, 10, 48],
  stack: [144, 100, 3, 4],
  people: [
    [205, 44],
    [216, 50],
    [227, 41],
    [238, 47],
  ],
  head: 5,
  halfWidth: 7,
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

/** the card's centre across (x) and down (y), in cells, for a card that starts on one of the three marks */
function tracks(layout: Layout, slot: number) {
  const [markX, markY] = layout.marks[slot]!;
  const [stackLeft, , notch] = layout.stack;
  const topCentre = stackTop(layout) + CARD.h / 2;
  const stackX = stackLeft + CARD.w / 2;
  const sinks: [number, number, Curve?][] = [];
  for (let depth = 1; depth <= DEPTH; depth += 1) {
    sinks.push([depth * CYCLE + BEAT.roomFrom, topCentre + (depth - 1) * notch, "in-out"]);
    sinks.push([depth * CYCLE + BEAT.roomTo, topCentre + depth * notch]);
  }
  const x: Track =
    layout.travel === "across"
      ? [
          [0, markX, "out"],
          [BEAT.lifted, layout.lifted[0], "in-out"],
          [BEAT.glided, layout.stamped[0]],
          [LOOP, stackX],
        ]
      : [
          [0, markX, "out"],
          [BEAT.lifted, layout.lifted[0]],
          [(BEAT.lifted + BEAT.glided) / 2, layout.lifted[0], "in-out"],
          [BEAT.glided, layout.stamped[0]],
          [LOOP, stackX],
        ];
  const glide: Track =
    layout.travel === "across"
      ? [
          [BEAT.lifted, layout.lifted[1], "out"],
          [BEAT.crest, layout.crest, "in-out"],
        ]
      : [[BEAT.lifted, layout.lifted[1], "in-out"]];
  const y: Track = [
    [0, markY, "out"],
    ...glide,
    [BEAT.glided, layout.stamped[1]],
    [BEAT.settled, layout.stamped[1], "in-out"],
    [BEAT.landed, topCentre],
    ...sinks,
    [LOOP, topCentre + DEPTH * notch],
  ];
  return { x, y };
}

/** a track's value at a moment, following its curves */
function valueAt(track: Track, ms: number) {
  for (let index = 0; index < track.length - 1; index += 1) {
    const [from, start, ease] = track[index]!;
    const [to, end] = track[index + 1]!;
    if (ms >= from && ms <= to) {
      const progress = to === from ? 1 : (ms - from) / (to - from);
      return start + (end - start) * (ease ? curve(ease)(progress) : progress);
    }
  }
  return track[track.length - 1]![1];
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
function shiftStops(layout: Layout, track: Track, axis: "x" | "y"): Stop[] {
  const cq = unit(layout);
  const half = axis === "x" ? CARD.w / 2 : CARD.h / 2;
  return track.map(([ms, value, ease]) => [
    ms,
    `transform: ${axis === "x" ? "translateX" : "translateY"}(${cq(value - half)})`,
    ease,
  ]);
}

/*
 * The secret line turns amber where the sieve meets it, sampled from the
 * card's own path so the sweep stays under the mesh. On a wide screen the card
 * crosses sideways and the amber follows the mesh along the line, from its
 * right end; on a phone the card crosses downwards and the block fills from
 * its lower edge.
 */
function sweepStops(layout: Layout): Stop[] {
  const { x, y } = tracks(layout, 1);
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
  for (let ms = BEAT.lifted; ms <= BEAT.glided; ms += 50) samples.push([ms, shown(fraction(ms)), "linear"]);
  samples.push([LOOP, shown(1)]);
  return samples;
}

/* where every card rests in the finished frame: the first card has just landed on the three before it */
function finishedAt(layout: Layout) {
  const moment = BEAT.landed + 200;
  return (index: number) => {
    const local = (moment + ((COUNT - index) % COUNT) * CYCLE) % LOOP;
    const { x, y } = tracks(layout, index % SHOWN);
    return { x: valueAt(x, local), y: valueAt(y, local) };
  };
}

function layoutRules(layout: Layout) {
  const cq = unit(layout);
  const half = layout.mark / 2;
  const at = finishedAt(layout);
  const [sx, sy, sw, sh] = layout.sieve;
  const [stackLeft, tableTop, , reach] = layout.stack;
  return [
    `.hf { aspect-ratio: ${layout.width} / ${layout.height} }`,
    ...layout.marks.flatMap(([x, y], slot) =>
      AGENTS.map((_, index) => index)
        .filter((index) => index % SHOWN === slot)
        .map((index) => `.hf-m${index} { left: ${cq(x - half)}; top: ${cq(y - half)}; width: ${cq(layout.mark)}; height: ${cq(layout.mark)} }`),
    ),
    `.hf-card { width: ${cq(CARD.w)}; height: ${cq(CARD.h)} }`,
    `.hf-mesh-${layout.travel} { left: ${cq(sx)}; top: ${cq(sy)}; width: ${cq(sw)}; height: ${cq(sh)} }`,
    `.hf-table-${layout.travel} { left: ${cq(stackLeft - reach)}; top: ${cq(tableTop)}; width: ${cq(CARD.w + 2 * reach)}; height: ${cq(layout.ground - tableTop)} }`,
    ...AGENTS.map((_, index) => {
      const rest = at(index);
      return `.hf-x${index} { transform: translateX(${cq(rest.x - CARD.w / 2)}) }\n.hf-y${index} { transform: translateY(${cq(rest.y - CARD.h / 2)}) }`;
    }),
  ].join("\n");
}

function layoutKeyframes(layout: Layout) {
  const slots = Array.from({ length: SHOWN }, (_, slot) => {
    const { x, y } = tracks(layout, slot);
    return [
      keyframes(`hf-x-${slot}`, LOOP, shiftStops(layout, x, "x")),
      keyframes(`hf-y-${slot}`, LOOP, shiftStops(layout, y, "y")),
    ];
  }).flat();
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
    [0, "opacity: 0; transform: scale(0.3)", "out"],
    [BEAT.lifted * 0.2, "opacity: 1; transform: scale(0.5)", "out"],
    [BEAT.lifted, "opacity: 1; transform: scale(1)"],
    [BEAT.glided, "opacity: 1; transform: scale(1)", "out"],
    [BEAT.pressed, "opacity: 1; transform: scale(0.96)", "out"],
    [BEAT.settled, "opacity: 1; transform: scale(1)"],
    [gone, "opacity: 1; transform: scale(1)", "out"],
    [gone + 300, "opacity: 0; transform: scale(1)"],
    [LOOP, "opacity: 0; transform: scale(1)"],
  ]);
  const stamp = keyframes("hf-stamp", LOOP, [
    [0, "opacity: 0; transform: scale(1.12)"],
    [BEAT.glided, "opacity: 0; transform: scale(1.12)", "out"],
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
      [t, rest, "out"],
      [t + 250, dip, "out"],
      [t + 900, rest],
    ];
    const stops: Stop[] =
      index < SHOWN
        ? [
            ...(index === 0 ? [] : ([[0, rest]] as Stop[])),
            ...lift,
            [swap - 400, rest, "out"],
            [swap - 100, hidden],
            [LOOP - 400, hidden, "out"],
            [LOOP - 100, rest],
            [LOOP, rest],
          ]
        : [
            [0, hidden],
            [swap - 400, hidden, "out"],
            [swap - 100, rest],
            ...lift,
            [LOOP - 400, rest, "out"],
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
 * (3px), a wide screen 1000px wide (4px). The marks in each pattern are drawn
 * in thirds or quarters of a cell, so each set lands on whole pixels.
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

/* ---------- the patterns ---------- */

/*
 * The dither marks, after the pictures' own: a dot, a plus, a square and a
 * checker on a cell, laid out over two by two cells. Light is a lone dot,
 * mid a dot in every cell, dark plusses with dots between them, amber a square
 * in every cell. Each comes in thirds and in quarters of a cell.
 */
type Grid = 3 | 4;

function marks(grid: Grid, kind: "dot" | "plus" | "square", cx: number, cy: number, className: string, key: string) {
  const p = 1 / grid;
  if (kind === "dot") {
    const at = grid === 3 ? p : 2 * p;
    return <rect key={key} className={className} x={cx + at} y={cy + at} width={p} height={p} />;
  }
  if (kind === "square") {
    return <rect key={key} className={className} x={cx + p} y={cy + p} width={2 * p} height={2 * p} />;
  }
  const arm = grid === 3 ? 1 : 3 * p;
  const offset = grid === 3 ? 0 : p;
  const middle = grid === 3 ? p : 2 * p;
  return (
    <g key={key} className={className}>
      <rect x={cx + middle} y={cy + offset} width={p} height={arm} />
      <rect x={cx + offset} y={cy + middle} width={arm} height={p} />
    </g>
  );
}

function Patterns({ grid }: { grid: Grid }) {
  const tile = (id: string, children: ReactNode) => (
    <pattern id={`hf-${id}-${grid}`} patternUnits="userSpaceOnUse" width={2} height={2}>
      {children}
    </pattern>
  );
  return (
    <>
      {tile("light", [marks(grid, "dot", 0, 0, "hf-ink", "a")])}
      {tile("mid", [
        marks(grid, "dot", 0, 0, "hf-ink", "a"),
        marks(grid, "dot", 1, 0, "hf-ink", "b"),
        marks(grid, "dot", 0, 1, "hf-ink", "c"),
        marks(grid, "dot", 1, 1, "hf-ink", "d"),
      ])}
      {tile("dark", [
        marks(grid, "plus", 0, 0, "hf-ink", "a"),
        marks(grid, "plus", 1, 1, "hf-ink", "b"),
        marks(grid, "dot", 1, 0, "hf-ink", "c"),
        marks(grid, "dot", 0, 1, "hf-ink", "d"),
      ])}
      {tile("amber", [
        marks(grid, "square", 0, 0, "hf-amber", "a"),
        marks(grid, "square", 1, 1, "hf-amber", "b"),
        marks(grid, "square", 1, 0, "hf-amber", "c"),
        marks(grid, "square", 0, 1, "hf-amber", "d"),
      ])}
    </>
  );
}

/* ---------- the drawings ---------- */

/** a closed shape: filled with the panel to cover what is behind it, then textured, then outlined */
function Solid({ d, tone }: { d: string; tone: "light" | "mid" | "dark" | "amber" | "none" }) {
  return (
    <>
      <path className="hf-fill" d={d} />
      {tone === "none" ? null : <path className={`hf-tone-${tone}`} d={d} />}
      <path className="hf-out" d={d} />
    </>
  );
}

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;

/* which of the two layouts a drawing belongs to; the stylesheet shows one */
const sizeClass = (layout: Layout) => (layout.travel === "across" ? "hf-wide" : "hf-phone");

/** The still parts: the ground, the laptop and the people. */
function Scene({ layout }: { layout: Layout }) {
  const [sx, sy, sw, sh] = layout.screen;
  const [depth, reach] = layout.deck;
  const { ground, head, halfWidth, inset } = layout;
  const deck = `M${sx} ${sy + sh}H${sx + sw}L${sx + sw + reach} ${sy + sh + depth}H${sx - reach}Z`;
  const ordered = layout.people
    .map((person, index) => ({ person, index }))
    .sort((a, b) => Number(a.index === NOTICER) - Number(b.index === NOTICER));
  return (
    <svg className={`hf-art ${sizeClass(layout)}`} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-mid" d={rect(0, ground - 1, layout.width, 1)} />
      <Solid d={rect(sx, sy, sw, sh)} tone="dark" />
      <Solid d={rect(sx + inset, sy + inset, sw - 2 * inset, sh - 2 * inset)} tone="light" />
      <Solid d={deck} tone="dark" />
      {ordered.map(({ person: [x, height], index }) => {
        const top = ground - height;
        const headY = top + head;
        const shoulders = top + 2 * head + 1;
        const corner = Math.round(halfWidth * 0.6);
        const left = x - halfWidth;
        const right = x + halfWidth;
        const body = `M${left} ${ground}V${shoulders + corner}Q${left} ${shoulders} ${left + corner} ${shoulders}H${right - corner}Q${right} ${shoulders} ${right} ${shoulders + corner}V${ground}Z`;
        const face = `M${x - head} ${headY}a${head} ${head} 0 1 0 ${2 * head} 0a${head} ${head} 0 1 0 ${-2 * head} 0Z`;
        return (
          <g key={x}>
            <Solid d={body} tone="dark" />
            <Solid d={face} tone="light" />
            {index === NOTICER ? <path className="hf-notice hf-tone-amber" d={face} /> : null}
            {index === NOTICER ? <path className="hf-notice hf-out" d={face} /> : null}
          </g>
        );
      })}
    </svg>
  );
}

/** The table the stack stands on: a lit top and a shaded front, drawn over the cards that have sunk into it. */
function Table({ layout }: { layout: Layout }) {
  const w = CARD.w + 2 * layout.stack[3];
  const h = layout.ground - layout.stack[1];
  return (
    <svg className={`hf-table hf-table-${layout.travel} ${sizeClass(layout)}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <Solid d={rect(0, 0, w, 3)} tone="light" />
      <Solid d={rect(0, 3, w, h - 3)} tone="dark" />
    </svg>
  );
}

/** The sieve: a short framed mesh of plusses, drawn over the card passing through it. */
function Mesh({ layout }: { layout: Layout }) {
  const [, , w, h] = layout.sieve;
  return (
    <svg className={`hf-mesh hf-mesh-${layout.travel} ${sizeClass(layout)}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-dark" d={rect(0, 0, w, h)} />
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
        <Solid d={rect(0, 0, CARD.w, CARD.h)} tone="light" />
        <path className="hf-tone-mid" d={`M${CARD.w - 2} 1H${CARD.w}V${CARD.h}H1V${CARD.h - 2}H${CARD.w - 2}Z`} />
        {ON_CARD.lines.map(([x, y, w]) => (
          <path key={y} className="hf-ink" d={rect(x, y, w, 2)} />
        ))}
        <path className="hf-out" d={rect(0, 0, CARD.w, CARD.h)} />
      </svg>
      <span className="hf-card-mark" style={box(markX, markY, markSize, markSize)}>
        <BrandMark name={mark} />
      </span>
      <span className={`hf-mask hf-k${index}`} style={box(maskX, maskY, maskW, maskH)}>
        <svg viewBox={`0 0 ${maskW} ${maskH}`} aria-hidden="true" focusable="false">
          <Solid d={rect(0, 0, maskW, maskH)} tone="amber" />
        </svg>
      </span>
      <span className={`hf-stamp hf-t${index}`} style={box(stampX, stampY, stampSize, stampSize)}>
        <svg viewBox={`0 0 ${stampSize} ${stampSize}`} aria-hidden="true" focusable="false">
          <path className="hf-ink" d={`M0 ${r}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`} />
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

          <Table layout={PHONE} />
          <Table layout={WIDE} />
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
