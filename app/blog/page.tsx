import { SiteShell } from "@/components/site-shell";
import { UnderConstruction } from "@/components/under-construction";
import { metadataForRoute } from "@/lib/projects";

export const metadata = metadataForRoute({
  title: "blog | peasant labs",
  description: "notes on the transcript commons — not published yet.",
  canonical: "/blog",
});

/**
 * A destination the header promises but the writing has not filled yet. It
 * exists so the nav link lands somewhere honest rather than on a 404.
 */
export default function BlogPage() {
  return (
    <SiteShell>
      <main id="content" className="pj-main" tabIndex={-1}>
        <UnderConstruction />

        <header className="pj-catalog-hero">
          <div className="pj-hero-copy">
            <h1 id="project-heading" tabIndex={-1}>
              blog
            </h1>
            <p className="pj-lede" data-reading-text>
              nothing published here yet. the essay on the transcript commons is on the
              front page, and posts will land here as the work does.
            </p>
          </div>
        </header>
      </main>
    </SiteShell>
  );
}
