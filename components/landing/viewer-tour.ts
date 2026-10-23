import { arc, EASE_MOVE, EASE_SETTLE, pointAt, PRESS, type Point } from "@/components/landing/pointer";

/* what the pointer rests on is lit the way a selection is, with no node added to the viewer's own markup */
const LIGHT = "tour-point";

function light(range: Range | undefined) {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
  if (range) CSS.highlights.set(LIGHT, new Highlight(range));
  else CSS.highlights.delete(LIGHT);
}

/** Thrown into a walk the moment its tour stops, so the walk ends wherever it is. */
class Stopped extends Error {}

type Target = Element | Range;

function boxOf(target: Target, part: "whole" | "end") {
  if (part === "whole" || target instanceof Element) return target.getBoundingClientRect();
  const lines = target.getClientRects();
  return lines[lines.length - 1] ?? target.getBoundingClientRect();
}

/* the nearest box around a node that scrolls along an axis, inside the tour's own window */
function scrollerOf(node: Node, root: HTMLElement, axis: "x" | "y") {
  for (let element = node instanceof Element ? node : node.parentElement; element && element !== root; ) {
    const style = getComputedStyle(element);
    const overflow = axis === "y" ? style.overflowY : style.overflowX;
    const room = axis === "y" ? element.scrollHeight - element.clientHeight : element.scrollWidth - element.clientWidth;
    if (/auto|scroll/.test(overflow) && room > 1) return element as HTMLElement;
    element = element.parentElement;
  }
  return null;
}

/**
 * A guided tour of a live interface, played by a macOS pointer over it: the
 * pointer moves on curved paths, rests on what matters (lit like a
 * selection), and presses real controls, which really click. The camera is
 * the interface's own scrolling, eased to each stop.
 *
 * Every wait and motion is an animation on one clock, so a tour pauses and
 * resumes as a whole; stopping it cancels them all and throws into the walk,
 * which ends there. A tour never takes the reader's own input: whoever drives
 * it stops it on the reader's first press, scroll, touch or key.
 */
export class Tour {
  private running = new Set<Animation>();
  private stopped = false;
  private paused = false;
  private at: Point | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly pointer: HTMLElement,
  ) {}

  get over() {
    return this.stopped;
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    for (const animation of this.running) animation.cancel();
    this.running.clear();
    light(undefined);
    this.root.dataset.touring = "false";
  }

  pause() {
    this.paused = true;
    for (const animation of this.running) if (animation.playState === "running") animation.pause();
  }

  resume() {
    this.paused = false;
    for (const animation of this.running) if (animation.playState === "paused") animation.play();
  }

  private track(animation: Animation) {
    if (this.stopped) {
      animation.cancel();
      return Promise.reject(new Stopped());
    }
    this.running.add(animation);
    if (this.paused) animation.pause();
    return animation.finished.then(
      () => {
        this.running.delete(animation);
        if (this.stopped) throw new Stopped();
      },
      () => {
        this.running.delete(animation);
        throw new Stopped();
      },
    );
  }

  /** Waits on the tour's clock, so a hold pauses with everything else. */
  hold(ms: number) {
    return this.track(this.root.animate([], { duration: ms }));
  }

  /* the part of a target the reader can see: its box cut by every box around it that clips, up to the window */
  private visible(target: Target, part: "whole" | "end") {
    const rect = boxOf(target, part);
    let [left, top, right, bottom] = [rect.left, rect.top, rect.right, rect.bottom];
    const start = target instanceof Element ? target.parentElement : target.startContainer.parentElement;
    for (let element = start; element; element = element.parentElement) {
      const style = getComputedStyle(element);
      if (style.overflowX !== "visible" || style.overflowY !== "visible") {
        const frame = element.getBoundingClientRect();
        [left, top, right, bottom] = [
          Math.max(left, frame.left),
          Math.max(top, frame.top),
          Math.min(right, frame.right),
          Math.min(bottom, frame.bottom),
        ];
      }
      if (element === this.root) break;
    }
    return right > left && bottom > top ? new DOMRect(left, top, right - left, bottom - top) : rect;
  }

  private place(target: Target, part: "whole" | "end"): Point {
    const box = this.root.getBoundingClientRect();
    const rect = this.visible(target, part);
    // a control is pressed in its middle; a run of text is pointed at from its end, the arrow hanging clear of it
    return part === "end"
      ? { x: rect.right - box.left - Math.min(6, rect.width * 0.1), y: rect.top - box.top + rect.height * 0.7 }
      : { x: rect.left - box.left + rect.width * 0.5, y: rect.top - box.top + rect.height * 0.6 };
  }

  /** The pointer fades in at the window's lower right, where a hand would come in from. */
  async appear() {
    const box = this.root.getBoundingClientRect();
    this.at = { x: box.width * 0.84, y: box.height * 0.82 };
    this.pointer.style.transform = pointAt(this.at, this.pointer.offsetWidth);
    this.root.dataset.touring = "true";
    await this.hold(420);
  }

  async vanish() {
    light(undefined);
    this.root.dataset.touring = "false";
    await this.hold(300);
  }

  /** Moves the pointer on a shallow arc to a control or a run of text, at a pace that grows with the distance. */
  async move(target: Target, part: "whole" | "end" = "whole") {
    const size = this.pointer.offsetWidth;
    const to = this.place(target, part);
    const from = this.at ?? to;
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    this.at = to;
    if (distance < 2) return;
    const animation = this.pointer.animate(arc(from, to, size), {
      duration: Math.min(1100, 420 + distance * 0.9),
      easing: EASE_MOVE,
      fill: "forwards",
    });
    await this.track(animation);
    this.pointer.style.transform = pointAt(to, size);
    animation.cancel();
  }

  /** Rests on a run of text, lit, for a while. */
  async rest(range: Range, ms: number) {
    await this.move(range, "end");
    light(range);
    await this.hold(ms);
    light(undefined);
  }

  /** A press: the arrow dips toward its tip and the control gives way under it, and the control really clicks. */
  async press(control: HTMLElement) {
    await this.move(control);
    const arrow = this.pointer.firstElementChild!;
    const dip = (element: Element, depth: number) =>
      this.track(
        element.animate([{ transform: "scale(1)" }, { transform: `scale(${depth})` }, { transform: "scale(1)" }], {
          duration: PRESS.duration,
          easing: EASE_SETTLE,
        }),
      );
    const done = Promise.all([dip(arrow, PRESS.arrow), dip(control, PRESS.control)]);
    done.catch(() => {});
    await this.hold(PRESS.duration / 2);
    control.click();
    await done;
  }

  /**
   * The camera: the interface's own scrolling brings a target into view,
   * easing there, the vertical stop `at` that share of the way down.
   */
  async reveal(target: Target, at = 0.32) {
    const node = target instanceof Element ? target : target.startContainer;
    const rect = boxOf(target, "end");
    const moves: Promise<unknown>[] = [];
    const down = scrollerOf(node, this.root, "y");
    if (down) {
      const frame = down.getBoundingClientRect();
      const top = down.scrollTop + rect.top - frame.top - down.clientHeight * at;
      const goal = Math.max(0, Math.min(down.scrollHeight - down.clientHeight, top));
      if (Math.abs(goal - down.scrollTop) > 4) moves.push(this.glide(down, { top: goal }));
    }
    const across = scrollerOf(node, this.root, "x");
    if (across) {
      const frame = across.getBoundingClientRect();
      if (rect.right > frame.right - 12 || rect.left < frame.left) {
        const goal = across.scrollLeft + rect.right - frame.right + 24;
        moves.push(this.glide(across, { left: Math.max(0, goal) }));
      }
    }
    await Promise.all(moves);
  }

  private async glide(scroller: HTMLElement, to: ScrollToOptions) {
    const ended = new Promise<void>((resolve) => scroller.addEventListener("scrollend", () => resolve(), { once: true }));
    scroller.scrollTo({ ...to, behavior: "smooth" });
    // a smooth scroll that never reports its end is let go after a second
    const timeout = this.hold(1000);
    timeout.catch(() => {});
    await Promise.race([ended, timeout]);
    if (this.stopped) throw new Stopped();
  }
}

/**
 * A run of text inside a part of the interface that is on screen now, or the
 * contents of the first part a selector (starting with "." or "[") names, or
 * undefined.
 */
export function textIn(scope: Element | null, text: string): Range | undefined {
  if (!scope) return undefined;
  if (/^[.[]/.test(text)) {
    const part = [...scope.querySelectorAll(text)].find((element) => element.getClientRects().length);
    if (!part) return undefined;
    const range = document.createRange();
    range.selectNodeContents(part);
    return range;
  }
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const index = node.textContent?.indexOf(text) ?? -1;
    if (index < 0) continue;
    const range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + text.length);
    if (range.getClientRects().length) return range;
  }
  return undefined;
}

export { Stopped };
