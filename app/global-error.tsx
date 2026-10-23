"use client";

import { Mark } from "@/components/mark";
import { THEME_SCRIPT, applyTheme, preferredTheme } from "@/lib/theme";
import { useEffect } from "react";
import "@peasant-labs/fairtrade/tokens.css";
import "@peasant-labs/fairtrade/base.css";
import "@peasant-labs/fairtrade/components.css";
import "./globals.css";
import "./site.css";
import "./not-found.css";

/* The fallback replaces the root layout, so it mounts the font stylesheet itself. */
/* eslint-disable @next/next/no-page-custom-font */

/**
 * The last fallback: the root layout itself failed, so this replaces the whole
 * document. It brings its own fonts, styles and theme rather than the
 * header and footer, which may be what failed. The error's message is never
 * shown. The head script runs only when the server draws this page, so the
 * theme is applied again once it mounts.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => applyTheme(preferredTheme(), { persist: false }), []);
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <title>something went wrong | peasant</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Atkinson+Hyperlegible+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="site-root">
        <main id="content" className="pj-main" tabIndex={-1}>
          <header className="pj-catalog-hero">
            <span className="site-brand">
              <Mark className="site-brand-mark" />
              peasant
            </span>
            <div className="pj-hero-copy">
              <h1 tabIndex={-1}>peasant could not load</h1>
              <p className="pj-lede">something went wrong before the page could draw. try again in a moment.</p>
            </div>
            <div className="nf-actions">
              <button type="button" className="btn btn-primary site-btn" onClick={() => reset()}>
                try again
              </button>
              {/* a full load: the client router is part of what failed */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a className="btn btn-secondary site-btn" href="/">
                back to home
              </a>
            </div>
          </header>
        </main>
      </body>
    </html>
  );
}
