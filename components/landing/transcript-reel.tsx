"use client";

import { arc, EASE_MOVE, EASE_SETTLE, pointAt, PRESS, type Point } from "@/components/landing/pointer";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { MacPointer, POINTER_TIP } from "@/components/mac";
import { GitCommitHorizontal } from "@peasant-labs/fairtrade/icons";
import {
  adaptTranscript,
  MetaItem,
  ProviderName,
  TranscriptOutcomeChip,
  TranscriptToolCall,
  TranscriptTurnCard,
  type TranscriptWireInput,
} from "@peasant-labs/fairtrade/ui";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

type TurnVM = ReturnType<typeof adaptTranscript>["turns"][number];

export type ReelBeat = Readonly<{
  id: string;
  /** what the beat shows, for the segment's name and the stage's description */
  label: string;
  description: string;
  /** the turn the beat reads from, by its index in the session */
  turn: number;
  /** a tool call of that turn to show open, by its id */
  tool?: string;
  /** what the beat adds under it: the commit the change became, or the session's outcome */
  with?: "commit" | "outcome";
  /** where the pointer rests while the beat holds: a run of the beat's text, or a selector into it */
  point: string;
}>;

/* how long a beat holds before the pointer moves the reel on */
const BEAT_MS = 5600;
/* the pointer's part in a beat, in ms from its start: over to what the beat shows, then to the next segment, then its press */
const TO_POINT = { at: 640, move: 1000 };
const TO_NEXT = { at: BEAT_MS - 1340, move: 860 };
const PRESS_AT = BEAT_MS - PRESS.duration - 40;

/* where a pointer's tip is now, in its parent's coordinates, or null before it has been placed */
function tipOf(pointer: HTMLElement): Point | null {
  const transform = getComputedStyle(pointer).transform;
  if (!transform || transform === "none") return null;
  const matrix = new DOMMatrix(transform);
  const size = pointer.offsetWidth;
  return { x: matrix.m41 + POINTER_TIP.x * size, y: matrix.m42 + POINTER_TIP.y * size };
}

/* a run of a beat's text, or the contents of the part a selector names */
function rangeIn(beat: HTMLElement, point: string): Range | undefined {
  const range = document.createRange();
  if (/^[.[]/.test(point)) {
    const part = beat.querySelector(point);
    if (!part) return undefined;
    range.selectNodeContents(part);
    return range;
  }
  const walker = document.createTreeWalker(beat, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const index = node.textContent?.indexOf(point) ?? -1;
    if (index < 0) continue;
    range.setStart(node, index);
    range.setEnd(node, index + point.length);
    return range;
  }
  return undefined;
}

/* what the pointer is on is lit the way a selection is, with no node added to the component's own markup */
const MARK = "reel-point";


function mark(range: Range | undefined) {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
  if (range) CSS.highlights.set(MARK, new Highlight(range));
  else CSS.highlights.delete(MARK);
}

/**
 * A guided reading of one published transcript: a few beats of the real
 * session, each drawn by fairtrade's own transcript components, with the
 * camera easing to the beat at hand while the others dim. A macOS pointer
 * drives it: it moves on a curved path to what each beat shows and rests
 * there, then to the next beat's segment, which it presses as that beat's time
 * runs out. A segment can also be chosen from the reader's own pointer or the
 * keyboard; the reel holds while hovered, keyboard-focused, off screen or in a
 * background tab, and its pointer steps aside while the reader's is in it.
 * Under reduced motion there is no pointer and nothing moves on its own: a
 * chosen beat is shown at once, finished.
 *
 * The session goes through `adaptTranscript`, the one wire-parse boundary, as
 * a published transcript would. The beats are a picture of it, so the stage is
 * one image to assistive technology, described by the beat at hand.
 */
export function TranscriptReel({
  session,
  title,
  beats,
  label,
}: {
  session: TranscriptWireInput;
  title: string;
  beats: readonly ReelBeat[];
  label: string;
}) {
  const viewModel = useMemo(() => adaptTranscript(session), [session]);
  const [beat, setBeat] = useState(0);
  const [round, setRound] = useState(0);
  const [held, setHeld] = useState({ hover: false, focus: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const beatRefs = useRef<(HTMLLIElement | null)[]>([]);
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const takeRef = useRef<Animation[]>([]);
  const playingRef = useRef(false);
  const reduced = useReducedMotion();
  const onScreen = useOnScreen(rootRef);
  const holding = held.hover || held.focus;
  const playing = !reduced && onScreen && !holding;
  // The pointer first sets off the first time the reel plays; from then on each beat is one take of it.
  const [started, setStarted] = useState(false);
  if (playing && !started) setStarted(true);
  const commit = viewModel.session.git?.commits?.[0];

  // The camera's resting place for a beat: the track's offset that sets it in the middle of the stage, never above
  // the first beat. The last one is set in the middle too, with the stage's floor clear, so nothing laid over the
  // window's lower edge can cover what it is about.
  const aimFor = useCallback((index: number) => {
    const stage = stageRef.current;
    const track = trackRef.current;
    const target = beatRefs.current[index];
    if (!stage || !track || !target) return 0;
    // a beat taller than the stage is read from its top; any other sits in the middle
    const inset = parseFloat(getComputedStyle(track).paddingTop) || 0;
    const aim =
      target.offsetHeight + 2 * inset > stage.clientHeight
        ? target.offsetTop - inset
        : target.offsetTop + target.offsetHeight / 2 - stage.clientHeight / 2;
    return Math.max(0, aim);
  }, []);

  // The camera: the track slides so the beat at hand sits where aimFor puts it, and again whenever the stage or track resizes.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track) return;
    const place = () => {
      track.style.transform = `translateY(${-aimFor(beat)}px)`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(stage);
    observer.observe(track);
    return () => observer.disconnect();
  }, [beat, aimFor]);

  // Holding pauses the take where it is, the pointer, the segment's fill and all; letting go plays on from there.
  useLayoutEffect(() => {
    playingRef.current = playing;
    for (const animation of takeRef.current) {
      if (playing && animation.playState === "paused") animation.play();
      if (!playing && animation.playState === "running") animation.pause();
    }
  }, [playing]);

  // One take per beat, on one clock: the segment fills with the beat's time while the pointer goes to what the beat
  // shows, rests, crosses to the next segment and presses it; the fill running out is that press moving the reel on.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const pointer = pointerRef.current;
    const fill = fillRef.current;
    const arrow = pointer?.firstElementChild;
    if (reduced || !started || !root || !track || !pointer || !fill || !arrow) return;
    const next = (beat + 1) % beats.length;
    const from = tipOf(pointer);
    let take: Animation[] = [];

    const build = (elapsed: number) => {
      const size = pointer.offsetWidth;
      const box = root.getBoundingClientRect();
      // a part of the track is measured where the camera is now and aimed at where the camera comes to rest
      const shift = -aimFor(beat) - new DOMMatrix(getComputedStyle(track).transform).m42;
      const start = from ?? { x: box.width * 0.84, y: box.height * 0.78 };
      const beatBox = beatRefs.current[beat];
      const range = beatBox ? rangeIn(beatBox, beats[beat]!.point) : undefined;
      const lines = range?.getClientRects();
      const target = lines?.[lines.length - 1];
      // the tip rests at the end of what it points at, so the arrow hangs into the space after it and covers none of it
      const rest = target
        ? { x: target.left - box.left + target.width * 0.94, y: target.top - box.top + target.height * 0.7 + shift }
        : start;
      const segment = segmentRefs.current[next];
      const line = segment?.querySelector<HTMLElement>(".reel-seg-track");
      const lineBox = line?.getBoundingClientRect();
      const press = lineBox
        ? { x: lineBox.left - box.left + lineBox.width * 0.42, y: lineBox.top - box.top + lineBox.height / 2 }
        : rest;
      const hover = line ? getComputedStyle(line).getPropertyValue("--ink-4").trim() : "";
      const arrived = TO_NEXT.at + TO_NEXT.move;
      // a moment of the take that is not a motion: an empty animation on the same clock, so it holds when the take does
      const cue = (at: number, run: () => void) => {
        const moment = root.animate([], { delay: at, duration: 0 });
        moment.onfinish = run;
        return moment;
      };

      const filling = fill.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration: BEAT_MS,
        fill: "forwards",
      });
      filling.onfinish = () => setBeat(next);
      take = [
        filling,
        pointer.animate(arc(start, rest, size), {
          delay: TO_POINT.at,
          duration: TO_POINT.move,
          easing: EASE_MOVE,
          fill: "both",
        }),
        pointer.animate(arc(rest, press, size), {
          delay: TO_NEXT.at,
          duration: TO_NEXT.move,
          easing: EASE_MOVE,
          fill: "forwards",
        }),
        cue(TO_POINT.at + TO_POINT.move, () => mark(range)),
        cue(TO_NEXT.at, () => mark(undefined)),
        arrow.animate(
          [{ transform: "scale(1)" }, { transform: `scale(${PRESS.arrow})` }, { transform: "scale(1)" }],
          { delay: PRESS_AT, duration: PRESS.duration, easing: EASE_SETTLE },
        ),
      ];
      if (segment && line) {
        // the segment answers the pointer as it would the reader's: its line darkens under it, and it gives way to the press
        if (hover) {
          take.push(
            line.animate([{ backgroundColor: hover }, { backgroundColor: hover }], {
              delay: arrived,
              duration: BEAT_MS - arrived,
              fill: "forwards",
            }),
          );
        }
        take.push(
          segment.animate(
            [{ transform: "scale(1)" }, { transform: `scale(${PRESS.control})` }, { transform: "scale(1)" }],
            { delay: PRESS_AT, duration: PRESS.duration, easing: EASE_SETTLE },
          ),
        );
      }
      for (const animation of take) {
        animation.currentTime = elapsed;
        if (!playingRef.current) animation.pause();
      }
      pointer.style.transform = pointAt(start, size);
      takeRef.current = take;
    };

    build(0);
    // a window that changes size mid-beat has its take measured again, from the same moment of it
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      const elapsed = Number(take[0]?.currentTime ?? 0);
      take.forEach((animation) => animation.cancel());
      mark(undefined);
      build(elapsed);
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
      // the next take sets off from wherever this one leaves the pointer
      const here = tipOf(pointer);
      take.forEach((animation) => animation.cancel());
      mark(undefined);
      if (here) pointer.style.transform = pointAt(here, pointer.offsetWidth);
      takeRef.current = [];
    };
  }, [beat, round, beats, reduced, started, aimFor]);

  // Under reduced motion each beat is its finished still, with what it is about already lit.
  useLayoutEffect(() => {
    const beatBox = beatRefs.current[beat];
    if (!reduced || !beatBox) return;
    mark(rangeIn(beatBox, beats[beat]!.point));
    return () => mark(undefined);
  }, [reduced, beat, beats]);

  function choose(index: number) {
    setBeat(index);
    setRound((value) => value + 1);
  }

  const turnOf = (index: number): TurnVM | undefined => viewModel.turns.find((turn) => turn.index === index);

  function render(item: ReelBeat): ReactNode {
    const tool = item.tool ? viewModel.toolCallsById.get(item.tool) : undefined;
    const turn = turnOf(item.turn);
    return (
      <div className="reel-part">
        {tool ? <TranscriptToolCall tool={tool} open /> : turn ? <TranscriptTurnCard turn={turn} compact /> : null}
        {item.with === "commit" && commit ? (
          <MetaItem icon={GitCommitHorizontal} className="reel-commit">
            {commit.message}
          </MetaItem>
        ) : null}
        {item.with === "outcome" ? (
          <TranscriptOutcomeChip outcome={session.outcome} className="reel-outcome" />
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="reel"
      data-reel
      data-playing={playing ? "true" : "false"}
      data-held={holding ? "true" : "false"}
      data-pointer={started && !reduced ? "on" : "off"}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHeld((current) => ({ ...current, hover: true }));
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHeld((current) => ({ ...current, hover: false }));
      }}
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) setHeld((current) => ({ ...current, focus: true }));
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHeld((current) => ({ ...current, focus: false }));
        }
      }}
    >
      <div className="reel-head">
        <h3 className="reel-title">{title}</h3>
        <ProviderName harness={session.harness ?? "claude-code"} />
      </div>

      <div ref={stageRef} className="reel-stage" role="img" aria-label={beats[beat]!.description}>
        <ol ref={trackRef} className="reel-track" inert>
          {beats.map((item, index) => (
            <li
              key={item.id}
              ref={(element) => {
                beatRefs.current[index] = element;
              }}
              className="reel-beat"
              data-on={index === beat ? "true" : "false"}
            >
              {render(item)}
            </li>
          ))}
        </ol>
      </div>

      <div className="reel-segs" role="group" aria-label="moments">
        {beats.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              segmentRefs.current[index] = element;
            }}
            type="button"
            className="reel-seg"
            aria-label={`show ${item.label}`}
            aria-current={index === beat ? "true" : undefined}
            data-state={index < beat ? "done" : index === beat ? "on" : "next"}
            onClick={() => choose(index)}
          >
            <span className="reel-seg-track">
              {index === beat && !reduced ? <span key={round} ref={fillRef} className="reel-seg-fill" /> : null}
            </span>
          </button>
        ))}
      </div>

      {reduced ? null : <MacPointer ref={pointerRef} className="reel-pointer" />}
    </div>
  );
}
