"use client";

import { PUBLISH_SCENE } from "@/components/landing/scenes/publish";
import { RECORD_SCENE } from "@/components/landing/scenes/record";
import { REVIEW_SCENE } from "@/components/landing/scenes/review";
import { SceneStage, type SceneDefinition } from "@/components/landing/scenes/stage";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { HOW } from "@/lib/landing";
import { ChevronLeft, ChevronRight, RotateCcw } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const SCENES: readonly SceneDefinition[] = [RECORD_SCENE, REVIEW_SCENE, PUBLISH_SCENE];
const WIDE = "(min-width: 62.5rem)";

function subscribeToWide(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * How it works, told by scrolling. The section holds still while the page
 * scrolls through it, about one screen per step, and each step's scene plays
 * as it becomes the current one; after the third the page simply carries on.
 * Nothing hijacks the scroll: three markers in the section's height say which
 * step the middle of the screen is on, so momentum, the keyboard and the
 * scroll bar all work as usual. Choosing a step scrolls to it.
 *
 * On a phone the scene window sticks under the header and the step texts
 * scroll beneath it, each taking over as it crosses the middle.
 *
 * Under reduced motion nothing is held: the three steps stack, each beside its
 * scene at its finished frame.
 */
export function HowItWorks({ title }: { title: string }) {
  const reduced = useReducedMotion();
  const wide = useSyncExternalStore(subscribeToWide, () => window.matchMedia(WIDE).matches, () => true);
  const [active, setActive] = useState(0);
  const [take, setTake] = useState(0);
  const markRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const windowRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(windowRef, 0.4);

  // The step whose marker (wide) or text (phone) holds the middle of the screen is the current one.
  useEffect(() => {
    if (reduced) return;
    const targets = (wide ? markRefs.current : flowRefs.current).filter(
      (element): element is HTMLDivElement | HTMLLIElement => element !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = targets.indexOf(entry.target as HTMLDivElement | HTMLLIElement);
          if (index >= 0) setActive(index);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [reduced, wide]);

  function goTo(index: number) {
    const target = (wide ? markRefs.current : flowRefs.current)[index];
    target?.scrollIntoView({ block: "center" });
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
                <span className="hw-n" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="hw-step-title">{step.title}</h3>
                <p className="hw-step-body">{step.body}</p>
              </div>
              <SceneWindow scene={SCENES[index]!} label={step.scene} playing={false} reduced />
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const current = HOW.steps[active]!;

  return (
    <div className="hw hw-scroll" data-active={current.id}>
      <div className="hw-pin">
        <div className="site-wrap hw-pin-inner">
          <h2 id="how-title" data-fade>
            {title}
          </h2>
          <div className="hw-grid">
            <ol className="hw-steps">
              {HOW.steps.map((step, index) => {
                const on = index === active;
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      className="hw-step"
                      aria-pressed={on}
                      aria-controls="hw-window"
                      onClick={() => goTo(index)}
                    >
                      <span className="hw-n" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="hw-step-title">{step.title}</span>
                    </button>
                    <p className="hw-step-body" hidden={!on}>
                      {step.body}
                    </p>
                  </li>
                );
              })}
            </ol>

            <div className="hw-side" ref={windowRef}>
              <SceneWindow
                key={`${active}-${take}`}
                scene={SCENES[active]!}
                label={current.scene}
                playing={onScreen}
                reduced={false}
                onReplay={() => setTake((value) => value + 1)}
              />
              <div className="hw-below">
                <div className="hw-arrows">
                  <button
                    type="button"
                    className="site-icon-btn site-icon-btn-boxed"
                    aria-label="previous step"
                    disabled={active === 0}
                    onClick={() => goTo(active - 1)}
                  >
                    <ChevronLeft aria-hidden="true" focusable="false" />
                  </button>
                  <button
                    type="button"
                    className="site-icon-btn site-icon-btn-boxed"
                    aria-label="next step"
                    disabled={active === HOW.steps.length - 1}
                    onClick={() => goTo(active + 1)}
                  >
                    <ChevronRight aria-hidden="true" focusable="false" />
                  </button>
                </div>
                <span className="hw-count">
                  {active + 1} / {HOW.steps.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* wide screens: one marker per step down the section's height */}
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

      {/* phones: the step texts scroll under the held window */}
      <ol className="hw-flow site-wrap">
        {HOW.steps.map((step, index) => (
          <li
            key={step.id}
            className="hw-flow-step"
            data-on={index === active ? "true" : "false"}
            ref={(element) => {
              flowRefs.current[index] = element;
            }}
          >
            <span className="hw-n" aria-hidden="true">
              {index + 1}
            </span>
            <h3 className="hw-step-title">{step.title}</h3>
            <p className="hw-flow-body">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SceneWindow({
  scene,
  label,
  playing,
  reduced,
  onReplay,
}: {
  scene: SceneDefinition;
  label: string;
  playing: boolean;
  reduced: boolean;
  onReplay?: () => void;
}) {
  return (
    <div className="hw-window" id={reduced ? undefined : "hw-window"}>
      <div className="hw-view" role="img" aria-label={label} data-scene={scene.id}>
        <SceneStage scene={scene} playing={playing} reduced={reduced} />
      </div>
      <div className="hw-foot">
        <span className="hw-footnote">{HOW.footnote}</span>
        {onReplay ? (
          <button type="button" className="hw-replay" onClick={onReplay}>
            <RotateCcw aria-hidden="true" focusable="false" />
            replay
          </button>
        ) : null}
      </div>
    </div>
  );
}
