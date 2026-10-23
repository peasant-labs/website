"use client";

import { MacDesktop, SafariWindow } from "@/components/mac";
import { Reveal, Swap, typing } from "@/components/landing/scenes/motion";
import { SAMPLE_COLLECTIVE } from "@/components/landing/scenes/sample";
import { SessionPage } from "@/components/landing/scenes/session-page";
import type { SceneDefinition } from "@/components/landing/scenes/stage";
import { Loader } from "@peasant-labs/fairtrade/icons";
import { AccessList, Button, CollectivePicker } from "@peasant-labs/fairtrade/ui";

const QUERY = "eval";
const SUGGESTIONS = [
  { id: SAMPLE_COLLECTIVE.id, name: SAMPLE_COLLECTIVE.name, members: SAMPLE_COLLECTIVE.members },
  { id: "eval-reading-group", name: "eval-reading-group", members: 5 },
];
const noop = () => {};

/* phases: 0 the page, 1 the dialog open, 2..5 "eval" typed, then added, publishing, published */
const OPEN = 1;
const TYPED = OPEN + QUERY.length;
const ADDED = TYPED + 1;
const PUBLISHING = ADDED + 1;
const PUBLISHED = PUBLISHING + 1;

/*
 * Publish, in Safari. The cursor presses publish on the session page and the
 * publish window opens from it; "eval" is typed into fairtrade's
 * CollectivePicker and its suggestions rise in; the cursor adds eval-crowd,
 * which arrives in AccessList as the picker fades; the cursor presses publish,
 * which turns busy, and the window closes as the page's state crossfades to
 * published to eval-crowd. Everything is mounted from the start and changes in
 * place, so the window never changes size and nothing on the page jumps; the
 * timeline drives it, never synthetic clicks.
 */
function Publish({ phase }: { phase: number }) {
  const open = phase >= OPEN && phase < PUBLISHED;
  const query = QUERY.slice(0, Math.max(0, Math.min(phase - OPEN, QUERY.length)));
  const added = phase >= ADDED;
  /* the button stays busy while the window closes over the published page */
  const publishing = phase >= PUBLISHING;
  return (
    <MacDesktop app="Safari">
      <SafariWindow className="scn-full-browser">
        <SessionPage published={phase >= PUBLISHED} />
        <div className="scn-modal" data-open={open ? "true" : "false"}>
          <div className="dialog framed dialog-wide pub-dialog scn-dialog" data-focus="dialog">
            <div className="dlg-head">
              <h3>publish</h3>
            </div>
            <div className="dlg-body">
              <section className="pub-section" data-focus="readers">
                <Swap on={added ? 1 : 0} className="scn-access">
                  <AccessList items={[]} empty="no collective can read it yet." />
                  <AccessList items={[SAMPLE_COLLECTIVE]} />
                </Swap>
                <Reveal on={!added}>
                  <CollectivePicker
                    suggestions={query ? SUGGESTIONS : []}
                    query={query}
                    onQueryChange={noop}
                    onAdd={noop}
                  />
                </Reveal>
              </section>
            </div>
            <div className="dlg-foot">
              <div className="pub-foot">
                <Button variant="secondary" size="sm">
                  cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!added}
                  aria-busy={publishing}
                  data-focus="publish"
                  className="scn-publish-btn"
                >
                  <Swap on={publishing ? 1 : 0}>
                    <span>publish</span>
                    <span className="scn-busy">
                      <Loader className="pub-spin" aria-hidden="true" /> publishing
                    </span>
                  </Swap>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SafariWindow>
    </MacDesktop>
  );
}

export const PUBLISH_SCENE: SceneDefinition = {
  id: "publish",
  duration: 8200,
  finalPhase: PUBLISHED,
  cues: [
    { at: 1650, phase: OPEN },
    ...typing(QUERY, 2350, OPEN + 1, 90),
    { at: 3600, phase: ADDED },
    { at: 4600, phase: PUBLISHING },
    { at: 5500, phase: PUBLISHED },
  ],
  shots: [
    { at: 0, focus: "all", move: 1 },
    { at: 300, focus: "page-head", move: 900, fill: 0.78 },
    { at: 1950, focus: "dialog", move: 900, fill: 0.92 },
    { at: 5650, focus: "page-head", move: 1100, ease: "settle", fill: 0.78 },
  ],
  cursor: [
    { at: 700, to: ".scn-page .pub-bar-action", move: 800, press: true },
    { at: 2800, to: ".pub-picker-add", move: 700, press: true },
    { at: 3900, to: "publish", move: 600, press: true },
    // and drifts to the page's new state as the window closes
    { at: 5800, to: "page-state", move: 900 },
  ],
  finalFocus: "page-head",
  finalFill: 0.78,
  Render: Publish,
};
