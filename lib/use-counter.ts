"use client";

import { useRef, useState, useEffect, useCallback } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function formatNumber(
  value: number,
  decimals: number,
  prefix: string,
  suffix: string
): string {
  const fixed = value.toFixed(decimals);

  // Split into integer and decimal parts
  const [intPart, decPart] = fixed.split(".");

  // Add commas for thousands
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const formatted = decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;

  return `${prefix}${formatted}${suffix}`;
}

export function useCounter(
  target: number,
  options?: {
    durationMs?: number;
    triggerOnView?: boolean;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    /** When false the animation is paused/not started. Defaults to true. */
    enabled?: boolean;
  }
): {
  display: string;
  isComplete: boolean;
  ref: React.RefObject<HTMLElement>;
} {
  const {
    durationMs = 1500,
    triggerOnView = true,
    decimals = 0,
    prefix = "",
    suffix = "",
    enabled = true,
  } = options ?? {};

  const ref = useRef<HTMLElement>(null!);
  const [display, setDisplay] = useState(() =>
    formatNumber(0, decimals, prefix, suffix)
  );
  const [isComplete, setIsComplete] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const hasTriggered = useRef(false);
  const animFrameRef = useRef<number>(0);

  // When enabled becomes true and triggerOnView is false, start immediately
  useEffect(() => {
    if (!enabled) return;
    if (!triggerOnView) {
      setShouldAnimate(true);
    }
  }, [enabled, triggerOnView]);

  // IntersectionObserver for triggerOnView
  useEffect(() => {
    if (!triggerOnView || !enabled) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          setShouldAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [triggerOnView, enabled]);

  // Core counter animation
  useEffect(() => {
    if (!shouldAnimate) {
      setDisplay(formatNumber(0, decimals, prefix, suffix));
      setIsComplete(false);
      return;
    }

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutCubic(progress);
      const currentValue = easedProgress * target;

      setDisplay(formatNumber(currentValue, decimals, prefix, suffix));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(formatNumber(target, decimals, prefix, suffix));
        setIsComplete(true);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [shouldAnimate, target, durationMs, decimals, prefix, suffix]);

  return { display, isComplete, ref };
}
