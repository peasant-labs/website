"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Where the published transcript's window stands: inside the page, with room
 * around it. The first time a fifth of it comes into view it slides in a
 * little from the right; only transform and opacity move, and without motion
 * it is simply there.
 */
export function SessionStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setEntered(true);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="lp-session-stage" data-entered={entered ? "true" : "false"}>
      {children}
    </div>
  );
}
