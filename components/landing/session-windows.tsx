"use client";

import { TerminalWindow } from "@/components/mac";
import { SESSION } from "@/lib/landing";
import { SAMPLE_SESSION } from "@/lib/sample-session";
import { CircleCheck } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* the sample's first ask and the first thing the agent says back, as Claude Code shows them */
const [ASK, ANSWER] = SAMPLE_SESSION.turns ?? [];
const ASK_TEXT = String(ASK?.content ?? "");
const ANSWER_TEXT = String(ANSWER?.content ?? "").replace(/<thinking>[\s\S]*?<\/thinking>/g, "");

/**
 * One session in three windows: behind, Claude Code in Terminal, where it was
 * recorded; in front, the published transcript a reviewer reads (passed in);
 * on top, the pull request's peasant check that links to it.
 *
 * They fan out from one stack the first time the group comes into view; only
 * transform and opacity move. Without motion they are simply where they end.
 * The Terminal repeats what the transcript already says, so it is hidden from
 * assistive technology; the check is read as a short group.
 */
export function SessionWindows({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fanned, setFanned] = useState(false);

  // They fan out once, the first time a fifth of the group is on screen.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setFanned(true);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="lp-windows" data-fanned={fanned ? "true" : "false"}>
      <div className="lp-windows-term" aria-hidden="true">
        <TerminalWindow title={SESSION.terminal} active={false}>
          <div className="cc">
            <div>you@macbook shop % claude</div>
            <div className="cc-welcome">
              <div>
                <span className="cc-accent">✻</span> <b>Welcome to Claude Code!</b>
              </div>
              <div className="cc-gap" />
              <div className="cc-dim">cwd: /Users/you/src/shop</div>
            </div>
            <div className="cc-out">
              <div className="cc-dim">&gt; {ASK_TEXT}</div>
              <div className="cc-gap" />
              <div className="cc-reply lp-windows-reply">
                <span className="cc-accent">⏺</span>
                <div>{ANSWER_TEXT}</div>
              </div>
            </div>
            <div className="cc-input">
              <span className="cc-dim">&gt;</span>
            </div>
          </div>
        </TerminalWindow>
      </div>
      <div className="lp-windows-front">{children}</div>
      <div className="lp-check" role="group" aria-label={SESSION.check.label}>
        <CircleCheck className="lp-check-ic" aria-hidden="true" focusable="false" />
        <div className="lp-check-text">
          <span className="lp-check-name">{SESSION.check.name}</span>
          <span className="lp-check-summary">{SESSION.check.summary}</span>
        </div>
      </div>
    </div>
  );
}
