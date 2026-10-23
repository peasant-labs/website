"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { HERO } from "@/lib/landing";
import { BadgeCheck, Pause, Play } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/*
 * The hero's picture, told without words. A transcript card lifts out of a
 * laptop that runs the agents, glides on a gentle arc through a sieve that
 * sweeps its secret line amber, is stamped as it is published, and slides down
 * onto the shared stack, which eases down a notch to make room while the people
 * standing at it notice. Its accessible name tells the same story.
 *
 * Every card makes the same journey, one cycle after the last, so the loop
 * never resets: a card lands on top, sinks one notch a cycle and slips behind
 * the table after four, and comes back out of the laptop on its next turn.
 *
 * Geometry and timeline live here and become one stylesheet. Places are in
 * hundredths of the picture's width (cqw), so it scales without moving anything
 * relative to anything else. A card moves on two nested layers, across and
 * down, each with its own curve, which is what bends its path into an arc.
 * Only transform, opacity and clip-path move; z-index steps a card behind the
 * one that lands on it. The stylesheet's resting state is one finished frame,
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

type Point = readonly [x: number, y: number];
type Rect = readonly [x: number, y: number, w: number, h: number];
type Figure = readonly [x: number, height: number];

type Layout = Readonly<{
  height: number;
  ground: number;
  /** the laptop: its screen, and its base's depth and reach past the screen */
  screen: Rect;
  base: readonly [depth: number, overhang: number];
  /** the three marks on the screen: centres and one size */
  marks: readonly Point[];
  mark: number;
  /** a card's width; its height is seven tenths of it */
  card: number;
  /** centres: lifted out of the laptop, at the top of the arc (wide) and where it is stamped */
  lifted: Point;
  crest: number;
  stamped: Point;
  /** the arc: on a wide screen the card travels across and rises then falls; on a phone it travels down and bends across late */
  travel: "across" | "down";
  /** the sieve: a short mesh panel across the card's path */
  sieve: Rect;
  /** the stack: its left edge (cards are its width), the table's top and the step between cards */
  stack: readonly [left: number, tableTop: number, notch: number];
  /** how far the table reaches past the stack on each side */
  table: number;
  /** the people at the stack: each one's centre and height, and one size for all */
  people: readonly Figure[];
  head: number;
  halfWidth: number;
}>;

const PHONE: Layout = {
  height: 159.5,
  ground: 158,
  screen: [20, 3, 60, 36],
  base: [4.5, 5],
  marks: [34, 50, 66].map((x) => [x, 21] as const),
  mark: 12,
  card: 44,
  lifted: [50, 52],
  crest: 0,
  stamped: [30, 92],
  travel: "down",
  sieve: [18, 69.5, 64, 4.5],
  stack: [8, 150, 3.6],
  table: 3,
  people: [
    [63, 27],
    [71.5, 31],
    [80, 25],
    [88.5, 29],
  ],
  head: 3,
  halfWidth: 5.5,
};

const WIDE: Layout = {
  height: 41.5,
  ground: 40,
  screen: [2.5, 21, 29, 16.5],
  base: [2.5, 2.4],
  marks: [9.5, 17, 24.5].map((x) => [x, 29.25] as const),
  mark: 5.6,
  card: 19,
  lifted: [22, 14],
  crest: 8,
  stamped: [68.5, 9.5],
  travel: "across",
  sieve: [43, 0.5, 4.5, 18],
  stack: [59, 35.5, 1.9],
  table: 1.5,
  people: [
    [83.6, 13.5],
    [87.8, 15.5],
    [92, 12.5],
    [96.2, 14.5],
  ],
  head: 1.35,
  halfWidth: 2.6,
};

/* the person who notices each card land: the tallest, nearest the stack */
const NOTICER = 1;

const cardHeight = (layout: Layout) => layout.card * 0.7;

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

/** the card's centre across (x) and down (y), and where it starts, for one of the three marks */
function tracks(layout: Layout, slot: number) {
  const [markX, markY] = layout.marks[slot]!;
  const h = cardHeight(layout);
  const [, tableTop, notch] = layout.stack;
  const stackLeft = layout.stack[0];
  const topCentre = tableTop - h - (DEPTH - 1) * notch + h / 2;
  const stackX = stackLeft + layout.card / 2;
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
  const y: Track =
    layout.travel === "across"
      ? [
          [0, markY, "out"],
          [BEAT.lifted, layout.lifted[1], "out"],
          [BEAT.crest, layout.crest, "in-out"],
          [BEAT.glided, layout.stamped[1]],
          [BEAT.settled, layout.stamped[1], "in-out"],
          [BEAT.landed, topCentre],
          ...sinks,
          [LOOP, topCentre + DEPTH * notch],
        ]
      : [
          [0, markY, "out"],
          [BEAT.lifted, layout.lifted[1], "in-out"],
          [BEAT.glided, layout.stamped[1]],
          [BEAT.settled, layout.stamped[1], "in-out"],
          [BEAT.landed, topCentre],
          ...sinks,
          [LOOP, topCentre + DEPTH * notch],
        ];
  return { x, y, topCentre };
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

const n = (value: number) => Number(value.toFixed(3));
const cq = (value: number) => `${n(value)}cqw`;

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

/* a layer moves its card's top-left corner; the card is drawn at the origin */
function shiftStops(track: Track, axis: "x" | "y", size: number): Stop[] {
  return track.map(([ms, value, ease]) => [
    ms,
    `transform: ${axis === "x" ? `translateX(${cq(value - size / 2)})` : `translateY(${cq(value - size / 2)})`}`,
    ease,
  ]);
}

/*
 * The secret line turns amber where the sieve meets it, sampled from the
 * card's own path so the sweep stays under the mesh. On a wide screen the card
 * crosses sideways and the amber follows the mesh along the line, from its
 * right end; on a phone the card crosses downwards and the line fills from its
 * lower edge.
 */
function sweepStops(layout: Layout): Stop[] {
  const { x, y } = tracks(layout, 1);
  const w = layout.card;
  const h = cardHeight(layout);
  const [sx, sy, sw, sh] = layout.sieve;
  const samples: Stop[] = [];
  const shown = (fraction: number) => {
    const hidden = n((1 - Math.min(1, Math.max(0, fraction))) * 100);
    return layout.travel === "across" ? `clip-path: inset(0 0 0 ${hidden}%)` : `clip-path: inset(${hidden}% 0 0 0)`;
  };
  /* the amber block spans 0.08 to 0.584 of the card across, and 0.611 to 0.746 of it down */
  const fraction = (ms: number) =>
    layout.travel === "across"
      ? (valueAt(x, ms) - w / 2 + 0.584 * w - (sx + sw / 2)) / (0.504 * w)
      : (valueAt(y, ms) - h / 2 + 0.746 * h - (sy + sh / 2)) / (0.135 * h);
  samples.push([0, shown(0)]);
  for (let ms = BEAT.lifted; ms <= BEAT.glided; ms += 50) samples.push([ms, shown(fraction(ms)), "linear"]);
  samples.push([LOOP, shown(1)]);
  return samples;
}

function layoutRules(layout: Layout, finished: (index: number) => { x: number; y: number }) {
  const half = layout.mark / 2;
  const w = layout.card;
  const h = cardHeight(layout);
  return [
    `.hf { aspect-ratio: 100 / ${layout.height} }`,
    ...layout.marks.flatMap(([x, y], slot) =>
      AGENTS.map((_, index) => index)
        .filter((index) => index % SHOWN === slot)
        .map((index) => `.hf-m${index} { left: ${cq(x - half)}; top: ${cq(y - half)}; width: ${cq(layout.mark)}; height: ${cq(layout.mark)} }`),
    ),
    `.hf-card { width: ${cq(w)}; height: ${cq(h)} }`,
    `.hf-mesh-${layout.travel} { left: ${cq(layout.sieve[0])}; top: ${cq(layout.sieve[1])}; width: ${cq(layout.sieve[2])}; height: ${cq(layout.sieve[3])} }`,
    `.hf-table { left: ${cq(layout.stack[0] - layout.table)}; top: ${cq(layout.stack[1])}; width: ${cq(w + 2 * layout.table)}; height: ${cq(layout.ground - layout.stack[1])} }`,
    ...AGENTS.map((_, index) => {
      const at = finished(index);
      return `.hf-x${index} { transform: translateX(${cq(at.x - w / 2)}) }\n.hf-y${index} { transform: translateY(${cq(at.y - h / 2)}) }`;
    }),
  ].join("\n");
}

function layoutKeyframes(layout: Layout) {
  const w = layout.card;
  const h = cardHeight(layout);
  const slots = Array.from({ length: SHOWN }, (_, slot) => {
    const { x, y } = tracks(layout, slot);
    return [keyframes(`hf-x-${slot}`, LOOP, shiftStops(x, "x", w)), keyframes(`hf-y-${slot}`, LOOP, shiftStops(y, "y", h))];
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
  const badge = keyframes("hf-badge", LOOP, [
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
  return [keyframes("hf-z", LOOP, z), card, badge, notice, ...marks].join("\n");
}

function motionRules() {
  const run = (name: string, length: number, delay: number) =>
    `animation: ${name} ${length}ms linear ${-delay}ms infinite`;
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
        `.hf-t${index} { ${run("hf-badge", LOOP, delay)} }`,
        `.hf-m${index} { ${run(`hf-mark-${index}`, LOOP, 0)} }`,
      ];
    }),
    `.hf-notice { ${run("hf-notice", CYCLE, 0)} }`,
    `.hf[data-paused=true] * { animation-play-state: paused }`,
  ].join("\n");
}

/*
 * At rest, one finished frame: the first card has just landed on the three
 * before it, its owner's neighbour has noticed, the first three marks show.
 */
function finishedAt(layout: Layout) {
  const moment = BEAT.landed + 200;
  return (index: number) => {
    const local = (moment + ((COUNT - index) % COUNT) * CYCLE) % LOOP;
    const { x, y } = tracks(layout, index % SHOWN);
    return { x: valueAt(x, local), y: valueAt(y, local) };
  };
}

const RESTING = [
  ...AGENTS.map((_, index) => {
    const depth = (COUNT - index) % COUNT;
    const shown = depth < DEPTH;
    return `.hf-x${index} { z-index: ${shown ? 10 - depth : 1} }\n.hf-c${index} { opacity: ${shown ? 1 : 0} }\n.hf-m${index} { opacity: ${index < SHOWN ? 1 : 0} }`;
  }),
  `.hf-notice { opacity: 1 }`,
].join("\n");

const STYLESHEET = [
  RESTING,
  layoutRules(PHONE, finishedAt(PHONE)),
  layoutKeyframes(PHONE),
  sharedKeyframes(),
  `.hf-art-wide, .hf-mesh-across { display: none }`,
  `@media (min-width: 48rem) {\n.hf-art-phone, .hf-mesh-down { display: none }\n.hf-art-wide, .hf-mesh-across { display: block }\n${layoutRules(WIDE, finishedAt(WIDE))}\n${layoutKeyframes(WIDE)}\n}`,
  `@media (prefers-reduced-motion: no-preference) {\n${motionRules()}\n}`,
].join("\n");

/* ---------- the drawing ---------- */

/** The still parts, drawn in the picture's own units: the laptop, the ground and the people. */
function Scene({ layout, className }: { layout: Layout; className: string }) {
  const [sx, sy, sw, sh] = layout.screen;
  const [depth, overhang] = layout.base;
  const tableLeft = layout.stack[0] - layout.table;
  const { ground, head, halfWidth } = layout;
  return (
    <svg className={`hf-art ${className}`} viewBox={`0 0 100 ${layout.height}`} aria-hidden="true" focusable="false">
      <rect className="hf-line" x={sx} y={sy} width={sw} height={sh} />
      <path
        className="hf-line"
        d={`M${sx} ${sy + sh} L${sx + sw} ${sy + sh} L${sx + sw + overhang} ${sy + sh + depth} L${sx - overhang} ${sy + sh + depth} Z`}
      />
      <line className="hf-ground" x1={layout.travel === "across" ? 0 : tableLeft - 3} y1={ground} x2={100} y2={ground} />
      {layout.people
        .map((person, index) => ({ person, index }))
        .sort((a, b) => Number(a.index === NOTICER) - Number(b.index === NOTICER))
        .map(({ person: [x, height], index }) => {
          const headY = ground - height + head;
          const shoulders = headY + head + head * 0.7;
          const corner = halfWidth * 0.55;
          const left = x - halfWidth;
          const right = x + halfWidth;
          return (
            <g key={x}>
              <path
                className="hf-line hf-person"
                d={`M${left} ${ground} V${shoulders + corner} Q${left} ${shoulders} ${left + corner} ${shoulders} H${right - corner} Q${right} ${shoulders} ${right} ${shoulders + corner} V${ground} Z`}
              />
              <circle className="hf-line hf-person" cx={x} cy={headY} r={head} />
              {index === NOTICER ? <circle className="hf-notice" cx={x} cy={headY} r={head} /> : null}
            </g>
          );
        })}
    </svg>
  );
}

/** The sieve: a short mesh of square cells the card passes through, drawn above the cards. */
function Mesh({ layout }: { layout: Layout }) {
  const [, , w, h] = layout.sieve;
  const cell = layout.travel === "across" ? 1.5 : 3.5;
  const columns = Math.max(2, Math.round(w / cell));
  const rows = Math.max(2, Math.round(h / cell));
  return (
    <svg
      className={`hf-mesh hf-mesh-${layout.travel}`}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {Array.from({ length: columns - 1 }, (_, index) => {
        const x = ((index + 1) / columns) * w;
        return <line key={`c${index}`} className="hf-wire" x1={x} y1={0} x2={x} y2={h} />;
      })}
      {Array.from({ length: rows - 1 }, (_, index) => {
        const y = ((index + 1) / rows) * h;
        return <line key={`r${index}`} className="hf-wire" x1={0} y1={y} x2={w} y2={y} />;
      })}
      <rect className="hf-line" x={0} y={0} width={w} height={h} />
    </svg>
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
        <div className="hf-stage" role="img" aria-label={FLOW.label}>
          <Scene layout={PHONE} className="hf-art-phone" />
          <Scene layout={WIDE} className="hf-art-wide" />

          {AGENTS.map((agent, index) => (
            <span key={agent.mark} className={`hf-mark hf-m${index}`}>
              <BrandMark name={agent.mark} />
            </span>
          ))}

          {AGENTS.map((agent, index) => (
            <div key={agent.mark} className={`hf-card-x hf-x${index}`}>
              <div className={`hf-card-y hf-y${index}`}>
                <div className={`hf-card hf-c${index}`}>
                  <div className="hf-card-body">
                    <BrandMark name={agent.mark} />
                    <i className="hf-bar" style={{ "--w": "80%" } as CSSProperties} />
                    <span className="hf-secret">
                      <i className="hf-bar" style={{ "--w": "58%" } as CSSProperties} />
                      <i className={`hf-mask hf-k${index}`} />
                    </span>
                    <i className="hf-bar" style={{ "--w": "70%" } as CSSProperties} />
                  </div>
                  <BadgeCheck className={`hf-stamp hf-t${index}`} aria-hidden="true" focusable="false" />
                </div>
              </div>
            </div>
          ))}

          <span className="hf-table" />
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
