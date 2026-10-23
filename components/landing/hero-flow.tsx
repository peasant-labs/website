"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { HERO } from "@/lib/landing";
import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * The hero's picture, told without words and drawn the way the site's
 * pictures are: low-poly shapes in three-quarter view, shaded with glyphs on a
 * fine grid (dots, plusses, checkers, solid squares), every edge a run of
 * solid squares on the same grid, a sparse dotted ground and patterned contact
 * shadows, in two inks: near-black (light on the dark page) and amber.
 *
 * A transcript card comes up on the laptop's screen out of its agent's mark;
 * a scan line sweeps down the screen and turns the card's secret line into an
 * amber block while it is still on the computer; the card lifts out of the
 * laptop, glides over to the commons, is stamped as it is published, and
 * slides down onto the shared stack, which eases down a notch to make room
 * while one of the peasants standing at it lifts an amber basket. Its
 * accessible name tells the same story.
 *
 * Every card makes the same journey, one cycle after the last, so the loop
 * never resets: a card lands on top, sinks one notch a cycle and slips behind
 * the base after four, and comes back out of the laptop on its next turn.
 *
 * The unit of every drawing is one grid cell, and the picture shows at widths
 * where a cell is a whole number of pixels: 3px on a phone and a wide screen,
 * 2px between. Glyph patterns tile from each drawing's own origin, so the
 * texture travels with a card instead of shimmering across it, and edges are
 * worked out here, cell by cell, so they step on the grid. A card moves on two
 * nested layers, across and down, each with its own curve, which bends its
 * path. Only transform, opacity and clip-path move; z-index steps a card
 * behind the one that lands on it. The resting state is one finished frame,
 * and the loop is laid over it only when motion is allowed.
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
  onScreen: 700,
  scanFrom: 900,
  scanTo: 1900,
  lift: 2300,
  lifted: 3100,
  crest: 3700,
  stamped: 4400,
  settled: 4650,
  drop: 4900,
  landed: 5900,
  /* the stack makes room while the card comes down */
  roomFrom: 5000,
  roomTo: 5800,
  noticed: 6300,
  forgetFrom: 7600,
  forgotten: 8200,
} as const;

/*
 * fairtrade's --ease-out and --ease-in-out, as numbers: a keyframe cannot read
 * a custom property for its timing function.
 */
const CURVES = {
  out: [0.23, 1, 0.32, 1],
  "in-out": [0.77, 0, 0.175, 1],
} as const;
type Curve = keyof typeof CURVES;

type Point = readonly [x: number, y: number];
type Rect = readonly [x: number, y: number, w: number, h: number];

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

/** a person at the commons: where they stand, how tall, and what they hold */
type Person = readonly [x: number, height: number, holds: "rake" | "basket" | null];

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
  /** the three marks on the screen, a centred group: the middle one's centre, the step between them and one size */
  marks: readonly [x: number, y: number, step: number, size: number];
  /** how small a card shows on the screen */
  onScreen: number;
  /** centres: lifted out of the laptop, the top of its arc, stamped above the stack */
  lifted: Point;
  crest: Point;
  stamped: Point;
  /** the stack: its cards' left edge, the base's top, the step between cards and the base's depth */
  stack: readonly [left: number, baseTop: number, notch: number, depth: number];
  /** the peasants at the commons, the one whose basket lights up, and the wheat sheaves: where and how tall */
  people: readonly Person[];
  noticer: number;
  sheaves: readonly (readonly [x: number, height: number, ground: number])[];
}>;

/*
 * A wide screen: the laptop and the commons on one ground, the same margin
 * outside them, and the card's arc over the gap between them, the whole
 * picture centred in a stage a little wider than 16:9.
 */
const WIDE: Layout = {
  name: "wide",
  width: 333,
  height: 190,
  card: WIDE_CARD,
  ground: 156,
  laptop: { x: 12, ground: 156, w: 90, depth: 30, deck: 3, screen: 62, lean: 4 },
  marks: [75.5, 112, 24, 16],
  onScreen: 0.85,
  lifted: [75.5, 60],
  crest: [118, 54],
  stamped: [166, 68],
  stack: [136, 146, 3, 6],
  people: [
    [234, 60, "rake"],
    [264, 64, "basket"],
    [298, 57, null],
  ],
  noticer: 1,
  sheaves: [
    [212, 28, 156],
    [319, 28, 156],
  ],
};

/*
 * A phone, at 4:5: the laptop above, and below it the peasants on the left and
 * the stack on the right, the card coming down from the screen onto it.
 */
const PHONE: Layout = {
  name: "phone",
  width: 100,
  height: 125,
  card: PHONE_CARD,
  ground: 118,
  laptop: { x: 6, ground: 46, w: 54, depth: 16, deck: 2, screen: 30, lean: 2 },
  marks: [42, 23, 13, 9],
  onScreen: 0.74,
  lifted: [70, 52],
  crest: [70, 50],
  stamped: [70, 50],
  stack: [46, 112, 3, 4],
  people: [
    [10, 30, "rake"],
    [24, 33, "basket"],
    [37, 28, null],
  ],
  noticer: 1,
  sheaves: [],
};

/* the centres of the three marks on the screen */
const markCentres = (layout: Layout): Point[] => {
  const [x, y, step] = layout.marks;
  return [-1, 0, 1].map((offset) => [x + offset * step, y] as const);
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
  const from = markCentres(layout)[slot]![axis];
  const screen = [layout.marks[0], layout.marks[1]][axis];
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
    [BEAT.onScreen, screen],
    [BEAT.lift, screen, "in-out"],
    [BEAT.lifted, layout.lifted[axis], axis === 0 ? "in-out" : "out"],
    [BEAT.crest, layout.crest[axis], "in-out"],
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

/* the laptop's screen, as drawn: the panel and the display inside its bezel */
function screenOf(layout: Layout) {
  const { x, ground, w, depth, deck, screen, lean } = layout.laptop;
  const deckTop = ground - deck;
  const [blx, bly] = back([x, deckTop], depth);
  const [brx, bry] = back([x + w, deckTop], depth);
  const top = bly - screen;
  const inset = layout.name === "wide" ? 4 : 2;
  const face: Point[] = [[blx, bly], [brx, bry], [brx + lean, top], [blx + lean, top]];
  const display: Point[] = [
    [blx + inset, bly - inset * 0.8],
    [brx - inset, bry - inset * 0.8],
    [brx + lean - inset, top + inset],
    [blx + lean + inset, top + inset],
  ];
  return { face, display, top: top + inset, bottom: bly - inset * 0.8, left: blx + lean + inset, right: brx - inset, deckTop };
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
 * The scan line runs down the display; the secret line turns amber, top
 * first, while the scan line crosses it, on the card still sitting on the
 * screen at its smaller size.
 */
function scanStops(layout: Layout): { scan: Stop[]; sweep: Stop[] } {
  const { top, bottom } = screenOf(layout);
  const cq = unit(layout);
  const run = bottom - top;
  const [, my, , mh] = layout.card.mask;
  const cardTop = layout.marks[1] - (layout.card.h * layout.onScreen) / 2;
  const from = cardTop + my * layout.onScreen;
  const to = from + mh * layout.onScreen;
  const at = (y: number) => BEAT.scanFrom + ((y - top) / run) * (BEAT.scanTo - BEAT.scanFrom);
  const scan: Stop[] = [
    [0, `opacity: 0; transform: translateY(0)`],
    [BEAT.scanFrom - 150, `opacity: 0; transform: translateY(0)`, "out"],
    [BEAT.scanFrom, `opacity: 1; transform: translateY(0)`, "linear"],
    [BEAT.scanTo, `opacity: 1; transform: translateY(${cq(run)})`, "out"],
    [BEAT.scanTo + 200, `opacity: 0; transform: translateY(${cq(run)})`],
    [CYCLE, `opacity: 0; transform: translateY(${cq(run)})`],
  ];
  const sweep: Stop[] = [
    [0, "clip-path: inset(0 0 100% 0)"],
    [at(from), "clip-path: inset(0 0 100% 0)", "linear"],
    [at(to), "clip-path: inset(0 0 0 0)"],
    [LOOP, "clip-path: inset(0 0 0 0)"],
  ];
  return { scan, sweep };
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
  const size = layout.marks[3];
  const half = size / 2;
  const at = finishedAt(layout);
  const { w, h } = layout.card;
  const { top, left, right } = screenOf(layout);
  return [
    `.hf { aspect-ratio: ${layout.width} / ${layout.height} }`,
    ...markCentres(layout).flatMap(([x, y], slot) =>
      AGENTS.map((_, index) => index)
        .filter((index) => index % SHOWN === slot)
        .map((index) => `.hf-m${index} { left: ${cq(x - half)}; top: ${cq(y - half)}; width: ${cq(size)}; height: ${cq(size)} }`),
    ),
    `.hf-card { width: ${cq(w)}; height: ${cq(h)} }`,
    `.hf-scan-${layout.name} { left: ${cq(left)}; top: ${cq(top)}; width: ${cq(right - left)}; height: ${cq(1)} }`,
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
  const { scan, sweep } = scanStops(layout);
  return [...slots, keyframes("hf-scan", CYCLE, scan), keyframes("hf-sweep", LOOP, sweep)].join("\n");
}

/* everything that moves the same way whatever the layout */
function sharedKeyframes(phoneScale: number, wideScale: number) {
  /* a card is drawn above the stack while it travels and lands, then steps behind each card that lands on it */
  const z: Stop[] = [[0, "z-index: 10"]];
  for (let depth = 1; depth <= DEPTH; depth += 1) {
    z.push([depth * CYCLE + BEAT.roomFrom - 1, `z-index: ${depth === 1 ? 10 : 11 - depth}`]);
    z.push([depth * CYCLE + BEAT.roomFrom, `z-index: ${depth === DEPTH ? 1 : 10 - depth}`]);
  }
  z.push([LOOP, "z-index: 1"]);

  const gone = DEPTH * CYCLE + BEAT.roomTo;
  const card = (name: string, small: number) =>
    keyframes(name, LOOP, [
      [0, `opacity: 0; transform: scale(${n(small * 0.35)})`, "in-out"],
      [200, `opacity: 1; transform: scale(${n(small * 0.5)})`, "in-out"],
      [BEAT.onScreen, `opacity: 1; transform: scale(${small})`],
      [BEAT.lift, `opacity: 1; transform: scale(${small})`, "in-out"],
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
  /* the marks give way while a card fills the screen, and come back once it lifts out */
  const giveWay = keyframes("hf-marks", CYCLE, [
    [0, "opacity: 1", "out"],
    [BEAT.onScreen, "opacity: 0"],
    [BEAT.lift, "opacity: 0", "out"],
    [BEAT.lifted, "opacity: 1"],
    [CYCLE, "opacity: 1"],
  ]);
  /* the first three marks show for the first three cycles, the other three for the rest */
  const swap = SHOWN * CYCLE;
  const rest = "opacity: 1";
  const hidden = "opacity: 0";
  const marks = AGENTS.map((_, index) =>
    keyframes(
      `hf-mark-${index}`,
      LOOP,
      index < SHOWN
        ? [[0, rest], [swap - 500, rest, "out"], [swap - 100, hidden], [LOOP - 500, hidden, "out"], [LOOP - 100, rest], [LOOP, rest]]
        : [[0, hidden], [swap - 500, hidden, "out"], [swap - 100, rest], [LOOP - 500, rest, "out"], [LOOP - 100, hidden], [LOOP, hidden]],
    ),
  );
  return [keyframes("hf-z", LOOP, z), card("hf-card-phone", phoneScale), card("hf-card-wide", wideScale), stamp, notice, giveWay, ...marks].join("\n");
}

function motionRules(cardName: string) {
  const run = (name: string, length: number, delay: number) => `animation: ${name} ${length}ms linear ${-delay}ms infinite`;
  /* card i is i cycles into the loop when the page starts, so the stack is already there */
  const offset = (index: number) => ((COUNT - index) % COUNT) * CYCLE;
  return AGENTS.flatMap((_, index) => {
    const slot = index % SHOWN;
    const delay = offset(index);
    return [
      `.hf-x${index} { animation: hf-x-${slot} ${LOOP}ms linear ${-delay}ms infinite, hf-z ${LOOP}ms linear ${-delay}ms infinite }`,
      `.hf-y${index} { ${run(`hf-y-${slot}`, LOOP, delay)} }`,
      `.hf-c${index} { ${run(cardName, LOOP, delay)} }`,
      `.hf-k${index} { ${run("hf-sweep", LOOP, delay)} }`,
      `.hf-t${index} { ${run("hf-stamp", LOOP, delay)} }`,
    ];
  }).join("\n");
}

const sharedMotion = [
  ...AGENTS.map((_, index) => `.hf-m${index} { animation: hf-mark-${index} ${LOOP}ms linear infinite }`),
  `.hf-marks { animation: hf-marks ${CYCLE}ms linear infinite }`,
  `.hf-notice { animation: hf-notice ${CYCLE}ms linear infinite }`,
  `.hf-scan { animation: hf-scan ${CYCLE}ms linear infinite }`,
  `.hf[data-paused=true] * { animation-play-state: paused }`,
].join("\n");

const RESTING = [
  ...AGENTS.map((_, index) => {
    const depth = (COUNT - index) % COUNT;
    const shown = depth < DEPTH;
    return `.hf-x${index} { z-index: ${shown ? 10 - depth : 1} }\n.hf-c${index} { opacity: ${shown ? 1 : 0} }\n.hf-m${index} { opacity: ${index < SHOWN ? 1 : 0} }`;
  }),
  `.hf-notice { opacity: 1 }`,
  `.hf-scan { opacity: 0 }`,
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
  sharedKeyframes(PHONE.onScreen, WIDE.onScreen),
  `.hf .hf-wide { display: none }`,
  `@media (min-width: 53rem) {\n.hf .hf-phone { display: none }\n.hf .hf-wide { display: block }\n${layoutRules(WIDE)}\n${layoutKeyframes(WIDE)}\n}`,
  `@media (prefers-reduced-motion: no-preference) {\n${motionRules("hf-card-phone")}\n${sharedMotion}\n@media (min-width: 53rem) {\n${motionRules("hf-card-wide")}\n}\n}`,
].join("\n");

/* ---------- the glyphs ---------- */

/*
 * One glyph per cell, drawn in thirds of a cell so each lands on whole pixels
 * at 3px. The tones, lightest first: a dot in every other cell, plusses with
 * dots between, a checker in every cell, a solid square in every cell. Amber
 * is the checker in amber; contact shadows thin out from plusses to dots; the
 * ground is a sparse scatter.
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

const SCATTER: readonly Point[] = [
  [3, 2], [17, 5], [29, 1], [41, 7], [8, 13], [23, 16], [36, 12], [47, 18], [2, 24], [14, 28], [31, 25], [44, 31], [9, 37], [26, 40], [39, 36],
];

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

/** the cells a run of segments passes through, as one path of unit squares */
function cellsAlong(points: readonly Point[], closed: boolean) {
  const cells = new Set<string>();
  const last = closed ? points.length : points.length - 1;
  for (let index = 0; index < last; index += 1) {
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
  return [...cells]
    .map((cell) => {
      const [x, y] = cell.split(",");
      return `M${x} ${y}h1v1h-1z`;
    })
    .join("");
}

const edgeCells = (points: readonly Point[]) => cellsAlong(points, true);

/* ---------- the drawings ---------- */

/* a face's light: lit faces the lightest glyphs, then mid, shade and deep */
type Light = "lit" | "mid" | "shade" | "deep" | "amber";

const toPath = (points: readonly Point[]) => `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}Z`;
const rectPoints = (x: number, y: number, w: number, h: number): Point[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
function ellipsePoints(cx: number, cy: number, rx: number, ry: number, sides = 24): Point[] {
  return Array.from({ length: sides }, (_, index) => {
    const angle = (index / sides) * Math.PI * 2;
    return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry] as const;
  });
}

/** a closed face: filled with the panel to cover what is behind it, shaded with its glyphs, edged with squares */
function Face({ points, light, edge = true }: { points: readonly Point[]; light: Light; edge?: boolean }) {
  const d = toPath(points);
  return (
    <>
      <path className="hf-fill" d={d} />
      <path className={`hf-light-${light}`} d={d} />
      {edge ? <path className="hf-ink" d={edgeCells(points)} /> : null}
    </>
  );
}

/** a contact shadow: glyphs thinning out from a darker core at the base */
function Shadow({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <>
      <path className="hf-tone-shade" d={toPath(ellipsePoints(cx, cy, rx, ry))} />
      <path className="hf-tone-shade-core" d={toPath(ellipsePoints(cx - rx * 0.12, cy, rx * 0.66, ry * 0.6))} />
    </>
  );
}

/** A box in three-quarter view: its lit top, its shaded side and its front, from the front face's corner and size. */
function Box({ x, y, w, h, depth, front = "mid", top = "lit", side = "shade" }: {
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  front?: Light;
  top?: Light;
  side?: Light;
}) {
  const [bx, by] = back([x, y], depth);
  const [rx, ry] = back([x + w, y], depth);
  return (
    <>
      <Face points={[[x, y], [x + w, y], [rx, ry], [bx, by]]} light={top} />
      <Face points={[[x + w, y], [rx, ry], [rx, ry + h], [x + w, y + h]]} light={side} />
      <Face points={rectPoints(x, y, w, h)} light={front} />
    </>
  );
}

/* which of the two layouts a drawing belongs to; the stylesheet shows one */
const sizeClass = (layout: Layout) => `hf-${layout.name}`;

/*
 * The peasants, traced from the pictures' village: a peaked hat with a brim on
 * a narrow neck, over a robe that widens to the hem, in units of the figure's
 * height from its peak (x) and from the ground (y). The basket rides at the
 * hip; the rake's handle runs from above the hat to the ground beside it.
 */
const HAT: Point[] = [
  [0, -1], [0.214, -0.85], [0.105, -0.782], [0.086, -0.763], [-0.087, -0.763], [-0.119, -0.788], [-0.215, -0.85],
];
const ROBE_LIT: Point[] = [
  [0.0, -0.763], [0.03, 0], [-0.042, 0], [-0.074, -0.017], [-0.215, -0.051], [-0.187, -0.25], [-0.151, -0.545], [-0.119, -0.718], [-0.081, -0.744], [-0.087, -0.763],
];
const ROBE_SHADE: Point[] = [
  [0.0, -0.763], [0.086, -0.763], [0.105, -0.735], [0.128, -0.699], [0.144, -0.538], [0.163, -0.41], [0.201, -0.286], [0.21, -0.214], [0.229, -0.119], [0.21, -0.096], [0.15, -0.026], [0.03, 0],
];
const BASKET: Point[] = [
  [0.144, -0.526], [0.323, -0.517], [0.377, -0.471], [0.342, -0.333], [0.304, -0.29], [0.201, -0.286], [0.17, -0.41],
];
const RAKE_HANDLE: Point[] = [[0.18, -1.15], [0.205, -1.15], [0.385, -0.02], [0.36, -0.02]];
const RAKE_HEAD: Point[] = [[-0.12, -1.19], [0.3, -1.15], [0.3, -1.125], [-0.12, -1.165]];

function Peasant({ person: [x, height, holds], ground, lit }: { person: Person; ground: number; lit: boolean }) {
  const place = (shape: readonly Point[]): Point[] => shape.map(([u, v]) => [x + u * height, ground + v * height] as const);
  const hat = place(HAT);
  const hatLit: Point[] = [hat[0]!, [x, hat[3]![1]], ...hat.slice(4)];
  const hatShade: Point[] = [hat[0]!, ...hat.slice(1, 4), [x, hat[3]![1]]];
  return (
    <g>
      <Shadow cx={x + height * 0.1} cy={ground + 0.6} rx={height * 0.3} ry={height * 0.05} />
      {holds === "rake" ? (
        <>
          <Face points={place(RAKE_HANDLE)} light="mid" />
          <Face points={place(RAKE_HEAD)} light="shade" />
        </>
      ) : null}
      <Face points={place(ROBE_LIT)} light="mid" edge={false} />
      <Face points={place(ROBE_SHADE)} light="shade" edge={false} />
      <path className="hf-ink" d={edgeCells(place([...ROBE_SHADE.slice(1, -1), ...ROBE_LIT.slice(2, -1)]))} />
      <Face points={hatLit} light="lit" edge={false} />
      <Face points={hatShade} light="shade" edge={false} />
      <path className="hf-ink" d={edgeCells(hat)} />
      {holds === "basket" ? (
        <>
          <Face points={place(BASKET)} light="mid" />
          {lit ? (
            <g className="hf-notice">
              <path className="hf-light-amber" d={toPath(place(BASKET))} />
              <path className="hf-ink" d={edgeCells(place(BASKET))} />
            </g>
          ) : null}
        </>
      ) : null}
    </g>
  );
}

/**
 * A wheat sheaf, flat like the pictures': twenty stalks gathered by a twine
 * band, spread at the foot and fanned above, each with an ear drooping outward,
 * every stalk and ear a run of squares on the grid.
 */
function Sheaf({ x, height, ground }: { x: number; height: number; ground: number }) {
  const band = ground - height * 0.42;
  const top = ground - height;
  const strokes: Point[][] = [];
  const count = 11;
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1) - 0.5;
    const lean = t < 0 ? -1 : 1;
    const tipX = x + t * height * 0.72;
    const tipY = top + t * t * height * 0.8;
    strokes.push([
      [x + t * height * 0.12, band],
      [tipX, tipY],
    ]);
    // each ear droops away from the middle
    strokes.push([
      [tipX, tipY],
      [tipX + lean * height * 0.05, tipY - height * 0.03],
      [tipX + lean * height * 0.1, tipY + height * 0.02],
    ]);
    // every other stalk carries on below the band, splayed, so the butts stay apart
    if (index % 2 === 0) strokes.push([[x + t * height * 0.12, band], [x + t * height * 0.56, ground - 0.5]]);
  }
  return (
    <g>
      <Shadow cx={x + height * 0.12} cy={ground + 0.5} rx={height * 0.32} ry={height * 0.05} />
      <path className="hf-ink" d={strokes.map((stroke) => cellsAlong(stroke, false)).join("")} />
      <Face points={rectPoints(x - height * 0.08, band - 1, height * 0.16, 2)} light="deep" />
    </g>
  );
}

/** The still parts: the ground's scatter, the laptop, the wheat and the peasants. */
function Scene({ layout }: { layout: Layout }) {
  const { x, ground: lg, w, depth, deck, lean } = layout.laptop;
  const { face, display, deckTop } = screenOf(layout);
  const [brx, bry] = face[1]!;
  const screenTop = face[3]![1];
  const [ex, ey] = back([0, 0], layout.name === "wide" ? 2.5 : 1.5);
  const keys: Point[] = [
    back([x + w * 0.1, deckTop], depth * 0.18),
    back([x + w * 0.9, deckTop], depth * 0.18),
    back([x + w * 0.9, deckTop], depth * 0.72),
    back([x + w * 0.1, deckTop], depth * 0.72),
  ];
  const people = layout.people
    .map((person, index) => ({ person, index }))
    .sort((a, b) => Number(a.index === layout.noticer) - Number(b.index === layout.noticer));
  return (
    <svg className={`hf-art ${sizeClass(layout)}`} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-ground" d={toPath(rectPoints(0, 0, layout.width, layout.height))} />
      <Shadow cx={x + w / 2 + depth * 0.4} cy={lg + 0.5} rx={w / 2 + depth * 0.35} ry={layout.name === "wide" ? 4.5 : 2.6} />
      <Face points={[[brx, bry], [brx + ex, bry + ey], [brx + lean + ex, screenTop + ey], [brx + lean, screenTop]]} light="deep" />
      <Face points={[face[3]!, face[2]!, [face[2]![0] + ex, screenTop + ey], [face[3]![0] + ex, screenTop + ey]]} light="mid" />
      <Face points={face} light="shade" />
      <Face points={display} light="lit" />
      <Box x={x} y={deckTop} w={w} h={deck} depth={depth} front="deep" top="mid" side="deep" />
      <Face points={keys} light="shade" />
      {layout.sheaves.map(([sx, height, ground]) => (
        <Sheaf key={sx} x={sx} height={height} ground={ground} />
      ))}
      {people.map(({ person, index }) => (
        <Peasant key={person[0]} person={person} ground={layout.ground} lit={index === layout.noticer} />
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
      <Shadow cx={w / 2 + 4} cy={h + 0.5} rx={w / 2 + 7} ry={layout.name === "wide" ? 4.5 : 2.6} />
      <Box x={0} y={0} w={w} h={h} depth={depth} front="mid" top="lit" side="deep" />
    </svg>
  );
}

/** The scan line that runs down the laptop's screen. */
function Scan({ layout }: { layout: Layout }) {
  return (
    <svg
      className={`hf-scan hf-scan-${layout.name} ${sizeClass(layout)}`}
      viewBox="0 0 10 1"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="hf-ink" x={0} y={0} width={10} height={1} />
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
  const [dx, dy] = back([0, 0], plan.w > 50 ? 3 : 2);
  return (
    <div className={`hf-card-face ${className}`}>
      <svg className="hf-card-art" viewBox={`0 0 ${plan.w} ${plan.h}`} aria-hidden="true" focusable="false">
        <Face points={[[0, 0], [plan.w, 0], [plan.w + dx, dy], [dx, dy]]} light="mid" />
        <Face points={[[plan.w, 0], [plan.w + dx, dy], [plan.w + dx, plan.h + dy], [plan.w, plan.h]]} light="shade" />
        <Face points={rectPoints(0, 0, plan.w, plan.h)} light="lit" />
        {plan.lines.map(([x, y, w]) => (
          <path key={y} className="hf-ink" d={toPath(rectPoints(x, y, w, plan.line))} />
        ))}
      </svg>
      <span className="hf-card-mark" style={box(markX, markY, markSize, markSize)}>
        <BrandMark name={mark} />
      </span>
      <span className={`hf-mask hf-k${index}`} style={box(maskX, maskY, maskW, maskH)}>
        <svg viewBox={`0 0 ${maskW} ${maskH}`} aria-hidden="true" focusable="false">
          <Face points={rectPoints(0, 0, maskW, maskH)} light="amber" />
        </svg>
      </span>
      <span className={`hf-stamp hf-t${index}`} style={box(stampX, stampY, stampSize, stampSize)}>
        <svg viewBox={`0 0 ${stampSize} ${stampSize}`} aria-hidden="true" focusable="false">
          <Face points={ellipsePoints(r, r, r, r, 16)} light="deep" />
          <path className="hf-knock" d={`M${r * 0.5} ${r}L${r * 0.85} ${r * 1.4}L${r * 1.5} ${r * 0.62}`} />
        </svg>
      </span>
    </div>
  );
}

/**
 * The loop holds while the picture is off screen, while the tab is behind
 * another, and while a pointer rests on it. It plays from the first paint:
 * nothing waits for the page's script to start it.
 */
export function HeroFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const paused = hovered || !inView || !pageVisible;

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
      <div
        ref={ref}
        className="hf"
        data-paused={paused ? "true" : "false"}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
      >
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

          <div className="hf-marks">
            {AGENTS.map((agent, index) => (
              <span key={agent.mark} className={`hf-mark hf-m${index}`}>
                <BrandMark name={agent.mark} />
              </span>
            ))}
          </div>

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

          <Scan layout={PHONE} />
          <Scan layout={WIDE} />
          <Base layout={PHONE} />
          <Base layout={WIDE} />
        </div>
      </div>
    </div>
  );
}
