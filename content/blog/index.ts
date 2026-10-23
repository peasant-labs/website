import type { ComponentType } from "react";
import ReclaimingDataAutonomy, { ESSAY_TEXT } from "./reclaiming-data-autonomy-as-a-peasant";

/**
 * Every listed post's body, and the words it shows for the docs search. A post
 * in lib/blog.ts without a body here is a 404.
 */
export const POST_BODIES: Readonly<Record<string, { Body: ComponentType; text: readonly string[] }>> = {
  "reclaiming-data-autonomy-as-a-peasant": { Body: ReclaimingDataAutonomy, text: ESSAY_TEXT },
};

/* a reader's pace for the reading-time estimate, in words a minute */
const WORDS_PER_MINUTE = 220;

/** a post's reading time in whole minutes, counted from the words it shows */
export function readingMinutes(slug: string): number {
  const words = (POST_BODIES[slug]?.text ?? []).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
