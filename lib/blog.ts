import type { Art } from "@/lib/landing";

/**
 * The blog's posts, newest first. A post is listed here and has a body in
 * content/blog/<slug>.tsx; the index shows a quiet empty state when the list
 * is empty. Drafts never appear here.
 */
export type Post = Readonly<{
  slug: string;
  title: string;
  description: string;
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
      "Why the transcripts our coding agents produce belong to the people who made them, and why we are building tools to share them on their terms.",
    kind: "essay",
    published: "2026-05-20",
    art: {
      light: "/art/hero-light.png",
      dark: "/art/hero-dark.png",
      alt: "a dithered wheat field, one stalk lit amber among the rest",
      width: 1200,
      height: 512,
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
