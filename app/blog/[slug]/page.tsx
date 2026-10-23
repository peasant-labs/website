import { Art } from "@/components/art";
import { formatPostDate, postBySlug, POSTS } from "@/lib/blog";
import { metadataForRoute } from "@/lib/projects";
import { LOGIN_URL } from "@/lib/site";
import ReclaimingDataAutonomy from "@/content/blog/reclaiming-data-autonomy-as-a-peasant";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";

/* Every listed post has exactly one body; a slug without one is a 404. */
const BODIES: Record<string, ComponentType> = {
  "reclaiming-data-autonomy-as-a-peasant": ReclaimingDataAutonomy,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return {};
  const metadata = metadataForRoute({
    title: `${post.title} | peasant`,
    description: post.description,
    canonical: `/blog/${post.slug}`,
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article" } };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  const Body = post ? BODIES[post.slug] : undefined;
  if (!post || !Body) notFound();

  return (
    <main id="content" className="dx-page" tabIndex={-1}>
      <article className="bx-essay">
        <nav className="dx-crumb" aria-label="breadcrumb">
          <Link href="/blog">blog</Link>
          <span aria-hidden="true"> / </span>
          <span>{post.kind}</span>
        </nav>
        <h1 className="bx-title">{post.title}</h1>
        <p className="bx-meta">
          peasant · <time dateTime={post.published}>{formatPostDate(post.published)}</time>
        </p>
        <Art art={post.art} className="bx-figure" />
        <div className="bx-body prose">
          <Body />
        </div>
        <nav className="dx-pager" aria-label="after this post">
          <Link href="/blog">all posts</Link>
          <a className="btn btn-primary site-btn" href={LOGIN_URL}>
            sign up free
          </a>
        </nav>
      </article>
    </main>
  );
}
