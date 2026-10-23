"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * How far the page has scrolled through a held section: 0 as it takes hold,
 * 1 as it lets go. The section is the tall element whose child sticks; while
 * the child is held, the page scrolls through the section's extra height.
 * Calls `onProgress` once per frame while the page moves, never in between.
 */
export function useHeldProgress(
  section: RefObject<HTMLElement | null>,
  onProgress: (progress: number, held: boolean) => void,
  enabled = true,
) {
  const listener = useRef(onProgress);
  useEffect(() => {
    listener.current = onProgress;
  });

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const element = section.current;
      if (!element) return;
      const box = element.getBoundingClientRect();
      const room = Math.max(1, box.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -box.top / room));
      listener.current(progress, box.top <= 1 && box.bottom >= window.innerHeight - 1);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [section, enabled]);
}

/**
 * A slim rail that shows how far the page has scrolled through a held
 * section, so a section that holds still never looks frozen: its fill grows
 * with the scroll, and one mark per part lights as the scroll reaches that
 * part. Only transforms and one attribute change while scrolling, never
 * layout. Any held or scroll-driven section can use it.
 */
export function ScrollRail({
  section,
  marks,
  label,
  className,
}: {
  /** the tall section the page scrolls through while its content is held */
  section: RefObject<HTMLElement | null>;
  /** how many parts the scroll is cut into; a mark lights at the start of each */
  marks: number;
  label: string;
  className?: string;
}) {
  const fillRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const percent = useRef(-1);

  useHeldProgress(section, (progress) => {
    fillRef.current?.style.setProperty("transform", `scaleX(${progress})`);
    const root = rootRef.current;
    if (!root) return;
    const now = Math.round(progress * 100);
    if (now !== percent.current) {
      percent.current = now;
      root.setAttribute("aria-valuenow", String(now));
    }
    root.querySelectorAll<HTMLElement>(".rail-mark").forEach((mark, index) => {
      const reached = progress >= index / marks - 0.001 ? "true" : "false";
      if (mark.dataset.reached !== reached) mark.dataset.reached = reached;
    });
  });

  return (
    <div
      ref={rootRef}
      className={`rail${className ? ` ${className}` : ""}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <span className="rail-track">
        <span ref={fillRef} className="rail-fill" />
      </span>
      {Array.from({ length: marks }, (_, index) => (
        <span
          key={index}
          className="rail-mark"
          data-reached={index === 0 ? "true" : "false"}
          style={{ insetInlineStart: `${(index / marks) * 100}%` }}
        />
      ))}
    </div>
  );
}
