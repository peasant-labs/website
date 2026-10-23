"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

const REDUCE = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(onStoreChange: () => void) {
  const query = window.matchMedia(REDUCE);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

/** True when the reader asked for less motion. The server renders the moving version. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(REDUCE).matches,
    () => false,
  );
}

/**
 * True while enough of the element is on screen and the tab is in front. Used
 * to keep motion from running where nobody can see it.
 */
export function useOnScreen(ref: RefObject<Element | null>, threshold = 0.25) {
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold]);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return inView && pageVisible;
}

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
