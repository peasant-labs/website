"use client";

import { currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { adaptTranscript, TranscriptViewer, type TranscriptWireInput } from "@peasant-labs/fairtrade/ui";
import { useMemo, useSyncExternalStore } from "react";

/**
 * Every capability is off. This is a read-only demonstration, so the viewer must
 * not offer an affordance that cannot do anything: the composite drops each
 * action entirely when its flag is false.
 */
const READ_ONLY = {
  canEdit: false,
  canLabel: false,
  canContribute: false,
  canChangeVisibility: false,
  canExport: false,
} as const;

/* no crumb trail: the sample has nowhere to navigate to, and its id is shown nowhere */
const NO_CRUMBS: never[] = [];

/**
 * The real transcript browser over the sample session, as online's transcript
 * page renders a published one: fairtrade's TranscriptViewer with its header,
 * tabs, turn list, filters, tool calls and diffs, and without the share tail
 * or the outcome chip. The session goes through `adaptTranscript`, the one
 * wire-parse boundary, under its short title. The viewer keeps the window's
 * height and scrolls inside it, and every part of it can be used.
 */
export function SessionViewer({
  session,
  title,
  label,
}: {
  session: TranscriptWireInput;
  title: string;
  label: string;
}) {
  // The site owns the theme; the viewer follows it rather than shipping its own.
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");
  const viewModel = useMemo(() => {
    const adapted = adaptTranscript(session);
    return { ...adapted, session: { ...adapted.session, title } };
  }, [session, title]);

  return (
    <div className="lp-viewer" data-session-viewer role="group" aria-label={label}>
      <TranscriptViewer
        viewModel={viewModel}
        capabilities={READ_ONLY}
        theme={theme}
        breadcrumb={NO_CRUMBS}
        showTail={false}
        showOutcome={false}
      />
    </div>
  );
}
