"use client";

import { useState, useCallback } from "react";
import { useAsciiMorph } from "@/lib/use-ascii-morph";
import { useTypewriter } from "@/lib/use-typewriter";
import { AsciiVillage } from "@/components/landing/ascii-village";

const FIGLET = `                                  _
 _ __   ___  __ _ ___  __ _ _ __ | |_
| '_ \\ / _ \\/ _\` / __|/ _\` | '_ \\| __|
| |_) |  __/ (_| \\__ \\ (_| | | | | |_
| .__/ \\___|\\__,_|___/\\__,_|_| |_|\\__|
|_|                                     `;

const INSTALL_CMD = "go install github.com/org/peasant@latest";

const DESC_LINES = [
  "open-source cli for ai coding transcripts.",
  "take back your sessions from claude code, codex & more.",
];

export function Hero() {
  const {
    text: morphedText,
    ref: morphRef,
  } = useAsciiMorph(FIGLET, {
    durationMs: 1200,
    triggerOnView: false,
  });

  const [copied, setCopied] = useState(false);

  const { displayLines: descDisplay, isComplete: descComplete } =
    useTypewriter(DESC_LINES, {
      charDelayMs: 16,
      lineDelayMs: 150,
      triggerOnView: false,
      enabled: true,
      startDelayMs: 300,
    });

  const { displayLines: installDisplay, isComplete: installComplete } =
    useTypewriter([`$ ${INSTALL_CMD}`], {
      charDelayMs: 12,
      startDelayMs: 100,
      triggerOnView: false,
      enabled: descComplete,
    });

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(INSTALL_CMD).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // Track which line the typewriter is currently on for cursor placement
  const currentLineIdx = descDisplay.findIndex(
    (line, i) => line.length > 0 && line.length < DESC_LINES[i].length
  );

  return (
    <section className="relative min-h-[95vh] flex items-start justify-center pt-[20vh] overflow-hidden">
      {/* Animated ASCII village — full background */}
      <AsciiVillage />

      {/* Hero content — with backdrop for readability, positioned toward top */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[700px] px-12 py-10 gap-6 bg-[var(--bg-deep)]/75 backdrop-blur-[2px]">
        {/* ASCII Art Title */}
        <div className="w-full flex flex-col items-center">
          <pre
            ref={morphRef as React.RefObject<HTMLPreElement>}
            className="hidden md:block text-[var(--accent)] text-[11px] sm:text-[13px] lg:text-[15px] leading-tight select-none whitespace-pre font-mono"
            aria-label="peasant"
          >
            {morphedText}
          </pre>
          <h1
            className="md:hidden text-display text-[var(--accent)] font-bold tracking-tight select-none"
            aria-label="peasant"
          >
            peasant
          </h1>
        </div>

        {/* Description — cursor follows the active line */}
        <div
          className="relative text-center"
          style={{
            opacity: descDisplay.some((l) => l.length > 0) ? 1 : 0,
            transform: descDisplay.some((l) => l.length > 0) ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div aria-hidden="true" className="invisible">
            {DESC_LINES.map((line, i) => (
              <p key={i} className="text-body">{line}</p>
            ))}
          </div>
          <div className="absolute inset-0">
            {descDisplay.map((line, i) => (
              <p key={i} className="text-body text-[var(--text-secondary)]">
                {line}
                {i === currentLineIdx && (
                  <span className="cursor-blink text-[var(--text-secondary)]">█</span>
                )}
              </p>
            ))}
          </div>
        </div>

        {/* Install command box */}
        <div className="w-full max-w-[520px]">
          <div
            className="flex items-center justify-between gap-2 border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 font-mono text-small"
            style={{
              opacity: descComplete ? 1 : 0,
              transform: descComplete ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <code className="text-[var(--text-primary)] truncate">
              {installDisplay[0]}
              {descComplete && !installComplete && (
                <span className="cursor-blink text-[var(--accent)]">█</span>
              )}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1 text-caption text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
              style={{
                opacity: installComplete ? 1 : 0,
                transition: "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              aria-label="copy install command"
              tabIndex={installComplete ? 0 : -1}
            >
              {copied ? "copied!" : "copy"}
            </button>
          </div>
        </div>

        {/* CTA */}
        <a
          href="#the-lay-of-the-land"
          className="text-small text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors font-mono tracking-wider"
          style={{
            opacity: installComplete ? 1 : 0,
            transform: installComplete ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          tabIndex={installComplete ? 0 : -1}
        >
          enter the shire ↓
        </a>
      </div>
    </section>
  );
}
