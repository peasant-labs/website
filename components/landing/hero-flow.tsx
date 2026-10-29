"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { HERO } from "@/lib/landing";
import { memo, useEffect, useRef, useState, type ReactNode } from "react";

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
 * The unit of every drawing is one grid cell: 3px on a phone and a wide
 * screen, and between them as wide as the frame allows, from 2px to 3px.
 * Glyph patterns tile from each drawing's own origin, so the
 * texture travels with a card instead of shimmering across it, and edges are
 * worked out here, cell by cell, so they step on the grid. A card moves on two
 * nested layers, across and down, each with its own curve, which bends its
 * path. Only transform, opacity and clip-path move; z-index steps a card
 * back a level as the next one sets out. The resting state is one finished
 * frame, and the loop is laid over it only when motion is allowed.
 */

const FLOW = HERO.flow;
const AGENTS = FLOW.agents;
const COUNT = AGENTS.length;
/* the laptop shows three marks at a time: the first three agents, then the other three */
const SHOWN = 3;
/* how many cards show on the stack before one slips behind the base */
const DEPTH = 4;

/* one cycle per card, with a short calm after it lands so the picture never reads as frozen; a card's own animation runs for all six cycles */
const CYCLE = 4400;
const LOOP = CYCLE * COUNT;

/*
 * A card's journey, from the start of its cycle, as one continuous motion:
 * it grows out of its mark onto the screen and keeps growing a little while
 * the scan line runs down it; it is already setting off as the scan ends, and
 * flies one arc to the stack on a single ease, so it never stops mid-path. It
 * is stamped on the fly at the top of the arc, lands softly and settles once;
 * the only stillness is the calm pause before the next card.
 */
const BEAT = {
  onScreen: 450,
  scanFrom: 400,
  scanTo: 1150,
  lift: 1000,
  landed: 3000,
  /* the top of the arc is half way through the flight */
  crest: 2000,
  stampFrom: 1950,
  stampTo: 2300,
  /* the stack makes room while the card comes down */
  roomFrom: 2400,
  roomTo: 2950,
  settled: 3250,
  noticed: 3500,
  forgetFrom: 3900,
  forgotten: 4300,
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

/* a cell on the grid: its column and row */
type Point = readonly [x: number, y: number];
type Rect = readonly [x: number, y: number, w: number, h: number];

/*
 * The three-quarter view: depth runs up and to the right, two cells across
 * for each cell up, so every receding edge steps evenly on the grid and every
 * box shows a lit top, a front and a shaded side.
 */
const back = ([x, y]: Point, steps: number): Point => [x + 2 * steps, y - steps];

/** a card's drawing, in cells: its size, its mark, three lines (the middle one the secret), the amber block over it, the stamp and the check pressed into it */
type CardPlan = Readonly<{
  w: number;
  h: number;
  mark: readonly [x: number, y: number, size: number];
  lines: readonly (readonly [x: number, y: number, w: number])[];
  line: number;
  mask: Rect;
  stamp: readonly [x: number, y: number, size: number];
  check: readonly Point[];
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
  mask: [5, 25, 36, 6],
  stamp: [43, 4, 11],
  check: [
    [3, 5],
    [5, 7],
    [8, 4],
  ],
};

const PHONE_CARD: CardPlan = {
  w: 30,
  h: 22,
  mark: [3, 3, 6],
  lines: [
    [3, 11, 21],
    [3, 14, 15],
    [3, 17, 18],
  ],
  line: 1,
  mask: [2, 13, 17, 3],
  stamp: [21, 2, 7],
  check: [
    [2, 3],
    [3, 4],
    [5, 2],
  ],
};

/*
 * The peasants, traced from the pictures' village and stood up as people, in
 * cells from the middle of the ground under them: a hat with a tall peaked
 * crown, shaped like a house, on a short brim a little wider than the head,
 * over a face, a neck, shoulders wider than it, sleeves standing off the body
 * with a hand at the end of each, a sash, a robe flaring to the ground and two
 * feet under its hem. Each stands their own way: one holds the rake upright,
 * one carries the basket, one waves at the card coming in.
 */

/** one part of a figure: its outline, its light, and the light right of the figure's middle */
type Part = Readonly<{ points: readonly Point[]; light: Light; right?: Light }>;

type Figure = Readonly<{
  /** ink behind the figure: the rake */
  behind: readonly (readonly Point[])[];
  parts: readonly Part[];
  /** ink over it: the sash */
  front: readonly (readonly Point[])[];
  /** the basket that lights up as a card lands */
  basket?: readonly Point[];
}>;

const WIDE_BODY: readonly Part[] = [
  { points: [[-1, -31], [1, -31], [5, -29], [6, -28], [6, -18], [9, -2], [-9, -2], [-6, -18], [-6, -28], [-5, -29]], light: "mid", right: "shade" },
  { points: [[-5, -1], [-2, -1], [-2, 0], [-5, 0]], light: "deep" },
  { points: [[2, -1], [5, -1], [5, 0], [2, 0]], light: "deep" },
  { points: [[-2, -36], [2, -36], [3, -35], [3, -32], [2, -31], [-2, -31], [-3, -32], [-3, -35]], light: "lit" },
  { points: [[0, -43], [3, -40], [3, -38], [5, -38], [5, -36], [-5, -36], [-5, -38], [-3, -38], [-3, -40]], light: "lit", right: "shade" },
  /* the left arm hangs at the side */
  { points: [[-5, -29], [-8, -27], [-10, -17], [-10, -15], [-7, -15], [-7, -26]], light: "lit" },
  { points: [[-9, -14], [-8, -14], [-8, -13], [-9, -13]], light: "deep" },
];
const WIDE_SASH = [[[-6, -18], [6, -18]]] as const;

const WIDE_FIGURES = {
  rake: {
    behind: [[[12, 0], [12, -46]], [[9, -47], [15, -47]], [[9, -48], [9, -48]], [[11, -48], [11, -48]], [[13, -48], [13, -48]], [[15, -48], [15, -48]]],
    parts: [
      ...WIDE_BODY,
      { points: [[5, -29], [8, -28], [11, -24], [11, -22], [9, -22], [7, -25]], light: "mid" },
      { points: [[11, -22], [12, -22], [12, -21], [11, -21]], light: "deep" },
    ],
    front: WIDE_SASH,
  },
  basket: {
    behind: [],
    parts: [
      ...WIDE_BODY,
      { points: [[5, -29], [8, -27], [10, -17], [10, -15], [7, -15], [7, -26]], light: "mid" },
      { points: [[8, -14], [9, -14], [9, -13], [8, -13]], light: "deep" },
    ],
    front: WIDE_SASH,
    basket: [[6, -11], [12, -11], [11, -6], [7, -6]],
  },
  wave: {
    behind: [],
    parts: [
      ...WIDE_BODY,
      { points: [[6, -29], [8, -29], [11, -37], [9, -38]], light: "mid" },
      { points: [[9, -40], [10, -40], [10, -39], [9, -39]], light: "deep" },
    ],
    front: WIDE_SASH,
  },
} satisfies Record<string, Figure>;

const PHONE_BODY: readonly Part[] = [
  { points: [[-1, -18], [1, -18], [3, -17], [4, -16], [4, -11], [5, -2], [-5, -2], [-4, -11], [-4, -16], [-3, -17]], light: "mid", right: "shade" },
  { points: [[-3, -1], [-2, -1], [-2, 0], [-3, 0]], light: "deep" },
  { points: [[2, -1], [3, -1], [3, 0], [2, 0]], light: "deep" },
  { points: [[-1, -22], [1, -22], [2, -21], [2, -19], [1, -18], [-1, -18], [-2, -19], [-2, -21]], light: "lit" },
  { points: [[0, -27], [2, -25], [2, -24], [3, -24], [3, -22], [-3, -22], [-3, -24], [-2, -24], [-2, -25]], light: "lit", right: "shade" },
  { points: [[-3, -17], [-6, -15], [-6, -9], [-5, -9], [-5, -15]], light: "lit" },
];
const PHONE_SASH = [[[-4, -11], [4, -11]]] as const;

const PHONE_FIGURES = {
  rake: {
    behind: [[[8, 0], [8, -28]], [[6, -29], [10, -29]], [[6, -30], [6, -30]], [[8, -30], [8, -30]], [[10, -30], [10, -30]]],
    parts: [...PHONE_BODY, { points: [[3, -17], [5, -17], [8, -14], [7, -13]], light: "mid" }],
    front: PHONE_SASH,
  },
  basket: {
    behind: [],
    parts: [...PHONE_BODY, { points: [[3, -17], [6, -15], [6, -9], [5, -9], [5, -15]], light: "mid" }],
    front: PHONE_SASH,
    basket: [[4, -8], [8, -8], [7, -4], [5, -4]],
  },
  wave: {
    behind: [],
    parts: [...PHONE_BODY, { points: [[3, -17], [5, -17], [7, -23], [6, -24]], light: "mid" }],
    front: PHONE_SASH,
  },
} satisfies Record<string, Figure>;

/*
 * A wheat sheaf, flat like the pictures': a fan of stalks gathered by a twine
 * band about three fifths of the way up and splayed to a flared foot, each
 * stalk topped with an ear, the outer ears drooping outward, and the stalks
 * behind shown as a light tone between them. In cells from the middle of its
 * foot; it stands as tall as a peasant's face.
 */
type SheafPlan = Readonly<{
  back: readonly (readonly Point[])[];
  stalks: readonly (readonly Point[])[];
  ears: readonly (readonly Point[])[];
  band: Rect;
}>;

function sheafPlan(height: number, top: number, foot: number, count: number): SheafPlan {
  const band = -Math.round(height * 0.6);
  const stalks: Point[][] = [];
  const ears: Point[][] = [];
  const tips: Point[] = [];
  for (let index = 0; index < count; index += 1) {
    const t = (index / (count - 1)) * 2 - 1;
    const side = Math.sign(t);
    const [x, y]: Point = [Math.round(t * top), -height + Math.round(t * t * height * 0.22)];
    tips.push([x, y]);
    stalks.push([[Math.round(t * 2), band - 1], [x, y]]);
    stalks.push([[Math.round(t * 2), band + 2], [Math.round(t * foot), 0]]);
    ears.push(Math.abs(t) < 0.4 ? [[x, y], [x, y - 2]] : [[x, y], [x + side, y - 1], [x + 2 * side, y], [x + 2 * side, y + 1]]);
  }
  return {
    back: [
      [[-2, band - 1], ...tips, [2, band - 1]],
      [[-2, band + 2], [2, band + 2], [foot, 0], [-foot, 0]],
    ],
    stalks,
    ears,
    band: [-3, band, 7, 2],
  };
}

const WIDE_SHEAF = sheafPlan(33, 5, 5, 7);

/** who stands at the commons, left to right: a sheaf, or a peasant and whether their basket lights up */
type Member = Readonly<{ sheaf: SheafPlan } | { figure: Figure; noticed?: boolean }>;

/** One layout, every measure in cells. */
type Layout = Readonly<{
  name: "phone" | "wide";
  width: number;
  height: number;
  card: CardPlan;
  /** the laptop: its deck's front-left cell, the row it stands on, its width, depth in steps and thickness, and its lid's height and bezel */
  laptop: Readonly<{ x: number; ground: number; w: number; depth: number; deck: number; screen: number; bezel: number }>;
  /** the three marks on the screen, a centred group: the step between them and their size */
  marks: readonly [step: number, size: number];
  /** how small a card shows on the screen */
  onScreen: number;
  /** the row the middle of a card passes at the top of its arc */
  crest: number;
  /** the stack: its cards' left column, the row its base stands on, the base's height and depth, and the step between cards */
  stack: Readonly<{ left: number; ground: number; base: number; depth: number; notch: number }>;
  /** the commons: the row it stands on, its first column, the gap between its members, and its members */
  commons: Readonly<{ ground: number; from: number; gap: number; members: readonly Member[] }>;
  /** how many rows of contact shadow lie under everything */
  shadow: number;
}>;

/*
 * A wide screen, a little over three times as wide as it is tall: three
 * groups on one ground, the laptop, the stack and the commons, with the same
 * gap between them and the same margin outside, and the same air above the
 * scene as below it. The laptop is about one and a half cards wide; a
 * peasant stands as tall as a card, and the wheat reaches their faces.
 */
const WIDE: Layout = {
  name: "wide",
  width: 333,
  height: 104,
  card: WIDE_CARD,
  laptop: { x: 14, ground: 78, w: 80, depth: 8, deck: 3, screen: 46, bezel: 3 },
  marks: [24, 16],
  onScreen: 0.85,
  crest: 28,
  stack: { left: 127, ground: 78, base: 4, depth: 2, notch: 3 },
  commons: {
    ground: 78,
    from: 206,
    gap: 3,
    members: [
      { sheaf: WIDE_SHEAF },
      { figure: WIDE_FIGURES.rake },
      { figure: WIDE_FIGURES.basket, noticed: true },
      { figure: WIDE_FIGURES.wave },
      { sheaf: WIDE_SHEAF },
    ],
  },
  shadow: 3,
};

/*
 * A phone, in two tiers with the same air above and below, held to the scene
 * so no band of empty ground is left: the laptop and the stack side by side
 * on top, the three peasants centred under them; the wheat is left out, too
 * small here to read as wheat.
 */
const PHONE: Layout = {
  name: "phone",
  width: 100,
  height: 114,
  card: PHONE_CARD,
  laptop: { x: 5, ground: 49, w: 40, depth: 4, deck: 2, screen: 26, bezel: 2 },
  marks: [11, 7],
  onScreen: 0.85,
  crest: 16,
  stack: { left: 62, ground: 49, base: 3, depth: 1, notch: 2 },
  commons: {
    ground: 93,
    from: 23,
    gap: 4,
    members: [{ figure: PHONE_FIGURES.rake }, { figure: PHONE_FIGURES.basket, noticed: true }, { figure: PHONE_FIGURES.wave }],
  },
  shadow: 2,
};

/* the laptop's screen: the lid standing on the deck's back edge, and the display inside its bezel */
function screenOf(layout: Layout) {
  const { x, ground, w, depth, deck, screen, bezel } = layout.laptop;
  const deckTop = ground - deck + 1;
  const [left, bottom] = back([x, deckTop], depth);
  const lid: Rect = [left, bottom - screen + 1, w, screen];
  const display: Rect = [left + bezel, lid[1] + bezel, w - 2 * bezel, screen - 2 * bezel];
  return {
    deckTop,
    lid,
    display,
    left: display[0],
    top: display[1],
    right: display[0] + display[2],
    bottom: display[1] + display[3],
  };
}

/* the middle of the display, where the marks gather and a card comes up */
function screenCentre(layout: Layout): Point {
  const { left, top, right, bottom } = screenOf(layout);
  return [(left + right) / 2, (top + bottom) / 2];
}

/* the centres of the three marks on the screen */
const markCentres = (layout: Layout): Point[] => {
  const [x, y] = screenCentre(layout);
  const [step] = layout.marks;
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

type Track = readonly (readonly [ms: number, value: number, ease?: Curve | "linear"])[];

/** the row the stack's bottom card stands on: the front of the base's top */
const baseTop = (layout: Layout) => layout.stack.ground - layout.stack.base + 1;

/** the top of the stack's top card */
const stackTop = (layout: Layout) => baseTop(layout) - layout.card.h - (DEPTH - 1) * layout.stack.notch;

/* how finely the flight is sampled into keyframes */
const FLIGHT_STEPS = 40;

/** the card's centre across (0) or down (1), in cells, for a card that starts on one of the three marks */
function track(layout: Layout, slot: number, axis: 0 | 1): Track {
  const from = markCentres(layout)[slot]![axis];
  const screen = screenCentre(layout)[axis];
  const { left, notch } = layout.stack;
  const rest = axis === 0 ? left + layout.card.w / 2 : stackTop(layout) + layout.card.h / 2;
  const sinks: [number, number, Curve?][] = [];
  if (axis === 1) {
    for (let depth = 1; depth <= DEPTH; depth += 1) {
      sinks.push([depth * CYCLE + BEAT.roomFrom, rest + (depth - 1) * notch, "in-out"]);
      sinks.push([depth * CYCLE + BEAT.roomTo, rest + depth * notch]);
    }
  }
  /*
   * The flight is one curve from the screen to the stack, bowed up so its top
   * is at the crest, and the card runs along it on one ease: sampled finely,
   * so the two layers, across and down, trace the same path at the same pace.
   */
  const [sx, sy] = screenCentre(layout);
  const [rx, ry] = [left + layout.card.w / 2, stackTop(layout) + layout.card.h / 2];
  const bow = 2 * layout.crest - (sy + ry) / 2;
  const along = curve("in-out");
  const flight: [number, number, "linear"][] = [];
  for (let step = 1; step < FLIGHT_STEPS; step += 1) {
    const p = along(step / FLIGHT_STEPS);
    const point = axis === 0 ? (1 - p) ** 2 * sx + 2 * p * (1 - p) * ((sx + rx) / 2) + p ** 2 * rx : (1 - p) ** 2 * sy + 2 * p * (1 - p) * bow + p ** 2 * ry;
    flight.push([BEAT.lift + ((BEAT.landed - BEAT.lift) * step) / FLIGHT_STEPS, point, "linear"]);
  }
  return [
    [0, from, "out"],
    [BEAT.onScreen, screen],
    [BEAT.lift, screen, "linear"],
    ...flight,
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
      return start + (end - start) * (ease && ease !== "linear" ? curve(ease)(progress) : progress);
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
 * The scan line runs down the display; the secret line turns amber, top
 * first, while the scan line crosses it, on the card still sitting on the
 * screen at its smaller size.
 */
function scanStops(layout: Layout): { scan: Stop[]; sweep: Stop[] } {
  const { top, bottom } = screenOf(layout);
  const cq = unit(layout);
  const run = bottom - top - 1;
  const [, my, , mh] = layout.card.mask;
  const cardTop = screenCentre(layout)[1] - (layout.card.h * layout.onScreen) / 2;
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
  const size = layout.marks[1];
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
    `.hf-base-${layout.name} { left: ${cq(layout.stack.left - 1)}; top: ${cq(baseTop(layout))}; width: ${cq(w + 2)}; height: ${cq(layout.stack.base)} }`,
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
  /*
   * A card is drawn above everything while it travels and lands, steps back a
   * level each time the next card sets out, so the one travelling is always in
   * front, and slips behind the base as it sinks into it.
   */
  const z: Stop[] = [[0, "z-index: 10"]];
  for (let depth = 1; depth <= DEPTH; depth += 1) {
    z.push([depth * CYCLE - 1, `z-index: ${11 - depth}`]);
    z.push([depth * CYCLE, `z-index: ${10 - depth}`]);
  }
  z.push([DEPTH * CYCLE + BEAT.roomFrom - 1, `z-index: ${10 - DEPTH}`]);
  z.push([DEPTH * CYCLE + BEAT.roomFrom, "z-index: 1"]);
  z.push([LOOP, "z-index: 1"]);

  const gone = DEPTH * CYCLE + BEAT.roomTo;
  /* a card grows onto the screen and keeps growing a little under the scan, reaches full size as it lifts, and settles once as it lands */
  const card = (name: string, small: number) =>
    keyframes(name, LOOP, [
      [0, `opacity: 0; transform: scale(${n(small * 0.4)})`, "out"],
      [BEAT.onScreen, `opacity: 1; transform: scale(${small})`, "linear"],
      [BEAT.lift, `opacity: 1; transform: scale(${n(small * 1.03)})`, "in-out"],
      [BEAT.crest, "opacity: 1; transform: scale(1)"],
      [BEAT.landed, "opacity: 1; transform: scale(1)", "out"],
      [BEAT.landed + 100, "opacity: 1; transform: scale(0.975)", "out"],
      [BEAT.settled, "opacity: 1; transform: scale(1)"],
      [gone, "opacity: 1; transform: scale(1)", "out"],
      [gone + 300, "opacity: 0; transform: scale(1)"],
      [LOOP, "opacity: 0; transform: scale(1)"],
    ]);
  /* the stamp comes down on the moving card at the top of its arc */
  const stamp = keyframes("hf-stamp", LOOP, [
    [0, "opacity: 0; transform: scale(1.15)"],
    [BEAT.stampFrom, "opacity: 0; transform: scale(1.15)", "out"],
    [BEAT.stampTo, "opacity: 1; transform: scale(1)"],
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
  // The commons receives each arriving card with one coordinated response.
  // The small lift answers the laptop's motion without moving the ground.
  const receive = keyframes("hf-receive", CYCLE, [
    [0, "transform: translateY(0)"],
    [BEAT.roomFrom, "transform: translateY(0)", "out"],
    [BEAT.landed, "transform: translateY(-2px)", "out"],
    [BEAT.noticed, "transform: translateY(0)"],
    [CYCLE, "transform: translateY(0)"],
  ]);
  /* the marks give way while a card fills the screen, and come back once it lifts out */
  const giveWay = keyframes("hf-marks", CYCLE, [
    [0, "opacity: 1", "out"],
    [BEAT.onScreen, "opacity: 0"],
    [BEAT.lift, "opacity: 0", "out"],
    [BEAT.lift + 700, "opacity: 1"],
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
  return [keyframes("hf-z", LOOP, z), card("hf-card-phone", phoneScale), card("hf-card-wide", wideScale), stamp, notice, receive, giveWay, ...marks].join("\n");
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
  `.hf-commons { animation: hf-receive ${CYCLE}ms linear infinite }`,
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
 * A phone shows its layout 300px wide, at 3px a cell; from a tablet up the
 * wide layout fills its frame, up to 999px, also 3px a cell.
 */
const STYLESHEET = [
  RESTING,
  layoutRules(PHONE),
  layoutKeyframes(PHONE),
  sharedKeyframes(PHONE.onScreen, WIDE.onScreen),
  `.hf .hf-wide { display: none }`,
  `@media (min-width: 48rem) {\n.hf .hf-phone { display: none }\n.hf .hf-wide { display: block }\n${layoutRules(WIDE)}\n${layoutKeyframes(WIDE)}\n}`,
  `@media (prefers-reduced-motion: no-preference) {\n${motionRules("hf-card-phone")}\n${sharedMotion}\n@media (min-width: 48rem) {\n${motionRules("hf-card-wide")}\n}\n}`,
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

/* ---------- cells ---------- */

/*
 * Every drawing is cells. An outline's corners are cells and its edges run
 * from cell to cell, stepping evenly, so a level or upright edge is one
 * straight row or column and a slope a regular staircase; a face is every
 * cell inside its outline, so its glyphs are never cut.
 */
type Cells = Set<string>;

const cellKey = (x: number, y: number) => `${x},${y}`;

/** the cells of a straight run from one cell to another */
function run([x0, y0]: Point, [x1, y1]: Point, cells: Cells = new Set()) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    cells.add(cellKey(x, y));
    if (x === x1 && y === y1) return cells;
    const twice = 2 * error;
    if (twice >= dy) {
      error += dy;
      x += sx;
    }
    if (twice <= dx) {
      error += dx;
      y += sy;
    }
  }
}

/** the cells along a closed outline */
function outline(points: readonly Point[]) {
  const cells: Cells = new Set();
  points.forEach((point, index) => run(point, points[(index + 1) % points.length]!, cells));
  return cells;
}

/** the cells inside a closed outline, the outline's own included */
function inside(points: readonly Point[], edge: Cells) {
  const cells: Cells = new Set(edge);
  const rows = points.map(([, y]) => y);
  for (let row = Math.min(...rows); row <= Math.max(...rows); row += 1) {
    const crossings: number[] = [];
    points.forEach(([x0, y0], index) => {
      const [x1, y1] = points[(index + 1) % points.length]!;
      if ((y0 <= row && row < y1) || (y1 <= row && row < y0)) crossings.push(x0 + ((row - y0) * (x1 - x0)) / (y1 - y0));
    });
    crossings.sort((a, b) => a - b);
    for (let index = 0; index + 1 < crossings.length; index += 2) {
      for (let x = Math.ceil(crossings[index]! - 1e-6); x <= Math.floor(crossings[index + 1]! + 1e-6); x += 1) {
        cells.add(cellKey(x, row));
      }
    }
  }
  return cells;
}

/** cells as one path, each row's neighbours joined into one run */
function cellPath(cells: Iterable<string>) {
  const rows = new Map<number, number[]>();
  for (const cell of cells) {
    const [x, y] = cell.split(",").map(Number) as [number, number];
    const row = rows.get(y);
    if (row) row.push(x);
    else rows.set(y, [x]);
  }
  let d = "";
  for (const [y, xs] of [...rows].sort((a, b) => a[0] - b[0])) {
    xs.sort((a, b) => a - b);
    let start = xs[0]!;
    let end = start;
    for (const x of [...xs.slice(1), Number.POSITIVE_INFINITY]) {
      if (x === end + 1) {
        end = x;
        continue;
      }
      d += `M${start} ${y}h${end - start + 1}v1h${start - end - 1}z`;
      start = x;
      end = x;
    }
  }
  return d;
}

/** a rectangle of cells, as the corners of its outline */
const corners = (x: number, y: number, w: number, h: number): Point[] => [
  [x, y],
  [x + w - 1, y],
  [x + w - 1, y + h - 1],
  [x, y + h - 1],
];

/** the shapes of a drawing moved to where it stands */
const shift = (points: readonly Point[], dx: number, dy: number): Point[] => points.map(([x, y]) => [x + dx, y + dy]);

/* ---------- the drawings ---------- */

/* a face's light: lit faces the lightest glyphs, then mid, shade and deep */
type Light = "lit" | "mid" | "shade" | "deep" | "amber";

/**
 * A closed face: filled with the panel to cover what is behind it, shaded with
 * its glyphs, and edged with one cell of ink. A face split down a column takes
 * a second light on its right, the side turned from the light.
 */
function Face({ points, light, edge = true, split }: {
  points: readonly Point[];
  light: Light;
  edge?: boolean;
  split?: readonly [column: number, light: Light];
}) {
  const ring = outline(points);
  const cells = inside(points, ring);
  const left = split ? [...cells].filter((cell) => Number(cell.split(",")[0]) < split[0]) : cells;
  const right = split ? [...cells].filter((cell) => Number(cell.split(",")[0]) >= split[0]) : [];
  return (
    <>
      <path className="hf-fill" d={cellPath(cells)} />
      <path className={`hf-light-${light}`} d={cellPath(left)} />
      {split ? <path className={`hf-light-${split[1]}`} d={cellPath(right)} /> : null}
      {edge ? <path className="hf-ink" d={cellPath(ring)} /> : null}
    </>
  );
}

/** runs of cells, in ink or, for a lighter line, in one face's glyphs */
function Strokes({ runs, light }: { runs: readonly (readonly Point[])[]; light?: Light }) {
  const cells: Cells = new Set();
  for (const points of runs) points.slice(1).forEach((point, index) => run(points[index]!, point, cells));
  return <path className={light ? `hf-light-${light}` : "hf-ink"} d={cellPath(cells)} />;
}

/**
 * A contact shadow: the same rows under every object, glyphs thinning from
 * plusses under its foot to dots, a little to the right, away from the light.
 */
function Shadow({ from, to, ground, rows }: { from: number; to: number; ground: number; rows: number }) {
  const band = (row: number, start: number, end: number) => `M${start} ${row}h${end - start + 1}v1h${start - end - 1}z`;
  const core = Array.from({ length: rows - 1 }, (_, index) => band(ground + 1 + index, from + index, to + 1 + index)).join("");
  return (
    <>
      <path className="hf-tone-shade-core" d={core} />
      <path className="hf-tone-shade" d={band(ground + rows, from + rows - 1, to + rows)} />
    </>
  );
}

/** A box in three-quarter view, from its front face's top-left cell and size: its lit top, its shaded side and its front. */
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
  const right = x + w - 1;
  const bottom = y + h - 1;
  return (
    <>
      <Face points={[[x, y], [right, y], back([right, y], depth), back([x, y], depth)]} light={top} />
      <Face points={[[right, y], back([right, y], depth), back([right, bottom], depth), [right, bottom]]} light={side} />
      <Face points={corners(x, y, w, h)} light={front} />
    </>
  );
}

/* which of the two layouts a drawing belongs to; the stylesheet shows one */
const sizeClass = (layout: Layout) => `hf-${layout.name}`;

function Peasant({ figure, x, ground, lit }: { figure: Figure; x: number; ground: number; lit: boolean }) {
  const place = (points: readonly Point[]) => shift(points, x, ground);
  return (
    <g>
      {figure.behind.length ? <Strokes runs={figure.behind.map(place)} /> : null}
      {figure.parts.map((part, index) => (
        <Face key={index} points={place(part.points)} light={part.light} split={part.right ? [x, part.right] : undefined} />
      ))}
      <Strokes runs={figure.front.map(place)} />
      {figure.basket ? (
        <>
          <Face points={place(figure.basket)} light="mid" />
          {lit ? (
            <g className="hf-notice">
              <Face points={place(figure.basket)} light="amber" />
            </g>
          ) : null}
        </>
      ) : null}
    </g>
  );
}

function Sheaf({ plan, x, ground }: { plan: SheafPlan; x: number; ground: number }) {
  const place = (points: readonly Point[]) => shift(points, x, ground);
  const [bx, by, bw, bh] = plan.band;
  return (
    <g>
      {plan.back.map((points, index) => (
        <Face key={index} points={place(points)} light="lit" edge={false} />
      ))}
      <Strokes runs={plan.stalks.map(place)} light="shade" />
      <Strokes runs={plan.ears.map(place)} />
      <Face points={place(corners(bx, by, bw, bh))} light="deep" />
    </g>
  );
}

/** every point a commons member is drawn through */
function pointsOf(member: Member): Point[] {
  if ("sheaf" in member) return [...member.sheaf.back.flat(), ...member.sheaf.ears.flat()];
  const { figure } = member;
  return [...figure.behind.flat(), ...figure.parts.flatMap((part) => part.points), ...(figure.basket ?? [])];
}

/** how far a member reaches either side of its column, overall and where it meets the ground */
function reach(member: Member) {
  const points = pointsOf(member);
  const xs = points.map(([x]) => x);
  const foot = points.filter(([, y]) => y >= -2).map(([x]) => x);
  return { from: Math.min(...xs), to: Math.max(...xs), footFrom: Math.min(...foot), footTo: Math.max(...foot) };
}

/** the commons' members set out left to right from its first column, the same gap between each */
function arrange(layout: Layout) {
  const { from, gap, members } = layout.commons;
  let cursor = from;
  return members.map((member) => {
    const extent = reach(member);
    const x = cursor - extent.from;
    cursor = x + extent.to + 1 + gap;
    return { member, x, extent };
  });
}

/** The still parts: the ground's scatter, the laptop, and the commons, each with its shadow. */
const Scene = memo(function Scene({ layout }: { layout: Layout }) {
  const { x, ground, w, depth, deck } = layout.laptop;
  const { deckTop, lid, display } = screenOf(layout);
  const keys: Point[] = [
    back([x + 7, deckTop], 1),
    back([x + w - 8, deckTop], 1),
    back([x + w - 8, deckTop], depth - 2),
    back([x + 7, deckTop], depth - 2),
  ];
  const commons = arrange(layout);
  const { ground: field } = layout.commons;
  return (
    <svg className={`hf-art ${sizeClass(layout)}`} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
      <path className="hf-tone-ground" d={`M0 0h${layout.width}v${layout.height}h${-layout.width}z`} />
      <Shadow from={x} to={x + w + 1} ground={ground} rows={layout.shadow} />
      {commons.map(({ x: mx, extent }) => (
        <Shadow key={mx} from={mx + extent.footFrom} to={mx + extent.footTo} ground={field} rows={layout.shadow} />
      ))}
      <Box x={x} y={deckTop} w={w} h={deck} depth={depth} front="deep" top="mid" side="deep" />
      <Face points={keys} light="shade" />
      <Box x={lid[0]} y={lid[1]} w={lid[2]} h={lid[3]} depth={1} front="mid" top="mid" side="deep" />
      <Face points={corners(...display)} light="lit" />
      <g className="hf-commons">
        {commons.map(({ member, x: mx }) =>
          "sheaf" in member ? (
            <Sheaf key={mx} plan={member.sheaf} x={mx} ground={field} />
          ) : (
            <Peasant key={mx} figure={member.figure} x={mx} ground={field} lit={member.noticed === true} />
          ),
        )}
      </g>
    </svg>
  );
});

/** The base the stack stands on: a low box a cell wider than the cards each side, drawn over the cards that have sunk into it. */
const Base = memo(function Base({ layout }: { layout: Layout }) {
  const w = layout.card.w + 2;
  const { base: h, depth } = layout.stack;
  return (
    <svg className={`hf-base hf-base-${layout.name} ${sizeClass(layout)}`} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <Shadow from={0} to={w + 1} ground={h - 1} rows={layout.shadow} />
      <Box x={0} y={0} w={w} h={h} depth={depth} front="mid" top="lit" side="deep" />
    </svg>
  );
});

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

/** a stamp's outline: a disc of cells, an octagon with its corners cut at forty-five degrees */
function octagon(size: number): Point[] {
  const last = size - 1;
  const cut = Math.round(size * 0.3);
  return [
    [cut, 0],
    [last - cut, 0],
    [last, cut],
    [last, last - cut],
    [last - cut, last],
    [cut, last],
    [0, last - cut],
    [0, cut],
  ];
}

/** A card: a slab of paper with a lit top edge and a shaded side, its agent's mark, three lines, and the amber block and the stamp laid over it. */
const CardArt = memo(function CardArt({ plan, mark, index, className }: { plan: CardPlan; mark: string; index: number; className: string }) {
  const [markX, markY, markSize] = plan.mark;
  const [maskX, maskY, maskW, maskH] = plan.mask;
  const [stampX, stampY, stampSize] = plan.stamp;
  const box = (x: number, y: number, w: number, h: number) => ({
    left: `${(x / plan.w) * 100}%`,
    top: `${(y / plan.h) * 100}%`,
    width: `${(w / plan.w) * 100}%`,
    height: `${(h / plan.h) * 100}%`,
  });
  const checkCells: Cells = new Set();
  plan.check.slice(1).forEach((point, step) => run(plan.check[step]!, point, checkCells));
  return (
    <div className={`hf-card-face ${className}`}>
      <svg className="hf-card-art" viewBox={`0 0 ${plan.w} ${plan.h}`} aria-hidden="true" focusable="false">
        <Box x={0} y={0} w={plan.w} h={plan.h} depth={1} front="lit" top="mid" side="shade" />
        <path className="hf-ink" d={plan.lines.map(([x, y, w]) => `M${x} ${y}h${w}v${plan.line}h${-w}z`).join("")} />
      </svg>
      <span className="hf-card-mark" style={box(markX, markY, markSize, markSize)}>
        <BrandMark name={mark} />
      </span>
      <span className={`hf-mask hf-k${index}`} style={box(maskX, maskY, maskW, maskH)}>
        <svg viewBox={`0 0 ${maskW} ${maskH}`} aria-hidden="true" focusable="false">
          <Face points={corners(0, 0, maskW, maskH)} light="amber" />
        </svg>
      </span>
      <span className={`hf-stamp hf-t${index}`} style={box(stampX, stampY, stampSize, stampSize)}>
        <svg viewBox={`0 0 ${stampSize} ${stampSize}`} aria-hidden="true" focusable="false">
          <path className="hf-ink" d={cellPath(inside(octagon(stampSize), outline(octagon(stampSize))))} />
          <path className="hf-fill" d={cellPath(checkCells)} />
        </svg>
      </span>
    </div>
  );
});

/**
 * The loop holds while the picture is off screen, while the tab is behind
 * another, and while a pointer that has moved onto it rests there. A page
 * scrolled under a still pointer does not hold it, and scrolling lets a hold
 * go. It plays from the first paint: nothing waits for the page's script to
 * start it.
 */
export function HeroFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  // where the pointer last was on screen, to tell a real move from the one the browser reports after a scroll
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const paused = hovered || !inView || !pageVisible;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? true));
    observer.observe(element);
    const update = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    const track = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
    };
    const release = () => setHovered(false);
    window.addEventListener("pointermove", track, { passive: true });
    window.addEventListener("scroll", release, { passive: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pointermove", track);
      window.removeEventListener("scroll", release);
    };
  }, []);

  return (
    <div className="hf-panel">
      <div
        ref={ref}
        className="hf"
        data-paused={paused ? "true" : "false"}
        onPointerMove={(event) => {
          // runs before the window's listener records this position, so an unchanged one means the page moved, not the pointer
          const last = pointer.current;
          const moved = !last || last.x !== event.clientX || last.y !== event.clientY;
          if (event.pointerType === "mouse" && moved) setHovered(true);
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
