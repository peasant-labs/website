"use client";

import { SAMPLE_MATCHES } from "@/components/landing/scenes/sample";
import type { SceneDefinition } from "@/components/landing/scenes/stage";
import { RedactionReview } from "@peasant-labs/fairtrade/ui";

/* the scan, as it reaches each match: files scanned, and the matches found so far */
const SCAN = [
  { scanned: 3, found: 1 },
  { scanned: 8, found: 2 },
  { scanned: 12, found: 3 },
] as const;
const TOTAL = 12;

/*
 * Review: fairtrade's redaction review, read-only, the way the publish window
 * shows what leaves the computer. The scan finds a key, an email and a home
 * path; each is shown as found and as it will leave, with the engine's own
 * placeholder and category label, and the count of what is hidden on top.
 */
function Review({ phase }: { phase: number }) {
  const step = SCAN[Math.min(phase, SCAN.length - 1)]!;
  return (
    <div className="scn-app scn-review">
      <div className="scn-panel" data-focus="review">
        <p className="pub-section-title">what leaves your machine</p>
        <RedactionReview
          readOnly
          level="standard"
          availableLevels={["standard"]}
          matches={SAMPLE_MATCHES.slice(0, step.found)}
          scanned={step.scanned}
          total={TOTAL}
        />
      </div>
    </div>
  );
}

export const REVIEW_SCENE: SceneDefinition = {
  id: "review",
  window: "peasant on this computer",
  duration: 6800,
  finalPhase: 2,
  cues: [
    { at: 900, phase: 1 },
    { at: 1700, phase: 2 },
  ],
  shots: [
    { at: 0, focus: "all", move: 1 },
    { at: 2100, focus: ".rdx-list > li:nth-child(1) .rdx-pair", move: 1000, fill: 0.9, width: 360 },
    { at: 3400, focus: ".rdx-list > li:nth-child(2) .rdx-pair", move: 800, fill: 0.9, width: 360 },
    { at: 4500, focus: ".rdx-list > li:nth-child(3) .rdx-pair", move: 800, fill: 0.9, width: 360 },
    { at: 5600, focus: "review", move: 1200, ease: "settle", fill: 0.96 },
  ],
  finalFocus: "review",
  finalFill: 0.96,
  Render: Review,
};
