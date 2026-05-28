import { site } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

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
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistMono.variable} suppressHydrationWarning>
      <body className="lowercase-all uniform min-h-screen font-mono antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-[var(--accent)] focus:bg-[var(--bg-deep)] focus:px-4 focus:py-2 focus:text-[var(--accent)]"
        >
          skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
