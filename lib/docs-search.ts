import { POST_BODIES } from "@/content/blog";
import { POSTS } from "@/lib/blog";
import { DOCS_GUIDES, DOCS_HOME, DOCS_HOME_SECTIONS, DOCS_START } from "@/lib/docs-content";
import { GUIDES, type DocBlock } from "@/lib/docs-guides";

/**
 * The docs search index: one entry per page and per section, built from the
 * same data the pages draw, so search can never describe a page that says
 * something else. It is served as one static JSON file at build
 * (app/docs/search-index.json) and loaded the first time search opens.
 */
export type SearchDoc = Readonly<{
  /** unique: the address it opens */
  id: string;
  /** the page's title, e.g. "docs" or "run an agent eval" */
  page: string;
  /** the section's title, and any headings inside it */
  heading: string;
  /** the words a reader sees in the section, marks removed */
  text: string;
  href: string;
}>;

export type SearchIndex = Readonly<{ version: 1; docs: readonly SearchDoc[] }>;

/** copy text as a reader sees it: `code`, **control** and [label](href) without their marks */
export function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

const SKIP = new Set(["id", "toc", "title", "brand", "category", "href", "art"]);

/** every string under a value, in order; `title` keys are collected as headings instead */
function collect(value: unknown, words: string[], headings: string[]) {
  if (typeof value === "string") {
    words.push(plain(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collect(item, words, headings);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key === "title" && typeof item === "string") headings.push(item);
      else if (!SKIP.has(key)) collect(item, words, headings);
    }
  }
}

function blockWords(blocks: readonly DocBlock[]): string[] {
  const words: string[] = [];
  collect(blocks, words, []);
  return words;
}

export function buildSearchIndex(): SearchIndex {
  const docs: SearchDoc[] = [];

  // the overview: its header and starting points, then each section
  docs.push({
    id: "/docs",
    page: DOCS_HOME.title,
    heading: DOCS_HOME.title,
    text: [DOCS_HOME.lede, ...DOCS_START.flatMap((start) => [start.title, plain(start.summary)])].join(" "),
    href: "/docs",
  });
  for (const section of DOCS_HOME_SECTIONS) {
    const words: string[] = [];
    const headings: string[] = [];
    const { title, ...rest } = section;
    collect(rest, words, headings);
    docs.push({
      id: `/docs#${section.id}`,
      page: DOCS_HOME.title,
      heading: [title, ...headings].join(" · "),
      text: words.join(" "),
      href: `/docs#${section.id}`,
    });
  }

  // the guides: the header, then each step
  for (const guide of GUIDES) {
    const card = DOCS_GUIDES.find((item) => item.id === guide.id)!;
    docs.push({ id: card.href, page: card.title, heading: card.title, text: guide.lede, href: card.href });
    for (const step of guide.steps) {
      docs.push({
        id: `${card.href}#${step.id}`,
        page: card.title,
        heading: step.title,
        text: blockWords(step.body).join(" "),
        href: `${card.href}#${step.id}`,
      });
    }
  }

  // the blog: each post, whole
  for (const post of POSTS) {
    const body = POST_BODIES[post.slug]?.text ?? [];
    docs.push({
      id: `/blog/${post.slug}`,
      page: "blog",
      heading: post.title,
      text: [post.summary, ...body.map(plain)].join(" "),
      href: `/blog/${post.slug}`,
    });
  }

  return { version: 1, docs };
}
