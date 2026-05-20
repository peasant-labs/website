/**
 * tldr — a collapsible summary, open by default. the `tldr;` row
 * stays visible and toggles the rest: the thesis, then the goals as a
 * short numbered list. built on native <details>, so it collapses
 * without javascript and stays a server component.
 *
 * presentational only — content is passed in.
 */
export function Tldr({
  summary,
  goals,
}: {
  summary: React.ReactNode;
  goals: React.ReactNode[];
}) {
  return (
    <details
      open
      className="group measure mt-10 border border-[var(--border-default)] bg-[var(--bg-surface)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 font-bold text-[var(--accent)] transition-colors hover:bg-[var(--bg-elevated)] [&::-webkit-details-marker]:hidden">
        tldr;
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      </summary>

      <div className="px-5 pb-5">
        <p className="text-[var(--text-primary)]">{summary}</p>

        <ol className="mt-4 space-y-2.5">
          {goals.map((goal, i) => (
            <li key={i} className="flex gap-3 text-[var(--text-secondary)]">
              <span
                aria-hidden="true"
                className="shrink-0 select-none self-start font-bold text-[var(--accent)]"
              >
                {i + 1}
              </span>
              <span>{goal}</span>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
