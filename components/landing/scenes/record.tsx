"use client";

import { MacDesktop, MacWindow } from "@/components/mac";
import { SAMPLE_ID, SAMPLE_TITLE } from "@/components/landing/scenes/sample";
import type { SceneDefinition } from "@/components/landing/scenes/stage";
import { Clock, ListTree, User } from "@peasant-labs/fairtrade/icons";
import { Breadcrumb, MetaItem, ProviderName, PublishBar } from "@peasant-labs/fairtrade/ui";

const URL_PATH = `localhost:8690/projects/3f9a0c2e/${SAMPLE_ID}`;
const noop = () => {};

/*
 * Record, on a Mac: `/peasant` typed into Claude Code in the terminal, and the
 * two lines `peasant open` prints back (its own wording). Then the browser comes
 * forward on the session it opened: the local session page's header, from
 * fairtrade's parts, with its one action, and the first two turns.
 */
function Record({ phase }: { phase: number }) {
  const opened = phase >= 4;
  return (
    <MacDesktop app={opened ? "browser" : "terminal"}>
      <MacWindow kind="terminal" title="claude — ~/src/shop" focus="term" className="scn-rec-term">
        <div className="scn-term-body">
          <p className="scn-term-dim">claude code · ~/src/shop</p>
          <p>
            <span className="scn-term-dim">&gt; </span>
            {phase >= 1 ? "/peasant" : <span className="scn-caret" />}
          </p>
          {phase >= 2 ? <p>{`peasant: opened "${SAMPLE_TITLE}" · not published`}</p> : null}
          {phase >= 3 ? <p className="scn-term-dim">http://{URL_PATH}</p> : null}
        </div>
      </MacWindow>
      {opened ? (
        <MacWindow kind="browser" url={URL_PATH} focus="browser" className="scn-rec-browser">
          <div className="scn-page">
            <div className="scn-page-top" data-focus="page-head">
              <Breadcrumb items={[{ label: "sessions" }, { label: "shop" }, { label: SAMPLE_ID }]} />
              <h3 className="scn-page-title">{SAMPLE_TITLE}</h3>
              <div className="scn-page-meta">
                <ProviderName harness="claude-code" />
                <MetaItem icon={Clock} value="14m" />
                <MetaItem icon={ListTree} value={7}>
                  turns
                </MetaItem>
              </div>
              <PublishBar state="not-published" onAction={noop} />
            </div>
            <div className="scn-turn">
              <span className="scn-turn-who">
                <User aria-hidden="true" /> user #1
              </span>
              <p>Uploads to staging fail with a 403 since this morning. Can you find out why?</p>
            </div>
            <div className="scn-turn">
              <span className="scn-turn-who">claude</span>
              <p>I will check which credentials the upload uses first.</p>
            </div>
          </div>
        </MacWindow>
      ) : null}
    </MacDesktop>
  );
}

export const RECORD_SCENE: SceneDefinition = {
  id: "record",
  duration: 6200,
  finalPhase: 4,
  cues: [
    { at: 500, phase: 1 },
    { at: 1150, phase: 2 },
    { at: 1550, phase: 3 },
    { at: 3000, phase: 4 },
  ],
  shots: [
    { at: 0, focus: "term", move: 1, fill: 0.9 },
    { at: 2300, focus: "all", move: 1300, ease: "move" },
    { at: 4000, focus: "browser", move: 1300, ease: "settle", fill: 0.97 },
  ],
  finalFocus: "all",
  Render: Record,
};
