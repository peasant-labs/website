import type { ReactNode } from "react";

interface CalloutProps {
  type?: "info" | "warn" | "error" | "tip";
  children: ReactNode;
}

const calloutConfig = {
  info: {
    label: "[INFO]",
    borderColor: "border-blue-500/40",
    labelColor: "text-blue-400",
    bg: "bg-blue-500/5",
  },
  warn: {
    label: "[WARN]",
    borderColor: "border-amber-500/40",
    labelColor: "text-amber-400",
    bg: "bg-amber-500/5",
  },
  error: {
    label: "[ERR!]",
    borderColor: "border-red-500/40",
    labelColor: "text-red-400",
    bg: "bg-red-500/5",
  },
  tip: {
    label: "[TIP]",
    borderColor: "border-[var(--green)]/40",
    labelColor: "text-[var(--green)]",
    bg: "bg-[var(--green)]/5",
  },
} as const;

export function Callout({ type = "info", children }: CalloutProps) {
  const config = calloutConfig[type];

  return (
    <div
      className={`my-6 border ${config.borderColor} ${config.bg} p-4`}
      role="note"
    >
      <div className="flex gap-3">
        <span
          className={`${config.labelColor} font-bold text-small shrink-0 select-none`}
        >
          {config.label}
        </span>
        <div className="text-[var(--text-secondary)] text-body [&>p]:m-0">
          {children}
        </div>
      </div>
    </div>
  );
}
