import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "peasant — tend your harvests. share your yields.",
  description:
    "the open-source cli for ai coding transcript analytics. ingest sessions from claude code, opencode, and more. analyze metrics locally. share anonymized transcripts with the village.",
  keywords: [
    "ai coding",
    "transcript analytics",
    "claude code",
    "tui",
    "developer tools",
    "open source",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistMono.variable} suppressHydrationWarning>
      <body className="min-h-screen font-mono">{children}</body>
    </html>
  );
}
