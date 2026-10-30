"use client";

import { SESSION } from "@/lib/landing";
import { TranscriptGraph } from "@/components/transcript-graph";
import { currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { adaptTranscript, TranscriptViewer, type TranscriptWireInput } from "@peasant-labs/fairtrade/ui";
import { startTransition, useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";

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

/*
 * How far ahead of the screen the viewer is drawn: early enough to be ready
 * before it is seen, late enough to cost nothing on the way down the page.
 */
const DRAW_AHEAD = "900px 0px";

/* true from the first time the element comes within DRAW_AHEAD of the screen */
function useNear(ref: RefObject<Element | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || near) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // a transition, so drawing the whole browser yields to scrolling instead of holding a frame
        if (entry?.isIntersecting) startTransition(() => setNear(true));
      },
      { rootMargin: DRAW_AHEAD },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, near]);
  return near;
}

/* the sample ended this long before the reader arrived (SESSION.endedAgoMinutes) */
const ENDED_AGO_MS = SESSION.endedAgoMinutes * 60 * 1000;

/* the sample, moved in time as a whole so it ended ENDED_AGO_MS before `now`; its own spacing is kept */
export function endedRecently(session: TranscriptWireInput, now: number): TranscriptWireInput {
  const end = Date.parse(session.endTime ?? session.startTime ?? "");
  if (Number.isNaN(end)) return session;
  const offset = now - ENDED_AGO_MS - end;
  const move = <T extends string | undefined>(time: T): T =>
    (time ? new Date(Date.parse(time) + offset).toISOString() : time) as T;
  const git = session.gitContext;
  return {
    ...session,
    startTime: move(session.startTime),
    endTime: move(session.endTime),
    turns: session.turns ? session.turns.map((turn) => ({ ...turn, timestamp: move(turn.timestamp) })) : session.turns,
    gitContext: git && {
      ...git,
      commits: git.commits?.map((commit) =>
        "timestamp" in commit ? { ...commit, timestamp: move(commit.timestamp) } : commit,
      ),
    },
  };
}

/* the viewer's tab union and open-tool map, named by the component rather than re-declared */
type ViewerProps = Parameters<typeof TranscriptViewer>[0];
type Tab = NonNullable<ViewerProps["activeTab"]>;
type OpenTools = NonNullable<ViewerProps["openTools"]>;

/* the tab the browser opens on, as online's transcript page does */
const FIRST_TAB: Tab = "trace";

/**
 * The real transcript browser over the sample session, as online's transcript
 * page renders a published one: fairtrade's TranscriptViewer with its header,
 * tabs, turn list, tool calls and diffs, and without the share tail or the
 * outcome chip. The session goes through `adaptTranscript`, the one
 * wire-parse boundary, under its short title. The filters open from their
 * rail's strip, so the conversation has most of the window. The viewer keeps
 * the window's height and scrolls inside it.
 *
 * It rests on the full trace at its top and does nothing on its own: only the
 * reader's own clicks, scrolls and keys change it. It is drawn as the section
 * nears the screen, in the browser, so it costs nothing before then and its
 * relative times are the reader's own.
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
  // the viewer is only ever drawn in the browser, so the reader's clock is the one its times are read against
  const [now] = useState(() => Date.now());
  const viewModel = useMemo(() => {
    const adapted = adaptTranscript(endedRecently(session, now));
    return { ...adapted, session: { ...adapted.session, title } };
  }, [session, title, now]);
  const rootRef = useRef<HTMLDivElement>(null);
  const near = useNear(rootRef);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The browser's heavier changes (a tab, a tool call opening) render as transitions, so they never hold a frame.
  const [tab, setTab] = useState<Tab>(FIRST_TAB);
  const [openTools, setOpenTools] = useState<OpenTools>({});

  return (
    <div ref={rootRef} className="lp-viewer" data-session-viewer role="group" aria-label={label}>
      {near ? (
        <TranscriptViewer
          viewModel={viewModel}
          capabilities={READ_ONLY}
          theme={theme}
          breadcrumb={NO_CRUMBS}
          showTail={false}
          showOutcome={false}
          rightRailOpen={filtersOpen}
          onRightRailOpenChange={setFiltersOpen}
          activeTab={tab}
          onTabChange={(next) => startTransition(() => setTab(next))}
          openTools={openTools}
          onOpenToolsChange={(next) => startTransition(() => setOpenTools(next))}
          graphSlot={({ viewModel }) => <TranscriptGraph session={session} viewModel={viewModel} />}
        />
      ) : null}
    </div>
  );
}
