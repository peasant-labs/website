import { SiteShell } from "@/components/site-shell";
import { metadataForRoute } from "@/lib/projects";
import Link from "next/link";

export const metadata = metadataForRoute({
  title: "about | peasant labs",
  description: "who peasant labs is and what the tools are for.",
  canonical: "/about",
});

/**
 * A destination the header promises but the copy has not filled yet. It exists
 * so the nav link lands somewhere honest rather than on a 404.
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
              peasant labs builds the tools for keeping the sessions your coding agents
              leave behind, and for publishing only the ones you choose. the full account
              of why is in{" "}
              <Link className="site-link" href="/blog/reclaiming-data-autonomy-as-a-peasant">
                the essay on the blog
              </Link>
              ; this page will carry the shorter one.
            </p>
          </div>
        </header>
      </main>
    </SiteShell>
  );
}
