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
/*
 * How a drag's last tenth of a second sets the glide after it, how fast a glide may start (in pixels a
 * millisecond, so it carries on for a card or so at most), and how much of its speed it keeps each 60th
 * of a second.
 */
const FLICK_MS = 100;
const GLIDE_MAX = 3;
const GLIDE_KEEP = 0.92;
/* dragged past either end, the cards give way less and less, never more than this far */
const PULL_PX = 160;
/* after a touch lets go, the row waits this long before it moves on its own again */
const TOUCH_REST_MS = 2400;
/* the drift picks up its speed over this long when it starts or comes back from a hold */
const EASE_IN_MS = 600;
/* at the end the row rests, goes back to the start in one eased move, and rests again before it drifts on */
const END_REST_MS = 2000;
const BACK_MS = 1400;
const START_REST_MS = 1000;

/* slow at both ends, quickest in the middle: the way back to the start */
function easeInOut(t: number) {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/* how far the row can scroll */
function endOf(row: HTMLElement) {
  return row.scrollWidth - row.clientWidth;
}

/**
 * The use cases: the section's heading on its own row, then one row of all
 * twelve capabilities, each a card of one shape (its picture on a tinted
 * panel, a small tag naming its audience, its headline, a sentence or two on
 * what it is), and a last card in the same shape that leads on to the docs,
 * the only one with an action. Every card's words are in the page as served.
 *
 * The row runs from one edge of the screen to the other and fades softly at
 * both. It starts with the first card on the title's edge and drifts on its
 * own, slowly and evenly, until the docs card stands on the content's right
 * edge. There it rests, goes back to the start in one eased move, rests, and
 * drifts on again. It holds while hovered, keyboard-focused, touched, off
 * screen or in a background tab. It is a real scroll area, so a finger swipes
 * it, a wheel or trackpad scrolls it, and the arrow keys move it once it has
 * focus. A mouse drags it one to one from anywhere on a card; past either end
 * the cards give way a little and spring back, and a flick glides on briefly
 * after the button lets go. The drift carries on from wherever it was left.
 * Under a quiet line, a short mark stands where the row is, from start to end:
 * a reading, not a control.
 *
 * Under reduced motion it never moves on its own: it scrolls and snaps to each
 * card by hand, and the mark still follows it.
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
  const drag = useRef<{
    x: number;
    left: number;
    end: number;
    moved: boolean;
    pulled: boolean;
    trail: { t: number; x: number }[];
  } | null>(null);
  const glide = useRef(0);
  const restTimer = useRef(0);
  const playing = onScreen && !reduced && !held.hover && !held.focus && !held.touch && !held.drag;

  // The drift, once per frame: on to the end, a rest, back to the start, a rest, and on again. The row
  // keeps its own unrounded place, so the drift stays even between whole pixels, and takes up the scroll
  // position again whenever a hand has moved it.
  useEffect(() => {
    const row = rowRef.current;
    if (!row || !playing) return;
    let frame = 0;
    let last = 0;
    let at = row.scrollLeft;
    let mode: "drift" | "end" | "back" | "start" = "drift";
    let since = 0;
    let from = 0;
    const tick = (time: number) => {
      if (!since) since = time;
      if (Math.abs(row.scrollLeft - at) > 1) at = row.scrollLeft;
      const end = endOf(row);
      if (mode === "drift") {
        if (at >= end - 0.5) {
          mode = "end";
          since = time;
        } else if (last) {
          const ease = Math.min(1, (time - since) / EASE_IN_MS);
          at = Math.min(end, at + ((time - last) / 1000) * USE_CASES.speed * ease * ease * (3 - 2 * ease));
          row.scrollLeft = at;
        }
      } else if (mode === "end" && time - since >= END_REST_MS) {
        mode = "back";
        since = time;
        from = at;
      } else if (mode === "back") {
        const t = Math.min(1, (time - since) / BACK_MS);
        at = from * (1 - easeInOut(t));
        row.scrollLeft = at;
        if (t === 1) {
          mode = "start";
          since = time;
        }
      } else if (mode === "start" && time - since >= START_REST_MS) {
        mode = "drift";
        since = time;
      }
      last = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // The line follows the row on every frame it moves, whoever moves it: the mark stands where the row is
  // between its start and its end, as long as the share of the row on screen.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let frame = 0;
    const place = () => {
      frame = 0;
      const line = lineRef.current;
      if (!line) return;
      const end = endOf(row);
      line.style.setProperty("--uc-at", String(end > 0 ? Math.min(1, row.scrollLeft / end) : 0));
      line.style.setProperty("--uc-span", String(Math.min(1, row.clientWidth / row.scrollWidth)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    row.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      row.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(restTimer.current);
      cancelAnimationFrame(glide.current);
    },
    [],
  );

  // Dragged past an end, the cards give way by less and less of the hand's overshoot.
  function pull(row: HTMLElement, over: number) {
    const give = PULL_PX * (1 - 1 / ((Math.abs(over) * 0.55) / PULL_PX + 1));
    row.style.setProperty("--uc-pull", `${-Math.sign(over) * give}px`);
  }

  // Let go past an end, the cards spring back into place.
  function release(row: HTMLElement) {
    row.dataset.pullback = "";
    row.style.setProperty("--uc-pull", "0px");
    window.setTimeout(() => delete row.dataset.pullback, 420);
  }

  // A drag, and the glide after it, is over: the row snaps again under reduced motion, standing on the
  // nearest card, and it may drift once the pointer leaves.
  function settle(row: HTMLElement) {
    glide.current = 0;
    if (reduced) {
      const cards = row.querySelectorAll<HTMLElement>(".uc-card");
      const pitch = cards[1]!.offsetLeft - cards[0]!.offsetLeft;
      row.scrollLeft = Math.min(endOf(row), Math.round(row.scrollLeft / pitch) * pitch);
    }
    delete row.dataset.dragging;
    setHeld((value) => ({ ...value, drag: false }));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      if (event.button !== 0) return;
      // no text selection, no picture or link dragged out of the page; a click still clicks
      event.preventDefault();
      const row = event.currentTarget;
      // a press stops a glide where it is
      if (glide.current) {
        cancelAnimationFrame(glide.current);
        settle(row);
      }
      drag.current = {
        x: event.clientX,
        left: row.scrollLeft,
        end: endOf(row),
        moved: false,
        pulled: false,
        trail: [{ t: event.timeStamp, x: event.clientX }],
      };
      return;
    }
    window.clearTimeout(restTimer.current);
    setHeld((value) => ({ ...value, touch: true }));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    const row = event.currentTarget;
    const dx = event.clientX - current.x;
    if (!current.moved) {
      if (Math.abs(dx) < DRAG_PX) return;
      current.moved = true;
      row.setPointerCapture(event.pointerId);
      // set at once, not on the next render: snapping must be off before the first move lands
      row.dataset.dragging = "";
      setHeld((value) => ({ ...value, drag: true }));
    }
    const target = current.left - dx;
    const left = Math.max(0, Math.min(current.end, target));
    row.scrollLeft = left;
    current.pulled = target !== left;
    pull(row, target - left);
    current.trail = [
      ...current.trail.filter((point) => event.timeStamp - point.t < FLICK_MS),
      { t: event.timeStamp, x: event.clientX },
    ];
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      const current = drag.current;
      drag.current = null;
      if (!current?.moved) return;
      const row = event.currentTarget;
      // a drag is not a click on the card under the pointer
      const swallow = (click: MouseEvent) => click.preventDefault();
      row.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => row.removeEventListener("click", swallow, { capture: true }));
      if (current.pulled) {
        release(row);
        settle(row);
        return;
      }
      // a flick glides on, slowing to a stop or to an end; a drag that came to rest before letting go stays put
      const recent = current.trail.filter((point) => event.timeStamp - point.t < FLICK_MS);
      const first = recent[0];
      const last = recent.at(-1);
      const flick = first && last && last.t > first.t ? -(last.x - first.x) / (last.t - first.t) : 0;
      let speed = Math.max(-GLIDE_MAX, Math.min(GLIDE_MAX, flick));
      if (reduced || Math.abs(speed) < 0.1) {
        settle(row);
        return;
      }
      let at = row.scrollLeft;
      let then = performance.now();
      const step = (now: number) => {
        const dt = now - then;
        then = now;
        const end = endOf(row);
        at = Math.max(0, Math.min(end, at + speed * dt));
        row.scrollLeft = at;
        speed *= GLIDE_KEEP ** (dt / (1000 / 60));
        if (Math.abs(speed) > 0.02 && at > 0 && at < end) glide.current = requestAnimationFrame(step);
        else settle(row);
      };
      glide.current = requestAnimationFrame(step);
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
        {CARDS.map((card, index) => (
          <article
            key={card.text}
            className="uc-card"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${CARDS.length}: ${card.text}`}
            data-use-case={card.id}
          >
            <figure className="uc-figure">
              <Art art={card.art} className="uc-art" near={near} draggable={false} />
            </figure>
            <p className="uc-tag">
              <LandingIcon name={card.icon} className="uc-ic" />
              {card.tag}
            </p>
            <h3 className="uc-cap-text">{card.text}</h3>
            <p className="uc-cap-detail">{withCommands(card.detail)}</p>
            {card.cta ? (
              <a className="uc-cta" href={card.cta.href}>
                {card.cta.label}
                <ArrowRight aria-hidden="true" focusable="false" />
              </a>
            ) : null}
          </article>
        ))}
      </div>
      {/* where the row is, from start to end: a reading, not a control, so it is hidden from assistive technology */}
      <div className="site-wrap">
        <div ref={lineRef} className="uc-progress" aria-hidden="true">
          <span className="uc-progress-mark" />
        </div>
      </div>
    </>
  );
}
