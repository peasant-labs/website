import type { TocItem } from "@/lib/docs-content";
import type { ComponentType } from "react";
import ReclaimingDataAutonomy, { ESSAY_TEXT } from "./reclaiming-data-autonomy-as-a-peasant";

/**
 * Every listed post's body, the words it shows for the docs search, and its
 * "on this page" list: one line for each h2 and h3 the body draws, with the
 * heading's id, in page order (a test reads the page to hold the two equal). A
 * post in lib/blog.ts without a body here is a 404.
 */
export const POST_BODIES: Readonly<
  Record<string, { Body: ComponentType; text: readonly string[]; toc: readonly TocItem[] }>
> = {
  // the essay runs as one piece with no headings
  "reclaiming-data-autonomy-as-a-peasant": { Body: ReclaimingDataAutonomy, text: ESSAY_TEXT, toc: [] },
};

/* a reader's pace for the reading-time estimate, in words a minute */
const WORDS_PER_MINUTE = 220;

/** a post's reading time in whole minutes, counted from the words it shows */
export function readingMinutes(slug: string): number {
  const words = (POST_BODIES[slug]?.text ?? []).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
