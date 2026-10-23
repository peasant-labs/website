"use client";

import { MacDesktop, MacWindow } from "@/components/mac";
import { SAMPLE_COLLECTIVE, SAMPLE_ID, SAMPLE_TITLE } from "@/components/landing/scenes/sample";
import type { SceneDefinition } from "@/components/landing/scenes/stage";
import { Loader } from "@peasant-labs/fairtrade/icons";
import { AccessList, Button, CollectivePicker, PublishStateLabel } from "@peasant-labs/fairtrade/ui";

const QUERY = ["", "e", "eval", "eval"] as const;
const SUGGESTIONS = [
  { id: SAMPLE_COLLECTIVE.id, name: SAMPLE_COLLECTIVE.name, members: SAMPLE_COLLECTIVE.members },
  { id: "eval-reading-group", name: "eval-reading-group", members: 5 },
];
const noop = () => {};

/*
 * Publish: the publish window in the browser, from the parts fairtrade ships:
 * who can read it (AccessList), adding a collective (CollectivePicker), the
 * publish action, then the published state. The cursor picks the collective and presses
 * publish; the window's state follows the timeline, never synthetic clicks.
 *
 * Phases: 0 empty, 1-2 typing the name, 3 added, 4 publishing, 5 published.
 */
function Publish({ phase }: { phase: number }) {
  const added = phase >= 3;
  const publishing = phase === 4;
  const done = phase >= 5;
  const query = QUERY[Math.min(phase, QUERY.length - 1)] ?? "";
  const access = added
    ? [{ ...SAMPLE_COLLECTIVE, pending: done ? undefined : ("adding" as const) }]
    : [];

  return (
    <MacDesktop app="browser">
      <MacWindow kind="browser" url={`localhost:8690/share/${SAMPLE_ID}`} className="scn-full-browser">
        <div className="scn-publish">
          <div className="dialog framed dialog-wide pub-dialog scn-dialog" data-focus="dialog">
            <div className="dlg-head">
              <h3 data-focus="heading">
                {done ? `published to ${SAMPLE_COLLECTIVE.name}` : `publish “${SAMPLE_TITLE}”`}
              </h3>
            </div>
            <div className="dlg-body">
              <section className="pub-section" data-focus="readers">
                <p className="pub-section-title">who can read it</p>
                <AccessList items={access} empty="no collective can read it yet." />
                {!added ? (
                  <CollectivePicker
                    suggestions={phase >= 2 ? SUGGESTIONS : []}
                    query={query}
                    onQueryChange={noop}
                    onAdd={noop}
                  />
                ) : null}
              </section>
              {publishing ? (
                <p className="pub-line">
                  <Loader className="pub-spin" aria-hidden="true" /> publishing to 1 collective
                </p>
              ) : null}
              {done ? (
                <p className="pub-line" data-focus="published">
                  <PublishStateLabel state="published" collectives={1} />
                </p>
              ) : null}
            </div>
            <div className="dlg-foot">
              <div className="pub-foot" data-focus="foot">
                <span className="pub-foot-note">
                  {publishing
                    ? "sending your redacted transcript to peasant online."
                    : done
                      ? "only eval-crowd can read it."
                      : "nothing leaves your machine until you publish."}
                </span>
                {done ? null : (
                  <Button variant="secondary" size="sm">
                    cancel
                  </Button>
                )}
                <Button variant="primary" size="sm" disabled={!added && !done} data-focus="publish">
                  {done ? "done" : "publish"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MacWindow>
    </MacDesktop>
  );
}

export const PUBLISH_SCENE: SceneDefinition = {
  id: "publish",
  duration: 6800,
  finalPhase: 5,
  cues: [
    { at: 700, phase: 1 },
    { at: 1150, phase: 2 },
    { at: 2650, phase: 3 },
    { at: 3950, phase: 4 },
    { at: 4900, phase: 5 },
  ],
  shots: [
    { at: 0, focus: "all", move: 1 },
    { at: 500, focus: "readers", move: 1000, fill: 0.9 },
    { at: 3000, focus: "foot", move: 800, fill: 0.86 },
    { at: 5000, focus: "dialog", move: 1300, ease: "settle", fill: 0.96 },
  ],
  cursor: [
    { at: 1500, to: ".pub-picker-add", move: 900, press: true },
    { at: 3200, to: "publish", move: 700, press: true },
  ],
  finalFocus: "dialog",
  finalFill: 0.96,
  Render: Publish,
};
