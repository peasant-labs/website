import { RevealOnView } from "@/components/reveal";
import { ThemeSync } from "@/components/theme-toggle";
import { site } from "@/lib/site";
import { ONLINE_HINT_SCRIPT } from "@/lib/online-session";
import { THEME_SCRIPT } from "@/lib/theme";
import type { Metadata, Viewport } from "next";
import "@peasant-labs/fairtrade/tokens.css";
import "@peasant-labs/fairtrade/base.css";
import "@peasant-labs/fairtrade/components.css";
import "./globals.css";
import "./site.css";

/* App Router mounts the canonical font stylesheet once from this root head. */
/* eslint-disable @next/next/no-page-custom-font */

export const metadata: Metadata = {
  // resolves the generated og / twitter images to absolute urls
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  keywords: [
    "peasantlabs",
    "peasant",
    "village",
    "agent sessions",
    "agent transcripts",
    "coding agents",
    "data commons",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: site.title,
    description: site.tagline,
    type: "website",
    url: site.url,
    siteName: site.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.tagline,
  },
  // og:image / twitter:image are wired automatically from
  // app/opengraph-image.tsx and app/twitter-image.tsx
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070706" },
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Atkinson+Hyperlegible+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: ONLINE_HINT_SCRIPT }} />
      </head>
      <body className="site-root">
        <a href="#content" className="site-skip-link">
          skip to content
        </a>
        <ThemeSync />
        {children}
        <RevealOnView />
      </body>
    </html>
  );
}
