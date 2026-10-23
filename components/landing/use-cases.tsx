"use client";

import { Art } from "@/components/art";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { USE_CASES } from "@/lib/landing";
import { ChevronLeft, ChevronRight } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const SLIDES = USE_CASES.slides;
const SWIPE_MIN = 40;

/**
 * The use-case carousel: one slide per audience, one picture per slide, and the
 * slide's three capabilities as a caption on the picture that fades from one to
 * the next. The audiences are real tabs, so the carousel is reachable and
 * operable from the keyboard, and the arrows and a horizontal swipe move the
 * same selection.
 *
 * The caption only moves while someone can see it: it holds while the carousel
 * is hovered or focused, off screen, or in a background tab, and under reduced
 * motion the three capabilities stand as a plain list instead.
 */
export function UseCases() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [caption, setCaption] = useState(0);
  const [held, setHeld] = useState({ hover: false, focus: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const reduced = useReducedMotion();
  const onScreen = useOnScreen(rootRef);
  const cycling = !reduced && onScreen && !held.hover && !held.focus;

  useEffect(() => {
    if (!cycling) return;
    const timer = window.setInterval(
      () => setCaption((current) => (current + 1) % 3),
      USE_CASES.captionMs,
    );
    return () => window.clearInterval(timer);
  }, [cycling, index]);

  function select(next: number, { focus = false, step }: { focus?: boolean; step?: 1 | -1 } = {}) {
    const target = (next + SLIDES.length) % SLIDES.length;
    if (target !== index) {
      setDirection(step ?? (target > index ? 1 : -1));
      setIndex(target);
      setCaption(0);
    }
    if (focus) tabRefs.current[target]?.focus();
  }

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    // Arrows move from the tab that has focus, which is the selected one unless a script moved focus.
    const focused = tabRefs.current.indexOf(event.target as HTMLButtonElement);
    const from = focused >= 0 ? focused : index;
    const moves: Record<string, () => void> = {
      ArrowRight: () => select(from + 1, { focus: true, step: 1 }),
      ArrowDown: () => select(from + 1, { focus: true, step: 1 }),
      ArrowLeft: () => select(from - 1, { focus: true, step: -1 }),
      ArrowUp: () => select(from - 1, { focus: true, step: -1 }),
      Home: () => select(0, { focus: true }),
      End: () => select(SLIDES.length - 1, { focus: true }),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) select(index + 1, { step: 1 });
    else select(index - 1, { step: -1 });
  }

  return (
    <div
      ref={rootRef}
      className="uc"
      data-use-cases
      role="region"
      aria-roledescription="carousel"
      aria-label="use cases"
      onFocus={() => setHeld((current) => ({ ...current, focus: true }))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHeld((current) => ({ ...current, focus: false }));
        }
      }}
    >
      <div className="uc-controls">
        <div
          className="uc-tabs"
          role="tablist"
          aria-label="audiences"
          onKeyDown={onTabKey}
        >
          {SLIDES.map((slide, slideIndex) => (
            <button
              key={slide.id}
              ref={(element) => {
                tabRefs.current[slideIndex] = element;
              }}
              type="button"
              role="tab"
              id={`uc-tab-${slide.id}`}
              className="uc-tab"
              aria-selected={slideIndex === index}
              aria-controls={`uc-panel-${slide.id}`}
              tabIndex={slideIndex === index ? 0 : -1}
              onClick={() => select(slideIndex)}
            >
              {slide.label}
            </button>
          ))}
        </div>
        <div className="uc-arrows">
          <button
            type="button"
            className="site-icon-btn site-icon-btn-boxed"
            aria-label="previous use case"
            aria-controls="uc-stage"
            onClick={() => select(index - 1, { step: -1 })}
          >
            <ChevronLeft aria-hidden="true" focusable="false" />
          </button>
          <span className="uc-count" aria-hidden="true">
            {index + 1} / {SLIDES.length}
          </span>
          <button
            type="button"
            className="site-icon-btn site-icon-btn-boxed"
            aria-label="next use case"
            aria-controls="uc-stage"
            onClick={() => select(index + 1, { step: 1 })}
          >
            <ChevronRight aria-hidden="true" focusable="false" />
          </button>
        </div>
      </div>

      <div
        id="uc-stage"
        className="uc-stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipe.current = null;
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHeld((current) => ({ ...current, hover: true }));
        }}
        onPointerLeave={() => setHeld((current) => ({ ...current, hover: false }))}
      >
        {SLIDES.map((slide, slideIndex) => {
          const active = slideIndex === index;
          return (
            <div
              key={slide.id}
              id={`uc-panel-${slide.id}`}
              className="uc-panel"
              role="tabpanel"
              aria-labelledby={`uc-tab-${slide.id}`}
              data-direction={direction}
              hidden={!active}
            >
              <figure className="uc-figure">
                <Art art={slide.art} className="uc-art" />
                <figcaption className="uc-caption">
                  <ul className="uc-caps" data-static={reduced ? "true" : "false"}>
                    {slide.capabilities.map((capability, capIndex) => (
                      <li
                        key={capability}
                        className="uc-cap"
                        data-on={reduced || (active && capIndex === caption) ? "true" : "false"}
                      >
                        {capability}
                      </li>
                    ))}
                  </ul>
                </figcaption>
              </figure>
              <a
                className="btn btn-primary site-btn site-btn-lg uc-cta"
                href={slide.cta.href}
                data-use-case-cta={slide.id}
              >
                {slide.cta.label}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
