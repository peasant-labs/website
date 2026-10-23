"use client";

import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
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
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
}>;

/* how long a beat holds before the reel moves on */
const BEAT_MS = 4200;

/**
 * A guided reading of one published transcript: a few beats of the real
 * session, each drawn by fairtrade's own transcript components, with the
 * camera easing to the beat at hand while the others dim. It plays on its own,
 * a slim segment per beat filling with its time; a segment can be chosen, from
 * the pointer or the keyboard, and the reel holds while hovered,
 * keyboard-focused, off screen or in a background tab. Under reduced motion
 * nothing moves on its own and a chosen beat is shown at once.
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
  const beatRefs = useRef<(HTMLLIElement | null)[]>([]);
  const reduced = useReducedMotion();
  const onScreen = useOnScreen(rootRef);
  const playing = !reduced && onScreen && !held.hover && !held.focus;
  const commit = viewModel.session.git?.commits?.[0];

  // The camera: the track slides so the beat at hand sits in the middle of the stage, never past either end.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    const target = beatRefs.current[beat];
    if (!stage || !track || !target) return;
    const place = () => {
      const room = Math.max(0, track.scrollHeight - stage.clientHeight);
      // a beat taller than the stage is read from its top; any other sits in the middle
      const inset = parseFloat(getComputedStyle(track).paddingTop) || 0;
      const aim =
        target.offsetHeight + 2 * inset > stage.clientHeight
          ? target.offsetTop - inset
          : target.offsetTop + target.offsetHeight / 2 - stage.clientHeight / 2;
      track.style.transform = `translateY(${-Math.min(room, Math.max(0, aim))}px)`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(stage);
    observer.observe(track);
    return () => observer.disconnect();
  }, [beat]);

  function choose(index: number) {
    setBeat(index);
    setRound((value) => value + 1);
  }

  const turnOf = (index: number): TurnVM | undefined => viewModel.turns.find((turn) => turn.index === index);

  function render(item: ReelBeat): ReactNode {
    const tool = item.tool ? viewModel.toolCallsById.get(item.tool) : undefined;
    if (tool) {
      return (
        <div className="reel-tool">
          <TranscriptToolCall tool={tool} open />
          {item.id === "change" && commit ? (
            <MetaItem icon={GitCommitHorizontal} value={commit.shortHash} className="reel-commit">
              {commit.message}
            </MetaItem>
          ) : null}
        </div>
      );
    }
    const turn = turnOf(item.turn);
    return turn ? <TranscriptTurnCard turn={turn} compact /> : null;
  }

  return (
    <div
      ref={rootRef}
      className="reel"
      data-reel
      data-playing={playing ? "true" : "false"}
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
        <span className="reel-meta">
          <ProviderName harness={session.harness ?? "claude-code"} />
          {session.outcome ? <TranscriptOutcomeChip outcome={session.outcome} /> : null}
        </span>
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
            type="button"
            className="reel-seg"
            aria-label={`show ${item.label}`}
            aria-current={index === beat ? "true" : undefined}
            data-state={index < beat ? "done" : index === beat ? "on" : "next"}
            onClick={() => choose(index)}
          >
            <span className="reel-seg-track">
              {index === beat && !reduced ? (
                <span
                  key={round}
                  className="reel-seg-fill"
                  style={{ animationDuration: `${BEAT_MS}ms` }}
                  onAnimationEnd={() => setBeat((current) => (current + 1) % beats.length)}
                />
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
