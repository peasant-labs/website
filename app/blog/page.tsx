import { Art } from "@/components/art";
import { DocHead } from "@/components/docs/doc-parts";
import { EmptyState } from "@/components/fairtrade-client";
import { formatPostDate, POSTS } from "@/lib/blog";
import { metadataForRoute } from "@/lib/projects";
import { FileText } from "@peasant-labs/fairtrade/icons";
import Link from "next/link";

const LEDE = "Essays on who owns the data that agent work produces.";

export const metadata = metadataForRoute({
  title: "blog | peasant",
  description: LEDE,
  canonical: "/blog",
});

export default function BlogIndex() {
  return (
    <main id="content" className="dx-page" tabIndex={-1}>
      <DocHead title="blog" lede={LEDE} />
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
        <div className="bx-posts">
          {POSTS.map((post) => (
            <Link key={post.slug} className="bx-post" href={`/blog/${post.slug}`}>
              <Art art={post.art} className="bx-post-art" />
              <span className="bx-meta">
                {post.kind} · <time dateTime={post.published}>{formatPostDate(post.published)}</time>
              </span>
              <h2 className="bx-post-title">{post.title}</h2>
              <p className="bx-post-desc">{post.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
