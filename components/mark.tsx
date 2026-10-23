/**
 * the peasant labs mark — a wheat stalk. the same geometry as app/icon.svg
 * (the favicon), so brand and tab icon stay in lockstep.
 *
 * decorative by default (aria-hidden); the surrounding link/heading
 * carries the accessible name. inherits color via `currentColor`.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 22"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 21V3" />
      <path d="M9 7 5 4" />
      <path d="M9 7l4-3" />
      <path d="M9 11 5 8" />
      <path d="M9 11l4-3" />
      <path d="M9 15l-4-3" />
      <path d="M9 15l4-3" />
    </svg>
  );
}
