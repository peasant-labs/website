import type { ReactNode } from "react";

/*
 * The scenes' rule for change: nothing appears, disappears or moves in one
 * frame. Two states of one spot are both mounted and crossfade (Swap); a part
 * that comes and goes stays mounted and fades (Reveal), so nothing around it
 * reflows; a part that mounts later rises in (the scn-in class); and a part
 * that is pushed along by new content glides there (data-flip, which the
 * stage animates). The motion itself lives in app/landing.css, under
 * prefers-reduced-motion: no-preference, so a reduced-motion still is static.
 */

/** Several states of one spot, all mounted in one grid cell; the one at `on` shows. */
export function Swap({ on, className, children }: { on: number; className?: string; children: ReactNode[] }) {
  return (
    <span className={`scn-swap${className ? ` ${className}` : ""}`}>
      {children.map((child, index) => (
        <span key={index} className="scn-swap-item" data-on={index === on ? "true" : "false"}>
          {child}
        </span>
      ))}
    </span>
  );
}

/** A part that keeps its place while hidden, so showing it moves nothing else. */
export function Reveal({ on, className, children }: { on: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={`scn-reveal${className ? ` ${className}` : ""}`} data-on={on ? "true" : "false"}>
      {children}
    </div>
  );
}

/** Scene cues for typing `text` one character at a time from `at`, phase `from` onwards. */
export function typing(text: string, at: number, from: number, every = 75) {
  return Array.from(text, (_, index) => ({ at: at + index * every, phase: from + index }));
}
