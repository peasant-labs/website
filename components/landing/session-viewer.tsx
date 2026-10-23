"use client";

import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { textIn, Tour } from "@/components/landing/viewer-tour";
import { MacPointer } from "@/components/mac";
import { currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { adaptTranscript, TranscriptViewer, type TranscriptWireInput } from "@peasant-labs/fairtrade/ui";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";

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
        if (entry?.isIntersecting) setNear(true);
      },
      { rootMargin: DRAW_AHEAD },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, near]);
  return near;
}

/* the reader's own input inside the window; any of it ends the tour */
const TAKE_OVER = ["pointerdown", "wheel", "touchstart", "keydown"] as const;

export type TourScript = Readonly<{
  /** the run of the prompt's text the tour rests on first */
  prompt: string;
  /** the tool call it opens, by the path in its head */
  tool: string;
  /** the redaction marker in that call's result */
  marker: string;
  /** the tab that shows the change, and the run of the change it rests on (text, or a selector) */
  changes: string;
  change: string;
  /** the tab back to the trace, and the run of the final answer it ends on */
  trace: string;
  answer: string;
}>;

/* the tour: the prompt, the redacted tool call opened, the change in diffs, and the answer it ended on */
async function walk(tour: Tour, root: HTMLElement, script: TourScript) {
  const stream = () => root.querySelector(".txn-stream");
  const tab = (name: string) =>
    [...root.querySelectorAll<HTMLElement>('[role="tab"]')].find((element) =>
      element.textContent?.trim().startsWith(name),
    );
  const need = <T,>(found: T | undefined | null) => {
    if (!found) throw new Error("the tour lost its way");
    return found;
  };

  await tour.hold(500);
  await tour.appear();

  // the prompt
  const prompt = need(textIn(stream(), script.prompt));
  await tour.reveal(prompt, 0.25);
  await tour.rest(prompt, 1700);

  // the tool call that read the credentials, opened in place, its key read as its marker
  const head = need(
    [...(stream()?.querySelectorAll<HTMLElement>(".tc-head") ?? [])].find((element) =>
      element.textContent?.includes(script.tool),
    ),
  );
  await tour.reveal(head, 0.22);
  if (head.getAttribute("aria-expanded") !== "true") await tour.press(head);
  await tour.hold(320);
  const marker = need(textIn(head.parentElement, script.marker));
  await tour.reveal(marker, 0.4);
  await tour.rest(marker, 2300);

  // the change, in the diffs
  await tour.press(need(tab(script.changes)));
  await tour.hold(420);
  const change = need(textIn(root.querySelector('[role="tabpanel"]') ?? root, script.change));
  await tour.reveal(change, 0.4);
  await tour.rest(change, 2300);

  // back to the trace, down to the answer it ended on
  await tour.press(need(tab(script.trace)));
  await tour.hold(420);
  const answer = need(textIn(stream(), script.answer));
  await tour.reveal(answer, 0.42);
  await tour.rest(answer, 2600);

  tour.vanish();
}

/**
 * The real transcript browser over the sample session, as online's transcript
 * page renders a published one: fairtrade's TranscriptViewer with its header,
 * tabs, turn list, tool calls and diffs, and without the share tail or the
 * outcome chip. The session goes through `adaptTranscript`, the one
 * wire-parse boundary, under its short title. The filters open from their
 * rail's strip, so the conversation has most of the window. The viewer keeps
 * the window's height and scrolls inside it, and every part of it can be used.
 * It is drawn as the section nears the screen, in the browser, so it costs
 * nothing before then and its relative times are the reader's own.
 *
 * The first time it is well in view, a macOS pointer tours it: the prompt,
 * the tool call that read the credentials (opened, its key shown as its
 * marker), the change in the diffs, and the answer the session ended on. The
 * tour clicks the real controls and has no controls of its own. It holds
 * while the window is off screen. The reader's first press, scroll, touch or
 * key in the window ends it for good; a tour that played to its end plays
 * again, on a fresh browser, when the section comes back after leaving the
 * screen. Under reduced motion there is no tour: the browser is simply there.
 */
export function SessionViewer({
  session,
  title,
  label,
  tour: script,
}: {
  session: TranscriptWireInput;
  title: string;
  label: string;
  tour: TourScript;
}) {
  // The site owns the theme; the viewer follows it rather than shipping its own.
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");
  const viewModel = useMemo(() => {
    const adapted = adaptTranscript(session);
    return { ...adapted, session: { ...adapted.session, title } };
  }, [session, title]);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<Tour | null>(null);
  const interacted = useRef(false);
  const away = useRef(false);
  const reduced = useReducedMotion();
  const near = useNear(rootRef);
  const inView = useOnScreen(rootRef, 0.5);
  // a take is one fresh viewer and one tour of it
  const [take, setTake] = useState(0);
  const [played, setPlayed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  if (!reduced && near && inView && !played) setPlayed(true);

  // The reader's own input in the window is theirs: it ends the tour, and no tour starts again after it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const takeOver = (event: Event) => {
      if (!event.isTrusted) return;
      interacted.current = true;
      tourRef.current?.stop();
    };
    for (const kind of TAKE_OVER) root.addEventListener(kind, takeOver, { capture: true, passive: true });
    return () => {
      for (const kind of TAKE_OVER) root.removeEventListener(kind, takeOver, { capture: true });
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const pointer = pointerRef.current;
    if (reduced || !played || interacted.current || !root || !pointer) return;
    const tour = new Tour(root, pointer);
    tourRef.current = tour;
    walk(tour, root, script)
      .catch(() => {})
      .finally(() => tour.stop());
    return () => {
      tour.stop();
      tourRef.current = null;
    };
  }, [played, take, reduced, script]);

  // Off screen the tour holds where it is. Back in view it plays on, or, once it has played to its end and the
  // section has left the screen and come back, it plays again on a fresh browser.
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    // noted as it happens, not on a render, so a quick leave and return still counts
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) away.current = true;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const tour = tourRef.current;
    if (!inView) {
      tour?.pause();
      return;
    }
    if (tour && !tour.over) tour.resume();
    else if (tour && away.current && !interacted.current && !reduced) {
      away.current = false;
      setFiltersOpen(false);
      setTake((value) => value + 1);
    }
    away.current = false;
  }, [inView, reduced]);

  return (
    <div
      ref={rootRef}
      className="lp-viewer"
      data-session-viewer
      data-touring="false"
      role="group"
      aria-label={label}
    >
      {near ? (
        <TranscriptViewer
          key={take}
          viewModel={viewModel}
          capabilities={READ_ONLY}
          theme={theme}
          breadcrumb={NO_CRUMBS}
          showTail={false}
          showOutcome={false}
          rightRailOpen={filtersOpen}
          onRightRailOpenChange={setFiltersOpen}
        />
      ) : null}
      {reduced ? null : <MacPointer ref={pointerRef} className="lp-tour-pointer" />}
    </div>
  );
}
