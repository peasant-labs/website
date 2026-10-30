"use client";

import { DEMO_SESSION } from "@/lib/demo-session";
import { TranscriptGraph } from "@/components/transcript-graph";
import { currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import {
  adaptTranscript,
  TranscriptViewer,
  type TranscriptWireInput,
} from "@peasant-labs/fairtrade/ui";
import { useMemo, useState, useSyncExternalStore } from "react";

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
}: {
  label: string;
  session?: TranscriptWireInput;
}) {
  // The site owns the theme; the viewer follows it rather than shipping its own.
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");
  const viewModel = useMemo(() => adaptTranscript(session), [session]);
  const breadcrumb = useMemo(() => breadcrumbFor(session), [session]);
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
        breadcrumb={breadcrumb}
        graphSlot={({ viewModel }) => <TranscriptGraph session={session} viewModel={viewModel} />}
      />
    </div>
  );
}
