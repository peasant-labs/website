import type { TocItem } from "@/lib/docs-content";
import type { ComponentType } from "react";
import { EssayBody } from "@/components/blog/essay";
import { type Essay, essayText, essayToc } from "@/lib/essay";
import { STRIKES } from "./a-short-guide-to-data-strikes";
import { BIG_DEAL } from "./coding-agents-are-a-big-deal";
import ReclaimingDataAutonomy, { ESSAY_TEXT, ESSAY_TOC } from "./reclaiming-data-autonomy-as-a-peasant";
import { DATA_DEAL } from "./the-coding-agent-data-deal";

/** a post written as data (lib/essay.ts): its body, words and "on this page" all come from the one value */
function essay(value: Essay) {
  return {
    Body: function Essay() {
      return <EssayBody essay={value} />;
    },
    text: essayText(value),
    toc: essayToc(value),
  };
}

/**
 * Every listed post's body, the words it shows for the docs search, and its
 * "on this page" list: one line for each h2 and h3 the body draws, with the
 * heading's id, in page order (a test reads the page to hold the two equal). A
 * post in lib/blog.ts without a body here is a 404.
 */
export const POST_BODIES: Readonly<
  Record<string, { Body: ComponentType; text: readonly string[]; toc: readonly TocItem[] }>
> = {
  "reclaiming-data-autonomy-as-a-peasant": { Body: ReclaimingDataAutonomy, text: ESSAY_TEXT, toc: ESSAY_TOC },
  "a-short-guide-to-data-strikes": essay(STRIKES),
  "the-coding-agent-data-deal": essay(DATA_DEAL),
  "coding-agents-are-a-big-deal": essay(BIG_DEAL),
};

/* a reader's pace for the reading-time estimate, in words a minute */
const WORDS_PER_MINUTE = 220;

/** a post's reading time in whole minutes, counted from the words it shows */
export function readingMinutes(slug: string): number {
  const words = (POST_BODIES[slug]?.text ?? []).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
