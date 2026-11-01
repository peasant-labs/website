"use client";

import { XThread } from "@/components/landing/x-thread";
import { TerminalWindow } from "@/components/mac";
import { SESSION } from "@/lib/landing";
import { SAMPLE_SESSION } from "@/lib/sample-session";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* the sample's first ask and the first thing the agent says back, as Claude Code shows them */
const [ASK, ANSWER] = SAMPLE_SESSION.turns ?? [];
const ASK_TEXT = String(ASK?.content ?? "");
const ANSWER_TEXT = String(ANSWER?.content ?? "").replace(/<thinking>[\s\S]*?<\/thinking>/g, "");

/** The three windows, by the name each goes by in `data-front`. */
type Window = "term" | "front" | "x";

/**
 * Recording, published transcript and shared link occupy separate desktop
 * columns. Narrower containers stack them; phones retain the readable slice.
 * The Terminal repeats the transcript and is decorative for screen readers.
 */
export function SessionWindows({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fanned, setFanned] = useState(false);
  const [front, setFront] = useState<Window | null>(null);
  const raise = (which: Window) => ({
    onPointerEnter: () => setFront(which),
    onFocus: () => setFront(which),
  });

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
    <div ref={ref} className="lp-windows" data-fanned={fanned ? "true" : "false"} data-front={front ?? undefined}>
      <div className="lp-windows-term" aria-hidden="true" {...raise("term")}>
        <TerminalWindow title={SESSION.terminal} active={false}>
          <div className="cc">
            <div>you@macbook billing % claude</div>
            <div className="cc-welcome">
              <div>
                <span className="cc-accent">✻</span> <b>Welcome to Claude Code!</b>
              </div>
              <div className="cc-gap" />
              <div className="cc-dim">cwd: /Users/you/src/billing</div>
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
      <div className="lp-windows-front" {...raise("front")}>
        {children}
      </div>
      <div className="lp-windows-x" {...raise("x")}>
        <XThread />
      </div>
    </div>
  );
}
