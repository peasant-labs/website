"use client";

import { SiteShell } from "@/components/site-shell";
import { applyTheme, preferredTheme } from "@/lib/theme";
import Link from "next/link";
import { useEffect } from "react";
import "./not-found.css";

/**
 * A page that failed while it rendered. It keeps the site's header and footer
 * and offers a second try, in place of Next's default "application error"
 * screen. The error's own message is never shown.
 *
 * An error while the page hydrates makes React draw the document again from
 * the server's dark default, so the reader's theme is applied once more.
 */
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => applyTheme(preferredTheme(), { persist: false }), []);
  return (
    <SiteShell>
      <title>this page could not load | peasant</title>
      <main id="content" className="pj-main" tabIndex={-1}>
        <header className="pj-catalog-hero">
          <div className="pj-hero-copy">
            <h1 id="project-heading" tabIndex={-1}>
              this page could not load
            </h1>
            <p className="pj-lede" data-reading-text>
              something went wrong while drawing it. try again, or go back to home.
            </p>
          </div>
          <div className="nf-actions">
            <button type="button" className="btn btn-primary site-btn" onClick={() => reset()}>
              try again
            </button>
            <Link className="btn btn-secondary site-btn" href="/">
              back to home
            </Link>
          </div>
        </header>
      </main>
    </SiteShell>
  );
}
