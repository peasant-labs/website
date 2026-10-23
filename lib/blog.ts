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
  /* ISO date the post was first published on this site */
  published: string;
  art: Art;
}>;

export const POSTS: readonly Post[] = [
  {
    slug: "reclaiming-data-autonomy-as-a-peasant",
    title: "Reclaiming Data Autonomy as a Peasant",
    description:
      "We are developing the suite of tools required to safely share and manage access to transcripts produced by coding agent sessions.",
    summary:
      "We are developing the suite of tools required to safely share and manage access to transcripts produced by coding agent sessions. While others are developing similar tools, our tools are designed to be local-first, prioritizing the user’s autonomy with explicit opt-ins at network boundaries; and to provide fine-grained access controls at low friction, with sane defaults and settings profiles for varying levels of complexity.",
    kind: "essay",
    published: "2026-05-20",
    art: {
      light: "/art/p-open-light.png",
      dark: "/art/p-open-dark.png",
      alt: "an open wooden farm gate",
      width: 704,
      height: 528,
    },
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
