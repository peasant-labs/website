import { Art } from "@/components/art";
import { Rich } from "@/components/docs/rich-text";
import { DocCommand } from "@/components/docs/doc-command";
import type { DocStep } from "@/lib/docs-content";
import type { Art as ArtSource } from "@/lib/landing";
import { ChevronDown, Info } from "@peasant-labs/fairtrade/icons";
import { Fragment, type ReactNode } from "react";

export { DocCommand };


/** A command under a short lowercase caption that says what it is for. */
export function DocCaptionedCommand({ caption, command }: { caption: string; command: string }) {
  return (
    <div className="dx-cmd-group">
      <p className="dx-cmd-label">{caption}</p>
      <DocCommand command={command} label={`${caption}: ${command}`} />
    </div>
  );
}

/** A run of commands, stacked close so they read as one group. */
export function DocCommands({ commands }: { commands: readonly string[] }) {
  if (commands.length === 0) return null;
  return (
    <div className="dx-cmds">
      {commands.map((command) => (
        <DocCommand key={command} command={command} />
      ))}
    </div>
  );
}

/**
 * A folder or file path the reader looks up rather than runs: no prompt and no
 * copy button. It wraps only after a slash, so a folder name never splits.
 */
export function DocPath({ path }: { path: string }) {
  const segments = path.split(/(?<=\/)/);
  return (
    <div className="dx-path">
      <code>
        {segments.map((segment, index) => (
          <Fragment key={index}>
            {index > 0 ? <wbr /> : null}
            <span className="dx-path-seg">{segment}</span>
          </Fragment>
        ))}
      </code>
    </div>
  );
}

/**
 * A procedure: numbered steps, each saying what it does above the commands that
 * do it. With `ordered={false}` it lists alternatives instead, as bullets.
 */
export function DocProcedure({ steps, ordered = true }: { steps: readonly DocStep[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={ordered ? "dx-list" : "dx-bullets"}>
      {steps.map((step) => (
        <li key={step.text}>
          <Rich text={step.text} />
          <DocCommands commands={step.commands} />
        </li>
      ))}
    </Tag>
  );
}

/**
 * "On this page" for a narrow screen, where the list beside the article is
 * hidden: folded under the header until the reader opens it.
 */
export function DocJump({ items }: { items: readonly { id: string; label: string }[] }) {
  return (
    <details className="dx-jump">
      <summary>
        on this page
        <ChevronDown className="dx-jump-ic" aria-hidden="true" focusable="false" />
      </summary>
      <nav aria-label="on this page">
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}

/* "`--flag`: what it does" or "**Name**: what it is": a term, then its meaning */
const TERM = /^((?:`[^`]+`|\*\*[^*]+\*\*)[^:]*?): (.+)$/;

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * A list of short lines: numbered rows when the order is the point. When every
 * line names a term and its meaning, it is a two-column table of terms;
 * otherwise plain bullets.
 */
export function DocList({ items, ordered = false }: { items: readonly string[]; ordered?: boolean }) {
  const terms = ordered ? null : items.map((item) => TERM.exec(item));
  if (terms && terms.every(Boolean)) {
    return (
      <dl className="dx-terms">
        {terms.map((match) => (
          <div key={match![1]}>
            <dt>
              <Rich text={match![1]} />
            </dt>
            <dd>
              <Rich text={sentence(match![2]!)} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={ordered ? "dx-list" : "dx-bullets"}>
      {items.map((item) => (
        <li key={item}>
          <Rich text={item} />
        </li>
      ))}
    </Tag>
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

/**
 * A page header: where it sits, its title, and one line saying what it is for.
 * A guide's picture sits beside the title on a wide screen, so the first step
 * starts in the first view.
 */
export function DocHead({
  crumb,
  title,
  lede,
  art,
  columns = false,
}: {
  crumb?: { label: string; href: string; here: string };
  title: string;
  lede: string;
  art?: ArtSource;
  /** the page has "on this page" beside its content: the header keeps the same two columns */
  columns?: boolean;
}) {
  return (
    <header className={columns ? "dx-head dx-head-cols" : "dx-head"}>
      <div className="dx-head-text">
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
      </div>
      {art ? <Art art={art} className="dx-pic dx-head-art" important /> : null}
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
          <div className="dx-step-head">
            <span className="dx-step-n" aria-hidden="true">
              {index + 1}
            </span>
            <h2>{step.title}</h2>
          </div>
          <div className="dx-step-body">{step.body}</div>
        </li>
      ))}
    </ol>
  );
}
