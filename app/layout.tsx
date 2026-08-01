import { site } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "@peasant-labs/fairtrade/tokens.css";
import "@peasant-labs/fairtrade/base.css";
import "@peasant-labs/fairtrade/components.css";
import "./globals.css";

/* App Router mounts the canonical font stylesheet once from this root head. */
/* eslint-disable @next/next/no-page-custom-font */

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // resolves the generated og / twitter images to absolute urls
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  keywords: [
    "peasantlabs",
    "peasant labs",
    "peasant",
    "agent transcripts",
    "data sovereignty",
    "coding agents",
    "attribution",
    "the commons",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: site.title,
    description: site.tagline,
    type: "article",
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

const themeScript = `(function(){try{var theme=localStorage.getItem("peasant-labs-theme");if(theme==="dark"||theme==="light"){document.documentElement.dataset.theme=theme}}catch(_){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={geistMono.variable}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Atkinson+Hyperlegible+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="site-root">
        <a
          href="#content"
          className="site-skip-link"
        >
          skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
