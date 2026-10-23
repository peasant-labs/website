"use client";

import { applyTheme, currentTheme, storedTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { Moon, Sun } from "@peasant-labs/fairtrade/icons";
import { useEffect, useSyncExternalStore } from "react";

/**
 * Keeps following the system setting live until a reader chooses a theme.
 * Mounted once in the root layout, so every page follows it, docs included.
 */
export function ThemeSync() {
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
  return null;
}

/**
 * The theme control. It names the theme it switches to and shows that theme's
 * icon, so the label and the picture never disagree. In the phone menu it is
 * labelled in words as well.
 */
export function ThemeToggle({
  className,
  labelled = false,
  tabIndex,
}: {
  className?: string;
  labelled?: boolean;
  tabIndex?: number;
}) {
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");
  const next: Theme = theme === "dark" ? "light" : "dark";
  const Icon = next === "light" ? Sun : Moon;

  return (
    <button
      type="button"
      className={className ?? "site-icon-btn"}
      data-theme-toggle
      aria-label={`use ${next} theme`}
      title={labelled ? undefined : `use ${next} theme`}
      tabIndex={tabIndex}
      onClick={() => applyTheme(next, { persist: true })}
    >
      <Icon aria-hidden="true" focusable="false" />
      {labelled ? <span>{next} mode</span> : null}
    </button>
  );
}
