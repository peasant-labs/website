"use client";

import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { textIn, Tour } from "@/components/landing/viewer-tour";
import { MacPointer } from "@/components/mac";
import { currentTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { RotateCcw } from "@peasant-labs/fairtrade/icons";
import { adaptTranscript, TranscriptViewer, type TranscriptWireInput } from "@peasant-labs/fairtrade/ui";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

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

/* the browser draws the viewer itself: its relative times and counts are the reader's clock's and locale's, not the build's */
const noChange = () => () => {};

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

  await tour.vanish();
}

/**
 * The real transcript browser over the sample session, as online's transcript
 * page renders a published one: fairtrade's TranscriptViewer with its header,
 * tabs, turn list, filters, tool calls and diffs, and without the share tail
 * or the outcome chip. The session goes through `adaptTranscript`, the one
 * wire-parse boundary, under its short title. The viewer keeps the window's
 * height and scrolls inside it, and every part of it can be used.
 *
 * The first time it is well in view, a macOS pointer tours it: the prompt,
 * the tool call that read the credentials (opened, its key shown as its
 * marker), the change in the diffs, and the answer the session ended on. The
 * tour clicks the real controls. It holds while the window is off screen, and
 * ends for good the moment the reader presses, scrolls, touches or types in
 * the window; the replay icon in the viewer's header plays it again from the
 * start. Under reduced motion there is no tour and no replay: the browser is
 * simply there to use.
 */
export function SessionViewer({
  session,
  title,
  label,
  tour: script,
  replay,
}: {
  session: TranscriptWireInput;
  title: string;
  label: string;
  tour: TourScript;
  /** the replay icon's name */
  replay: string;
}) {
  // The site owns the theme; the viewer follows it rather than shipping its own.
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, currentTheme, () => "dark");
  const drawn = useSyncExternalStore(noChange, () => true, () => false);
  const viewModel = useMemo(() => {
    const adapted = adaptTranscript(session);
    return { ...adapted, session: { ...adapted.session, title } };
  }, [session, title]);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<Tour | null>(null);
  const reduced = useReducedMotion();
  const onScreen = useOnScreen(rootRef, 0.5);
  // a take is one fresh viewer and one tour of it: replay starts the next
  const [take, setTake] = useState(0);
  const [played, setPlayed] = useState(false);
  if (!reduced && onScreen && !played) setPlayed(true);

  useEffect(() => {
    const root = rootRef.current;
    const pointer = pointerRef.current;
    if (reduced || !played || !root || !pointer) return;
    const tour = new Tour(root, pointer);
    tourRef.current = tour;
    const takeOver = (event: Event) => {
      if (event.isTrusted) tour.stop();
    };
    for (const kind of TAKE_OVER) root.addEventListener(kind, takeOver, { capture: true, passive: true });
    walk(tour, root, script)
      .catch(() => {})
      .finally(() => tour.stop());
    return () => {
      for (const kind of TAKE_OVER) root.removeEventListener(kind, takeOver, { capture: true });
      tour.stop();
      tourRef.current = null;
    };
  }, [played, take, reduced, script]);

  // Off screen, the tour holds where it is, and plays on when it is back in view.
  useEffect(() => {
    if (onScreen) tourRef.current?.resume();
    else tourRef.current?.pause();
  }, [onScreen]);

  return (
    <div
      ref={rootRef}
      className="lp-viewer"
      data-session-viewer
      data-touring="false"
      role="group"
      aria-label={label}
      tabIndex={-1}
    >
      {drawn ? (
        <TranscriptViewer
          key={take}
          viewModel={viewModel}
          capabilities={READ_ONLY}
          theme={theme}
          breadcrumb={NO_CRUMBS}
          showTail={false}
          showOutcome={false}
          headerActions={
            reduced ? undefined : (
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-icon"
                aria-label={replay}
                onClick={() => {
                  // a fresh viewer, back at its start, and the tour again; focus stays in the window
                  setTake((value) => value + 1);
                  setPlayed(true);
                  rootRef.current?.focus({ preventScroll: true });
                }}
              >
                <RotateCcw aria-hidden="true" focusable="false" />
              </button>
            )
          }
        />
      ) : null}
      {reduced ? null : <MacPointer ref={pointerRef} className="lp-tour-pointer" />}
    </div>
  );
}
