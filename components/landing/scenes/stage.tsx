"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";

/** The virtual screen every scene is laid out on, in CSS pixels, before the camera scales it: a Mac's desktop. */
export const SCREEN = { width: 1120, height: 700 } as const;

/* moves across the screen, and the settle into a held framing */
const EASE_MOVE = "cubic-bezier(0.77, 0, 0.175, 1)";
const EASE_SETTLE = "cubic-bezier(0.23, 1, 0.32, 1)";

/**
 * A camera move: at `at` ms the camera frames the element marked
 * `data-focus="<focus>"`, or matched by a selector starting with "." or "[",
 * or the whole screen ("all"), over `move` ms. Framing
 * is measured when the move starts, so it follows whatever the scene has
 * rendered by then.
 */
export type Shot = Readonly<{
  at: number;
  focus: string;
  move: number;
  ease?: "move" | "settle";
  /** how much of the view the framed element may fill, 0..1 */
  fill?: number;
  /** frame at most this much of the element's width, from its left edge, so a wide row can be read on a phone */
  width?: number;
  /** crop to `width` only when the whole element would be framed smaller than this scale; by default it always crops */
  cropBelow?: number;
}>;

/** A beat of the scene's own state: from `at` ms the scene renders `phase`. */
export type Cue = Readonly<{ at: number; phase: number }>;

/** A cursor move to an element marked `data-focus`, pressing it when it arrives. */
export type CursorCue = Readonly<{ at: number; to: string; move: number; press?: boolean }>;

export type SceneDefinition = Readonly<{
  id: string;
  duration: number;
  /** the phase the scene rests on: its finished frame */
  finalPhase: number;
  cues: readonly Cue[];
  shots: readonly Shot[];
  cursor?: readonly CursorCue[];
  /** how the finished frame is framed when nothing moves */
  finalFocus: string;
  finalFill?: number;
  Render: ComponentType<{ phase: number }>;
}>;

type Box = { x: number; y: number; w: number; h: number };

/* the closest the camera goes: past this a short line would fill the window */
const MAX_ZOOM = 2.6;

function frameFor(box: Box, view: { w: number; h: number }, fill: number) {
  const scale = Math.min((view.w * fill) / box.w, (view.h * fill) / box.h, MAX_ZOOM);
  const x = view.w / 2 - (box.x + box.w / 2) * scale;
  const y = view.h / 2 - (box.y + box.h / 2) * scale;
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

/* where an element sits on the virtual screen, whatever the camera is doing right now */
function boxOf(screen: HTMLElement, focus: string): Box {
  if (focus === "all") return { x: 0, y: 0, w: SCREEN.width, h: SCREEN.height };
  // a name marked with data-focus, or a selector into a component's own markup
  const selector = /^[.[]/.test(focus) ? focus : `[data-focus="${focus}"]`;
  const target = screen.querySelector<HTMLElement>(selector);
  if (!target) return { x: 0, y: 0, w: SCREEN.width, h: SCREEN.height };
  const screenBox = screen.getBoundingClientRect();
  const scale = screenBox.width / SCREEN.width || 1;
  const box = target.getBoundingClientRect();
  return {
    x: (box.left - screenBox.left) / scale,
    y: (box.top - screenBox.top) / scale,
    w: box.width / scale,
    h: box.height / scale,
  };
}

/**
 * Plays one scene: the real components it renders sit on a fixed virtual
 * screen, and a camera (one transform on one wrapper, animated with WAAPI)
 * frames them, zooming in on what matters and pulling out again. Each move
 * starts from wherever the camera is, so the take is one continuous shot.
 * The component text is DOM, so it stays sharp at every zoom.
 *
 * Under reduced motion nothing moves: the scene renders its finished phase,
 * framed on its final focus. A new take is a new mount (the caller keys it).
 */
export function SceneStage({
  scene,
  playing,
  reduced,
}: {
  scene: SceneDefinition;
  /** false holds the scene on its first frame until it can be seen; once started, a take runs to its end */
  playing: boolean;
  reduced: boolean;
}) {
  const viewRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(reduced ? scene.finalPhase : 0);
  // A take starts the first time the scene can be seen, and is not stopped by scrolling away.
  const [started, setStarted] = useState(false);
  if (playing && !started && !reduced) setStarted(true);

  const viewSize = useCallback(() => {
    const view = viewRef.current;
    return { w: view?.clientWidth ?? SCREEN.width, h: view?.clientHeight ?? SCREEN.height };
  }, []);

  const frame = useCallback(
    (focus: string, fill: number, width?: number, cropBelow = Infinity) => {
      const camera = cameraRef.current;
      if (!camera) return "none";
      const box = boxOf(camera, focus);
      const view = viewSize();
      const whole = Math.min((view.w * fill) / box.w, (view.h * fill) / box.h);
      const crop = width !== undefined && box.w > width && whole < cropBelow;
      return frameFor(crop ? { ...box, w: width } : box, view, fill);
    },
    [viewSize],
  );

  // The resting frame: reduced motion, before a take, and after any resize.
  const rest = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.style.transform = reduced
      ? frame(scene.finalFocus, scene.finalFill ?? 0.94)
      : frame(scene.shots[0]?.focus ?? "all", scene.shots[0]?.fill ?? 0.94);
  }, [frame, reduced, scene]);

  useLayoutEffect(() => {
    // once a take runs, the camera is the take's: a beat of the scene must not snap it back to the opening frame
    if (reduced || !started) rest();
    // the framing is measured on the real text, so it is taken again once the fonts arrive
    let live = true;
    document.fonts?.ready.then(() => {
      if (live && (reduced || !started)) rest();
    });
    const view = viewRef.current;
    if (!view) return;
    const observer = new ResizeObserver(() => {
      if (reduced || !started) rest();
    });
    observer.observe(view);
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [rest, reduced, started, phase]);

  // One take: the scene's beats, the camera moves and the cursor, on one clock.
  useEffect(() => {
    if (reduced || !started) return;
    const camera = cameraRef.current;
    const cursor = cursorRef.current;
    if (!camera) return;
    const timers: number[] = [];
    const running = new Set<Animation>();
    const at = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));

    for (const cue of scene.cues) at(cue.at, () => setPhase(cue.phase));

    for (const shot of scene.shots) {
      at(shot.at, () => {
        const from = getComputedStyle(camera).transform;
        const to = frame(shot.focus, shot.fill ?? 0.94, shot.width, shot.cropBelow);
        const animation = camera.animate([{ transform: from }, { transform: to }], {
          duration: shot.move,
          easing: shot.ease === "settle" ? EASE_SETTLE : EASE_MOVE,
          fill: "forwards",
        });
        running.add(animation);
        animation.onfinish = () => {
          camera.style.transform = to;
          animation.cancel();
          running.delete(animation);
        };
      });
    }

    if (cursor && scene.cursor?.length) {
      cursor.style.opacity = "0";
      for (const [index, cue] of scene.cursor.entries()) {
        at(cue.at, () => {
          const box = boxOf(camera, cue.to);
          const to = `translate(${box.x + box.w / 2}px, ${box.y + box.h / 2}px)`;
          const from = index === 0 ? `translate(${SCREEN.width * 0.9}px, ${SCREEN.height * 0.95}px)` : getComputedStyle(cursor).transform;
          cursor.style.opacity = "1";
          const animation = cursor.animate([{ transform: from }, { transform: to }], {
            duration: cue.move,
            easing: EASE_MOVE,
            fill: "forwards",
          });
          running.add(animation);
          animation.onfinish = () => {
            cursor.style.transform = to;
            animation.cancel();
            running.delete(animation);
            // a press is the arrow dipping, the way a click feels, with nothing drawn around it
            const arrow = cursor.firstElementChild;
            if (cue.press && arrow) {
              const press = arrow.animate(
                [{ transform: "scale(1)" }, { transform: "scale(0.82)" }, { transform: "scale(1)" }],
                { duration: 240, easing: EASE_SETTLE },
              );
              running.add(press);
              press.onfinish = () => running.delete(press);
            }
          };
        });
      }
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      running.forEach((animation) => animation.cancel());
    };
  }, [scene, started, reduced, frame]);

  const Render = scene.Render;

  return (
    <div className="scn-view" ref={viewRef}>
      <div className="scn-camera" ref={cameraRef} style={{ width: SCREEN.width, height: SCREEN.height }}>
        <div className="scn-screen" inert aria-hidden="true">
          <Render phase={reduced ? scene.finalPhase : phase} />
        </div>
        {scene.cursor?.length && !reduced ? (
          <div className="scn-cursor" ref={cursorRef} aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M2 1.5v12l3.3-3.1 2.2 4.6 2-.9-2.2-4.5H12z" />
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  );
}
