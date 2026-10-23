import { CommandBlock } from "@/components/fairtrade-client";
import { Info } from "@peasant-labs/fairtrade/icons";
import type { ReactNode } from "react";

/**
 * A copyable command. A long one scrolls inside its own box rather than
 * pushing the page sideways on a phone.
 */
export function DocCommand({ command, label }: { command: string; label?: string }) {
  return (
    <div className="dx-cmd" data-contained-overflow>
      <CommandBlock command={command} label={label ?? command} />
    </div>
  );
}

/** A short aside the reader should not miss: one icon, one or two sentences. */
export function DocNote({ children }: { children: ReactNode }) {
  return (
    <div className="dx-note">
      <Info className="dx-note-ic" aria-hidden="true" focusable="false" />
      <p>{children}</p>
    </div>
  );
}

/** A page header: where it sits, its title, and one line saying what it is for. */
export function DocHead({
  crumb,
  title,
  lede,
}: {
  crumb?: { label: string; href: string; here: string };
  title: string;
  lede: string;
}) {
  return (
    <header className="dx-head">
      {crumb ? (
        <nav className="dx-crumb" aria-label="breadcrumb">
          <a href={crumb.href}>{crumb.label}</a>
          <span aria-hidden="true"> / </span>
          <span>{crumb.here}</span>
        </nav>
      ) : null}
      <h1 id="page-heading" tabIndex={-1}>
        {title}
      </h1>
      <p className="dx-lede">{lede}</p>
    </header>
  );
}

export type GuideStep = Readonly<{ id: string; title: string; body: ReactNode }>;

/** A guide's numbered steps. Each step is an anchor the "on this page" list links to. */
export function DocSteps({ steps }: { steps: readonly GuideStep[] }) {
  return (
    <ol className="dx-steps">
      {steps.map((step, index) => (
        <li key={step.id} id={step.id} className="dx-step">
          <span className="dx-step-n" aria-hidden="true">
            {index + 1}
          </span>
          <div className="dx-step-body">
            <h2>{step.title}</h2>
            {step.body}
          </div>
        </li>
      ))}
    </ol>
  );
}
