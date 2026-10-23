import { Art } from "@/components/art";
import { DocHead } from "@/components/docs/doc-parts";
import { POST_BODIES, readingMinutes } from "@/content/blog";
import { formatPostDate, postBySlug, POSTS } from "@/lib/blog";
import { metadataForRoute } from "@/lib/projects";
import { LOGIN_URL } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  const Body = post ? POST_BODIES[post.slug]?.Body : undefined;
  if (!post || !Body) notFound();

  return (
    <main id="content" className="dx-page" tabIndex={-1}>
      <DocHead
        crumb={{ label: "blog", href: "/blog", here: post.kind }}
        title={post.title}
        authored
        meta={
          <>
            peasant · <time dateTime={post.published}>{formatPostDate(post.published)}</time> ·{" "}
            {readingMinutes(post.slug)} min read
          </>
        }
      />
      <article className="dx-prose" aria-labelledby="page-heading">
        <Art art={post.art} className="dx-pic bx-figure" />
        <Body />
      </article>
      <nav className="dx-pager" aria-label="after this post">
        <Link href="/blog">all posts</Link>
        <a className="btn btn-primary site-btn" href={LOGIN_URL}>
          sign up free
        </a>
      </nav>
    </main>
  );
}
