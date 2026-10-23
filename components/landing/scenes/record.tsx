"use client";

import { MacDesktop, SafariWindow, TerminalWindow } from "@/components/mac";
import { SAMPLE_ID, SAMPLE_TITLE } from "@/components/landing/scenes/sample";
import type { SceneDefinition } from "@/components/landing/scenes/stage";
import { Clock, ListTree, User } from "@peasant-labs/fairtrade/icons";
import { Breadcrumb, MetaItem, ProviderName, PublishBar } from "@peasant-labs/fairtrade/ui";

const URL_PATH = `localhost:8690/projects/3f9a0c2e/${SAMPLE_ID}`;
const noop = () => {};

function Caret() {
  return <span className="cc-caret" />;
}

/*
 * Record, on a Mac. In Terminal, zsh starts Claude Code; in its input row
 * /peasant is typed and sent, and peasant's hook answers with the two lines
 * `peasant open` prints (its own wording). Then Safari comes forward on the
 * session it opened: the local session page's header, from fairtrade's parts,
 * with its one action, and the first two turns.
 *
 * Phases: 0 the shell, 1 `claude` typed, 2 Claude Code open, 3 /peasant typed,
 * 4 peasant's answer, 5 Safari in front.
 */
function Record({ phase }: { phase: number }) {
  const inClaude = phase >= 2;
  const answered = phase >= 4;
  const opened = phase >= 5;
  return (
    <MacDesktop app={opened ? "Safari" : "Terminal"}>
      <TerminalWindow
        title={inClaude ? "shop — claude — 80×24" : "shop — zsh — 80×24"}
        focus="term"
        active={!opened}
        className="scn-rec-term"
      >
        <div className="cc">
          <div>Last login: Fri Oct 23 09:38:12 on ttys000</div>
          <div>
            you@macbook shop % {phase >= 1 ? "claude" : <Caret />}
          </div>
          {inClaude ? (
            <>
              <div className="cc-welcome">
                <div>
                  <span className="cc-accent">✻</span> <b>Welcome to Claude Code!</b>
                </div>
                <div className="cc-gap" />
                <div className="cc-dim">/help for help, /status for your current setup</div>
                <div className="cc-gap" />
                <div className="cc-dim">cwd: /Users/you/src/shop</div>
              </div>
              {answered ? (
                <div className="cc-out" data-focus="cc-out">
                  <div className="cc-dim">&gt; /peasant</div>
                  <div className="cc-reply">
                    <span className="cc-dim">⎿</span>
                    <div>
                      <div>{`peasant: opened "${SAMPLE_TITLE}" · not published`}</div>
                      <div>http://{URL_PATH}</div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="cc-input" data-focus="cc-input">
                <span className="cc-dim">&gt;</span> {phase === 3 ? "/peasant" : null}
                {opened ? null : <Caret />}
              </div>
              <div className="cc-dim cc-hint">? for shortcuts</div>
            </>
          ) : null}
        </div>
      </TerminalWindow>
      {opened ? (
        <SafariWindow url={URL_PATH} focus="browser" className="scn-rec-browser">
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
        </SafariWindow>
      ) : null}
    </MacDesktop>
  );
}

export const RECORD_SCENE: SceneDefinition = {
  id: "record",
  duration: 6600,
  finalPhase: 5,
  cues: [
    { at: 400, phase: 1 },
    { at: 900, phase: 2 },
    { at: 1700, phase: 3 },
    { at: 2400, phase: 4 },
    { at: 4000, phase: 5 },
  ],
  shots: [
    { at: 0, focus: "term", move: 1, fill: 0.94 },
    // a wide screen reads the whole row; a phone leans in on its start
    { at: 1100, focus: "cc-input", move: 700, fill: 0.92, width: 430, cropBelow: 0.8 },
    { at: 2450, focus: "cc-out", move: 700, fill: 0.92, width: 430, cropBelow: 0.8 },
    { at: 3400, focus: "all", move: 1100, ease: "move" },
    { at: 4900, focus: "browser", move: 1300, ease: "settle", fill: 0.97 },
  ],
  finalFocus: "all",
  Render: Record,
};
