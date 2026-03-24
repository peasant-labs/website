"use client";

import { useAsciiMorph } from "@/lib/use-ascii-morph";
import { useInView } from "@/lib/use-in-view";

const WHY_TEXT =
  "sharing just hundreds of coding transcripts can dramatically improve ai agents. your sessions have value — redacted and shared on your terms, they strengthen the entire open-source community.";

const SOURCES = [
  { label: "swe-gym, icml 2025", url: "https://github.com/SWE-Gym/SWE-Gym" },
  { label: "agent data protocol", url: "https://arxiv.org/abs/2510.24702" },
  {
    label: "metr study, 2025",
    url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/",
  },
];

export function Village() {
  const { text: titleText, ref: titleRef } = useAsciiMorph("the village", {
    durationMs: 500,
  });

  const { ref: sectionRef, isInView } = useInView({ threshold: 0.15 });

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative bg-[var(--bg-surface)] py-24 sm:py-32 px-4 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h2 className="text-heading text-[var(--text-tertiary)] font-mono mb-12">
          //{" "}
          <span ref={titleRef as React.RefObject<HTMLSpanElement>}>
            {titleText}
          </span>
        </h2>

        {/* Description + sources */}
        <div
          className="max-w-2xl mb-6"
          style={{
            opacity: isInView ? 1 : 0,
            transition: "opacity 500ms ease-out",
          }}
        >
          <p className="text-body text-[var(--text-secondary)] leading-relaxed mb-4">
            {WHY_TEXT}
          </p>
          <div className="flex flex-wrap gap-4">
            {SOURCES.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-caption text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors underline underline-offset-2"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(6px)",
            transition:
              "opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) 500ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) 500ms",
          }}
        >
          <a
            href="https://village.peasantlabs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[var(--accent)] text-[var(--accent)] px-6 py-3 text-body font-mono hover:bg-[var(--accent)] hover:text-[var(--bg-deep)] transition-colors"
          >
            explore the village →
          </a>
        </div>

        {/* Popular collectives */}
        <div
          className="mt-16"
          style={{
            opacity: isInView ? 1 : 0,
            transition: "opacity 500ms ease-out 700ms",
          }}
        >
          <h3 className="text-small text-[var(--text-tertiary)] font-mono tracking-wider mb-6">
            // from the hearth
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a
              href="https://village.peasantlabs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:border-[var(--accent)] hover:-translate-y-[2px] group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 border border-[var(--border-default)] bg-[var(--bg-deep)] flex items-center justify-center text-caption text-[var(--text-tertiary)] font-mono">
                  #1
                </div>
                <div>
                  <p className="text-body text-[var(--text-primary)] font-bold group-hover:text-[var(--accent)] transition-colors">
                    claude code commons
                  </p>
                  <p className="text-caption text-[var(--text-tertiary)]">
                    2,847 transcripts · 142 members
                  </p>
                </div>
              </div>
              <p className="text-small text-[var(--text-secondary)]">
                open collective for claude code session transcripts. cc0
                licensed.
              </p>
            </a>

            <a
              href="https://village.peasantlabs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:border-[var(--accent)] hover:-translate-y-[2px] group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 border border-[var(--border-default)] bg-[var(--bg-deep)] flex items-center justify-center text-caption text-[var(--text-tertiary)] font-mono">
                  #2
                </div>
                <div>
                  <p className="text-body text-[var(--text-primary)] font-bold group-hover:text-[var(--accent)] transition-colors">
                    swe-bench trajectories
                  </p>
                  <p className="text-caption text-[var(--text-tertiary)]">
                    1,203 transcripts · 89 members
                  </p>
                </div>
              </div>
              <p className="text-small text-[var(--text-secondary)]">
                agent trajectories for software engineering benchmarks.
                attribution license.
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
