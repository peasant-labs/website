"use client";

import { useTypewriter } from "@/lib/use-typewriter";
import { useInView } from "@/lib/use-in-view";

const BATTLEMENT =
  "|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|";

const LINE1 = ["Every AI coding session generates a transcript."];
const LINE2 = [
  "Companies keep them. Use them to retrain their",
  "models. You never see them again.",
];
const LINE3 = ["What if you could take them back?"];
const LINE4 = [
  "Redact the sensitive parts. Keep the insights.",
  "Share with researchers, the open-source community,",
  "and your own team — on your terms.",
];

function InvisibleSizer({
  lines,
  className,
}: {
  lines: string[];
  className: string;
}) {
  return (
    <div aria-hidden="true" className="invisible">
      {lines.map((line, i) => (
        <p key={i} className={className}>
          {line}
        </p>
      ))}
    </div>
  );
}

export function PerceptionGap() {
  const { ref: sectionRef, isInView } = useInView({ threshold: 0.2 });

  const { displayLines: line1Display, isComplete: line1Done } = useTypewriter(
    LINE1,
    { charDelayMs: 14, triggerOnView: false, enabled: isInView }
  );

  const { displayLines: line2Display, isComplete: line2Done } = useTypewriter(
    LINE2,
    {
      charDelayMs: 12,
      startDelayMs: 150,
      triggerOnView: false,
      enabled: line1Done,
    }
  );

  const { displayLines: line3Display, isComplete: line3Done } = useTypewriter(
    LINE3,
    {
      charDelayMs: 12,
      startDelayMs: 200,
      triggerOnView: false,
      enabled: line2Done,
    }
  );

  const { displayLines: line4Display, isComplete: line4Done } = useTypewriter(
    LINE4,
    {
      charDelayMs: 14,
      startDelayMs: 150,
      triggerOnView: false,
      enabled: line3Done,
    }
  );

  // Find the currently-typing line index for multi-line groups
  const line2CursorIdx = line2Display.findIndex(
    (line, i) => line.length > 0 && line.length < LINE2[i].length
  );
  const line4CursorIdx = line4Display.findIndex(
    (line, i) => line.length > 0 && line.length < LINE4[i].length
  );

  return (
    <section
      id="the-lay-of-the-land"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative scroll-mt-12"
    >
      <div className="w-full overflow-hidden border-t border-[var(--border-default)]">
        <div className="text-[var(--text-tertiary)] text-caption font-mono whitespace-nowrap select-none text-center py-1 opacity-60">
          {BATTLEMENT}
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] py-24 sm:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Line 1 — muted, medium */}
          <div
            className="relative mb-8"
            style={{ opacity: isInView ? 1 : 0, transition: "opacity 300ms" }}
          >
            <InvisibleSizer
              lines={LINE1}
              className="text-subheading leading-relaxed"
            />
            <div className="absolute inset-0">
              <p className="text-subheading text-[var(--text-secondary)] leading-relaxed">
                {line1Display[0]}
                {isInView && !line1Done && (
                  <span className="cursor-blink text-[var(--text-secondary)]">
                    █
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Line 2 — amber, heading size */}
          <div
            className="relative mb-10"
            style={{ opacity: line1Done ? 1 : 0, transition: "opacity 300ms" }}
          >
            <InvisibleSizer
              lines={LINE2}
              className="text-heading leading-relaxed"
            />
            <div className="absolute inset-0">
              {line2Display.map((line, i) => (
                <p
                  key={i}
                  className="text-heading text-[var(--amber)] leading-relaxed"
                >
                  {line}
                  {i === line2CursorIdx && (
                    <span className="cursor-blink text-[var(--amber)]">█</span>
                  )}
                </p>
              ))}
            </div>
          </div>

          {/* Line 3 — SAME style as Line 2 (amber, heading) */}
          <div
            className="relative mb-10"
            style={{ opacity: line2Done ? 1 : 0, transition: "opacity 300ms" }}
          >
            <InvisibleSizer
              lines={LINE3}
              className="text-heading leading-relaxed"
            />
            <div className="absolute inset-0">
              <p className="text-heading text-[var(--amber)] leading-relaxed">
                {line3Display[0]}
                {line2Done && !line3Done && (
                  <span className="cursor-blink text-[var(--amber)]">█</span>
                )}
              </p>
            </div>
          </div>

          {/* Line 4 — SAME style as Line 1 (muted, subheading) */}
          <div
            className="relative"
            style={{ opacity: line3Done ? 1 : 0, transition: "opacity 300ms" }}
          >
            <InvisibleSizer
              lines={LINE4}
              className="text-subheading leading-relaxed"
            />
            <div className="absolute inset-0">
              {line4Display.map((line, i) => (
                <p
                  key={i}
                  className="text-subheading text-[var(--text-secondary)] leading-relaxed"
                >
                  {line}
                  {i === line4CursorIdx && (
                    <span className="cursor-blink text-[var(--text-secondary)]">
                      █
                    </span>
                  )}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden border-b border-[var(--border-default)]">
        <div className="text-[var(--text-tertiary)] text-caption font-mono whitespace-nowrap select-none text-center py-1 opacity-60">
          {BATTLEMENT}
        </div>
      </div>
    </section>
  );
}
