"use client";

import { MacDesktop, SafariWindow, TerminalWindow } from "@/components/mac";
import { Swap, typing } from "@/components/landing/scenes/motion";
import { SAMPLE_TITLE } from "@/components/landing/scenes/sample";
import { SessionPage } from "@/components/landing/scenes/session-page";
import type { SceneDefinition } from "@/components/landing/scenes/stage";

const COMMAND = "/peasant";
/* phases: 0 the empty input, 1..8 /peasant typed, then sent, answered and opened */
const TYPED = COMMAND.length;
const SENT = TYPED + 1;
const ANSWERED = TYPED + 2;
const OPENED = TYPED + 3;

/*
 * Record, on a Mac. In Claude Code, in Terminal, /peasant is typed into the
 * input row and sent; peasant's hook answers with the line `peasant open`
 * prints (its own wording), and the input row glides down as the lines arrive.
 * Then Safari rises in front on the session it opened, and Terminal dims
 * behind it.
 */
function Record({ phase }: { phase: number }) {
  const sent = phase >= SENT;
  const opened = phase >= OPENED;
  const typed = sent ? "" : COMMAND.slice(0, Math.min(phase, TYPED));
  return (
    <MacDesktop app={<Swap on={opened ? 1 : 0}>{["Terminal", "Safari"]}</Swap>}>
      <TerminalWindow title="shop — claude — 80×24" focus="term" active={!opened} className="scn-rec-term">
        <div className="cc">
          <div className="cc-welcome">
            <span className="cc-accent">✻</span> <b>Welcome to Claude Code!</b>
          </div>
          {sent ? (
            <div className="cc-out scn-in" data-focus="cc-out">
              <div className="cc-dim">&gt; {COMMAND}</div>
              {phase >= ANSWERED ? (
                <div className="cc-reply scn-in">
                  <span className="cc-dim">⎿</span>
                  <span>{`peasant: opened "${SAMPLE_TITLE}" · not published`}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="cc-input" data-focus="cc-input" data-flip="cc-input">
            <span className="cc-dim">&gt;</span> {typed}
            <span className="cc-caret" />
          </div>
        </div>
      </TerminalWindow>
      <SafariWindow focus="browser" className="scn-rec-browser" open={opened}>
        <SessionPage />
      </SafariWindow>
    </MacDesktop>
  );
}

export const RECORD_SCENE: SceneDefinition = {
  id: "record",
  duration: 7000,
  finalPhase: OPENED,
  cues: [
    ...typing(COMMAND, 500, 1),
    { at: 1500, phase: SENT },
    { at: 1950, phase: ANSWERED },
    { at: 3100, phase: OPENED },
  ],
  shots: [
    { at: 0, focus: "term", move: 1, fill: 0.94 },
    // a wide screen reads the whole row; a phone leans in on its start
    { at: 300, focus: "cc-input", move: 800, fill: 0.92, width: 430, cropBelow: 0.8 },
    { at: 2050, focus: "cc-out", move: 700, fill: 0.92, width: 430, cropBelow: 0.8 },
    { at: 2900, focus: "all", move: 1200 },
    { at: 4300, focus: "browser", move: 1300, ease: "settle", fill: 0.97 },
  ],
  finalFocus: "all",
  Render: Record,
};
