"use client";

import { Art } from "@/components/art";
import { LandingIcon } from "@/components/landing/icons";
import { withCommands } from "@/components/landing/inline-code";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { USE_CASES, type Capability, type LandingIconName, type UseCase } from "@/lib/landing";
import { ArrowRight } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type PointerEvent } from "react";

type Card = Readonly<{
  id: string;
  tag: string;
  icon: LandingIconName;
  text: string;
  detail: string;
  art: Capability["art"];
  cta: UseCase["cta"];
}>;

/* every capability, in order, tagged with the audience it belongs to, then the card that leads on to the docs */
const CARDS: readonly Card[] = [
  ...USE_CASES.slides.flatMap((useCase) =>
    useCase.capabilities.map((capability) => ({
      id: useCase.id,
      tag: useCase.label,
      icon: useCase.icon,
      text: capability.text,
      detail: capability.detail,
      art: capability.art,
      cta: useCase.cta,
    })),
  ),
  { id: "docs", ...USE_CASES.more },
];

/* a drag shorter than this is a click */
const DRAG_PX = 6;
/* after a touch lets go, the row waits this long before it moves on its own again */
const TOUCH_REST_MS = 2400;
/* how long the row rests on a card before it steps on, so it always rests with a whole card on the title's edge */
const STEP_MS = 4200;

/**
 * The use cases: the section's heading on its own row, then one row of all
 * twelve capabilities, each a card with its own picture on a tinted panel, a
 * small tag naming its audience, its headline, a sentence or two on what it
 * is, and its audience's one action; a last card in the same shape leads on to
 * the docs. Every card's words are in the page as served. Under the row, a
 * thin line of one segment per card shows where the row is and fills with the
 * time left on the current card; it is a reading, not a control.
 *
 * The row moves on its own and loops: when the current segment fills, it
 * steps one card along and rests with a whole card on the title's left edge,
 * the rest of the row running off to the right. A second set of the cards
 * follows the first, hidden from assistive technology and out of the tab
 * order, and the row steps back by one set when it reaches it. It holds while
 * hovered, keyboard-focused, touched, off screen or in a background tab. It is
 * a real scroll area, so a finger swipes it, the arrow keys move it once it
 * has focus, and a mouse can drag it. Under reduced motion it never moves on
 * its own: it scrolls and snaps to each card, and still goes round, so after
 * the docs card come the first cards again.
 */
export function UseCases() {
  const rowRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(rowRef, 0.1);
  const reduced = useReducedMotion();
  const [held, setHeld] = useState({ hover: false, focus: false, touch: false, drag: false });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const restTimer = useRef(0);
  const playing = onScreen && !reduced && !held.hover && !held.focus && !held.touch && !held.drag;

  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  /* a new take restarts the current segment's fill from empty */
  const [take, setTake] = useState(0);

  function show(index: number) {
    if (currentRef.current === index) return;
    currentRef.current = index;
    setCurrent(index);
    setTake((value) => value + 1);
  }

  // One card along: a smooth step to the next snap point, and back a set at the seam.
  function step() {
    const row = rowRef.current;
    if (!row) return;
    const cards = [...row.querySelectorAll<HTMLElement>(".uc-card")];
    const first = cards[0]!.offsetLeft;
    const clone = row.querySelector<HTMLElement>("[data-clone]");
    const set = clone ? clone.offsetLeft - first : 0;
    // the card now resting at the start, then the next one
    const here = cards.findIndex((card) => card.offsetLeft - first >= row.scrollLeft - 2);
    const next = cards[here + 1];
    if (!next) return;
    const target = next.offsetLeft - first;
    row.scrollTo({ left: target, behavior: "smooth" });
    show((here + 1) % CARDS.length);
    if (set && target >= set) {
      // the copy of the first card has arrived; once it settles, stand on the real one without motion
      window.setTimeout(() => {
        row.scrollTo({ left: target - set, behavior: "instant" });
      }, 700);
    }
  }

  // A swipe, a drag or the keys move the row too: the line follows the card that comes to rest, and a
  // rest in the second set stands on the same card in the first without motion, so the row goes round.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let timer = 0;
    const settle = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const cards = [...row.querySelectorAll<HTMLElement>(".uc-card")];
        const first = cards[0]!.offsetLeft;
        const here = cards.findIndex((card) => card.offsetLeft - first >= row.scrollLeft - 2);
        if (here < 0) return;
        if (here >= CARDS.length) {
          const twin = cards[here - CARDS.length]!;
          row.scrollTo({ left: twin.offsetLeft - first, behavior: "instant" });
        }
        show(here % CARDS.length);
      }, 160);
    };
    row.addEventListener("scroll", settle, { passive: true });
    return () => {
      row.removeEventListener("scroll", settle);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(restTimer.current), []);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      if (event.button !== 0) return;
      drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
      return;
    }
    window.clearTimeout(restTimer.current);
    setHeld((value) => ({ ...value, touch: true }));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    if (!current.moved && Math.abs(dx) < DRAG_PX) return;
    if (!current.moved) {
      current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setHeld((value) => ({ ...value, drag: true }));
    }
    event.currentTarget.scrollLeft = current.left - dx;
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      const current = drag.current;
      drag.current = null;
      if (current?.moved) {
        // a drag is not a click on the card under the pointer
        event.currentTarget.addEventListener("click", (click) => click.preventDefault(), {
          capture: true,
          once: true,
        });
        setHeld((value) => ({ ...value, drag: false }));
      }
      return;
    }
    window.clearTimeout(restTimer.current);
    restTimer.current = window.setTimeout(
      () => setHeld((value) => ({ ...value, touch: false })),
      TOUCH_REST_MS,
    );
  }

  /* the second set follows the first under reduced motion too, so the row goes round when moved by hand */
  const sets = [false, true];

  return (
    <>
      <div className="site-wrap">
        <div className="lp-head">
          <h2 id="uses-title" className="lp-title" data-fade>
            {USE_CASES.title}
          </h2>
        </div>
      </div>
      <div
        ref={rowRef}
        className="uc"
        data-use-cases
        data-playing={playing ? "true" : "false"}
        data-static={reduced ? "true" : "false"}
        role="region"
        aria-roledescription="carousel"
        aria-label={USE_CASES.label}
        tabIndex={0}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHeld((value) => ({ ...value, hover: true }));
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setHeld((value) => ({ ...value, hover: false }));
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        // Keyboard focus holds the row; a mouse click that leaves focus inside it does not.
        onFocus={(event) => {
          if (event.target.matches(":focus-visible")) setHeld((value) => ({ ...value, focus: true }));
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setHeld((value) => ({ ...value, focus: false }));
          }
        }}
      >
        {sets.flatMap((clone) =>
          CARDS.map((card, index) => (
            <article
              key={`${clone ? "clone" : "card"}-${card.text}`}
              className="uc-card"
              aria-roledescription={clone ? undefined : "slide"}
              aria-label={clone ? undefined : `${index + 1} of ${CARDS.length}: ${card.text}`}
              aria-hidden={clone ? true : undefined}
              inert={clone}
              data-clone={clone && index === 0 ? "" : undefined}
              data-use-case={clone ? undefined : card.id}
            >
              <figure className="uc-figure">
                <Art art={card.art} className="uc-art" />
              </figure>
              <p className="uc-tag">
                <LandingIcon name={card.icon} className="uc-ic" />
                {card.tag}
              </p>
              <h3 className="uc-cap-text">{card.text}</h3>
              <p className="uc-cap-detail">{withCommands(card.detail)}</p>
              <a className="uc-cta" href={card.cta.href} tabIndex={clone ? -1 : undefined}>
                {card.cta.label}
                <ArrowRight aria-hidden="true" focusable="false" />
              </a>
            </article>
          )),
        )}
      </div>
      {/* where the row is: a reading, not a control, so it is hidden from assistive technology */}
      <div className="site-wrap">
        <ol
          className="uc-progress"
          aria-hidden="true"
          data-playing={playing ? "true" : "false"}
          data-static={reduced ? "true" : "false"}
        >
          {CARDS.map((card, index) => (
            <li key={card.text} className="uc-progress-seg" data-state={index === current ? "on" : "off"}>
              {index === current && !reduced ? (
                <span
                  key={take}
                  className="uc-progress-fill"
                  style={{ animationDuration: `${STEP_MS}ms` }}
                  onAnimationEnd={step}
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}