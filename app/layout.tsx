import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peasant — Tend your harvests. Share your yields.",
  description:
    "The open-source CLI for AI coding transcript analytics. Ingest sessions from Claude Code, OpenCode, and more. Analyze metrics locally. Share anonymized transcripts with the Village.",
  keywords: [
    "AI coding",
    "transcript analytics",
    "Claude Code",
    "TUI",
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
