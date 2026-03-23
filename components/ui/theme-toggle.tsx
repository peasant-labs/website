'use client';

import { useState, useEffect, useCallback } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("peasant-theme");
    if (stored === "light") {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      setTheme("dark");
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (next === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("peasant-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("peasant-theme", "dark");
      }
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="inline-flex items-center justify-center font-mono text-small px-3 py-1 border border-[var(--border-default)] rounded-none bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors cursor-pointer select-none"
    >
      {theme === "dark" ? "[DARK]" : "[LIGHT]"}
    </button>
  );
}
