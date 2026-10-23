"use client";

import { PUBLISH_SCENE } from "@/components/landing/scenes/publish";
import { RECORD_SCENE } from "@/components/landing/scenes/record";
import { REVIEW_SCENE } from "@/components/landing/scenes/review";
import { SceneStage, type SceneDefinition } from "@/components/landing/scenes/stage";
import { useHeldProgress, useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { LandingIcon } from "@/components/landing/icons";
import { withCommands } from "@/components/landing/inline-code";
import { HOW } from "@/lib/landing";
import { useLayoutEffect, useRef, useState } from "react";

const SCENES: readonly SceneDefinition[] = [RECORD_SCENE, REVIEW_SCENE, PUBLISH_SCENE];

/**
 * How it works, told by scrolling. The section holds still while the page
 * scrolls through it, about one screen per step, and each step's scene plays
 * as it becomes the current one; after the third the page simply carries on.
 * Nothing hijacks the scroll: the section's scroll is cut in thirds, one per
 * step, so momentum, the keyboard and the scroll bar all work as usual.
 * Choosing a step scrolls to it. So the held section never looks frozen, the
 * current step's bar, along its bottom rule, fills with its third.
 *
 * The scenes have no controls: a take plays only while its screen can be
 * seen, and holds where it is while the reader's pointer or keyboard focus is
 * on it. The screen is one image to assistive technology, described by the
 * step at hand, and it takes focus so a keyboard can hold it too.
 *
 * The steps show their titles; only the current one opens its description,
 * and the last one closes as it does, both on one height transition. The list
 * holds the height of its tallest open state from the start, so nothing below
 * it moves, and the stepping follows the markers, never the list, so opening
 * and closing cannot feed back into which step is current.
 *
 * The three scenes are stacked in one screen and crossfade: the next one
 * starts its take from the first frame as it fades in, while the last one
 * fades out where it was, so a change of step never cuts.
 *
 * A phone holds the same way, the scene on top and the steps right under it;
 * the heading slides away under the header so the two fit the screen.
 *
 * Under reduced motion nothing is held: the three steps stack, each open,
 * beside its scene at its finished frame.
 */
export function HowItWorks({ title }: { title: string }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  /* one take counter per scene: a scene starts a fresh take each time it becomes current, and on replay */
  const [takes, setTakes] = useState<readonly number[]>(() => SCENES.map(() => 0));
  /* the reader's pointer or keyboard focus on the screen holds the take where it is */
  const [held, setHeld] = useState({ hover: false, focus: false });
  const [shown, setShown] = useState(active);
  if (shown !== active) {
    setShown(active);
    setTakes((current) => current.map((value, index) => (index === active ? value + 1 : value)));
  }
  const windowRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const onScreen = useOnScreen(windowRef, 0.4);

  // The scroll through the held section is cut in thirds, one per step; the current step's third fills its own bar.
  useHeldProgress(
    rootRef,
    (progress, sectionHeld) => {
      setActive(Math.min(SCENES.length - 1, Math.floor(progress * SCENES.length)));
      const root = rootRef.current;
      if (!root) return;
      root.querySelectorAll<HTMLElement>(".hw-step-fill").forEach((fill, index) => {
        const own = Math.min(1, Math.max(0, progress * SCENES.length - index));
        fill.style.transform = `scaleX(${own})`;
      });
      // from the moment the held block reaches the header until it lets go, the header stays (see app/landing.css)
      const pin = root.querySelector<HTMLElement>(".hw-pin");
      const reach = pin ? parseFloat(getComputedStyle(pin).top) || 0 : 0;
      const box = root.getBoundingClientRect();
      const holding = sectionHeld || (box.top <= reach + 1 && box.bottom > window.innerHeight);
      if (root.dataset.holding !== String(holding)) root.dataset.holding = String(holding);
    },
    !reduced,
  );

  // The list holds its tallest open state: every title, and the longest description open.
  // The heading's height is kept too, for a phone, where it slides away under the header.
  useLayoutEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const list = stepsRef.current;
    const head = headRef.current;
    if (!root || !list || !head) return;
    const measure = () => {
      const rows = [...list.children].map((item) => item.querySelector<HTMLElement>(".hw-step")?.offsetHeight ?? 0);
      const bodies = [...list.querySelectorAll<HTMLElement>(".hw-step-body")].map((body) => body.scrollHeight);
      const rules = list.offsetHeight - list.clientHeight + list.children.length;
      root.style.setProperty(
        "--hw-steps-h",
        `${rows.reduce((sum, row) => sum + row, 0) + Math.max(0, ...bodies) + rules}px`,
      );
      const gap = parseFloat(getComputedStyle(head.parentElement!).rowGap) || 0;
      root.style.setProperty("--hw-head-h", `${head.offsetHeight + gap}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(head);
    return () => observer.disconnect();
  }, [reduced]);

  /* choosing a step scrolls to the middle of its third */
  function goTo(index: number) {
    const root = rootRef.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const room = Math.max(1, box.height - window.innerHeight);
    window.scrollTo({ top: window.scrollY + box.top + (room * (index + 0.5)) / SCENES.length });
  }

  if (reduced) {
    return (
      <div className="hw hw-stacked">
        <h2 id="how-title" data-fade>
          {title}
        </h2>
        <ol className="hw-stack">
          {HOW.steps.map((step, index) => (
            <li key={step.id} className="hw-stack-step">
              <div className="hw-stack-copy">
                <LandingIcon name={step.icon} className="hw-ic" />
                <h3 className="hw-step-title">{step.title}</h3>
                <p className="hw-step-body">{withCommands(step.body)}</p>
              </div>
              <div className="hw-window">
                <div className="hw-view" role="img" aria-label={step.scene} data-scene={SCENES[index]!.id}>
                  <SceneStage scene={SCENES[index]!} playing={false} reduced />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const current = HOW.steps[active]!;

  return (
    <div ref={rootRef} className="hw hw-scroll" data-active={current.id}>
      <div className="hw-pin">
        <div className="site-wrap hw-pin-inner">
          <h2 id="how-title" data-fade ref={headRef}>
            {title}
          </h2>
          <div className="hw-grid">
            <ol className="hw-steps" ref={stepsRef}>
              {HOW.steps.map((step, index) => {
                const on = index === active;
                return (
                  <li key={step.id} data-on={on ? "true" : "false"}>
                    <button
                      type="button"
                      className="hw-step"
                      aria-pressed={on}
                      aria-expanded={on}
                      aria-controls={`hw-more-${step.id}`}
                      onClick={() => goTo(index)}
                    >
                      <LandingIcon name={step.icon} className="hw-ic" />
                      <span className="hw-step-title">{step.title}</span>
                    </button>
                    <span className="hw-step-fill" aria-hidden="true" />
                    <div className="hw-step-more" id={`hw-more-${step.id}`}>
                      <div className="hw-step-clip">
                        <p className="hw-step-body">{withCommands(step.body)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="hw-side" ref={windowRef}>
              <div className="hw-window" id="hw-window">
                <div
                  className="hw-view"
                  role="img"
                  aria-label={current.scene}
                  data-scene={current.id}
                  tabIndex={0}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setHeld((value) => ({ ...value, hover: true }));
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") setHeld((value) => ({ ...value, hover: false }));
                  }}
                  onFocus={() => setHeld((value) => ({ ...value, focus: true }))}
                  onBlur={() => setHeld((value) => ({ ...value, focus: false }))}
                >
                  {SCENES.map((scene, index) => (
                    <div
                      key={scene.id}
                      className="hw-layer"
                      data-scene={scene.id}
                      data-on={index === active ? "true" : "false"}
                    >
                      <SceneStage
                        key={takes[index]}
                        scene={scene}
                        playing={index === active && onScreen && !held.hover && !held.focus}
                        reduced={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
