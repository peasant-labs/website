"use client";

import { PUBLISH_SCENE } from "@/components/landing/scenes/publish";
import { RECORD_SCENE } from "@/components/landing/scenes/record";
import { REVIEW_SCENE } from "@/components/landing/scenes/review";
import { SceneStage, type SceneDefinition } from "@/components/landing/scenes/stage";
import { useOnScreen, useReducedMotion } from "@/components/landing/use-motion";
import { LandingIcon } from "@/components/landing/icons";
import { HOW } from "@/lib/landing";
import { RotateCcw } from "@peasant-labs/fairtrade/icons";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const SCENES: readonly SceneDefinition[] = [RECORD_SCENE, REVIEW_SCENE, PUBLISH_SCENE];
/* replay fades the scene all the way out before the fresh take fades in: the layer's fade is 420ms */
const REWIND_MS = 440;
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
 * scroll bar all work as usual. Choosing a step scrolls to it. All three
 * steps stay written out, the current one in full ink, so changing steps moves
 * nothing in the list.
 *
 * The three scenes are stacked in one screen and crossfade: the next one
 * starts its take from the first frame as it fades in, while the last one
 * fades out where it was, so a change of step never cuts.
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
                  <li key={step.id} data-on={on ? "true" : "false"}>
                    <button
                      type="button"
                      className="hw-step"
                      aria-pressed={on}
                      aria-controls="hw-window"
                      onClick={() => goTo(index)}
                    >
                      <LandingIcon name={step.icon} className="hw-ic" />
                      <span className="hw-step-title">{step.title}</span>
                    </button>
                    <p className="hw-step-body">{step.body}</p>
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
            <LandingIcon name={step.icon} className="hw-ic" />
            <h3 className="hw-step-title">{step.title}</h3>
            <p className="hw-flow-body">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
