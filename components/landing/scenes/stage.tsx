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
/*
 * On a phone the scenes lay out on a smaller screen of the same shape as the
 * phone's view, so the camera shows them near their own size and the words
 * stay readable; the scene CSS reflows the windows for it ([data-compact]).
 */
const COMPACT = { width: 360, height: 316 } as const;
/* a view narrower than this plays the compact screen */
const COMPACT_BELOW = 560;

type Screen = Readonly<{ width: number; height: number }>;

/* moves across the screen, and the settle into a held framing */
const EASE_MOVE = "cubic-bezier(0.77, 0, 0.175, 1)";
const EASE_SETTLE = "cubic-bezier(0.23, 1, 0.32, 1)";
/* a hand's move from one control to the next: eases out of rest and into the target */
const EASE_GLIDE = "cubic-bezier(0.45, 0, 0.2, 1)";
/* how long a part pushed along by new content takes to glide to its new place */
const FLIP_MS = 360;
/*
 * A take loops while it plays: its finished frame rests a moment, then the
 * screen dips out, the scene starts over out of sight, and the screen comes
 * back in on its first frame, so the seam is a short fade, never a cut.
 */
const LOOP_REST = 1200;
const DIP_OUT = 240;
const DIP_IN = 360;
/* how long a new round waits out of sight for its first frame to render before the camera frames it */
const DIP_SETTLE = 80;

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

function frameFor(box: Box, view: { w: number; h: number }, fill: number, screen: Screen, least = 0) {
  const fit = Math.min((view.w * fill) / box.w, (view.h * fill) / box.h, MAX_ZOOM);
  const scale = Math.max(fit, least);
  // a box too big to show whole at the least scale is read from its top left, the way a reader comes to it
  const marginX = (view.w * (1 - fill)) / 2;
  const marginY = (view.h * (1 - fill)) / 2;
  const left = box.w * scale > view.w - 2 * marginX ? marginX - box.x * scale : view.w / 2 - (box.x + box.w / 2) * scale;
  const top = box.h * scale > view.h - 2 * marginY ? marginY - box.y * scale : view.h / 2 - (box.y + box.h / 2) * scale;
  const x = keepInside(left, view.w, screen.width * scale);
  const y = keepInside(top, view.h, screen.height * scale);
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

/*
 * The camera never pulls back so far that words drop below reading size: the
 * smallest type in a scene is 13px (the system chrome and the terminal), and
 * it must read at 14px or more on a wide screen and 12px or more on a phone.
 * A scene is never shown whole at a smaller scale; the camera frames the part
 * that matters at that size instead.
 */
const SMALLEST_TYPE = 13;
const READ_AT = { wide: 14, phone: 12 } as const;

/*
 * A framing never shows a menu-bar word cut at its edge: an item the framing
 * would cut, across or along it, fades out, and fades back in once a framing
 * takes it in whole.
 */
function settleMenuBar(camera: HTMLElement, transform: string, view: { w: number; h: number }) {
  const lens = new DOMMatrix(transform);
  if (!lens.a) return;
  const from = { x: -lens.e / lens.a, y: -lens.f / lens.d };
  const to = { x: (view.w - lens.e) / lens.a, y: (view.h - lens.f) / lens.d };
  for (const item of camera.querySelectorAll<HTMLElement>(".mac-menubar > span:not(.mac-menu-end), .mac-menu-end > *")) {
    const at = layoutOffset(item, camera);
    const cut =
      at.x < from.x - 0.5 ||
      at.x + item.offsetWidth > to.x + 0.5 ||
      at.y < from.y - 0.5 ||
      at.y + item.offsetHeight > to.y + 0.5
        ? "true"
        : "false";
    if (item.dataset.cut !== cut) item.dataset.cut = cut;
  }
}

/*
 * A target inside a page that scrolls ([data-scroll], overflow hidden) and
 * out of its view is scrolled into the middle of it, smoothly, the way a
 * reader scrolls down a page; the box returned is where it will be once the
 * scroll ends, so the camera arrives with it.
 */
function scrollIntoPage(camera: HTMLElement, focus: string, box: Box): Box {
  const target = targetOf(camera, focus);
  const page = target?.closest<HTMLElement>("[data-scroll]");
  if (!target || !page) return box;
  const inPage = layoutOffset(target, page).y;
  const wanted = Math.max(0, Math.min(page.scrollHeight - page.clientHeight, inPage + target.offsetHeight / 2 - page.clientHeight / 2));
  const shift = wanted - page.scrollTop;
  if (Math.abs(shift) < 1) return box;
  page.scrollTo({ top: wanted, behavior: "smooth" });
  return { ...box, y: box.y - shift };
}

/* the element a focus names: a name marked with data-focus, or a selector into a component's own markup */
function targetOf(screen: HTMLElement, focus: string) {
  if (focus === "all") return null;
  const selector = /^[.[]/.test(focus) ? focus : `[data-focus="${focus}"]`;
  return screen.querySelector<HTMLElement>(selector);
}

/* where an element sits on the virtual screen, whatever the camera is doing right now */
function boxOf(screen: HTMLElement, focus: string): Box {
  const whole = { x: 0, y: 0, w: screen.offsetWidth, h: screen.offsetHeight };
  if (focus === "all") return whole;
  const target = targetOf(screen, focus);
  if (!target) return whole;
  const screenBox = screen.getBoundingClientRect();
  const scale = screenBox.width / (screen.offsetWidth || 1) || 1;
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
 * The take loops while it plays: each round starts the scene over on a fresh
 * mount of its screen, so every part is back in its first state.
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
  /**
   * The take plays, looping, while this is true: it starts the first time the
   * scene can be seen, and holds exactly where it is whenever it is false (off
   * screen, or the reader's keyboard on it), then carries on.
   */
  playing: boolean;
  reduced: boolean;
}) {
  const viewRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const flipFrom = useRef(new Map<string, { x: number; y: number }>());
  const holdTake = useRef<((held: boolean) => void) | null>(null);
  const playingNow = useRef(playing);
  const [phase, setPhase] = useState(reduced ? scene.finalPhase : 0);
  // each round of a looping take renders the scene on a fresh mount
  const [round, setRound] = useState(0);
  // A take starts the first time the scene can be seen; after that, it holds while it cannot be.
  const [started, setStarted] = useState(false);
  if (playing && !started && !reduced) setStarted(true);
  const [compact, setCompact] = useState(false);
  const screen: Screen = compact ? COMPACT : SCREEN;

  // A phone's view plays the compact screen; measured before the first paint, and again on resize.
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const measure = () => setCompact(view.clientWidth > 0 && view.clientWidth < COMPACT_BELOW);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    return () => observer.disconnect();
  }, []);

  const viewSize = useCallback(() => {
    const view = viewRef.current;
    return { w: view?.clientWidth ?? screen.width, h: view?.clientHeight ?? screen.height };
  }, [screen]);

  const frame = useCallback(
    (focus: string, fill: number, width?: number, cropBelow = Infinity) => {
      const camera = cameraRef.current;
      if (!camera) return "none";
      const box = scrollIntoPage(camera, focus, boxOf(camera, focus));
      const view = viewSize();
      const whole = Math.min((view.w * fill) / box.w, (view.h * fill) / box.h);
      // the compact screen is laid out to be read whole, so it never needs a row cropped to its start
      const crop = !compact && width !== undefined && box.w > width && whole < cropBelow;
      const least = (compact ? READ_AT.phone : READ_AT.wide) / SMALLEST_TYPE;
      const to = frameFor(crop ? { ...box, w: width } : box, view, fill, screen, least);
      settleMenuBar(camera, to, view);
      return to;
    },
    [viewSize, compact, screen],
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
  // A change of screen size, or a new round, is a new layout, not a move: it is recorded, never animated.
  const flipLayout = useRef(`${compact}/${round}`);
  useLayoutEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const layout = `${compact}/${round}`;
    const relaid = flipLayout.current !== layout;
    flipLayout.current = layout;
    const now = new Map<string, { x: number; y: number }>();
    for (const element of screen.querySelectorAll<HTMLElement>("[data-flip]")) {
      const key = element.dataset.flip!;
      const at = layoutOffset(element, screen);
      now.set(key, at);
      const was = flipFrom.current.get(key);
      if (relaid || reduced || !started || !was || (was.x === at.x && was.y === at.y)) continue;
      element.animate(
        [{ transform: `translate(${was.x - at.x}px, ${was.y - at.y}px)` }, { transform: "none" }],
        { duration: FLIP_MS, easing: EASE_MOVE },
      );
    }
    flipFrom.current = now;
  }, [phase, reduced, started, compact, round]);

  // Hold the take, and the scene's own short animations, whenever it is not playing.
  useEffect(() => {
    playingNow.current = playing;
    holdTake.current?.(!playing);
    const view = viewRef.current;
    if (view) view.dataset.paused = String(!playing);
  }, [playing]);

  // One take: the scene's beats, the camera moves and the cursor, on one clock, round after round.
  useEffect(() => {
    if (reduced || !started) return;
    const camera = cameraRef.current;
    const cursor = cursorRef.current;
    if (!camera) return;
    const running = new Set<Animation>();
    /*
     * The take's clock runs on animation frames and stands still while the take
     * is held, so every beat, camera move and pointer move resumes exactly where
     * it stopped; the moves already under way pause with it.
     */
    const pending: { at: number; run: () => void }[] = [];
    let elapsed = 0;
    let last = performance.now();
    let held = !playingNow.current;
    let tick = 0;
    const advance = (now: number) => {
      if (!held) elapsed += now - last;
      last = now;
      pending.sort((a, b) => a.at - b.at);
      while (pending.length && pending[0]!.at <= elapsed) pending.shift()!.run();
      tick = pending.length ? window.requestAnimationFrame(advance) : 0;
    };
    const at = (ms: number, run: () => void) => {
      pending.push({ at: ms, run });
      if (!tick) tick = window.requestAnimationFrame(advance);
    };
    const later = (ms: number, run: () => void) => at(elapsed + ms, run);
    holdTake.current = (hold) => {
      held = hold;
      running.forEach((animation) => (hold ? animation.pause() : animation.play()));
    };
    /* an animation the take holds and cancels with it; `done` runs as it ends */
    const play = (element: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions, done?: () => void) => {
      const animation = element.animate(keyframes, options);
      running.add(animation);
      animation.onfinish = () => {
        done?.();
        if (options.fill === "forwards") animation.cancel();
        running.delete(animation);
      };
      if (held) animation.pause();
      return animation;
    };

    // The pointer starts where the last take's pointer is, or where the last scene left it, and fades in there.
    // a scene's resting point is set on the full screen; the compact screen takes it in proportion
    const pointer = scene.cursor?.length ? cursor : null;
    const resting = scene.cursorFrom ?? [SCREEN.width * 0.82, SCREEN.height * 0.88];
    let here: readonly [number, number] = [
      (resting[0] * screen.width) / SCREEN.width,
      (resting[1] * screen.height) / SCREEN.height,
    ];
    let bend = 1;
    let hovered: HTMLElement | null = null;
    if (pointer) {
      const view = viewRef.current;
      const handed = lastPointer && view ? onScreenPoint(lastPointer.cursor, lastPointer.view) : null;
      if (handed) {
        const lens = new DOMMatrix(getComputedStyle(camera).transform);
        const point = lens.inverse().transformPoint(new DOMPoint(handed.x, handed.y));
        here = [point.x, point.y];
      }
      if (view) lastPointer = { cursor: pointer, view };
      pointer.style.transform = `translate(${here[0]}px, ${here[1]}px)`;
      pointer.dataset.shape = "arrow";
      play(pointer, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: EASE_SETTLE });
      pointer.style.opacity = "1";
    }

    /* one round of the take from `start` on its clock; as it ends, the next one is set up */
    const playRound = (start: number) => {
      for (const cue of scene.cues) at(start + cue.at, () => setPhase(cue.phase));

      for (const shot of scene.shots) {
        at(start + shot.at, () => {
          const from = getComputedStyle(camera).transform;
          const to = frame(shot.focus, shot.fill ?? 0.94, shot.width, shot.cropBelow);
          play(
            camera,
            [{ transform: from }, { transform: to }],
            { duration: shot.move, easing: shot.ease === "settle" ? EASE_SETTLE : EASE_MOVE, fill: "forwards" },
            () => (camera.style.transform = to),
          );
        });
      }

      for (const cue of pointer ? scene.cursor! : []) {
        at(start + cue.at, () => {
          const target = targetOf(camera, cue.to);
          const box = scrollIntoPage(camera, cue.to, boxOf(camera, cue.to));
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
          if (pointer!.dataset.shape !== "arrow" && cue.shape !== "ibeam") {
            later(cue.move * 0.15, () => (pointer!.dataset.shape = "arrow"));
          }
          play(pointer!, frames, { duration: cue.move, easing: EASE_GLIDE, fill: "forwards" }, () => {
            pointer!.style.transform = frames.at(-1)!.transform;
            if (cue.shape === "ibeam") pointer!.dataset.shape = "ibeam";
            if (target) {
              target.dataset.hover = "true";
              hovered = target;
            }
            if (!cue.press) return;
            // after a short hover, a click: the pointer dips and the control gives way under it
            later(cue.hover ?? 200, () => {
              for (const [element, depth] of [
                [pointer!.querySelector<HTMLElement>(".scn-pointer"), 0.82],
                [target, 0.97],
              ] as const) {
                if (!element) continue;
                play(element, [{ transform: "scale(1)" }, { transform: `scale(${depth})` }, { transform: "scale(1)" }], {
                  duration: 240,
                  easing: EASE_SETTLE,
                });
              }
            });
          });
        });
      }

      // The finished frame rests; then the screen dips out, and the scene starts over out of sight.
      // The pointer stays where the hand left it, and sets off from there in the next round.
      const end = start + scene.duration + LOOP_REST;
      at(end, () => {
        camera.style.opacity = "0";
        play(camera, [{ opacity: 1 }, { opacity: 0 }], { duration: DIP_OUT, easing: EASE_MOVE });
      });
      at(end + DIP_OUT, () => {
        running.forEach((animation) => animation.cancel());
        running.clear();
        if (hovered) {
          delete hovered.dataset.hover;
          hovered = null;
        }
        if (pointer) {
          pointer.style.transform = `translate(${here[0]}px, ${here[1]}px)`;
          pointer.dataset.shape = "arrow";
        }
        setPhase(0);
        setRound((value) => value + 1);
      });
      // once the first frame has rendered, the next round frames it and the screen comes back in
      at(end + DIP_OUT + DIP_SETTLE, () => {
        playRound(elapsed);
        at(elapsed, () => {
          camera.style.opacity = "";
          play(camera, [{ opacity: 0 }, { opacity: 1 }], { duration: DIP_IN, easing: EASE_SETTLE });
        });
      });
    };
    playRound(0);

    return () => {
      window.cancelAnimationFrame(tick);
      holdTake.current = null;
      running.forEach((animation) => animation.cancel());
      camera.style.opacity = "";
      camera.querySelectorAll<HTMLElement>("[data-hover]").forEach((element) => delete element.dataset.hover);
    };
  }, [scene, started, reduced, frame, screen]);

  const Render = scene.Render;

  return (
    <div className="scn-view" ref={viewRef} data-round={round}>
      <div
        className="scn-camera"
        ref={cameraRef}
        data-compact={compact ? "true" : undefined}
        style={{ width: screen.width, height: screen.height }}
      >
        <div className="scn-screen" ref={screenRef} inert aria-hidden="true">
          <Render key={round} phase={reduced ? scene.finalPhase : phase} />
        </div>
        {scene.cursor?.length && !reduced ? (
          <div className="scn-cursor" ref={cursorRef} aria-hidden="true">
            {/* the macOS pointers: the arrow, its tip on the point, and the I-beam, centred on it */}
            <svg className="scn-pointer scn-arrow" viewBox="0 0 14 22">
              <path d="M1.5 1.4v16.1l3.9-3.7 2.5 5.9 2.8-1.2-2.5-5.8h5.4z" />
            </svg>
            <svg className="scn-pointer scn-ibeam" viewBox="0 0 10 20">
              <path
                className="scn-ibeam-edge"
                d="M1.5 1.5h2c.8 0 1.5.5 1.5 1.2 0-.7.7-1.2 1.5-1.2h2M5 2.7v14.6M1.5 18.5h2c.8 0 1.5-.5 1.5-1.2 0 .7.7 1.2 1.5 1.2h2"
              />
              <path d="M1.5 1.5h2c.8 0 1.5.5 1.5 1.2 0-.7.7-1.2 1.5-1.2h2M5 2.7v14.6M1.5 18.5h2c.8 0 1.5-.5 1.5-1.2 0 .7.7 1.2 1.5 1.2h2" />
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  );
}
