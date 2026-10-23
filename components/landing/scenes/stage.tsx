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
/* a hand's move from one control to the next: eases out of rest and into the target */
const EASE_GLIDE = "cubic-bezier(0.45, 0, 0.2, 1)";
/* how long a part pushed along by new content takes to glide to its new place */
const FLIP_MS = 360;

/* where an element sits on the virtual screen by layout alone, whatever transforms are running */
function layoutOffset(element: HTMLElement, screen: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== screen) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

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

/**
 * A move of the pointer to an element (a `data-focus` name or a selector), on
 * a gently curved path. On arrival the target shows its hover state for
 * `hover` ms; with `press` the pointer then clicks it. `shape` is the pointer
 * it shows over the target: the I-beam over text it will type into. `aim`
 * picks the point within the target, as fractions of its box.
 */
export type CursorCue = Readonly<{
  at: number;
  to: string;
  move: number;
  press?: boolean;
  hover?: number;
  shape?: "arrow" | "ibeam";
  aim?: readonly [number, number];
}>;

export type SceneDefinition = Readonly<{
  id: string;
  duration: number;
  /** the phase the scene rests on: its finished frame */
  finalPhase: number;
  cues: readonly Cue[];
  shots: readonly Shot[];
  cursor?: readonly CursorCue[];
  /** where the pointer rests as the take begins, on the virtual screen: where the last scene left it */
  cursorFrom?: readonly [number, number];
  /** how the finished frame is framed when nothing moves */
  finalFocus: string;
  finalFill?: number;
  Render: ComponentType<{ phase: number }>;
}>;

type Box = { x: number; y: number; w: number; h: number };

/*
 * The pointer is one hand across the scenes: a take starts its pointer where
 * the last take's pointer is on screen right now, so a change of step hands it
 * over in place instead of jumping. The scenes share one view, so a point on
 * screen is the same point for both.
 */
let lastPointer: { cursor: HTMLElement; view: HTMLElement } | null = null;

function onScreenPoint(cursor: HTMLElement, view: HTMLElement) {
  if (!cursor.isConnected || getComputedStyle(cursor).opacity === "0") return null;
  const point = cursor.getBoundingClientRect();
  const box = view.getBoundingClientRect();
  return { x: point.left - box.left, y: point.top - box.top };
}

/* the closest the camera goes: past this a short line would fill the window */
const MAX_ZOOM = 2.6;

/* the camera never looks past the screen's edges: a framing near an edge slides back inside it */
function keepInside(offset: number, view: number, screen: number) {
  if (screen <= view) return (view - screen) / 2;
  return Math.min(0, Math.max(view - screen, offset));
}

function frameFor(box: Box, view: { w: number; h: number }, fill: number) {
  const scale = Math.min((view.w * fill) / box.w, (view.h * fill) / box.h, MAX_ZOOM);
  const x = keepInside(view.w / 2 - (box.x + box.w / 2) * scale, view.w, SCREEN.width * scale);
  const y = keepInside(view.h / 2 - (box.y + box.h / 2) * scale, view.h, SCREEN.height * scale);
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

/* the element a focus names: a name marked with data-focus, or a selector into a component's own markup */
function targetOf(screen: HTMLElement, focus: string) {
  if (focus === "all") return null;
  const selector = /^[.[]/.test(focus) ? focus : `[data-focus="${focus}"]`;
  return screen.querySelector<HTMLElement>(selector);
}

/* where an element sits on the virtual screen, whatever the camera is doing right now */
function boxOf(screen: HTMLElement, focus: string): Box {
  if (focus === "all") return { x: 0, y: 0, w: SCREEN.width, h: SCREEN.height };
  const target = targetOf(screen, focus);
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
  const screenRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const flipFrom = useRef(new Map<string, { x: number; y: number }>());
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
    // once a take runs, the camera is the take's: a beat of the scene must not snap it back to the opening frame.
    // A take can start in the same render the stage mounts, so a camera with no framing yet gets its opening one.
    if (reduced || !started || !cameraRef.current?.style.transform) rest();
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

  // A part marked data-flip that a beat pushes along glides from where it was (FLIP), so nothing jumps.
  useLayoutEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const now = new Map<string, { x: number; y: number }>();
    for (const element of screen.querySelectorAll<HTMLElement>("[data-flip]")) {
      const key = element.dataset.flip!;
      const at = layoutOffset(element, screen);
      now.set(key, at);
      const was = flipFrom.current.get(key);
      if (reduced || !started || !was || (was.x === at.x && was.y === at.y)) continue;
      element.animate(
        [{ transform: `translate(${was.x - at.x}px, ${was.y - at.y}px)` }, { transform: "none" }],
        { duration: FLIP_MS, easing: EASE_MOVE },
      );
    }
    flipFrom.current = now;
  }, [phase, reduced, started]);

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
      // The pointer starts where the last take's pointer is, or where the last scene left it, and fades in there.
      let here = scene.cursorFrom ?? [SCREEN.width * 0.82, SCREEN.height * 0.88];
      const view = viewRef.current;
      const handed = lastPointer && view ? onScreenPoint(lastPointer.cursor, lastPointer.view) : null;
      if (handed) {
        const lens = new DOMMatrix(getComputedStyle(camera).transform);
        const point = lens.inverse().transformPoint(new DOMPoint(handed.x, handed.y));
        here = [point.x, point.y];
      }
      if (view) lastPointer = { cursor, view };
      let bend = 1;
      cursor.style.transform = `translate(${here[0]}px, ${here[1]}px)`;
      cursor.dataset.shape = "arrow";
      const fadeIn = cursor.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: EASE_SETTLE });
      running.add(fadeIn);
      cursor.style.opacity = "1";
      let hovered: HTMLElement | null = null;

      for (const cue of scene.cursor) {
        at(cue.at, () => {
          const target = targetOf(camera, cue.to);
          const box = boxOf(camera, cue.to);
          const [ax, ay] = cue.aim ?? [0.5, 0.5];
          const to: [number, number] = [box.x + box.w * ax, box.y + box.h * ay];
          const from = here;
          here = to;
          // a hand moves in a slight arc, alternating its side, never a ruler-straight line
          const dx = to[0] - from[0];
          const dy = to[1] - from[1];
          const lift = Math.hypot(dx, dy) * 0.12 * bend;
          bend = -bend;
          const control: [number, number] = [
            (from[0] + to[0]) / 2 - (dy / (Math.hypot(dx, dy) || 1)) * lift,
            (from[1] + to[1]) / 2 + (dx / (Math.hypot(dx, dy) || 1)) * lift,
          ];
          const frames = Array.from({ length: 13 }, (_, step) => {
            const t = step / 12;
            const x = (1 - t) ** 2 * from[0] + 2 * (1 - t) * t * control[0] + t ** 2 * to[0];
            const y = (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * control[1] + t ** 2 * to[1];
            return { transform: `translate(${x}px, ${y}px)` };
          });
          if (hovered) {
            delete hovered.dataset.hover;
            hovered = null;
          }
          // leaving a text field, the I-beam turns back into the arrow a moment after setting off
          if (cursor.dataset.shape !== "arrow" && cue.shape !== "ibeam") {
            timers.push(window.setTimeout(() => (cursor.dataset.shape = "arrow"), cue.move * 0.15));
          }
          const travel = cursor.animate(frames, { duration: cue.move, easing: EASE_GLIDE, fill: "forwards" });
          running.add(travel);
          travel.onfinish = () => {
            cursor.style.transform = frames.at(-1)!.transform;
            travel.cancel();
            running.delete(travel);
            if (cue.shape === "ibeam") cursor.dataset.shape = "ibeam";
            if (target) {
              target.dataset.hover = "true";
              hovered = target;
            }
            if (!cue.press) return;
            // after a short hover, a click: the pointer dips and the control gives way under it
            timers.push(
              window.setTimeout(() => {
                for (const [element, depth] of [
                  [cursor.querySelector<HTMLElement>(".scn-pointer"), 0.82],
                  [target, 0.97],
                ] as const) {
                  if (!element) continue;
                  const press = element.animate(
                    [{ transform: "scale(1)" }, { transform: `scale(${depth})` }, { transform: "scale(1)" }],
                    { duration: 240, easing: EASE_SETTLE },
                  );
                  running.add(press);
                  press.onfinish = () => running.delete(press);
                }
              }, cue.hover ?? 200),
            );
          };
        });
      }
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      running.forEach((animation) => animation.cancel());
      camera.querySelectorAll<HTMLElement>("[data-hover]").forEach((element) => delete element.dataset.hover);
    };
  }, [scene, started, reduced, frame]);

  const Render = scene.Render;

  return (
    <div className="scn-view" ref={viewRef}>
      <div className="scn-camera" ref={cameraRef} style={{ width: SCREEN.width, height: SCREEN.height }}>
        <div className="scn-screen" ref={screenRef} inert aria-hidden="true">
          <Render phase={reduced ? scene.finalPhase : phase} />
        </div>
        {scene.cursor?.length && !reduced ? (
          <div className="scn-cursor" ref={cursorRef} aria-hidden="true">
            {/* the macOS pointers: the arrow, its tip on the point, and the I-beam, centred on it */}
            <svg className="scn-pointer scn-arrow" viewBox="0 0 14 22">
              <path d="M1.5 1.4v16.1l3.9-3.7 2.5 5.9 2.8-1.2-2.5-5.8h5.4z" />
            </svg>
            <svg className="scn-pointer scn-ibeam" viewBox="0 0 10 20">
              <path d="M1.5 1.5h2c.8 0 1.5.5 1.5 1.2 0-.7.7-1.2 1.5-1.2h2M5 2.7v14.6M1.5 18.5h2c.8 0 1.5-.5 1.5-1.2 0 .7.7 1.2 1.5 1.2h2" />
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  );
}
