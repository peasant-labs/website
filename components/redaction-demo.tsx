"use client";

import { REDACTION, type RedactionMatch } from "@/lib/projects";
import { RedactionReview } from "@peasant-labs/fairtrade/ui";
import { useState, type ComponentType } from "react";

/*
 * Only the accessible name is widened in. Intersecting the full HTMLAttributes
 * would drag in React's own `onToggle` (a DOM event handler) and collide with
 * the component's `onToggle(id, kept)`.
 */
type RedactProps = Parameters<typeof RedactionReview>[0] & { "aria-label"?: string };

const Redact = RedactionReview as ComponentType<RedactProps>;

/**
 * The redaction review, wired to state so the panel actually works: each match
 * can be kept or reverted. fairtrade's component is fully controlled — without
 * an owner for that state, clicking it would do nothing, and a demonstration of
 * a consent surface that ignores your clicks would be a poor argument for one.
 *
 * The level is fixed. Standard is the only level the product ships, so no
 * `onLevel` handler is passed: the control states what is in force rather than
 * offering a choice between three, and `app/globals.css` hides the two options
 * fairtrade still renders beside it.
 *
 * The matches are invented. The section says so above this panel.
 */
export function RedactionDemo({ label }: { label: string }) {
  const [kept, setKept] = useState<ReadonlySet<string>>(
    () => new Set(REDACTION.matches.filter((match) => match.kept).map((match) => match.id)),
  );

  const matches: RedactionMatch[] = REDACTION.matches.map((match) => ({
    ...match,
    kept: kept.has(match.id),
  }));

  return (
    <Redact
      level={REDACTION.level}
      matches={matches}
      onToggle={(id, nextKept) =>
        setKept((current) => {
          const next = new Set(current);
          if (nextKept) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        })
      }
      scanned={REDACTION.scanned}
      total={REDACTION.total}
      aria-label={label}
    />
  );
}
