"use client";

import { useInView } from "@/lib/use-in-view";
import { useAsciiMorph } from "@/lib/use-ascii-morph";

// Placeholder contributors — replace with real data
const INDIVIDUALS = [
  {
    name: "your name",
    company: "company",
    image: "/demos/avatar-placeholder.svg",
  },
  {
    name: "your name",
    company: "company",
    image: "/demos/avatar-placeholder.svg",
  },
  {
    name: "your name",
    company: "company",
    image: "/demos/avatar-placeholder.svg",
  },
  {
    name: "your name",
    company: "company",
    image: "/demos/avatar-placeholder.svg",
  },
  {
    name: "your name",
    company: "company",
    image: "/demos/avatar-placeholder.svg",
  },
  {
    name: "your name",
    company: "company",
    image: "/demos/avatar-placeholder.svg",
  },
];

const COMPANIES = [
  { name: "company", logo: "/demos/logo-placeholder.svg" },
  { name: "company", logo: "/demos/logo-placeholder.svg" },
  { name: "company", logo: "/demos/logo-placeholder.svg" },
  { name: "company", logo: "/demos/logo-placeholder.svg" },
];

export function Research() {
  const { ref, isInView } = useInView({ threshold: 0.15 });

  const { text: titleText, ref: titleRef } = useAsciiMorph("contributors", { durationMs: 500 });

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-[var(--bg-elevated)] py-24 px-4"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-16">
        {/* Section title */}
        <div>
          <h2 className="text-heading text-[var(--text-tertiary)] font-mono">
            // <span ref={titleRef as React.RefObject<HTMLSpanElement>}>{titleText}</span>
          </h2>
          <p className="text-small text-[var(--text-tertiary)] mt-1">
            peasants who tend the commons
          </p>
        </div>

        {/* Individual contributors */}
        <div
          className="w-full"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(16px)",
            transition: "all 500ms ease-out",
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {INDIVIDUALS.map((person, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 border border-[var(--border-default)] bg-[var(--bg-deep)] transition-all duration-500 ease-out hover:border-[var(--accent)] hover:-translate-y-[2px]"
                style={{
                  transitionDelay: isInView ? `${i * 80}ms` : "0ms",
                  opacity: isInView ? 1 : 0,
                }}
              >
                {/* Avatar */}
                <div className="w-12 h-12 shrink-0 border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center font-mono text-[var(--text-tertiary)] text-subheading select-none">
                  ?
                </div>
                <div>
                  <p className="text-small text-[var(--text-primary)] font-bold leading-tight">
                    {person.name}
                  </p>
                  <p className="text-caption text-[var(--text-tertiary)] leading-tight mt-0.5">
                    {person.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-[var(--border-default)]" />

        {/* Company logos */}
        <div
          className="w-full"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(16px)",
            transition: "all 500ms ease-out 400ms",
          }}
        >
          <p className="text-caption text-[var(--text-tertiary)] tracking-widest mb-6">
            supported by
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {COMPANIES.map((company, i) => (
              <div
                key={i}
                className="flex items-center justify-center h-16 border-2 border-[var(--border-default)] bg-[var(--bg-deep)] transition-all duration-300 hover:border-[var(--border-strong)]"
              >
                <span className="text-small text-[var(--text-tertiary)] font-mono tracking-wider">
                  [{company.name}]
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
