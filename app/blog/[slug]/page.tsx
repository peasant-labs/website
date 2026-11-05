import { DocHead, DocJump } from "@/components/docs/doc-parts";
import { OnThisPage } from "@/components/docs/on-this-page";
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
  // a guest post's canonical address is where it first appeared, so search engines credit the original
  const alternates = post.origin ? { ...metadata.alternates, canonical: post.origin.href } : metadata.alternates;
  return {
    ...metadata,
    alternates,
    authors: [{ name: post.author }],
    openGraph: { ...metadata.openGraph, type: "article", authors: [post.author], publishedTime: post.published },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  const body = post ? POST_BODIES[post.slug] : undefined;
  if (!post || !body) notFound();
  const { Body, toc } = body;

  // the docs pages' frame: "on this page" beside the post, its column kept even when the post has no headings
  return (
    <main id="content" className="dx-page" tabIndex={-1}>
      <DocHead
        crumb={{ label: "blog", href: "/blog", here: post.kind }}
        title={post.title}
        authored
        meta={
          <>
            by <span className="bx-author">{post.author}</span>,{" "}
            <time dateTime={post.published}>{formatPostDate(post.published)}</time>, {readingMinutes(post.slug)} min
            read
          </>
        }
        columns
      />
      {toc.length > 0 ? <DocJump items={toc} /> : null}
      <div className="dx-columns">
        <div className="dx-article">
          <article className="dx-prose" aria-labelledby="page-heading">
            {post.origin ? (
              <p className="bx-origin">
                first published on{" "}
                <a className="dx-link" href={post.origin.href} target="_blank" rel="noopener noreferrer">
                  {post.origin.name}
                </a>
                , republished here as a guest post
              </p>
            ) : null}
            <Body />
          </article>
          <nav className="dx-pager" aria-label="after this post">
            <Link href="/blog">all posts</Link>
            <a className="btn btn-primary site-btn" href={LOGIN_URL}>
              sign up free
            </a>
          </nav>
        </div>
        {toc.length > 0 ? (
          <aside className="dx-aside">
            <OnThisPage items={toc} />
          </aside>
        ) : null}
      </div>
    </main>
  );
}
