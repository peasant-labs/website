"use client";

import { PUBLISH_SCENE } from "@/components/landing/scenes/publish";
import { RECORD_SCENE } from "@/components/landing/scenes/record";
import { REVIEW_SCENE } from "@/components/landing/scenes/review";
import { SceneStage, type SceneDefinition } from "@/components/landing/scenes/stage";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { LandingIcon } from "@/components/landing/icons";
import { HOW } from "@/lib/landing";
import { RotateCcw } from "@peasant-labs/fairtrade/icons";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const SCENES: readonly SceneDefinition[] = [RECORD_SCENE, REVIEW_SCENE, PUBLISH_SCENE];
/* replay fades the scene all the way out before the fresh take fades in: the layer's fade is 420ms */
const REWIND_MS = 440;

/**
 * How it works, told by scrolling. The section holds still while the page
 * scrolls through it, about one screen per step, and each step's scene plays
 * as it becomes the current one; after the third the page simply carries on.
 * Nothing hijacks the scroll: three markers down the section's height, one a
 * third each, say which step the middle of the screen is on, so momentum, the
 * keyboard and the scroll bar all work as usual. Choosing a step scrolls to it.
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
  /* replay dips the current scene out and back in on a fresh take, rather than cutting to its first frame */
  const [rewinding, setRewinding] = useState(false);
  const [shown, setShown] = useState(active);
  if (shown !== active) {
    setShown(active);
    setTakes((current) => current.map((value, index) => (index === active ? value + 1 : value)));
  }
  const markRefs = useRef<(HTMLDivElement | null)[]>([]);
  const windowRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const onScreen = useOnScreen(windowRef, 0.4);

  // The step whose marker holds the middle of the screen is the current one.
  useEffect(() => {
    if (reduced) return;
    const targets = markRefs.current.filter((element): element is HTMLDivElement => element !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = targets.indexOf(entry.target as HTMLDivElement);
          if (index >= 0) setActive(index);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [reduced]);

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

  // While the section is held, the header it sits under stays (see app/landing.css).
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const pin = pinRef.current;
      if (!pin || !rootRef.current) return;
      const top = parseFloat(getComputedStyle(pin).top) || 0;
      const box = rootRef.current.getBoundingClientRect();
      const holding = box.top <= top + 1 && box.bottom >= window.innerHeight;
      rootRef.current.dataset.holding = holding ? "true" : "false";
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reduced]);

  function goTo(index: number) {
    markRefs.current[index]?.scrollIntoView({ block: "center" });
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
                <p className="hw-step-body">{step.body}</p>
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
      <div className="hw-pin" ref={pinRef}>
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
                    <div className="hw-step-more" id={`hw-more-${step.id}`}>
                      <div className="hw-step-clip">
                        <p className="hw-step-body">{step.body}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="hw-side" ref={windowRef}>
              <div className="hw-window" id="hw-window">
                <div className="hw-view" role="img" aria-label={current.scene} data-scene={current.id}>
                  {SCENES.map((scene, index) => (
                    <div
                      key={scene.id}
                      className="hw-layer"
                      data-scene={scene.id}
                      data-on={index === active && !rewinding ? "true" : "false"}
                    >
                      <SceneStage
                        key={takes[index]}
                        scene={scene}
                        playing={index === active && onScreen}
                        reduced={false}
                      />
                    </div>
                  ))}
                </div>
                <div className="hw-foot">
                  <button
                    type="button"
                    className="hw-replay"
                    aria-label="replay"
                    disabled={rewinding}
                    onClick={() => {
                      setRewinding(true);
                      window.setTimeout(() => {
                        setTakes((current) => current.map((value, index) => (index === active ? value + 1 : value)));
                        setRewinding(false);
                      }, REWIND_MS);
                    }}
                  >
                    <RotateCcw aria-hidden="true" focusable="false" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* one marker per step down the section's height */}
      <div className="hw-marks" aria-hidden="true">
        {HOW.steps.map((step, index) => (
          <div
            key={step.id}
            className="hw-mark"
            ref={(element) => {
              markRefs.current[index] = element;
            }}
          />
        ))}
      </div>

    </div>
  );
}
