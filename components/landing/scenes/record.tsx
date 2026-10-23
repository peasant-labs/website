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
 * Record, on a Mac. In Claude Code, in Terminal, the pointer clicks into the
 * input row, /peasant is typed and sent; peasant's hook answers with the line `peasant open`
 * prints (its own wording), and the input row glides down as the lines arrive.
 * Then Safari rises in front on the session it opened, Terminal dims behind
 * it, and the pointer crosses to the page and comes to rest on publish, where
 * the next steps pick it up.
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
  duration: 7200,
  finalPhase: OPENED,
  cues: [
    ...typing(COMMAND, 1250, 1),
    { at: 2000, phase: SENT },
    { at: 2450, phase: ANSWERED },
    { at: 3500, phase: OPENED },
  ],
  shots: [
    { at: 0, focus: "term", move: 1, fill: 0.94 },
    // a wide screen reads the whole row; a phone leans in on its start
    { at: 400, focus: "cc-input", move: 800, fill: 0.92, width: 430, cropBelow: 0.8 },
    { at: 2550, focus: "cc-out", move: 700, fill: 0.92, width: 430, cropBelow: 0.8 },
    // the camera crosses to Safari as it rises in front, and settles on the session it opened
    { at: 3400, focus: "browser", move: 1400, fill: 0.97 },
    { at: 5000, focus: "page-head", move: 1100, ease: "settle", fill: 0.9 },
  ],
  // the pointer clicks into Claude Code's input, then, once Safari is in front, crosses to it and settles on publish
  cursorFrom: [560, 330],
  cursor: [
    { at: 200, to: "cc-input", move: 700, press: true, hover: 180, shape: "ibeam", aim: [0.25, 0.5] },
    { at: 3900, to: "browser", move: 800, aim: [0.55, 0.62] },
    { at: 5100, to: ".scn-page .pub-bar-action", move: 800 },
  ],
  finalFocus: "browser",
  finalFill: 0.97,
  Render: Record,
};
