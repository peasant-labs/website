"use client";

import { TerminalWindow } from "@/components/ui/terminal-window";
import { useInView } from "@/lib/use-in-view";
import { useTypewriter } from "@/lib/use-typewriter";
import { useAsciiMorph } from "@/lib/use-ascii-morph";

interface Feature {
  heading: string;
  description: string;
  terminalTitle: string;
  terminalLines: string[];
}

// All terminals have exactly 8 lines for uniform height
const features: Feature[] = [
  {
    heading: "Ingest",
    description: "Pull sessions from Claude Code, OpenCode, and more.",
    terminalTitle: "peasant ingest",
    terminalLines: [
      "$ peasant ingest --since 2w",
      "",
      "  Claude Code   34 sessions   890K tokens",
      "  OpenCode      12 sessions   234K tokens",
      "",
      "  New: 46   Updated: 0   Unchanged: 8",
      "",
      "  Done in 2.3s",
    ],
  },
  {
    heading: "Analyze",
    description: "Browse in the TUI or fire up the web dashboard.",
    terminalTitle: "peasant tui",
    terminalLines: [
      "$ peasant tui",
      "",
      "  ID       Provider   Duration   Tokens",
      "  ------   --------   --------   ------",
      "  a3f2..   claude     23m14s     124K  ",
      "  b7e1..   claude     11m02s      43K  ",
      "  c9d4..   opencode    8m45s      31K  ",
      "",
    ],
  },
  {
    heading: "Redact",
    description: "Strip API keys, paths, and PII. Keep the patterns.",
    terminalTitle: "peasant push --dry-run",
    terminalLines: [
      "$ peasant push --dry-run",
      "",
      "  api_key: sk-proj-abc   ->   [REDACTED]",
      "  path: /Users/john/     ->   /[USER]/[PROJECT]",
      "  model: claude-opus     ->   claude-opus  kept",
      "",
      "  Redacted: 2   Kept: 1",
      "",
    ],
  },
  {
    heading: "Share",
    description: "Push redacted transcripts to the Village.",
    terminalTitle: "peasant push",
    terminalLines: [
      "$ peasant push --visibility public",
      "",
      "  Redacted:    12/12 transcripts",
      "  Visibility:  public",
      "",
      "  Pushed to village.peasant.dev",
      "",
      "  Done.",
    ],
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const { ref, isInView } = useInView({ threshold: 0.15, once: true });

  const { displayLines, isComplete } = useTypewriter(feature.terminalLines, {
    charDelayMs: 6,
    lineDelayMs: 30,
    startDelayMs: 100,
    triggerOnView: false,
    enabled: isInView,
  });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="flex flex-col gap-4 transition-all duration-500"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(16px)",
      }}
    >
      {/* Terminal — fixed height via uniform 8-line content */}
      <TerminalWindow title={feature.terminalTitle}>
        <pre className="text-small leading-relaxed whitespace-pre overflow-x-auto relative">
          <div aria-hidden="true" className="invisible">
            {feature.terminalLines.map((line, i) => (
              <div key={i} className="min-h-[1.5em]">
                {line || "\u00A0"}
              </div>
            ))}
          </div>
          <div className="absolute inset-0">
            {displayLines.map((line, i) => {
              const isTyping =
                !isComplete &&
                line.length > 0 &&
                line.length < (feature.terminalLines[i]?.length ?? 0);
              return (
                <div key={i} className="min-h-[1.5em]">
                  {line}
                  {isTyping && (
                    <span className="cursor-blink text-[var(--accent)]">█</span>
                  )}
                </div>
              );
            })}
          </div>
        </pre>
      </TerminalWindow>

      {/* Label with number */}
      <div>
        <h3 className="text-subheading text-[var(--text-primary)] font-bold mb-1">
          <span className="text-[var(--text-tertiary)] font-mono mr-2">{String(index + 1).padStart(2, "0")}.</span>
          {feature.heading}
        </h3>
        <p className="text-small text-[var(--text-secondary)] leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export function Features() {
  const { text: titleText, ref: titleRef } = useAsciiMorph("tools of the trade", { durationMs: 500 });

  return (
    <section className="w-full bg-[var(--bg-deep)] py-24 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-16">
          <h2 className="text-heading text-[var(--text-tertiary)] font-mono">
            // <span ref={titleRef as React.RefObject<HTMLSpanElement>}>{titleText}</span>
          </h2>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
