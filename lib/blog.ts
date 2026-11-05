import type { Art } from "@/lib/landing";

/**
 * The blog's posts, newest first. A post is listed here and has a body in
 * content/blog/<slug>.tsx; the index shows a quiet empty state when the list
 * is empty. Drafts never appear here.
 */
export type Post = Readonly<{
  slug: string;
  title: string;
  /* the post's own first sentence, for search engines and link cards */
  description: string;
  /* what the index shows under the title: the post's own summary, verbatim */
  summary: string;
  kind: string;
  /* who wrote it, as the byline names them */
  author: string;
  /* ISO date the post was first published: on this site, or where a guest post first appeared */
  published: string;
  /*
   * where a guest post first appeared: the byline credits it and the page's
   * canonical address points there, so search engines credit the original
   */
  origin?: Readonly<{ name: string; href: string }>;
  /* the picture on the post's card in the blog index; the post itself opens with its words */
  art: Art;
}>;

const DATA_LEVERAGE = "Data Leverage";

/* a post's picture: one of the site's light and dark pairs, at the blog's 4:3 */
function art(name: string, alt: string): Art {
  return { light: `/art/${name}-light.png`, dark: `/art/${name}-dark.png`, alt, width: 704, height: 528 };
}

export const POSTS: readonly Post[] = [
  {
    slug: "reclaiming-data-autonomy-as-a-peasant",
    title: "Reclaiming Data Autonomy as a Peasant",
    description:
      "We are developing the suite of tools required to safely share and manage access to transcripts produced by coding agent sessions.",
    summary:
      "We are developing the suite of tools required to safely share and manage access to transcripts produced by coding agent sessions. While others are developing similar tools, our tools are designed to be local-first, prioritizing the user’s autonomy with explicit opt-ins at network boundaries; and to provide fine-grained access controls at low friction, with sane defaults and settings profiles for varying levels of complexity.",
    kind: "essay",
    author: "David Huu Pham",
    published: "2026-05-20",
    art: {
      light: "/art/p-open-light.png",
      dark: "/art/p-open-dark.png",
      alt: "an open wooden farm gate",
      width: 704,
      height: 528,
    },
  },
  {
    slug: "a-short-guide-to-data-strikes",
    title: "A Short Guide to Data Strikes and Conscious Data Contribution in the Context of 2026 Frontier AI",
    description:
      "This post will attempt to restate some of the basic arguments of data leverage in the context of (1) developments in the AI space and (2) a series of events involving Anthropic, OpenAI, and US public bodies that coincided with a notable public response.",
    summary: "Back to the basics of data leverage.",
    kind: "guest essay",
    author: "Nick Vincent",
    published: "2026-03-03",
    origin: { name: DATA_LEVERAGE, href: "https://dataleverage.substack.com/p/a-short-guide-to-data-strikes-and" },
    art: art("uc-bell", "an amber town crier's handbell"),
  },
  {
    slug: "the-coding-agent-data-deal",
    title: "The Coding Agent Data Deal",
    description: "This is a follow-up to my previous post about coding agents, focused on data implications.",
    summary: "On user data control, coding agents as retrievers, and the value of your coding transcripts",
    kind: "guest essay",
    author: "Nick Vincent",
    published: "2026-01-12",
    origin: { name: DATA_LEVERAGE, href: "https://dataleverage.substack.com/p/the-coding-agent-data-deal" },
    art: art("uc-scroll", "a written scroll with an amber wax seal"),
  },
  {
    slug: "coding-agents-are-a-big-deal",
    title:
      "Coding agents are (1) a big deal, (2) very relevant to data leverage, and (3) able to help build tools that support data leverage!",
    description:
      "In December 2025 there was a fresh wave of hype about LLM agents, especially the use of Anthropic’s Opus 4.5 model in conjunction with the “Claude Code” software.",
    summary: "Sharing an early reaction to recent coding agent discourse and two relevant projects",
    kind: "guest essay",
    author: "Nick Vincent",
    published: "2026-01-05",
    origin: { name: DATA_LEVERAGE, href: "https://dataleverage.substack.com/p/coding-agents-are-1-a-big-deal-2" },
    art: art("uc-lens", "an amber magnifying glass held up to a page"),
  },
];

export function postBySlug(slug: string): Post | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export function formatPostDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${iso}T00:00:00Z`))
    .toLowerCase();
}
