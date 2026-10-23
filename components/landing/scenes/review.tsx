"use client";

import { MacDesktop, SafariWindow } from "@/components/mac";
import { SAMPLE_MATCHES } from "@/components/landing/scenes/sample";
import type { SceneDefinition } from "@/components/landing/scenes/stage";
import { RedactionReview } from "@peasant-labs/fairtrade/ui";

const TOTAL = 12;
/* the files at which the scan meets each match */
const FOUND_AT = [3, 8, 12] as const;
const SCAN_FROM = 500;
const SCAN_EVERY = 140;

/*
 * Review: fairtrade's redaction review, read-only, in Safari, the way it shows
 * what leaves the computer. The scan counts up file by file and its bar fills;
 * each match rises into the list as it is found, a mark sweeps across the
 * value it found, and the engine's placeholder fades in beneath it.
 *
 * Phases: the files scanned so far, 0 to 12.
 */
function Review({ phase }: { phase: number }) {
  const scanned = Math.min(phase, TOTAL);
  const found = FOUND_AT.filter((at) => scanned >= at).length;
  return (
    <MacDesktop app="Safari">
      <SafariWindow className="scn-full-browser">
        <div className="scn-review" data-scroll>
          <div className="scn-panel" data-focus="review">
            <RedactionReview
              readOnly
              level="standard"
              availableLevels={["standard"]}
              matches={SAMPLE_MATCHES.slice(0, found)}
              scanned={scanned}
              total={TOTAL}
            />
          </div>
        </div>
      </SafariWindow>
    </MacDesktop>
  );
}

const pairAt = (index: number) => `.rdx-list > li:nth-child(${index}) .rdx-pair`;

export const REVIEW_SCENE: SceneDefinition = {
  id: "review",
  duration: 7600,
  finalPhase: TOTAL,
  cues: Array.from({ length: TOTAL }, (_, index) => ({ at: SCAN_FROM + index * SCAN_EVERY, phase: index + 1 })),
  shots: [
    { at: 0, focus: "review", move: 1, fill: 0.96 },
    { at: 2500, focus: pairAt(1), move: 900, fill: 0.9, width: 360 },
    { at: 3700, focus: pairAt(2), move: 800, fill: 0.9, width: 360 },
    { at: 4800, focus: pairAt(3), move: 800, fill: 0.9, width: 360 },
    { at: 5900, focus: "review", move: 1200, ease: "settle", fill: 0.96 },
  ],
  // the pointer picks up where publish left it, follows the scan, then reads each match in turn
  cursorFrom: [650, 265],
  cursor: [
    { at: 300, to: ".rdx-scan", move: 900, aim: [0.3, 0.6] },
    { at: 2500, to: pairAt(1), move: 900, aim: [0.18, 0.3] },
    { at: 3700, to: pairAt(2), move: 800, aim: [0.18, 0.3] },
    { at: 4800, to: pairAt(3), move: 800, aim: [0.18, 0.3] },
    { at: 5900, to: ".rdx-summary-safe", move: 900, aim: [0.4, 0.5] },
  ],
  finalFocus: "review",
  finalFill: 0.96,
  Render: Review,
};
