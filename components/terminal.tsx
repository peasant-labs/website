import { CopyAllCommands, ProjectCommand } from "@/components/project-client";
import type { StartStep } from "@/lib/projects";

/**
 * A terminal panel: one shell comment per step, and the command that carries it
 * out. The /projects user story runs a short sequence in place; the peasant
 * page's own setup sequence uses fairtrade's CliSteps instead.
 */
export function Terminal({
  steps,
  terminalLabel,
  commandsLabel,
  copyAllLabel,
}: {
  steps: readonly StartStep[];
  terminalLabel: string;
  commandsLabel: string;
  copyAllLabel?: string;
}) {
  const commands = steps
    .map((step) => step.command)
    .filter((command): command is string => command !== undefined);

  return (
    <div className="pj-terminal" data-terminal>
      <div className="pj-terminal-head">
        <p className="pj-terminal-name">
          <span className="pj-terminal-dot" aria-hidden="true" />
          {terminalLabel}
        </p>
        {copyAllLabel && commands.length > 1 ? (
          <CopyAllCommands commands={commands} label={copyAllLabel} />
        ) : null}
      </div>
      <ol className="pj-terminal-lines" aria-label={commandsLabel}>
        {steps.map((step) => (
          <li key={step.id} data-start-line={step.id}>
            <p className="pj-terminal-note">{step.comment}</p>
            {step.command ? (
              <ProjectCommand command={step.command} label={step.title} />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}