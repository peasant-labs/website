"use client";

import { Art } from "@/components/art";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { USE_CASES, type CapabilityIcon, type UseCase } from "@/lib/landing";
import {
  ChartNoAxesColumn,
  Check,
  ChevronLeft,
  ChevronRight,
  Code,
  GitPullRequest,
  GraduationCap,
  HistoryIcon,
  Link as LinkIcon,
  Lock,
  MessageCircle,
  Search,
  Send,
} from "@peasant-labs/fairtrade/icons";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type PointerEvent,
  type SVGProps,
} from "react";

const SLIDES = USE_CASES.slides;
const COUNT = SLIDES.length;
/* the track: a copy of the last slide, the slides, a copy of the first, so the loop never rewinds */
const TRACK: readonly { slide: UseCase; real: number | null }[] = [
  { slide: SLIDES[COUNT - 1]!, real: null },
  ...SLIDES.map((slide, real) => ({ slide, real })),
  { slide: SLIDES[0]!, real: null },
];

/* a drag past this share of the width, or a flick faster than this, moves a slide */
const DRAG_SHARE = 0.2;
const FLICK_PX_PER_MS = 0.35;
/* past this share of the width a drag resists, like a rubber band */
const DAMP_FROM = 0.6;

type Motion = "slide" | "release" | "none";

const CAPABILITY_ICONS: Record<CapabilityIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  check: Check,
  chart: ChartNoAxesColumn,
  class: GraduationCap,
  "pull-request": GitPullRequest,
  history: HistoryIcon,
  conversation: MessageCircle,
  search: Search,
  link: LinkIcon,
  send: Send,
  lock: Lock,
  code: Code,
};

/*
 * On a phone the tab row scrolls sideways. Bring the chosen tab into the row's
 * view without moving the page, which scrollIntoView would do.
 */
function revealInRow(tab: HTMLElement) {
  const row = tab.closest<HTMLElement>(".uc-tabs-row");
  if (!row) return;
  const tabBox = tab.getBoundingClientRect();
  const rowBox = row.getBoundingClientRect();
  if (tabBox.left < rowBox.left) row.scrollLeft -= rowBox.left - tabBox.left;
  else if (tabBox.right > rowBox.right) row.scrollLeft += tabBox.right - rowBox.right;
}

function damp(dx: number, width: number) {
  const limit = width * DAMP_FROM;
  if (Math.abs(dx) <= limit) return dx;
  return Math.sign(dx) * (limit + (Math.abs(dx) - limit) * 0.35);
}

/**
 * The use-case carousel: one slide per audience, its picture beside a heading,
 * a sentence and one action, and its three capabilities cycling as a caption
 * on the picture.
 *
 * It plays on its own: every few seconds it moves forward, and after the last
 * audience it carries on to the first without rewinding, because the track ends
 * in copies of its first and last slides that it quietly swaps for the real
 * ones. A thin bar under the chosen tab shows the time to the next slide. It
 * holds while hovered, keyboard-focused, touched, off screen or in a background
 * tab; under reduced motion it never moves on its own.
 *
 * On touch the slide follows the finger and settles by distance or by a flick.
 * The audiences are real tabs, so it is fully operable from the keyboard.
 */
export function UseCases() {
  const [pos, setPos] = useState(1);
  const [round, setRound] = useState(0);
  const [caption, setCaption] = useState(0);
  const [held, setHeld] = useState({ hover: false, focus: false, touch: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const motion = useRef<Motion>("none");
  const drag = useRef<{
    x: number;
    y: number;
    lastX: number;
    lastT: number;
    velocity: number;
    axis: "x" | "y" | null;
    base: number;
  } | null>(null);
  const reduced = useReducedMotion();
  const onScreen = useOnScreen(rootRef);
  const index = (((pos - 1) % COUNT) + COUNT) % COUNT;
  const playing = !reduced && onScreen && !held.hover && !held.focus && !held.touch;

  const apply = useCallback((at: number, dragPx: number, how: Motion) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition =
      how === "slide"
        ? "transform 520ms var(--ease-in-out)"
        : how === "release"
          ? "transform 360ms var(--ease-out)"
          : "none";
    track.style.transform = `translate3d(calc(${-at * 100}% + ${dragPx}px), 0, 0)`;
  }, []);

  // Every position change lands with the motion its cause asked for.
  useLayoutEffect(() => {
    apply(pos, 0, reduced ? "none" : motion.current);
    motion.current = "slide";
  }, [pos, reduced, apply]);

  // The captions cycle with the slide, three to a slide, and hold with it.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setCaption((current) => (current + 1) % 3),
      USE_CASES.captionMs,
    );
    return () => window.clearInterval(timer);
  }, [playing, index]);

  /* A copy of an end slide is swapped for the real one without motion. */
  function normalize() {
    const real = pos === 0 ? COUNT : pos === COUNT + 1 ? 1 : pos;
    if (real !== pos) {
      apply(real, 0, "none");
      void trackRef.current?.offsetWidth;
    }
    return real;
  }

  function moveTo(target: number, how: Motion = "slide") {
    const next = reduced ? ((((target - 1) % COUNT) + COUNT) % COUNT) + 1 : target;
    motion.current = how;
    if (next === pos) apply(next, 0, reduced ? "none" : how);
    else setPos(next);
    setCaption(0);
    setRound((value) => value + 1);
  }

  function step(delta: 1 | -1) {
    moveTo(normalize() + delta);
  }

  function choose(real: number, { focus = false } = {}) {
    const target = (((real % COUNT) + COUNT) % COUNT) + 1;
    const from = normalize();
    if (target !== from) moveTo(target);
    const tab = tabRefs.current[target - 1];
    if (tab) {
      revealInRow(tab);
      if (focus) tab.focus();
    }
  }

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    // Arrows move from the tab that has focus, which is the selected one unless a script moved focus.
    const focused = tabRefs.current.indexOf(event.target as HTMLButtonElement);
    const from = focused >= 0 ? focused : index;
    const moves: Record<string, () => void> = {
      ArrowRight: () => choose(from + 1, { focus: true }),
      ArrowLeft: () => choose(from - 1, { focus: true }),
      Home: () => choose(0, { focus: true }),
      End: () => choose(COUNT - 1, { focus: true }),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    const base = normalize();
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
      axis: null,
      base,
    };
    setHeld((current) => ({ ...current, touch: true }));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (current.axis === "x") viewportRef.current?.setPointerCapture(event.pointerId);
    }
    if (current.axis !== "x") return;
    const elapsed = event.timeStamp - current.lastT;
    if (elapsed > 0) current.velocity = (event.clientX - current.lastX) / elapsed;
    current.lastX = event.clientX;
    current.lastT = event.timeStamp;
    apply(current.base, damp(dx, viewportRef.current?.clientWidth ?? 1), "none");
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const current = drag.current;
    drag.current = null;
    setHeld((value) => ({ ...value, touch: false }));
    if (!current || current.axis !== "x") return;
    const width = viewportRef.current?.clientWidth ?? 1;
    const dx = cancelled ? 0 : event.clientX - current.x;
    // a flick is judged on the last movement, so a slow drag that ends still counts as slow
    const recent = event.timeStamp - current.lastT < 80 ? current.velocity : 0;
    let target = current.base;
    if (dx < -width * DRAG_SHARE || recent < -FLICK_PX_PER_MS) target = current.base + 1;
    else if (dx > width * DRAG_SHARE || recent > FLICK_PX_PER_MS) target = current.base - 1;
    moveTo(target, "release");
  }

  return (
    <div
      ref={rootRef}
      className="uc"
      data-use-cases
      data-playing={playing ? "true" : "false"}
      role="region"
      aria-roledescription="carousel"
      aria-label="use cases"
      // Keyboard focus holds the carousel; a mouse click that leaves focus on a tab does not.
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) {
          setHeld((current) => ({ ...current, focus: true }));
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHeld((current) => ({ ...current, focus: false }));
        }
      }}
    >
      <div className="uc-tabs-row" data-contained-overflow>
        <div className="uc-tabs" role="tablist" aria-label="audiences" onKeyDown={onTabKey}>
          {SLIDES.map((slide, slideIndex) => {
            const selected = slideIndex === index;
            return (
              <button
                key={slide.id}
                ref={(element) => {
                  tabRefs.current[slideIndex] = element;
                }}
                type="button"
                role="tab"
                id={`uc-tab-${slide.id}`}
                className="uc-tab"
                aria-selected={selected}
                aria-controls={`uc-panel-${slide.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => choose(slideIndex)}
              >
                {slide.label}
                {selected && !reduced ? (
                  <span
                    key={round}
                    className="uc-progress"
                    style={{ animationDuration: `${USE_CASES.slideMs}ms` }}
                    aria-hidden="true"
                    onAnimationEnd={() => step(1)}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={viewportRef}
        id="uc-stage"
        className="uc-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endDrag(event)}
        onPointerCancel={(event) => endDrag(event, true)}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHeld((current) => ({ ...current, hover: true }));
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setHeld((current) => ({ ...current, hover: false }));
        }}
      >
        <div
          ref={trackRef}
          className="uc-track"
          // the first real slide, before the script takes the track over
          style={{ transform: "translate3d(-100%, 0, 0)" }}
          onTransitionEnd={(event) => {
            if (event.target !== trackRef.current || event.propertyName !== "transform") return;
            if (pos === 0 || pos === COUNT + 1) {
              motion.current = "none";
              setPos(pos === 0 ? COUNT : 1);
            }
          }}
        >
          {TRACK.map(({ slide, real }, at) => {
            const shown = at === pos;
            const isReal = real !== null;
            return (
              <div
                key={isReal ? slide.id : `copy-${at}`}
                id={isReal ? `uc-panel-${slide.id}` : undefined}
                className="uc-panel"
                role={isReal ? "tabpanel" : undefined}
                aria-labelledby={isReal ? `uc-tab-${slide.id}` : undefined}
                aria-hidden={shown ? undefined : true}
                inert={!shown}
                data-active={shown ? "true" : "false"}
              >
                <figure className="uc-figure">
                  <Art art={slide.art} className="uc-art" />
                  <figcaption className="uc-caption">
                    <ul className="uc-caps" data-static={reduced ? "true" : "false"}>
                      {slide.capabilities.map((capability, capIndex) => {
                        const Icon = CAPABILITY_ICONS[capability.icon];
                        const on = reduced || capIndex === (shown ? caption : 0);
                        return (
                          <li key={capability.text} className="uc-cap" data-on={on ? "true" : "false"}>
                            <Icon className="uc-cap-ic" aria-hidden="true" focusable="false" />
                            <span className="uc-cap-text">{capability.text}</span>
                            <span className="uc-cap-n" aria-hidden="true">
                              {capIndex + 1} / {slide.capabilities.length}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </figcaption>
                </figure>
                <div className="uc-copy">
                  <h3>{slide.label}</h3>
                  <p>{slide.sentence}</p>
                  <a
                    className="btn btn-primary site-btn site-btn-lg uc-cta"
                    href={slide.cta.href}
                    data-use-case-cta={isReal ? slide.id : undefined}
                  >
                    {slide.cta.label}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="uc-arrows">
        <button
          type="button"
          className="site-icon-btn site-icon-btn-boxed"
          aria-label="previous use case"
          aria-controls="uc-stage"
          onClick={() => step(-1)}
        >
          <ChevronLeft aria-hidden="true" focusable="false" />
        </button>
        <span className="uc-count" aria-hidden="true">
          {index + 1} / {COUNT}
        </span>
        <button
          type="button"
          className="site-icon-btn site-icon-btn-boxed"
          aria-label="next use case"
          aria-controls="uc-stage"
          onClick={() => step(1)}
        >
          <ChevronRight aria-hidden="true" focusable="false" />
        </button>
      </div>
    </div>
  );
}
