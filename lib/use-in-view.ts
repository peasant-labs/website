"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export function useInView(options?: {
  threshold?: number;
  once?: boolean;
  rootMargin?: string;
}): {
  ref: React.RefObject<HTMLElement>;
  isInView: boolean;
} {
  const { threshold = 0, once = true, rootMargin = "0px" } = options ?? {};
  const ref = useRef<HTMLElement>(null!);
  const [isInView, setIsInView] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (once && triggered.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        if (inView) {
          setIsInView(true);
          if (once) {
            triggered.current = true;
            observer.disconnect();
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once]);

  return { ref, isInView };
}
