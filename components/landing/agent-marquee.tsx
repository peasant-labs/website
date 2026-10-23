"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { AGENTS } from "@/lib/landing";
import { useRef } from "react";

/* the band repeats its row this many times, so the loop's seam is always off screen */
const COPIES = 4;

/**
 * The harnesses peasant reads, each led by its mark, drifting past under the
 * hero. One row is the list a screen reader hears; the copies that make the
 * loop seamless are hidden from it. The drift runs on the compositor, only
 * while the band is on screen and not hovered; under reduced motion the row
 * stands still and wraps.
 */
export function AgentMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref, 0);
  const reduced = useReducedMotion();
  const copies = reduced ? 1 : COPIES;

  return (
    <div
      ref={ref}
      className="lp-agents"
      data-agents
      data-static={reduced ? "true" : "false"}
      data-playing={onScreen && !reduced ? "true" : "false"}
    >
      <div className="lp-agents-track">
        {Array.from({ length: copies }, (_, copy) => (
          <ul
            key={copy}
            className="lp-agents-row"
            aria-label={copy === 0 ? AGENTS.label : undefined}
            aria-hidden={copy === 0 ? undefined : true}
          >
            {AGENTS.list.map((agent) => (
              <li key={agent.mark} className="lp-agent">
                <BrandMark name={agent.mark} />
                <span>{agent.name}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
