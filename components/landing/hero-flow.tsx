"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { HERO } from "@/lib/landing";
import { BadgeCheck, Pause, Play } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/*
 * The hero's picture, told without words: a transcript card rises out of a
 * laptop that runs the agents, a scanner turns its secret line amber as it
 * passes, a stamp marks it published, and it lands on the stack beside a
 * person, which grows with each one. Its accessible name tells the same story.
 *
 * Its geometry and its timeline live here, together, and become one stylesheet.
 * Every place is in hundredths of the picture's width (cqw), so the picture
 * scales without moving anything relative to anything else. A phone reads it
 * top to bottom; a wide screen reads it left to right.
 *
 * Only transform and opacity move. The stylesheet's resting state is the
 * finished frame, every card on the stack, and the loop is laid over it only
 * when motion is allowed, so reduced motion sees that one frame.
 */

const FLOW = HERO.flow;
const AGENTS = FLOW.agents;
/* the laptop shows three marks at a time: the first three agents, then the other three */
const SHOWN = 3;

/* one loop, a card every GAP ms from START, and the fade out at the end */
const LOOP = 19400;
const START = 400;
const GAP = 2600;
const FADE_FROM = LOOP - 950;
const FADE_TO = LOOP - 550;
const SWAP = START + SHOWN * GAP - 700;

/* a card's trip, from its start: out of the laptop, to the scanner, through it at an even pace, stamped, onto the stack */
const TRIP = { out: 450, atScanner: 1150, pastScanner: 1950, stamped: 2550, landed: 3250 } as const;
const CROSS = TRIP.pastScanner - TRIP.atScanner;

type Point = readonly [x: number, y: number];
type Rect = readonly [x: number, y: number, w: number, h: number];

type Layout = Readonly<{
  /** the picture's height, in hundredths of its width */
  height: number;
  /** the laptop's screen, and how far its base reaches past the screen on each side */
  screen: Rect;
  base: readonly [depth: number, overhang: number];
  /** the three marks on the screen: centres and one size */
  marks: readonly Point[];
  mark: number;
  /** a card's width; its height is seven tenths of it */
  card: number;
  /** centres: just out of the laptop (a card starts on its agent's mark), at the scanner, past it */
  out: Point;
  atScanner: Point;
  pastScanner: Point;
  /** the scanner: a line across the card's path */
  scanner: readonly [from: Point, to: Point];
  /** where the secret line meets the scanner, as a share of the crossing; null when it wipes across */
  flip: number | null;
  /** the stack: its left edge, the ground it stands on, each card's step up and its scale */
  stack: readonly [left: number, ground: number, step: number, scale: number];
  ground: readonly [from: number, to: number];
  /** the person beside the stack: head centre and radius, shoulders' line and half width */
  person: readonly [x: number, headY: number, radius: number, shouldersY: number, halfWidth: number];
}>;

const PHONE: Layout = {
  height: 150,
  screen: [24, 3, 52, 30],
  base: [3.5, 4],
  marks: [36, 50, 64].map((x) => [x, 18] as const),
  mark: 10,
  card: 48,
  out: [50, 46],
  atScanner: [50, 59.2],
  pastScanner: [50, 92.8],
  scanner: [
    [6, 76],
    [94, 76],
  ],
  flip: 0.4,
  stack: [18, 147, 3.6, 0.5],
  ground: [10, 90],
  person: [67, 122, 4.5, 129, 8],
};

const WIDE: Layout = {
  height: 34,
  screen: [3, 7, 22, 16],
  base: [2.5, 2.5],
  marks: [8.5, 14, 19.5].map((x) => [x, 15] as const),
  mark: 4,
  card: 24,
  out: [22, 15],
  atScanner: [38, 15],
  pastScanner: [62, 15],
  scanner: [
    [50, 4],
    [50, 27],
  ],
  flip: null,
  stack: [76, 32, 2.4, 0.62],
  ground: [72, 99.5],
  person: [95.5, 21.5, 1.8, 25, 3.25],
};

const starts = (index: number) => START + index * GAP;
const cardHeight = (layout: Layout) => layout.card * 0.7;

/* ---------- the stylesheet ---------- */

const n = (value: number) => Number(value.toFixed(3));
const cq = (value: number) => `${n(value)}cqw`;
const at = (ms: number) => `${n((ms / LOOP) * 100)}%`;

type Ease = "out" | "in-out" | "linear";
type Stop = readonly [ms: number, declarations: string, ease?: Ease];

function keyframes(name: string, stops: readonly Stop[]) {
  const body = stops
    .map(([ms, declarations, ease]) => {
      const timing = !ease ? "" : ease === "linear" ? " animation-timing-function: linear;" : ` animation-timing-function: var(--ease-${ease});`;
      return `${at(ms)} { ${declarations};${timing} }`;
    })
    .join(" ");
  return `@keyframes ${name} { ${body} }`;
}

/* a card centred on a point, at a scale; it scales from its top-left corner */
function pose(layout: Layout, [x, y]: Point, scale: number, opacity: number) {
  const w = layout.card;
  const h = cardHeight(layout);
  return `transform: translate(${cq(x - (w * scale) / 2)}, ${cq(y - (h * scale) / 2)}) scale(${n(scale)}); opacity: ${opacity}`;
}

function stacked(layout: Layout, index: number, opacity = 1) {
  const [left, ground, step, scale] = layout.stack;
  const top = ground - cardHeight(layout) * scale - index * step;
  return `transform: translate(${cq(left)}, ${cq(top)}) scale(${n(scale)}); opacity: ${opacity}`;
}

function cardStops(layout: Layout, index: number): Stop[] {
  const t = starts(index);
  const from = layout.marks[index % SHOWN]!;
  const startScale = (layout.mark * 1.2) / layout.card;
  return [
    [0, pose(layout, from, startScale, 0)],
    [t, pose(layout, from, startScale, 0), "out"],
    [t + TRIP.out, pose(layout, layout.out, 0.62, 1), "in-out"],
    [t + TRIP.atScanner, pose(layout, layout.atScanner, 1, 1), "linear"],
    [t + TRIP.pastScanner, pose(layout, layout.pastScanner, 1, 1)],
    [t + TRIP.stamped, pose(layout, layout.pastScanner, 1, 1), "in-out"],
    [t + TRIP.landed, stacked(layout, index)],
    [FADE_FROM, stacked(layout, index), "out"],
    [FADE_TO, stacked(layout, index, 0)],
    [LOOP, stacked(layout, index, 0)],
  ];
}

/*
 * The secret line turns amber where the scanner meets it: on a wide screen the
 * card crosses sideways and the amber follows the scanner along the line; on a
 * phone the card crosses downwards and the whole line turns at once.
 */
function maskStops(layout: Layout, index: number): Stop[] {
  const crossing = starts(index) + TRIP.atScanner;
  if (layout.flip !== null) {
    const when = crossing + layout.flip * CROSS;
    return [
      [0, "opacity: 0; transform: none"],
      [when - 60, "opacity: 0; transform: none", "out"],
      [when + 60, "opacity: 1; transform: none"],
      [LOOP, "opacity: 1; transform: none"],
    ];
  }
  /* the line runs from a tenth of the card to 0.564 of it; the scanner sweeps the card from its right edge */
  const from = crossing + 0.436 * CROSS;
  const to = crossing + 0.9 * CROSS;
  return [
    [0, "opacity: 1; transform: scaleX(0)"],
    [from, "opacity: 1; transform: scaleX(0)", "linear"],
    [to, "opacity: 1; transform: scaleX(1)"],
    [LOOP, "opacity: 1; transform: scaleX(1)"],
  ];
}

function layoutRules(layout: Layout) {
  const half = layout.mark / 2;
  return [
    `.hf { aspect-ratio: 100 / ${layout.height} }`,
    ...layout.marks.flatMap(([x, y], slot) =>
      AGENTS.map((_, index) => index)
        .filter((index) => index % SHOWN === slot)
        .map(
          (index) =>
            `.hf-m${index} { left: ${cq(x - half)}; top: ${cq(y - half)}; width: ${cq(layout.mark)}; height: ${cq(layout.mark)} }`,
        ),
    ),
    `.hf-card { width: ${cq(layout.card)}; height: ${cq(cardHeight(layout))} }`,
    ...AGENTS.map((_, index) => `.hf-c${index} { ${stacked(layout, index)} }`),
  ].join("\n");
}

function layoutKeyframes(layout: Layout) {
  return AGENTS.flatMap((_, index) => [
    keyframes(`hf-card-${index}`, cardStops(layout, index)),
    keyframes(`hf-mask-${index}`, maskStops(layout, index)),
  ]).join("\n");
}

/* everything that moves the same way whatever the layout */
function sharedKeyframes() {
  const marks = AGENTS.map((_, index) => {
    const first = index < SHOWN;
    const t = starts(index);
    const idle = "opacity: 0.4";
    const lit = "opacity: 1";
    const gone = "opacity: 0";
    /* the first three show from the start and come back at the end; the other three take the middle */
    const shown: Stop[] = first
      ? [
          [0, idle],
          [t - 250, idle, "out"],
          [t, lit],
          [t + TRIP.out + 200, lit, "out"],
          [t + TRIP.out + 500, idle],
          [SWAP - 300, idle, "out"],
          [SWAP, gone],
          [FADE_TO, gone, "out"],
          [FADE_TO + 300, idle],
          [LOOP, idle],
        ]
      : [
          [0, gone],
          [SWAP, gone, "out"],
          [SWAP + 300, idle],
          [t - 250, idle, "out"],
          [t, lit],
          [t + TRIP.out + 200, lit, "out"],
          [t + TRIP.out + 500, idle],
          [FADE_FROM, idle, "out"],
          [FADE_TO, gone],
          [LOOP, gone],
        ];
    return keyframes(`hf-mark-${index}`, shown);
  });
  const stamps = AGENTS.map((_, index) => {
    const t = starts(index) + TRIP.pastScanner + 100;
    return keyframes(`hf-stamp-${index}`, [
      [0, "opacity: 0; transform: scale(1.5)"],
      [t, "opacity: 0; transform: scale(1.5)", "out"],
      [t + 260, "opacity: 1; transform: scale(1)"],
      [LOOP, "opacity: 1; transform: scale(1)"],
    ]);
  });
  const beam = keyframes("hf-beam", [
    [0, "opacity: 0"],
    ...AGENTS.flatMap((_, index): Stop[] => {
      const t = starts(index);
      return [
        [t + TRIP.atScanner - 80, "opacity: 0", "out"],
        [t + TRIP.atScanner + 80, "opacity: 1"],
        [t + TRIP.pastScanner - 80, "opacity: 1", "out"],
        [t + TRIP.pastScanner + 120, "opacity: 0"],
      ];
    }),
    [LOOP, "opacity: 0"],
  ]);
  return [...marks, ...stamps, beam].join("\n");
}

function motionRules() {
  const run = (name: string) => `animation: ${name} ${LOOP}ms linear infinite`;
  return [
    ...AGENTS.flatMap((_, index) => [
      `.hf-c${index} { ${run(`hf-card-${index}`)} }`,
      `.hf-k${index} { ${run(`hf-mask-${index}`)} }`,
      `.hf-t${index} { ${run(`hf-stamp-${index}`)} }`,
      `.hf-m${index} { ${run(`hf-mark-${index}`)} }`,
    ]),
    `.hf-beam { ${run("hf-beam")} }`,
    `.hf[data-paused=true] * { animation-play-state: paused }`,
  ].join("\n");
}

/* at rest, the finished frame: the first three marks on the laptop, every card on the stack */
const RESTING = AGENTS.map((_, index) => `.hf-m${index} { opacity: ${index < SHOWN ? 1 : 0} }`).join("\n");

const STYLESHEET = [
  RESTING,
  layoutRules(PHONE),
  layoutKeyframes(PHONE),
  sharedKeyframes(),
  `.hf-art-wide { display: none }`,
  `@media (min-width: 48rem) {\n.hf-art-phone { display: none }\n.hf-art-wide { display: block }\n${layoutRules(WIDE)}\n${layoutKeyframes(WIDE)}\n}`,
  `@media (prefers-reduced-motion: no-preference) {\n${motionRules()}\n}`,
].join("\n");

/* ---------- the drawing ---------- */

/** The still parts, drawn in the picture's own units: the laptop, the scanner, the ground and the person. */
function Scene({ layout, className }: { layout: Layout; className: string }) {
  const [sx, sy, sw, sh] = layout.screen;
  const [depth, overhang] = layout.base;
  const [[x1, y1], [x2, y2]] = layout.scanner;
  const [px, headY, radius, shouldersY, halfWidth] = layout.person;
  const [, groundY] = layout.stack;
  const [groundFrom, groundTo] = layout.ground;
  const corner = halfWidth * 0.5;
  const left = px - halfWidth;
  const right = px + halfWidth;
  return (
    <svg className={`hf-art ${className}`} viewBox={`0 0 100 ${layout.height}`} aria-hidden="true" focusable="false">
      <rect className="hf-line" x={sx} y={sy} width={sw} height={sh} />
      <path
        className="hf-line"
        d={`M${sx} ${sy + sh} L${sx + sw} ${sy + sh} L${sx + sw + overhang} ${sy + sh + depth} L${sx - overhang} ${sy + sh + depth} Z`}
      />
      <line className="hf-sieve" x1={x1} y1={y1} x2={x2} y2={y2} />
      <line className="hf-beam" x1={x1} y1={y1} x2={x2} y2={y2} />
      <line className="hf-ground" x1={groundFrom} y1={groundY} x2={groundTo} y2={groundY} />
      <circle className="hf-line" cx={px} cy={headY} r={radius} />
      <path
        className="hf-line"
        d={`M${left} ${groundY} V${shouldersY + corner} Q${left} ${shouldersY} ${left + corner} ${shouldersY} H${right - corner} Q${right} ${shouldersY} ${right} ${shouldersY + corner} V${groundY}`}
      />
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
          <div key={agent.mark} className={`hf-card hf-c${index}`}>
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
        ))}
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
