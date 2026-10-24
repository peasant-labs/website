import { SiteShell } from "@/components/site-shell";
import { VISION } from "@/lib/landing";
import { metadataForRoute } from "@/lib/projects";
import Link from "next/link";

export const metadata = metadataForRoute({
  title: "about | peasant",
  description: "who we are and what peasant is for.",
  canonical: "/about",
});

/**
 * Why we build peasant, in the owner's words: the statement the landing ends
 * on, its lead line as the page's heading, then a pointer to the blog.
 */
export default function AboutPage() {
  return (
    <SiteShell>
      <main id="content" className="pj-main" tabIndex={-1}>
        <header className="pj-catalog-hero">
          <div className="pj-hero-copy">
            {/* why, in the owner's words: the same statement the landing ends on */}
            <div className="pj-vision" data-reading-text>
              <h1 id="project-heading" className="pj-vision-line" tabIndex={-1}>
                {VISION.line}
              </h1>
              {VISION.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="pj-lede" data-reading-text>
              See{" "}
              <Link className="site-link" href="/blog">
                our blog
              </Link>{" "}
              for the long version.
            </p>
          </div>
        </header>
      </main>
    </SiteShell>
  );
}
