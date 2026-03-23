"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Nav() {
  const [playing, setPlaying] = useState(true);

  const toggleAnimation = useCallback(() => {
    setPlaying((prev) => {
      const next = !prev;
      // Toggle data-paused on html to kill all CSS animations site-wide
      if (next) {
        document.documentElement.removeAttribute("data-paused");
      } else {
        document.documentElement.setAttribute("data-paused", "true");
      }
      return next;
    });
    window.dispatchEvent(new CustomEvent("peasant-animation-toggle"));
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-default)] bg-[var(--bg-deep)]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between font-mono">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
        >
          <span className="text-subheading text-[var(--accent)] font-mono select-none">
            {"{p}"}
          </span>
        </Link>

        {/* Links + Toggles — all same style, vertically centered */}
        <div className="flex items-center gap-5">
          <Link
            href="/docs"
            className="text-small text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Docs
          </Link>
          <a
            href="https://village.peasant.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-small text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Village
          </a>
          <a
            href="https://github.com/peasant-dev/peasant"
            target="_blank"
            rel="noopener noreferrer"
            className="text-small text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            GitHub
          </a>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              type="button"
              onClick={toggleAnimation}
              aria-label={playing ? "Pause animation" : "Play animation"}
              className="inline-flex items-center justify-center font-mono text-small px-3 py-1 border border-[var(--border-default)] rounded-none bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer select-none"
            >
              {playing ? "[⏸]" : "[▶]"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
