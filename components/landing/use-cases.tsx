"use client";

import { Art } from "@/components/art";
import { LandingIcon } from "@/components/landing/icons";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { USE_CASES, type UseCase } from "@/lib/landing";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

const SLIDES = USE_CASES.slides;
const COUNT = SLIDES.length;
const CAPS = 3;
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

function damp(dx: number, width: number) {
  const limit = width * DAMP_FROM;
  if (Math.abs(dx) <= limit) return dx;
  return Math.sign(dx) * (limit + (Math.abs(dx) - limit) * 0.35);
}

/**
 * The use-case carousel: one slide per audience, its picture on its own panel
 * beside a heading, a sentence and one action, and its three capabilities
 * cycling as a caption bar along the panel's foot, each with its own picture.
 *
 * All four audiences stand side by side as labelled tabs, each with its icon
 * and its own track, so the whole set reads at a glance. It plays on its own:
 * the chosen tab's track fills with the slide's time, and the caption's three
 * segments fill one capability at a time; a segment can be chosen to jump to
 * its capability. After the last audience it carries on to the first without
 * rewinding, because the track ends in copies of its first and last slides that
 * it quietly swaps for the real ones. Both clocks are CSS animations, so they
 * pause exactly where they are while the carousel is hovered, keyboard-focused,
 * touched, off screen or in a background tab; under reduced motion nothing
 * moves on its own and the capabilities stand as a list.
 *
 * On touch the slide follows the finger and settles by distance or by a flick.
 * The audiences are real tabs, so it is fully operable from the keyboard.
 */
export function UseCases() {
  const [pos, setPos] = useState(1);
  const [round, setRound] = useState(0);
  const [caption, setCaption] = useState(0);
  /* a chosen capability restarts both clocks from its place in the slide */
  const [picked, setPicked] = useState({ key: 0, from: 0 });
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
    setPicked({ key: 0, from: 0 });
    setRound((value) => value + 1);
  }

  function pickCaption(capIndex: number) {
    setCaption(capIndex);
    setPicked((current) => ({ key: current.key + 1, from: capIndex }));
  }

  function step(delta: 1 | -1) {
    moveTo(normalize() + delta);
  }

  function choose(real: number, { focus = false } = {}) {
    const target = (((real % COUNT) + COUNT) % COUNT) + 1;
    const from = normalize();
    if (target !== from) moveTo(target);
    if (focus) tabRefs.current[target - 1]?.focus();
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
      <div className="uc-tabs-row">
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
                <LandingIcon name={slide.icon} className="uc-tab-ic" />
                <span className="uc-tab-label">{slide.label}</span>
                {selected && !reduced ? (
                  <span
                    key={`${round}-${picked.key}`}
                    className="uc-progress"
                    style={{
                      animationDuration: `${USE_CASES.slideMs}ms`,
                      animationDelay: `${-picked.from * USE_CASES.captionMs}ms`,
                    }}
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
            const current = shown ? caption : 0;
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
                  {/* each capability's picture, stacked in one place; the caption's own shows */}
                  <div className="uc-arts">
                    {slide.capabilities.map((capability, capIndex) => (
                      <div
                        key={capability.text}
                        className="uc-shot"
                        data-on={capIndex === current ? "true" : "false"}
                      >
                        <Art art={capability.art} className="uc-art" />
                      </div>
                    ))}
                  </div>
                  <figcaption className="uc-caption" data-static={reduced ? "true" : "false"}>
                    <ul className="uc-caps">
                      {slide.capabilities.map((capability, capIndex) => {
                        const on = reduced || capIndex === current;
                        return (
                          <li key={capability.text} className="uc-cap" data-on={on ? "true" : "false"}>
                            <LandingIcon name={capability.icon} className="uc-cap-ic" />
                            <span className="uc-cap-text">{capability.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                    {reduced ? null : (
                      <div className="uc-segs" role="group" aria-label={`${slide.label}: capabilities`}>
                        {slide.capabilities.map((capability, capIndex) => (
                          <button
                            key={capability.text}
                            type="button"
                            className="uc-seg"
                            aria-label={`show capability ${capIndex + 1} of ${CAPS}: ${capability.text}`}
                            aria-current={capIndex === current ? "true" : undefined}
                            data-state={capIndex < current ? "done" : capIndex === current ? "on" : "next"}
                            onClick={() => pickCaption(capIndex)}
                          >
                            <span className="uc-seg-track">
                              {shown && capIndex === current ? (
                                <span
                                  key={`${round}-${picked.key}-${capIndex}`}
                                  className="uc-seg-fill"
                                  style={{ animationDuration: `${USE_CASES.captionMs}ms` }}
                                  onAnimationEnd={() => {
                                    if (capIndex < CAPS - 1) setCaption(capIndex + 1);
                                  }}
                                />
                              ) : null}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
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
    </div>
  );
}
