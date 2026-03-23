"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_RANDOM_POOL = "!@#$%^&*()_+-=[]{}|;:,.<>?/~╔═╗║╚╝┌─┐│└┘";

export function useAsciiMorph(
  targetText: string,
  options?: {
    randomPool?: string;
    triggerOnView?: boolean;
    durationMs?: number;
  }
): {
  text: string;
  isComplete: boolean;
  ref: React.RefObject<HTMLElement>;
  restart: () => void;
} {
  const {
    randomPool = DEFAULT_RANDOM_POOL,
    triggerOnView = true,
    durationMs = 2400,
  } = options ?? {};

  const ref = useRef<HTMLElement>(null!);
  const [text, setText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(!triggerOnView);

  const animFrameRef = useRef<number>(0);
  const hasTriggered = useRef(false);
  const landTimesRef = useRef<number[]>([]);

  useEffect(() => {
    if (!triggerOnView) return;
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
    return () => observer.disconnect();
  }, [triggerOnView]);

  // Generate random landing times once per targetText
  useEffect(() => {
    const chars = targetText.split("");
    // Each non-space char gets a random landing time in the last 40% of duration
    // This means: first 60% is pure shuffle, then chars start locking in staggered
    const shufflePhase = durationMs * 0.2;
    const landingWindow = durationMs - shufflePhase;

    // Compute column position for each char (left-to-right reveal)
    // For multi-line text, column = position within the current line
    const lines = targetText.split("\n");
    const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
    let charIdx = 0;
    const colPositions: number[] = [];
    for (const line of lines) {
      for (let c = 0; c < line.length; c++) {
        colPositions[charIdx] = c;
        charIdx++;
      }
      colPositions[charIdx] = 0; // newline char
      charIdx++;
    }

    landTimesRef.current = chars.map((ch, i) => {
      if (ch === " " || ch === "\n") return 0;
      // Column-based: chars on the left land first, right land last
      const col = colPositions[i] ?? 0;
      const colRatio = col / maxLineLen;
      const jitter = (Math.random() - 0.5) * 0.08;
      return (
        shufflePhase +
        Math.max(0, Math.min(1, colRatio + jitter)) * landingWindow
      );
    });
  }, [targetText, durationMs]);

  // Core animation
  useEffect(() => {
    if (!shouldAnimate) {
      setText(targetText.replace(/[^ \n]/g, " "));
      return;
    }

    const chars = targetText.split("");
    const landTimes = landTimesRef.current;
    const shuffleIntervalMs = 500; // change random chars ~2x per second

    let startTime: number | null = null;
    let lastFrame = -1;
    let cachedRandoms: string[] = chars.map(() => " ");

    const pickRandom = () =>
      randomPool[Math.floor(Math.random() * randomPool.length)];

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed >= durationMs) {
        setText(targetText);
        setIsComplete(true);
        return;
      }

      // Only regenerate random chars when frame counter advances
      const frame = Math.floor(elapsed / shuffleIntervalMs);
      if (frame !== lastFrame) {
        lastFrame = frame;
        cachedRandoms = chars.map((ch) =>
          ch === " " || ch === "\n" ? ch : pickRandom()
        );
      }

      const display = chars
        .map((ch, i) => {
          if (ch === " " || ch === "\n") return ch;
          if (elapsed >= landTimes[i]) return ch;
          // Still shuffling — use cached random (only changes on frame tick)
          return cachedRandoms[i];
        })
        .join("");

      setText(display);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [shouldAnimate, targetText, durationMs, randomPool]);

  const restart = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsComplete(false);
    setShouldAnimate(false);
    hasTriggered.current = false;
    queueMicrotask(() => setShouldAnimate(true));
  }, []);

  return { text, isComplete, ref, restart };
}
