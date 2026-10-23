"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { HERO } from "@/lib/landing";
import { Pause, Play } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/*
 * The hero's picture, drawn with the page's own type and tokens: a transcript
 * leaves each agent, passes through redaction, is published across the edge of
 * your computer, and lands in the commons, where the meter under @you counts it.
 *
 * Its geometry and its timeline live here, together, and become one stylesheet.
 * Every place is in hundredths of the picture's width (cqw), so the picture
 * scales without moving anything relative to anything else. A phone reads it
 * top to bottom; a wide screen reads it left to right.
 *
 * Only transform and opacity move. The stylesheet's resting state is the
 * finished frame, every transcript in the commons, and the loop is laid over it
 * only when motion is allowed, so reduced motion sees that one frame.
 */

const FLOW = HERO.flow;
const AGENTS = FLOW.agents;

/* one loop, a departure every GAP ms from START, and the fade out at the end */
const LOOP = 18400;
const START = 400;
const GAP = 2400;
const FADE_FROM = LOOP - 900;
const FADE_TO = LOOP - 500;

/* a trip, from its departure: appear beside the agent, reach redaction, wait, reach the edge, wait while publish is pressed, land */
const TRIP = { shown: 300, atFilter: 1000, leaveFilter: 1550, atEdge: 2050, leaveEdge: 2350, landed: 3050 } as const;

type Rect = readonly [x: number, y: number, w: number, h: number];
type Text = Readonly<{ x: number; y: number; align: "start" | "center" | "end"; middle?: boolean }>;
type Point = readonly [x: number, y: number];

type Layout = Readonly<{
  /** the picture's height, in hundredths of its width */
  height: number;
  computer: Rect;
  commons: Rect;
  filter: Rect;
  labels: Readonly<{ computer: Text; commons: Text; filter: Text; you: Text; plus: Text; caption: Text }>;
  /** the agents' marks: their centres and one size */
  marks: readonly Point[];
  mark: number;
  /** where a transcript first shows beside its agent, from that agent's centre, and how small */
  out: Point;
  outScale: number;
  card: readonly [w: number, h: number];
  /** the centres a transcript stops at: in redaction, then at the edge of your computer */
  atFilter: Point;
  atEdge: Point;
  /** the centre of publish, on the edge */
  publish: Point;
  /** where each transcript lands, top-left, and how small it rests there */
  slots: readonly Point[];
  slotScale: number;
  meter: Rect;
  segmentGap: number;
}>;

const PHONE: Layout = {
  height: 110,
  computer: [0.5, 0.5, 99, 57.5],
  commons: [0.5, 64, 99, 45.5],
  filter: [4.5, 31.5, 91, 6],
  labels: {
    computer: { x: 4.5, y: 3.5, align: "start" },
    commons: { x: 4.5, y: 67, align: "start" },
    filter: { x: 95.5, y: 39, align: "end" },
    you: { x: 4.5, y: 90, align: "start", middle: true },
    plus: { x: 95.5, y: 90, align: "end", middle: true },
    caption: { x: 4.5, y: 95.5, align: "start" },
  },
  marks: [14, 28.4, 42.8, 57.2, 71.6, 86].map((x) => [x, 17] as const),
  mark: 7,
  out: [0, 8],
  outScale: 0.45,
  card: [20, 14],
  atFilter: [50, 34.5],
  atEdge: [50, 49.5],
  publish: [78, 58],
  slots: [4.5, 20.22, 35.94, 51.66, 67.38, 83.1].map((x) => [x, 74] as const),
  slotScale: 0.62,
  meter: [17.5, 89.4, 66, 1.2],
  segmentGap: 1.2,
};

/* the commons fills its far side first, so a transcript on its way never crosses one that has landed */
const WIDE: Layout = {
  height: 43,
  computer: [0.5, 0.5, 57.5, 42],
  commons: [64, 0.5, 35.5, 42],
  filter: [31, 11, 6, 24],
  labels: {
    computer: { x: 2.75, y: 2.2, align: "start" },
    commons: { x: 67.75, y: 2.2, align: "start" },
    filter: { x: 34, y: 7.6, align: "center" },
    you: { x: 67.75, y: 27.2, align: "start", middle: true },
    plus: { x: 95.75, y: 27.2, align: "end", middle: true },
    caption: { x: 67.75, y: 31.6, align: "start" },
  },
  marks: [9.5, 14.8, 20.1, 25.4, 30.7, 36].map((y) => [4.15, y] as const),
  mark: 2.8,
  out: [4.5, 0],
  outScale: 0.5,
  card: [10, 7],
  atFilter: [34, 23],
  atEdge: [51.5, 23],
  publish: [58, 31.5],
  slots: [
    [87.75, 8],
    [77.75, 8],
    [67.75, 8],
    [87.75, 15.6],
    [77.75, 15.6],
    [67.75, 15.6],
  ],
  slotScale: 0.8,
  meter: [73.5, 26.8, 18.5, 0.8],
  segmentGap: 0.7,
};

const departs = (index: number) => START + index * GAP;
const lands = (index: number) => departs(index) + TRIP.landed;

/* ---------- the stylesheet ---------- */

const n = (value: number) => Number(value.toFixed(3));
const cq = (value: number) => `${n(value)}cqw`;
const at = (ms: number) => `${n((ms / LOOP) * 100)}%`;

type Stop = readonly [ms: number, declarations: string, ease?: "out" | "in-out"];

function keyframes(name: string, stops: readonly Stop[]) {
  const body = stops
    .map(([ms, declarations, ease]) => {
      const timing = ease ? ` animation-timing-function: var(--ease-${ease});` : "";
      return `${at(ms)} { ${declarations};${timing} }`;
    })
    .join(" ");
  return `@keyframes ${name} { ${body} }`;
}

function box([x, y, w, h]: Rect) {
  return `left: ${cq(x)}; top: ${cq(y)}; width: ${cq(w)}; height: ${cq(h)}`;
}

function text({ x, y, align, middle }: Text) {
  const left = align === "end" ? `left: auto; right: ${cq(100 - x)}` : `left: ${cq(x)}; right: auto`;
  const shift = `${align === "center" ? "-50%" : "0"} ${middle ? "-50%" : "0"}`;
  return `${left}; top: ${cq(y)}; translate: ${shift}`;
}

/* a transcript centred on a point, at a scale; it scales from its top-left corner */
function pose(layout: Layout, [x, y]: Point, scale: number, opacity: number) {
  const [w, h] = layout.card;
  return `transform: translate(${cq(x - (w * scale) / 2)}, ${cq(y - (h * scale) / 2)}) scale(${n(scale)}); opacity: ${opacity}`;
}

function landed(layout: Layout, index: number, opacity = 1) {
  const [x, y] = layout.slots[index]!;
  return `transform: translate(${cq(x)}, ${cq(y)}) scale(${n(layout.slotScale)}); opacity: ${opacity}`;
}

function cardStops(layout: Layout, index: number): Stop[] {
  const t = departs(index);
  const [mx, my] = layout.marks[index]!;
  const out: Point = [mx + layout.out[0], my + layout.out[1]];
  return [
    [0, pose(layout, out, layout.outScale, 0)],
    [t, pose(layout, out, layout.outScale, 0), "out"],
    [t + TRIP.shown, pose(layout, out, layout.outScale, 1), "in-out"],
    [t + TRIP.atFilter, pose(layout, layout.atFilter, 1, 1)],
    [t + TRIP.leaveFilter, pose(layout, layout.atFilter, 1, 1), "in-out"],
    [t + TRIP.atEdge, pose(layout, layout.atEdge, 1, 1)],
    [t + TRIP.leaveEdge, pose(layout, layout.atEdge, 1, 1), "in-out"],
    [t + TRIP.landed, landed(layout, index)],
    [FADE_FROM, landed(layout, index), "out"],
    [FADE_TO, landed(layout, index, 0)],
    [LOOP, landed(layout, index, 0)],
  ];
}

/* the places, and each transcript's finished frame, for one layout */
function layoutRules(layout: Layout) {
  const mw = layout.mark;
  const [, , meterWidth] = layout.meter;
  const segment = (meterWidth - layout.segmentGap * (AGENTS.length - 1)) / AGENTS.length;
  return [
    `.hf { aspect-ratio: 100 / ${layout.height} }`,
    `.hf-computer { ${box(layout.computer)} }`,
    `.hf-commons { ${box(layout.commons)} }`,
    `.hf-filter { ${box(layout.filter)} }`,
    ...(["computer", "commons", "filter", "you", "plus", "caption"] as const).map(
      (name) => `.hf-label-${name} { ${text(layout.labels[name])} }`,
    ),
    ...layout.marks.map(([x, y], index) => `.hf-m${index} { ${box([x - mw / 2, y - mw / 2, mw, mw])} }`),
    `.hf-card { width: ${cq(layout.card[0])}; height: ${cq(layout.card[1])} }`,
    ...AGENTS.map((_, index) => `.hf-c${index} { ${landed(layout, index)} }`),
    `.hf-publish { left: ${cq(layout.publish[0])}; top: ${cq(layout.publish[1])} }`,
    `.hf-meter { ${box(layout.meter)}; gap: ${cq(layout.segmentGap)} }`,
    `.hf-segment { width: ${cq(segment)} }`,
    `.hf-toggle { left: calc(${cq(layout.commons[0] + layout.commons[2])} - 44px); top: calc(${cq(layout.commons[1] + layout.commons[3])} - 44px) }`,
  ].join("\n");
}

function layoutKeyframes(layout: Layout) {
  return AGENTS.map((_, index) => keyframes(`hf-card-${index}`, cardStops(layout, index))).join("\n");
}

/* everything that moves the same way whatever the layout */
function sharedKeyframes() {
  const hidden = "opacity: 0";
  const shown = "opacity: 1";
  const masks = AGENTS.map((_, index) => {
    const t = departs(index);
    return keyframes(`hf-mask-${index}`, [
      [0, hidden],
      [t + TRIP.atFilter + 100, hidden, "out"],
      [t + TRIP.atFilter + 400, shown],
      [LOOP, shown],
    ]);
  });
  const segments = AGENTS.map((_, index) =>
    keyframes(`hf-seg-${index}`, [
      [0, "transform: scaleX(0); opacity: 1"],
      [lands(index), "transform: scaleX(0); opacity: 1", "out"],
      [lands(index) + 400, "transform: scaleX(1); opacity: 1"],
      [FADE_FROM, "transform: scaleX(1); opacity: 1", "out"],
      [FADE_TO, "transform: scaleX(1); opacity: 0"],
      [LOOP, "transform: scaleX(1); opacity: 0"],
    ]),
  );
  const pulses = (name: string, from: number, to: number, on: string, off: string) =>
    keyframes(name, [
      [0, off],
      ...AGENTS.flatMap((_, index): Stop[] => {
        const t = departs(index);
        return [
          [t + from - 50, off, "out"],
          [t + from + 100, on],
          [t + to, on, "out"],
          [t + to + 200, off],
        ];
      }),
      [LOOP, off],
    ]);
  const plus = keyframes("hf-plus", [
    [0, "opacity: 0; transform: translateY(40%)"],
    ...AGENTS.flatMap((_, index): Stop[] => [
      [lands(index), "opacity: 0; transform: translateY(40%)", "out"],
      [lands(index) + 250, "opacity: 1; transform: translateY(0)"],
      [lands(index) + 900, "opacity: 1; transform: translateY(0)", "out"],
      [lands(index) + 1200, "opacity: 0; transform: translateY(0)"],
    ]),
    [LOOP, "opacity: 0; transform: translateY(0)"],
  ]);
  const press = keyframes("hf-press", [
    [0, "transform: scale(1)"],
    ...AGENTS.flatMap((_, index): Stop[] => {
      const t = departs(index) + TRIP.atEdge;
      return [
        [t, "transform: scale(1)", "out"],
        [t + 120, "transform: scale(0.97)", "out"],
        [t + 320, "transform: scale(1)"],
      ];
    }),
    [LOOP, "transform: scale(1)"],
  ]);
  return [
    ...masks,
    ...segments,
    pulses("hf-scan", TRIP.atFilter, TRIP.leaveFilter, shown, hidden),
    pulses("hf-press-fill", TRIP.atEdge, TRIP.leaveEdge, shown, hidden),
    plus,
    press,
  ].join("\n");
}

function motionRules() {
  const run = (name: string) => `animation: ${name} ${LOOP}ms linear infinite`;
  return [
    ...AGENTS.flatMap((_, index) => [
      `.hf-c${index} { ${run(`hf-card-${index}`)} }`,
      `.hf-k${index} { ${run(`hf-mask-${index}`)} }`,
      `.hf-s${index} { ${run(`hf-seg-${index}`)} }`,
    ]),
    `.hf-scan { ${run("hf-scan")} }`,
    `.hf-publish-chip { ${run("hf-press")} }`,
    `.hf-publish-fill { ${run("hf-press-fill")} }`,
    `.hf-label-plus { ${run("hf-plus")} }`,
    `.hf[data-paused=true] * { animation-play-state: paused }`,
  ].join("\n");
}

const STYLESHEET = [
  layoutRules(PHONE),
  layoutKeyframes(PHONE),
  sharedKeyframes(),
  `@media (min-width: 48rem) {\n${layoutRules(WIDE)}\n${layoutKeyframes(WIDE)}\n}`,
  `@media (prefers-reduced-motion: no-preference) {\n${motionRules()}\n}`,
].join("\n");

/* ---------- the picture ---------- */

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
        <div className="hf-zone hf-computer" />
        <div className="hf-zone hf-commons" />
        <span className="hf-label hf-label-computer">{FLOW.computer}</span>
        <span className="hf-label hf-label-commons">{FLOW.commons}</span>

        <div className="hf-filter">
          <i className="hf-scan" />
        </div>
        <span className="hf-label hf-label-filter">{FLOW.filter}</span>

        {AGENTS.map((agent, index) => (
          <span key={agent.mark} className={`hf-mark hf-m${index}`}>
            <BrandMark name={agent.mark} />
          </span>
        ))}

        <span className="hf-publish">
          <span className="hf-publish-chip">
            {FLOW.publish}
            <span className="hf-publish-fill">{FLOW.publish}</span>
          </span>
        </span>

        {AGENTS.map((agent, index) => (
          <div key={agent.mark} className={`hf-card hf-c${index}`}>
            <div className="hf-card-body">
              <span className="hf-card-head">
                <BrandMark name={agent.mark} />
                <i className="hf-bar" style={{ "--w": "58%" } as CSSProperties} />
              </span>
              <i className="hf-bar" style={{ "--w": "88%" } as CSSProperties} />
              <span className="hf-secret">
                <i className="hf-bar" style={{ "--w": "62%" } as CSSProperties} />
                <i className={`hf-mask hf-k${index}`} />
              </span>
              <i className="hf-bar" style={{ "--w": "74%" } as CSSProperties} />
            </div>
          </div>
        ))}

        <span className="hf-label hf-label-you">{FLOW.handle}</span>
        <span className="hf-meter">
          {AGENTS.map((agent, index) => (
            <span key={agent.mark} className="hf-segment">
              <i className={`hf-fill hf-s${index}`} />
            </span>
          ))}
        </span>
        <span className="hf-label hf-label-plus">+1</span>
        <span className="hf-label hf-label-caption">{FLOW.caption}</span>
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
