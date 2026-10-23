"use client";

import { useReducedMotion } from "@/components/landing/use-motion";
import { DEMO_SESSION } from "@/lib/demo-session";
import { currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import {
  adaptTranscript,
  TranscriptViewer,
  type TranscriptWireInput,
} from "@peasant-labs/fairtrade/ui";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";

/* how long the shown view takes to fade out before the chosen one fades in */
const SWITCH_MS = 140;

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
function breadcrumbFor(session: TranscriptWireInput) {
  return [{ label: "sessions" }, { label: session.project ?? "peasant" }, { label: session.id }];
}

/**
 * The real fairtrade viewer over a sample session. The session goes through
 * `adaptTranscript`, the one wire-parse boundary, exactly as a published
 * transcript would; nothing here re-implements the viewer.
 */
export function TranscriptDemo({
  label,
  session = DEMO_SESSION,
  title,
  breadcrumb: showBreadcrumb = true,
  crossfade = false,
}: {
  label: string;
  session?: TranscriptWireInput;
  /** an editorial title in place of the one derived from the first prompt */
  title?: string;
  /** false leaves out the crumb trail, for a page that keeps to the fewest words */
  breadcrumb?: boolean;
  /** a change of tab fades the shown view out and the chosen one in, instead of swapping in one frame */
  crossfade?: boolean;
}) {
  // The site owns the theme; the viewer follows it rather than shipping its own.
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");
  const viewModel = useMemo(() => {
    const adapted = adaptTranscript(session);
    return title ? { ...adapted, session: { ...adapted.session, title } } : adapted;
  }, [session, title]);
  const breadcrumb = useMemo(() => (showBreadcrumb ? breadcrumbFor(session) : []), [session, showBreadcrumb]);
  const [activeTab, setActiveTab] = useState<Tab>(OPENING_TAB);
  const [switching, setSwitching] = useState(false);
  const pending = useRef<number | undefined>(undefined);
  const reduced = useReducedMotion();

  function changeTab(tab: Tab) {
    if (!crossfade || reduced) {
      setActiveTab(tab);
      return;
    }
    window.clearTimeout(pending.current);
    setSwitching(true);
    pending.current = window.setTimeout(() => {
      setActiveTab(tab);
      setSwitching(false);
    }, SWITCH_MS);
  }

  return (
    <div
      className="pj-transcript"
      data-transcript-demo
      data-contained-overflow
      role="group"
      aria-label={label}
      data-switching={switching ? "true" : undefined}
    >
      <TranscriptViewer
        viewModel={viewModel}
        capabilities={READ_ONLY}
        theme={theme}
        activeTab={activeTab}
        onTabChange={changeTab}
        breadcrumb={breadcrumb}
      />
    </div>
  );
}
