"use client";

import { TerminalWindow } from "@/components/ui/terminal-window";
import { useTypewriter } from "@/lib/use-typewriter";
import { useAsciiMorph } from "@/lib/use-ascii-morph";
import { useMemo } from "react";

const COMMANDS = [
  "# Install peasant",
  "$ go install github.com/org/peasant@latest",
  "",
  "# Run the setup wizard",
  "$ peasant kickstart",
  "",
  "# Ingest your first sessions",
  "$ peasant ingest",
  "",
  "# Launch the TUI",
  "$ peasant tui",
];

export function Quickstart() {
  const lines = useMemo(() => COMMANDS, []);

  const { text: titleText, ref: titleRef } = useAsciiMorph("getting started", {
    durationMs: 500,
  });

  const { displayLines, isComplete, ref } = useTypewriter(lines, {
    charDelayMs: 12,
    lineDelayMs: 100,
    startDelayMs: 200,
    triggerOnView: true,
  });

  return (
    <section className="bg-[var(--bg-deep)] pt-24 pb-12 px-4">
      <div ref={ref as React.RefObject<HTMLDivElement>} className="max-w-6xl mx-auto">
        <h2 className="text-heading text-[var(--text-tertiary)] font-mono mb-10">
          //{" "}
          <span ref={titleRef as React.RefObject<HTMLSpanElement>}>
            {titleText}
          </span>
        </h2>

        <div className="max-w-[600px]">
          <TerminalWindow title="quickstart">
            <pre className="text-small leading-relaxed whitespace-pre font-mono relative">
              {/* Invisible content to hold final height */}
              <div aria-hidden="true" className="invisible">
                {COMMANDS.map((line, i) => (
                  <div key={i} className={line === "" ? "h-[1em]" : "min-h-[1.5em]"}>
                    {line || "\u00A0"}
                  </div>
                ))}
                <div className="mt-2 min-h-[1.5em]">$ █</div>
              </div>

              {/* Animated overlay — every line has matching height to sizer */}
              <div className="absolute inset-0">
                {displayLines.map((line, i) => {
                  const source = COMMANDS[i];
                  const isComment = source.startsWith("#");
                  const isEmpty = source === "";
                  const heightClass = isEmpty ? "h-[1em]" : "min-h-[1.5em]";

                  if (isEmpty) {
                    return <div key={i} className={heightClass} />;
                  }

                  if (isComment) {
                    return (
                      <div key={i} className={`${heightClass} text-[var(--text-tertiary)]`}>
                        {source}
                      </div>
                    );
                  }

                  return (
                    <div key={i} className={`${heightClass} text-[var(--text-primary)]`}>
                      <span className="text-[var(--green)]">
                        {line.slice(0, 2)}
                      </span>
                      <span>{line.slice(2)}</span>
                      {!isComplete &&
                        displayLines[i] !== COMMANDS[i] &&
                        line.length > 0 && (
                          <span className="cursor-blink text-[var(--accent)]">
                            █
                          </span>
                        )}
                    </div>
                  );
                })}
                {isComplete && (
                  <div className="mt-2">
                    <span className="text-[var(--green)]">$ </span>
                    <span className="cursor-blink text-[var(--accent)]">█</span>
                  </div>
                )}
              </div>
            </pre>
          </TerminalWindow>

          {/* CTA */}
          <div
            className="flex flex-col sm:flex-row gap-6 mt-6 transition-all duration-500 ease-out"
            style={{
              opacity: isComplete ? 1 : 0,
              transform: isComplete ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <a
              href="/docs/getting-started"
              className="text-body text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              Read the full guide →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
