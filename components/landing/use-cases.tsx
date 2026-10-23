"use client";

import { Art } from "@/components/art";
import { LandingIcon } from "@/components/landing/icons";
import { withCommands } from "@/components/landing/inline-code";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { USE_CASES, type Capability, type LandingIconName } from "@/lib/landing";
import { ArrowRight } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type PointerEvent } from "react";

type Card = Readonly<{
  id: string;
  tag: string;
  icon: LandingIconName;
  text: string;
  detail: string;
  art: Capability["art"];
  /** only the last card, the one that leads on to the docs, has an action */
  cta?: Readonly<{ label: string; href: string }>;
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
    })),
  ),
  { id: "docs", ...USE_CASES.more },
];

/* a drag shorter than this is a click */
const DRAG_PX = 6;
/* after a touch lets go, the row waits this long before it moves on its own again */
const TOUCH_REST_MS = 2400;
/* the drift picks up its speed over this long when it starts or comes back from a hold */
const EASE_IN_MS = 600;

/**
 * The use cases: the section's heading on its own row, then one row of all
 * twelve capabilities, each a card of one shape (its picture on a tinted
 * panel, a small tag naming its audience, its headline, a sentence or two on
 * what it is), and a last card in the same shape that leads on to the docs,
 * the only one with an action. Every card's words are in the page as served.
 *
 * The row drifts on its own, slowly and evenly, and never ends: a second set
 * of the cards follows the first, hidden from assistive technology and out of
 * the tab order, and the row steps back by one set, without motion, when it
 * reaches it. It holds while hovered, keyboard-focused, touched, off screen
 * or in a background tab. It is a real scroll area, so a finger swipes it, the
 * arrow keys move it once it has focus, and a mouse can drag it; the drift
 * carries on from wherever it was left. Under a quiet line, a short mark moves
 * with the row through the whole loop: a reading, not a control.
 *
 * Under reduced motion it never moves on its own: it scrolls and snaps to each
 * card by hand, and still goes round, and the mark still follows it.
 */
export function UseCases() {
  const rowRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(rowRef, 0.1);
  // once the row has shown, every card's picture loads, not just those in the row's own view
  const [near, setNear] = useState(false);
  if (onScreen && !near) setNear(true);
  const reduced = useReducedMotion();
  const [held, setHeld] = useState({ hover: false, focus: false, touch: false, drag: false });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const restTimer = useRef(0);
  const playing = onScreen && !reduced && !held.hover && !held.focus && !held.touch && !held.drag;

  /* the width of one set of cards: past it, the row stands at the same place in the first set */
  function setWidth(row: HTMLElement) {
    const clone = row.querySelector<HTMLElement>("[data-clone]");
    return clone ? clone.offsetLeft - (row.firstElementChild as HTMLElement).offsetLeft : 0;
  }

  // The drift: a few pixels a second, once per frame, back a set at the seam. The row keeps its own
  // unrounded place, so the drift stays even between whole pixels, and takes up the scroll position
  // again whenever a hand has moved it.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !playing) return;
    let frame = 0;
    let start = 0;
    let last = 0;
    let at = row.scrollLeft;
    const tick = (time: number) => {
      if (!start) start = time;
      if (last) {
        if (Math.abs(row.scrollLeft - at) > 1) at = row.scrollLeft;
        const ease = Math.min(1, (time - start) / EASE_IN_MS);
        at += ((time - last) / 1000) * USE_CASES.speed * ease * ease * (3 - 2 * ease);
        const set = setWidth(row);
        if (set && at >= set) at -= set;
        row.scrollLeft = at;
      }
      last = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // The line follows the row, whoever moves it; a hand scroll that comes to rest in the second set stands
  // on the same place in the first, so the row goes round by hand too.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let frame = 0;
    let timer = 0;
    // the mark stands at the row's place in its loop, as long as the share of the loop on screen
    const place = () => {
      frame = 0;
      const set = setWidth(row);
      const line = lineRef.current;
      if (!set || !line) return;
      const shown = row.clientWidth - parseFloat(getComputedStyle(row).paddingLeft);
      line.style.setProperty("--uc-at", String((row.scrollLeft % set) / set));
      line.style.setProperty("--uc-span", String(Math.min(1, shown / set)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(place);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const set = setWidth(row);
        if (set && row.scrollLeft >= set) row.scrollTo({ left: row.scrollLeft - set, behavior: "instant" });
      }, 160);
    };
    place();
    row.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      row.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
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
        {/* the second set follows under reduced motion too, so the row goes round when moved by hand */}
        {[false, true].flatMap((clone) =>
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
                <Art art={card.art} className="uc-art" near={near} />
              </figure>
              <p className="uc-tag">
                <LandingIcon name={card.icon} className="uc-ic" />
                {card.tag}
              </p>
              <h3 className="uc-cap-text">{card.text}</h3>
              <p className="uc-cap-detail">{withCommands(card.detail)}</p>
              {card.cta ? (
                <a className="uc-cta" href={card.cta.href} tabIndex={clone ? -1 : undefined}>
                  {card.cta.label}
                  <ArrowRight aria-hidden="true" focusable="false" />
                </a>
              ) : null}
            </article>
          )),
        )}
      </div>
      {/* where the row is in its loop: a reading, not a control, so it is hidden from assistive technology */}
      <div className="site-wrap">
        <div ref={lineRef} className="uc-progress" aria-hidden="true">
          <span className="uc-progress-mark" />
          <span className="uc-progress-mark" />
        </div>
      </div>
    </>
  );
}
