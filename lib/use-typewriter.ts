"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export function useTypewriter(
  lines: string[],
  options?: {
    charDelayMs?: number;
    lineDelayMs?: number;
    startDelayMs?: number;
    triggerOnView?: boolean;
    loop?: boolean;
    /** When false the animation is paused/not started. Defaults to true. */
    enabled?: boolean;
  }
): {
  displayLines: string[];
  currentLine: number;
  isComplete: boolean;
  ref: React.RefObject<HTMLElement>;
  restart: () => void;
} {
  const {
    charDelayMs = 40,
    lineDelayMs = 300,
    startDelayMs = 0,
    triggerOnView = true,
    loop = false,
    enabled = true,
  } = options ?? {};

  const ref = useRef<HTMLElement>(null!);

  // Stabilize the lines reference so inline arrays don't re-trigger the effect
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const stableLines = useRef(lines);
  if (
    lines.length !== stableLines.current.length ||
    lines.some((l, i) => l !== stableLines.current[i])
  ) {
    stableLines.current = lines;
  }

  const [displayLines, setDisplayLines] = useState<string[]>(() =>
    lines.map(() => "")
  );
  const [currentLine, setCurrentLine] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const hasTriggered = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const animatingRef = useRef(false);

  // Determine if animation should start based on enabled + triggerOnView
  // When enabled becomes true (and triggerOnView is false), start immediately.
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

  // Core typewriter animation
  const currentStableLines = stableLines.current;
  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayLines(currentStableLines.map(() => ""));
      setCurrentLine(0);
      setIsComplete(false);
      return;
    }

    // Prevent double-run in StrictMode
    if (animatingRef.current) return;
    animatingRef.current = true;

    const theLines = currentStableLines;

    const state = {
      lineIndex: 0,
      charIndex: 0,
      builtLines: theLines.map(() => ""),
      cancelled: false,
    };

    const randomizeDelay = (base: number) => {
      const variance = base * 0.3;
      return base + (Math.random() * 2 - 1) * variance;
    };

    const scheduleNext = () => {
      if (state.cancelled) return;

      const { lineIndex, charIndex } = state;

      // All lines done
      if (lineIndex >= theLines.length) {
        setIsComplete(true);
        animatingRef.current = false;

        if (loop) {
          timeoutRef.current = setTimeout(() => {
            if (state.cancelled) return;
            state.lineIndex = 0;
            state.charIndex = 0;
            state.builtLines = theLines.map(() => "");
            setDisplayLines([...state.builtLines]);
            setCurrentLine(0);
            setIsComplete(false);
            animatingRef.current = true;
            scheduleNext();
          }, lineDelayMs * 2);
        }
        return;
      }

      const currentLineText = theLines[lineIndex];

      // Current line is complete
      if (charIndex >= currentLineText.length) {
        state.lineIndex++;
        state.charIndex = 0;
        setCurrentLine(state.lineIndex);
        timeoutRef.current = setTimeout(scheduleNext, lineDelayMs);
        return;
      }

      // Type next character
      state.charIndex++;
      state.builtLines[lineIndex] = currentLineText.slice(0, state.charIndex);
      setDisplayLines([...state.builtLines]);

      const delay = randomizeDelay(charDelayMs);
      timeoutRef.current = setTimeout(scheduleNext, delay);
    };

    // Initial delay before starting
    timeoutRef.current = setTimeout(scheduleNext, startDelayMs);

    return () => {
      state.cancelled = true;
      animatingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shouldAnimate, currentStableLines, charDelayMs, lineDelayMs, startDelayMs, loop]);

  const restart = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    animatingRef.current = false;
    setIsComplete(false);
    setCurrentLine(0);
    setDisplayLines(linesRef.current.map(() => ""));
    setShouldAnimate(false);
    hasTriggered.current = false;
    queueMicrotask(() => {
      setShouldAnimate(true);
    });
  }, []);

  return { displayLines, currentLine, isComplete, ref, restart };
}
