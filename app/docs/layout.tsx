import type { Metadata } from "next";
import { Sidebar } from "@/components/docs/sidebar";
import { MobileSidebar } from "@/components/docs/mobile-sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DocsSearch } from "@/components/docs/search";

export const metadata: Metadata = {
  title: {
    template: "%s | Peasant Docs",
    default: "Peasant Docs",
  },
  description:
    "Documentation for Peasant — the open-source CLI for AI coding transcript analytics.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      {/* Mobile sidebar hamburger */}
      <MobileSidebar />

      {/* Docs top bar with search and theme toggle */}
      <div className="sticky top-0 z-40 border-b border-[var(--border-default)] bg-[var(--bg-deep)]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between h-12 px-4">
          <a href="/" className="text-small text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors font-mono">
            ← peasant
          </a>
          <div className="flex items-center gap-3">
            <DocsSearch />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-surface)] sticky top-12 h-[calc(100vh-48px)] overflow-y-auto px-5 pt-5 pb-6">
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[720px] mx-auto px-6 pt-5 pb-12 lg:px-10">
            <article className="docs-content">{children}</article>
          </div>
        </main>

        {/* Right rail */}
        <aside className="hidden lg:block w-[200px] shrink-0 border-l border-[var(--border-default)] sticky top-12 h-[calc(100vh-48px)] overflow-y-auto px-5 pt-5 pb-6">
          <span className="text-caption text-[var(--text-tertiary)] uppercase tracking-widest">
            On this page
          </span>
        </aside>
      </div>
    </div>
  );
}
