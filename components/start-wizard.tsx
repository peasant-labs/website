"use client";

import { Button, StepIndicator } from "@/components/fairtrade-client";
import { ProjectCommand } from "@/components/project-client";
import type { StartStep } from "@/lib/projects";
import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
} from "react";

/*
 * Neither typedef declares the `...rest` it spreads onto its root element, so the
 * rail's accessible name and the actions' handlers have to be widened back in.
 */
type IndicatorProps = Parameters<typeof StepIndicator>[0] & { "aria-label"?: string };
type ActionProps = Parameters<typeof Button>[0] & ButtonHTMLAttributes<HTMLButtonElement>;

const Rail = StepIndicator as ComponentType<IndicatorProps>;
const Action = Button as ComponentType<ActionProps>;

/**
 * The setup sequence as fairtrade's first-run wizard: the rail names every step
 * up front, and the body carries one step's command at a time.
 *
 * The wizard owns its own position, so it has to run on the client. The step
 * annotations are authored as shell comments — the terminal on /projects needs
 * them that way — and the sigil comes off here, where they are read as prose.
 *
 * fairtrade's `StepWizard` is uncontrolled and only ever adds to its completed
 * set, so walking back left a check standing over a step the reader had just
 * re-opened. This drives fairtrade's controlled `StepIndicator` instead and
 * derives completion from position: a check means "you are past this", so it
 * clears the moment a reader steps back over it and returns on continue.
 */
export function StartWizard({
  steps,
  label,
  continueLabel,
  doneLabel,
  backLabel,
}: {
  steps: readonly StartStep[];
  label: string;
  continueLabel: string;
  doneLabel: string;
  backLabel: string;
}) {
  const [index, setIndex] = useState(0);
  /* the last step earns its own check only once the reader closes the sequence. */
  const [finished, setFinished] = useState(false);
  const panelId = `${useId()}-panel`;

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const completed = new Set(
    steps.slice(0, finished ? steps.length : index).map((done) => done.id),
  );

  const goTo = (next: number) => {
    setFinished(false);
    setIndex(next);
  };

  return (
    <section className="swz" aria-label={label}>
      <div className="swz-head">
        <Rail
          steps={steps.map((item) => ({ id: item.id, label: item.title }))}
          current={step.id}
          completed={completed}
          /*
           * Every marker is a jump target. Nothing here is gated — the sequence is
           * five commands to read, not a form to satisfy — so a reader who wants
           * step four should be able to say so rather than press continue three times.
           */
          reachable={new Set(steps.map((item) => item.id))}
          onJump={(id: string) => {
            const next = steps.findIndex((item) => item.id === id);
            if (next >= 0) {
              goTo(next);
            }
          }}
          aria-label={label}
        />
      </div>

      <div
        className="swz-body"
        id={panelId}
        role="group"
        aria-label={`step ${index + 1}: ${step.title}`}
        tabIndex={-1}
      >
        <span className="swz-body-kicker">
          step {index + 1}: {step.title}
        </span>
        <div className="pj-start-step" data-start-step={step.id}>
          <p data-reading-text>{step.comment.replace(/^#\s*/, "")}</p>
          {step.command ? <ProjectCommand command={step.command} label={step.title} /> : null}
        </div>
      </div>

      <div className="swz-foot">
        <Action variant="ghost" onClick={() => goTo(Math.max(0, index - 1))} disabled={index === 0}>
          {backLabel}
        </Action>
        <span className="swz-count" aria-hidden="true">
          step <span className="tnum">{index + 1}</span> /{" "}
          <span className="tnum">{steps.length}</span>
        </span>
        <Action
          variant="primary"
          aria-controls={panelId}
          onClick={() => (isLast ? setFinished(true) : setIndex(index + 1))}
        >
          {isLast ? doneLabel : continueLabel}
        </Action>
      </div>
    </section>
  );
}
