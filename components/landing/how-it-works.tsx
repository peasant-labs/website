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
 * How it works, three steps that play on their own. While the section can be
 * seen, the current step's scene plays through, and as it finishes the next
 * step takes over: record, review, publish, then record again. The current
 * step's bar, along its bottom rule, fills with its scene, so the next step
 * never comes as a surprise.
 *
 * The section also holds still while the page scrolls through it, about one
 * screen per step, and scrolling into a step's third makes it current; the
 * steps carry on by themselves from there. Choosing a step makes it current
 * and plays its scene from the start. Nothing ever moves the page: the scroll
 * is the reader's, and only the step and its scene change on their own.
 *
 * The scenes have no controls, and a pointer resting on one or a tap on it
 * never stops it. The screen is one image to assistive technology, described
 * by the step at hand, and it takes keyboard focus, which holds the take, and
 * with it the stepping, until the focus moves on.
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
  /*
   * The current step, and one take counter per scene: a scene starts a fresh
   * take, from its first frame, each time it is made current.
   */
  const [{ active, takes }, setRun] = useState(() => ({ active: 0, takes: SCENES.map(() => 0) }));
  const select = (pick: (current: number) => number) =>
    setRun(({ active, takes }) => {
      const next = pick(active);
      return { active: next, takes: takes.map((take, index) => (index === next ? take + 1 : take)) };
    });
  /* keyboard focus on the screen holds the take where it is; a click or a tap that focuses it does not */
  const [held, setHeld] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const onScreen = useOnScreen(windowRef, 0.4);

  // The scroll through the held section is cut in thirds, one per step: scrolling into a third makes its step current.
  const scrolledTo = useRef(0);
  useHeldProgress(
    rootRef,
    (progress) => {
      const third = Math.min(SCENES.length - 1, Math.floor(progress * SCENES.length));
      if (third === scrolledTo.current) return;
      scrolledTo.current = third;
      select(() => third);
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
                      onClick={() => select(() => index)}
                    >
                      <LandingIcon name={step.icon} className="hw-ic" />
                      <span className="hw-step-title">{step.title}</span>
                    </button>
                    <span
                      className="hw-step-fill"
                      aria-hidden="true"
                      ref={(fill) => {
                        fillRefs.current[index] = fill;
                      }}
                    />
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
                  onFocus={(event) => setHeld(event.currentTarget.matches(":focus-visible"))}
                  onBlur={() => setHeld(false)}
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
                        playing={index === active && onScreen && !held}
                        reduced={false}
                        onProgress={(progress) => {
                          const fill = fillRefs.current[index];
                          if (fill) fill.style.transform = `scaleX(${progress})`;
                        }}
                        onFinish={() => select((current) => (current === index ? (index + 1) % SCENES.length : current))}
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
