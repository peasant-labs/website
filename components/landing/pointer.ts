import { POINTER_TIP } from "@/components/mac";

export type Point = Readonly<{ x: number; y: number }>;

/* a move across a window, and the settle a press springs back with: the scenes' own curves */
export const EASE_MOVE = "cubic-bezier(0.77, 0, 0.175, 1)";
export const EASE_SETTLE = "cubic-bezier(0.23, 1, 0.32, 1)";

/** A press: the arrow dips toward its tip and the control gives way under it, with nothing drawn around either. */
export const PRESS = { duration: 240, arrow: 0.82, control: 0.97 } as const;

/** The transform that puts the tip of a pointer `size` px across on a point. */
export function pointAt(point: Point, size: number) {
  return `translate(${point.x - POINTER_TIP.x * size}px, ${point.y - POINTER_TIP.y * size}px)`;
}

/**
 * Keyframes for a hand's path from one point to another: a shallow arc, bowed
 * to one side by `bow` of its length, never a ruler line. The keyframes are
 * spread evenly along the curve, so the animation's easing is the hand's pace.
 */
export function arc(from: Point, to: Point, size: number, bow = 0.16, steps = 24): Keyframe[] {
  const bend = {
    x: (from.x + to.x) / 2 - (to.y - from.y) * bow,
    y: (from.y + to.y) / 2 + (to.x - from.x) * bow,
  };
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const [a, b, c] = [(1 - t) * (1 - t), 2 * (1 - t) * t, t * t];
    return {
      transform: pointAt({ x: a * from.x + b * bend.x + c * to.x, y: a * from.y + b * bend.y + c * to.y }, size),
    };
  });
}
