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
 * Who we are and what we make, in a few plain lines; the long account of why
 * is the essay on the blog.
 */
export default function AboutPage() {
  return (
    <SiteShell>
      <main id="content" className="pj-main" tabIndex={-1}>
        <header className="pj-catalog-hero">
          <div className="pj-hero-copy">
            <h1 id="project-heading" tabIndex={-1}>
              about
            </h1>
            <p className="pj-lede" data-reading-text>
              we build peasant, an app that keeps the sessions your coding agents leave on
              your computer, and peasant online, where you publish the ones you choose for
              your team or a research group. both are open source under Apache-2.0.
            </p>
            {/* why, in the owner's words: the same statement the landing ends on */}
            <div className="pj-vision" data-reading-text>
              <p className="pj-vision-line">{VISION.line}</p>
              {VISION.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="pj-lede" data-reading-text>
              the long version is{" "}
              <Link className="site-link" href="/blog/reclaiming-data-autonomy-as-a-peasant">
                the essay on the blog
              </Link>
              .
            </p>
          </div>
        </header>
      </main>
    </SiteShell>
  );
}
