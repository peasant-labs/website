/**
 * the peasant mark — a wheat sheaf. identical geometry to app/icon.svg
 * (the favicon), so brand and tab icon stay in lockstep.
 *
 * decorative by default (aria-hidden); the surrounding link/heading
 * carries the accessible name. inherits color via `currentColor`.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16 27V8" />
      <path d="M16 21l-5.5-6" />
      <path d="M16 21l5.5-6" />
      <path d="M16 15l-5-5.5" />
      <path d="M16 15l5-5.5" />
    </svg>
  );
}
