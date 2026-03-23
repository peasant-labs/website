"use client";

import { useState, useEffect, useRef } from "react";
import { useTypewriter } from "@/lib/use-typewriter";
import { useInView } from "@/lib/use-in-view";
import { TerminalWindow } from "@/components/ui/terminal-window";

const STAGES = [
  { name: "DISCOVER", desc: "find sessions" },
  { name: "DIFF", desc: "compare mod times" },
  { name: "FILTER", desc: "skip unchanged" },
  { name: "EXTRACT", desc: "parse & write" },
  { name: "DB INSERT", desc: "upsert to SQLite" },
  { name: "INDEX", desc: "build entries" },
  { name: "COMPUTE", desc: "run 16 metrics" },
  { name: "CLEANUP", desc: "remove orphans" },
  { name: "REPORT", desc: "summary counts" },
] as const;

const TERMINAL_LINES = [
  "$ peasant ingest --since 2w",
  "  DISCOVER → DIFF → FILTER → EXTRACT → DB INSERT → INDEX → COMPUTE → CLEANUP → REPORT",
  "  ████████████████████████████████████████ 100%",
  "",
  "  New: 35  Updated: 12  Unchanged: 12  Active: 0  Errors: 0",
];

const STAGE_DELAY_MS = 150;

function PipelineNode({
  name,
  desc,
  isActive,
  isLit,
}: {
  name: string;
  desc: string;
  isActive: boolean;
  isLit: boolean;
}) {
  return (
    <div
      className="relative border-2 px-3 py-3 sm:px-4 sm:py-4 font-mono transition-all duration-300 min-w-[100px]"
      style={{
        borderColor: isActive
          ? "var(--accent)"
          : isLit
            ? "var(--border-strong)"
            : "var(--border-default)",
        backgroundColor: isActive
          ? "var(--accent-muted)"
          : isLit
            ? "var(--bg-elevated)"
            : "var(--bg-surface)",
      }}
    >
      <div
        className="text-small font-bold transition-colors duration-300 whitespace-nowrap"
        style={{
          color: isActive
            ? "var(--accent)"
            : isLit
              ? "var(--text-primary)"
              : "var(--text-tertiary)",
        }}
      >
        {name}
      </div>
      <div
        className="text-caption mt-1 transition-colors duration-300 whitespace-nowrap"
        style={{
          color: isLit ? "var(--text-secondary)" : "var(--text-tertiary)",
        }}
      >
        {desc}
      </div>

      {/* Glow effect for active node */}
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "0 0 12px rgba(212, 168, 67, 0.15)",
          }}
        />
      )}
    </div>
  );
}

function Arrow({ isLit }: { isLit: boolean }) {
  return (
    <div className="flex items-center justify-center relative">
      <span
        className="text-body transition-colors duration-300 select-none hidden sm:inline"
        style={{
          color: isLit ? "var(--text-secondary)" : "var(--text-tertiary)",
          opacity: isLit ? 1 : 0.4,
        }}
      >
        →
      </span>
      {/* Particle dot flowing between nodes */}
      {isLit && (
        <span
          className="absolute w-1 h-1 hidden sm:block"
          style={{
            backgroundColor: "var(--accent)",
            animation: "flow-dot 1.5s ease-in-out infinite",
            opacity: 0.7,
          }}
        />
      )}
    </div>
  );
}

/* ── Terminal output (animates after all pipeline nodes are lit) ── */
function PipelineTerminal({ animate }: { animate: boolean }) {
  const { displayLines, isComplete } = useTypewriter(TERMINAL_LINES, {
    charDelayMs: 8,
    lineDelayMs: 80,
    startDelayMs: 400,
    triggerOnView: false,
  });

  return (
    <TerminalWindow title="peasant ingest">
      <div className="overflow-x-auto relative">
        {/* Invisible full content to hold the terminal size stable */}
        <div aria-hidden="true" className="invisible whitespace-pre font-mono">
          {TERMINAL_LINES.map((line, i) => (
            <div key={i}>{line || "\u00A0"}</div>
          ))}
        </div>

        {/* Visible animated content overlaid on top */}
        <div className="absolute inset-0 whitespace-pre font-mono">
          {animate ? (
            <>
              {displayLines.map((line, i) => (
                <div key={i}>
                  {i === 0 ? (
                    <span className="text-[var(--green)]">{line}</span>
                  ) : i === 2 ? (
                    <span className="text-[var(--accent)]">{line}</span>
                  ) : i === 4 ? (
                    <span className="text-[var(--text-secondary)]">
                      {colorizeStats(line)}
                    </span>
                  ) : (
                    <span className="text-[var(--text-secondary)]">{line}</span>
                  )}
                </div>
              ))}
              {!isComplete && (
                <span className="cursor-blink text-[var(--green)]">█</span>
              )}
            </>
          ) : null}
        </div>
      </div>
    </TerminalWindow>
  );
}

/* ── Main Pipeline Section ── */
export function Pipeline() {
  const { ref: sectionRef, isInView } = useInView({ threshold: 0.15 });
  const [litCount, setLitCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const animationStarted = useRef(false);

  const allLit = litCount >= STAGES.length;

  // Sequential lighting animation
  useEffect(() => {
    if (!isInView || animationStarted.current) return;
    animationStarted.current = true;

    let current = 0;
    const interval = setInterval(() => {
      current++;
      setLitCount(current);
      setActiveIndex(current - 1);

      if (current >= STAGES.length) {
        clearInterval(interval);
        // After all lit, remove active highlight after a short pause
        setTimeout(() => {
          setActiveIndex(-1);
        }, 600);
      }
    }, STAGE_DELAY_MS);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="py-20 sm:py-28 px-4"
    >
      <style>{`
        @keyframes flow-dot {
          0% { transform: translateX(-8px); opacity: 0; }
          30% { opacity: 0.8; }
          70% { opacity: 0.8; }
          100% { transform: translateX(8px); opacity: 0; }
        }
      `}</style>

      <div className="max-w-[1100px] mx-auto">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="text-heading text-[var(--text-primary)] mb-2">
            {"// ingest pipeline"}
          </h2>
          <p className="text-small text-[var(--text-secondary)]">
            9 stages from discovery to report
          </p>
        </div>

        {/* Pipeline — horizontal on desktop, wrapping */}
        <div className="hidden sm:flex items-center justify-center gap-1 mb-16 flex-wrap">
          {STAGES.map((stage, i) => (
            <div key={stage.name} className="contents">
              <PipelineNode
                name={stage.name}
                desc={stage.desc}
                isActive={activeIndex === i}
                isLit={i < litCount}
              />
              {i < STAGES.length - 1 && <Arrow isLit={i + 1 < litCount} />}
            </div>
          ))}
        </div>

        {/* Mobile: 3-column grid */}
        <div className="sm:hidden grid grid-cols-3 gap-2 mb-12">
          {STAGES.map((stage, i) => (
            <PipelineNode
              key={stage.name}
              name={stage.name}
              desc={stage.desc}
              isActive={activeIndex === i}
              isLit={i < litCount}
            />
          ))}
        </div>

        {/* Terminal mockup */}
        <div
          className="max-w-[700px] mx-auto transition-opacity duration-500"
          style={{ opacity: allLit ? 1 : 0.3 }}
        >
          <PipelineTerminal animate={allLit} />
        </div>
      </div>
    </section>
  );
}

/** Colorizes stat labels in the summary line */
function colorizeStats(line: string): React.ReactNode {
  if (!line) return line;

  const parts = line.split(/(\s{2,})/);
  return parts.map((part, i) => {
    const match = part.match(/^(\w+):\s*(\d+)$/);
    if (match) {
      const [, label, value] = match;
      let valueColor = "var(--text-primary)";
      if (label === "New") valueColor = "var(--green)";
      else if (label === "Updated") valueColor = "var(--accent)";
      else if (label === "Errors")
        valueColor =
          Number(value) > 0 ? "var(--red)" : "var(--text-tertiary)";
      else if (label === "Active") valueColor = "var(--text-tertiary)";
      else if (label === "Unchanged") valueColor = "var(--text-tertiary)";

      return (
        <span key={i}>
          <span style={{ color: "var(--text-secondary)" }}>{label}: </span>
          <span style={{ color: valueColor }}>{value}</span>
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
