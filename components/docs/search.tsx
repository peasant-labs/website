"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const SEARCH_INDEX = [
  { title: "Overview", path: "/docs", keywords: "overview introduction what is peasant" },
  { title: "Getting Started", path: "/docs/getting-started", keywords: "install setup quickstart kickstart" },
  { title: "Architecture", path: "/docs/core-concepts/architecture", keywords: "architecture packages go sqlite" },
  { title: "Ingest Pipeline", path: "/docs/core-concepts/ingest-pipeline", keywords: "pipeline stages discover diff filter extract" },
  { title: "Analytics Schema", path: "/docs/core-concepts/analytics-schema", keywords: "schema database tables migrations sqlite" },
  { title: "Installation", path: "/docs/guides/installation", keywords: "install go nix build binary" },
  { title: "Configuration", path: "/docs/guides/configuration", keywords: "config yaml settings selection" },
  { title: "Ingesting Sessions", path: "/docs/guides/ingesting-sessions", keywords: "ingest sessions provider claude opencode" },
  { title: "CLI: ingest", path: "/docs/cli-reference/ingest", keywords: "ingest command flags dry-run force since" },
  { title: "CLI: push", path: "/docs/cli-reference/push", keywords: "push village share visibility" },
  { title: "CLI: tui", path: "/docs/cli-reference/tui", keywords: "tui terminal ui dashboard" },
  { title: "CLI: web", path: "/docs/cli-reference/web", keywords: "web start stop dashboard server" },
  { title: "CLI: kickstart", path: "/docs/cli-reference/kickstart", keywords: "kickstart setup wizard" },
];

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = query.length > 1
    ? SEARCH_INDEX.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.keywords.includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router]
  );

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <>
      {/* Search trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 font-mono text-small px-3 py-1 border border-[var(--border-default)] rounded-none bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer select-none"
      >
        search...
        <kbd className="text-caption text-[var(--text-tertiary)] border border-[var(--border-default)] px-1 rounded-none">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div className="fixed inset-0 bg-[var(--bg-deep)]/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[500px] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-default)]">
              <span className="text-[var(--text-tertiary)] text-body">$</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search docs..."
                className="flex-1 bg-transparent text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none font-mono"
              />
              <kbd
                className="text-caption text-[var(--text-tertiary)] border border-[var(--border-default)] px-1 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto">
                {results.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(item.path)}
                    className="w-full text-left px-4 py-3 text-small text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors font-mono border-b border-[var(--border-default)] last:border-b-0 cursor-pointer"
                  >
                    {item.title}
                    <span className="text-caption text-[var(--text-tertiary)] ml-2">
                      {item.path}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {query.length > 1 && results.length === 0 && (
              <div className="px-4 py-6 text-small text-[var(--text-tertiary)] text-center font-mono">
                No results found.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
