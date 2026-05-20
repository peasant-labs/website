import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reclaiming Data Autonomy as a Peasant",
  description:
    "an upcoming editorial on the quiet enclosure of the transcript commons, and why the harvest belongs to the hands that sowed it.",
  applicationName: "peasant",
  authors: [{ name: "peasant" }],
  keywords: [
    "agent transcripts",
    "data sovereignty",
    "coding agents",
    "attribution",
    "the commons",
  ],
  openGraph: {
    title: "Reclaiming Data Autonomy as a Peasant",
    description:
      "forthcoming — on the quiet enclosure of the transcript commons.",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0e",
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
