"use client";

import { Art } from "@/components/art";
import { LandingIcon } from "@/components/landing/icons";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { USE_CASES, type UseCase } from "@/lib/landing";
import { ArrowRight } from "@peasant-labs/fairtrade/icons";
import { useRef, useState } from "react";

const CAPS = 3;

/**
 * The use cases: the section's heading on its own row, then the four audiences, two by two
 * on a wide screen and one under another on a phone. Each card leads with what
 * its audience can do: under its picture, the audience as a small label, then
 * the capability now showing as the card's headline, the three segments that
 * step between capabilities, and its one action. The picture and the headline
 * change together. Every card keeps the same rhythm, and cards side by side
 * share their rows (CSS subgrid), so their parts line up across the page.
 *
 * Each card keeps its own clock, a quarter of a turn apart from its neighbour
 * so the four never change together. A clock is a CSS animation on the current
 * segment, so it holds exactly where it is while its card is hovered or holds
 * keyboard focus, and every clock holds while the section is off screen or the
 * tab is in the background. Under reduced motion nothing cycles: each card
 * shows its first picture and lists its three capabilities.
 */
export function UseCases() {
  const rootRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(rootRef, 0.1);
  const reduced = useReducedMotion();

  return (
    <>
      <div className="lp-head">
        <h2 id="uses-title" className="lp-title" data-fade>
          {USE_CASES.title}
        </h2>
      </div>
      <div ref={rootRef} className="uc" data-use-cases>
        {USE_CASES.slides.map((useCase, order) => (
          <UseCaseCard key={useCase.id} useCase={useCase} order={order} running={onScreen} reduced={reduced} />
        ))}
      </div>
    </>
  );
}

function UseCaseCard({
  useCase,
  order,
  running,
  reduced,
}: {
  useCase: UseCase;
  order: number;
  running: boolean;
  reduced: boolean;
}) {
  const [current, setCurrent] = useState(0);
  /* a chosen capability restarts its segment's clock from empty */
  const [take, setTake] = useState(0);
  const [held, setHeld] = useState({ hover: false, focus: false });
  const playing = running && !reduced && !held.hover && !held.focus;
  const shown = reduced ? 0 : current;
  /* the first turn starts a quarter of a capability later per card, so neighbours change apart */
  const lead = take === 0 && current === 0 ? (order * USE_CASES.captionMs) / 4 : 0;

  function pick(capIndex: number) {
    setCurrent(capIndex);
    setTake((value) => value + 1);
  }

  return (
    <article
      className="uc-card"
      id={`uc-${useCase.id}`}
      aria-labelledby={`uc-${useCase.id}-title`}
      data-use-case={useCase.id}
      data-playing={playing ? "true" : "false"}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHeld((value) => ({ ...value, hover: true }));
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHeld((value) => ({ ...value, hover: false }));
      }}
      // Keyboard focus holds the card; a mouse click that leaves focus on a segment does not.
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) setHeld((value) => ({ ...value, focus: true }));
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHeld((value) => ({ ...value, focus: false }));
        }
      }}
    >
      {/* each capability's picture, stacked in one place on its panel; the headline's own shows */}
      <figure className="uc-figure">
        <div className="uc-arts">
          {useCase.capabilities.map((capability, capIndex) => (
            <div key={capability.text} className="uc-shot" data-on={capIndex === shown ? "true" : "false"}>
              <Art art={capability.art} className="uc-art" />
            </div>
          ))}
        </div>
      </figure>
      <h3 id={`uc-${useCase.id}-title`} className="uc-who">
        <LandingIcon name={useCase.icon} className="uc-ic" />
        {useCase.label}
      </h3>
      <ul className="uc-caps" data-static={reduced ? "true" : "false"}>
        {useCase.capabilities.map((capability, capIndex) => (
          <li key={capability.text} className="uc-cap" data-on={reduced || capIndex === shown ? "true" : "false"}>
            <LandingIcon name={capability.icon} className="uc-cap-ic" />
            <span className="uc-cap-text">{capability.text}</span>
          </li>
        ))}
      </ul>
      {reduced ? (
        <span className="uc-segs" aria-hidden="true" />
      ) : (
        <div className="uc-segs" role="group" aria-label={`${useCase.label}: capabilities`}>
          {useCase.capabilities.map((capability, capIndex) => (
            <button
              key={capability.text}
              type="button"
              className="uc-seg"
              aria-label={`show capability ${capIndex + 1} of ${CAPS}: ${capability.text}`}
              aria-current={capIndex === current ? "true" : undefined}
              data-state={capIndex < current ? "done" : capIndex === current ? "on" : "next"}
              onClick={() => pick(capIndex)}
            >
              <span className="uc-seg-track">
                {capIndex === current ? (
                  <span
                    key={`${take}-${capIndex}`}
                    className="uc-seg-fill"
                    style={{
                      animationDuration: `${USE_CASES.captionMs}ms`,
                      animationDelay: lead ? `${-lead}ms` : undefined,
                    }}
                    onAnimationEnd={() => setCurrent((capIndex + 1) % CAPS)}
                  />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}
      <a className="uc-cta" href={useCase.cta.href} data-use-case-cta={useCase.id}>
        {useCase.cta.label}
        <ArrowRight aria-hidden="true" focusable="false" />
      </a>
    </article>
  );
}
