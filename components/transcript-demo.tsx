"use client";

import { DEMO_SESSION } from "@/lib/demo-session";
import { adaptTranscript, TranscriptViewer } from "@peasant-labs/fairtrade/ui";
import { useMemo, useState, useSyncExternalStore } from "react";

const THEME_EVENT = "peasant-labs-theme-change";

/**
 * The viewer opens on its own summary rather than the raw log. fairtrade
 * defaults to "trace", which lands a first-time reader in the middle of a
 * transcript before they have been told what the session was — highlights is
 * the view that answers "can you help me review this?" first.
 *
 * The tab is owned here rather than passed as a one-time default: the prop is
 * controlled, so without state the tabs would render and refuse to move.
 */
const OPENING_TAB = "highlights" as const;

/* Derived from the component rather than re-declared: the tab union is fairtrade's to name. */
type Tab = NonNullable<Parameters<typeof TranscriptViewer>[0]["activeTab"]>;

/**
 * Every capability is off. This is a read-only demonstration, so the viewer must
 * not offer an affordance that cannot do anything — the composite drops each
 * action entirely when its flag is false.
 */
const READ_ONLY = {
  canEdit: false,
  canLabel: false,
  canContribute: false,
  canChangeVisibility: false,
  canExport: false,
} as const;

/* Label-only crumbs: a demo transcript has nowhere real to navigate to. */
const BREADCRUMB = [
  { label: "sessions" },
  { label: "peasant" },
  { label: DEMO_SESSION.id },
];

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_EVENT, onStoreChange);
}

function currentTheme(): "dark" | "light" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function TranscriptDemo({ label }: { label: string }) {
  // The site owns the theme; the viewer follows it rather than shipping its own.
  const theme = useSyncExternalStore<"dark" | "light">(
    subscribeToTheme,
    currentTheme,
    () => "dark",
  );
  const viewModel = useMemo(() => adaptTranscript(DEMO_SESSION), []);
  const [activeTab, setActiveTab] = useState<Tab>(OPENING_TAB);

  return (
    <div
      className="pj-transcript"
      data-transcript-demo
      data-contained-overflow
      role="group"
      aria-label={label}
    >
      <TranscriptViewer
        viewModel={viewModel}
        capabilities={READ_ONLY}
        theme={theme}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        breadcrumb={BREADCRUMB}
      />
    </div>
  );
}
