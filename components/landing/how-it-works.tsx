"use client";

import { useOnScreen } from "@/components/landing/use-motion";
import { HOW } from "@/lib/landing";
import { Check, ChevronLeft, ChevronRight, RotateCcw } from "@peasant-labs/fairtrade/icons";
import { useRef, useState, useSyncExternalStore } from "react";

const noSubscription = () => () => {};

type StepId = (typeof HOW.steps)[number]["id"];

/**
 * How it works: three steps beside a small window that acts each one out. The
 * scenes are drawn in HTML and CSS, not recorded: their resting styles are the
 * last frame, and every animation only says where it starts. Under reduced
 * motion no animation is attached, so each scene shows its finished frame.
 *
 * A scene plays when it is chosen. Until then it holds its first frame while the
 * window is off screen, so nobody scrolls down to an animation that already
 * ended, and it pauses if the window leaves the screen mid-take.
 */
export function HowItWorks() {
  const [step, setStep] = useState(0);
  const [take, setTake] = useState(0);
  const [started, setStarted] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(windowRef, 0.4);
  // false on the server and during hydration, true once the page is live.
  const live = useSyncExternalStore(noSubscription, () => true, () => false);


  const current = HOW.steps[step]!;

  function choose(next: number) {
    const target = Math.max(0, Math.min(HOW.steps.length - 1, next));
    setStep(target);
    setTake((value) => value + 1);
    setStarted(true);
  }

  return (
    <div className="hw">
      <ol className="hw-steps">
        {HOW.steps.map((item, itemIndex) => {
          const on = itemIndex === step;
          return (
            <li key={item.id}>
              <button
                type="button"
                className="hw-step"
                aria-pressed={on}
                aria-controls="hw-window"
                onClick={() => choose(itemIndex)}
              >
                <span className="hw-n" aria-hidden="true">
                  {itemIndex + 1}
                </span>
                <span className="hw-step-title">{item.title}</span>
              </button>
              <p className="hw-step-body" hidden={!on}>
                {item.body}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="hw-side">
        <div className="hw-window" id="hw-window" ref={windowRef}>
          <div className="hw-titlebar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>{current.window}</span>
          </div>
          <div className="hw-view">
            <Scene
              key={`${current.id}-${take}`}
              id={current.id}
              label={current.scene}
              playback={!live ? "final" : started || onScreen ? "true" : "pending"}
            />
          </div>
          <div className="hw-foot">
            <span className="hw-footnote">{HOW.footnote}</span>
            <button
              type="button"
              className="hw-replay"
              onClick={() => {
                setTake((value) => value + 1);
                setStarted(true);
              }}
            >
              <RotateCcw aria-hidden="true" focusable="false" />
              replay
            </button>
          </div>
        </div>
        <div className="hw-below">
          <div className="hw-arrows">
            <button
              type="button"
              className="site-icon-btn site-icon-btn-boxed"
              aria-label="previous step"
              disabled={step === 0}
              onClick={() => choose(step - 1)}
            >
              <ChevronLeft aria-hidden="true" focusable="false" />
            </button>
            <button
              type="button"
              className="site-icon-btn site-icon-btn-boxed"
              aria-label="next step"
              disabled={step === HOW.steps.length - 1}
              onClick={() => choose(step + 1)}
            >
              <ChevronRight aria-hidden="true" focusable="false" />
            </button>
          </div>
          <span className="hw-count">
            {step + 1} / {HOW.steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}

/*
 * "final" is the server render and the no-script page: the finished frame.
 * Once the page is live a scene waits "pending" on its first frame, then plays.
 */
type Playback = "final" | "pending" | "true";

function Scene({ id, label, playback }: { id: StepId; label: string; playback: Playback }) {
  return (
    <div
      className={`hw-scene hw-s-${id}`}
      data-playing={playback}
      role="img"
      aria-label={label}
    >
      <div className="hw-cam" aria-hidden="true">
        {id === "record" ? <RecordScene /> : id === "review" ? <ReviewScene /> : <PublishScene />}
      </div>
    </div>
  );
}

function RecordScene() {
  return (
    <div className="hw-term">
      <div>
        <span className="hw-prompt">$ </span>
        <span className="hw-typed hw-t1">peasant harvest</span>
      </div>
      <div className="hw-ok hw-l2">✓ 3 sessions indexed</div>
      <div className="hw-ok hw-l3">✓ nothing uploaded</div>
      <div className="hw-l4">
        <span className="hw-prompt">&gt; </span>
        <span className="hw-typed hw-t2">/peasant</span>
      </div>
      <div className="hw-ok hw-l5">→ opened in your browser</div>
    </div>
  );
}

function ReviewScene() {
  return (
    <>
      <div className="hw-badge">
        <span className="hw-cnt">
          <span className="hw-strip">
            <span>0</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </span>
        </span>
        hidden
      </div>
      <div className="hw-row" style={{ top: "24%" }}>
        <span className="hw-rail hw-r-tool" />
        AWS_KEY=
        <span className="hw-red hw-k1">
          <span className="hw-raw">AKIAIOSFODNN7EXAMPLE</span>
          <span className="hw-lbl">secrets</span>
        </span>
      </div>
      <div className="hw-row" style={{ top: "46%" }}>
        <span className="hw-rail hw-r-you" />
        email
        <span className="hw-red hw-k2">
          <span className="hw-raw">ana@example.com</span>
          <span className="hw-lbl">pii</span>
        </span>
      </div>
      <div className="hw-row" style={{ top: "68%" }}>
        <span className="hw-rail hw-r-agent" />
        read
        <span className="hw-red hw-k3">
          <span className="hw-raw">~/work/widget-shop/.env</span>
          <span className="hw-lbl">paths</span>
        </span>
      </div>
      <div className="hw-scan" />
    </>
  );
}

function PublishScene() {
  return (
    <>
      <div className="hw-dlg" />
      <div className="hw-abs hw-ttl">publish</div>
      <div className="hw-abs hw-lab">who can read it</div>
      <div className="hw-abs hw-chip">
        <Check className="hw-ck" />
        eval-crowd
      </div>
      <div className="hw-abs hw-box">
        <Check />
      </div>
      <div className="hw-abs hw-cons">share it (redacted)</div>
      <div className="hw-abs hw-done">
        <Check />
        published to eval-crowd
      </div>
      <div className="hw-abs hw-pub">publish</div>
      <span className="hw-ring hw-g1" />
      <span className="hw-ring hw-g2" />
      <span className="hw-ring hw-g3" />
      <span className="hw-cur-track">
        <svg className="hw-cur" viewBox="0 0 16 16">
          <path d="M2 1.5v12l3.3-3.1 2.2 4.6 2-.9-2.2-4.5H12z" />
        </svg>
      </span>
    </>
  );
}
