import { Art } from "@/components/art";
import { DocHead } from "@/components/docs/doc-parts";
import { EmptyState } from "@/components/fairtrade-client";
import { formatPostDate, POSTS } from "@/lib/blog";
import { metadataForRoute } from "@/lib/projects";
import { FileText } from "@peasant-labs/fairtrade/icons";
import Link from "next/link";

const LEDE = "Essays about data labour.";

export const metadata = metadataForRoute({
  title: "blog | peasant",
  description: LEDE,
  canonical: "/blog",
});

export default function BlogIndex() {
  // the docs pages' frame, so the list starts on their left edge; nothing sits in the "on this page" column
  return (
    <main id="content" className="dx-page" tabIndex={-1}>
      <DocHead title="blog" lede={LEDE} columns />
      <div className="dx-columns">
        <div className="dx-article">
          {POSTS.length === 0 ? (
            <EmptyState
              as="h2"
              icon={FileText}
              title="nothing published yet"
              message="Posts will appear here as they are written."
              action={
                <Link className="site-link" href="/docs">
                  read the docs
                </Link>
              }
            />
          ) : (
            <div className="dx-guides bx-posts">
              {POSTS.map((post) => (
                <Link key={post.slug} className="dx-guide bx-post" href={`/blog/${post.slug}`}>
                  <Art art={post.art} className="dx-pic bx-post-art" />
                  <span className="dx-guide-text">
                    <span className="dx-meta">
                      {post.kind} · <time dateTime={post.published}>{formatPostDate(post.published)}</time>
                    </span>
                    <h2 className="dx-guide-title dx-authored">{post.title}</h2>
                    <span className="dx-guide-desc">{post.summary}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
