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
    heading: "ingest",
    description: "pull sessions from claude code, opencode, and more.",
    terminalTitle: "peasant ingest",
    terminalLines: [
      "$ peasant ingest --since 2w",
      "",
      "  claude code   34 sessions   890k tokens",
      "  opencode      12 sessions   234k tokens",
      "",
      "  new: 46   updated: 0   unchanged: 8",
      "",
      "  done in 2.3s",
    ],
  },
  {
    heading: "analyze",
    description: "browse in the tui or fire up the web dashboard.",
    terminalTitle: "peasant tui",
    terminalLines: [
      "$ peasant tui",
      "",
      "  id       provider   duration   tokens",
      "  ------   --------   --------   ------",
      "  a3f2..   claude     23m14s     124k  ",
      "  b7e1..   claude     11m02s      43k  ",
      "  c9d4..   opencode    8m45s      31k  ",
      "",
    ],
  },
  {
    heading: "redact",
    description: "strip api keys, paths, and pii. keep the patterns.",
    terminalTitle: "peasant push --dry-run",
    terminalLines: [
      "$ peasant push --dry-run",
      "",
      "  api_key: sk-proj-abc   ->   [redacted]",
      "  path: /users/john/     ->   /[user]/[project]",
      "  model: claude-opus     ->   claude-opus  kept",
      "",
      "  redacted: 2   kept: 1",
      "",
    ],
  },
  {
    heading: "share",
    description: "push redacted transcripts to the village.",
    terminalTitle: "peasant push",
    terminalLines: [
      "$ peasant push --visibility public",
      "",
      "  redacted:    12/12 transcripts",
      "  visibility:  public",
      "",
      "  pushed to village.peasant.dev",
      "",
      "  done.",
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
