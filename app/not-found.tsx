import { SiteShell } from "@/components/site-shell";
import type { Metadata } from "next";
import Link from "next/link";
import "./not-found.css";

export const metadata: Metadata = {
  title: "page not found | peasant",
  robots: { index: false },
};

/**
 * An address no route answers. It keeps the site's header and footer, in place
 * of Next's default page, which paints its own black or white ground over the
 * theme and offers no way back.
 */
export default function NotFound() {
  return (
    <SiteShell>
      <main id="content" className="pj-main" tabIndex={-1}>
        <header className="pj-catalog-hero">
          <div className="pj-hero-copy">
            <h1 id="project-heading" tabIndex={-1}>
              page not found
            </h1>
            <p className="pj-lede" data-reading-text>
              nothing lives at this address. the link may be mistyped, or the page may have moved.
            </p>
          </div>
          <div className="nf-actions">
            <Link className="btn btn-primary site-btn" href="/">
              back to home
            </Link>
            <Link className="btn btn-secondary site-btn" href="/docs">
              read the docs
            </Link>
          </div>
        </header>
      </main>
    </SiteShell>
  );
}
