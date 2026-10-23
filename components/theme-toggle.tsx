"use client";

import { applyTheme, currentTheme, storedTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { Moon, Sun } from "@peasant-labs/fairtrade/icons";
import { useEffect, useSyncExternalStore } from "react";

/**
 * The small theme control in the header and the docs sidebar. It names the
 * theme it switches to, and shows that theme's icon, so the label and the
 * picture never disagree.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");

  // Until a reader chooses, the page keeps following the system setting live.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const follow = () => {
      if (storedTheme() === null) {
        applyTheme(query.matches ? "light" : "dark", { persist: false });
      }
    };
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const Icon = next === "light" ? Sun : Moon;

  return (
    <button
      type="button"
      className={`site-icon-btn${className ? ` ${className}` : ""}`}
      data-theme-toggle
      aria-label={`use ${next} theme`}
      title={`use ${next} theme`}
      onClick={() => applyTheme(next, { persist: true })}
    >
      <Icon aria-hidden="true" focusable="false" />
    </button>
  );
}
