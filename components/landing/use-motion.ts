"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

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
