import { type ReactNode } from "react";

interface TerminalWindowProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function TerminalWindow({
  title = "peasant",
  children,
  className = "",
}: TerminalWindowProps) {
  return (
    <div
      className={`border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-none overflow-hidden ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
        <span className="text-small text-[var(--text-secondary)] select-none">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)] text-small select-none">
            ○
          </span>
          <span className="text-[var(--text-tertiary)] text-small select-none">
            ○
          </span>
          <span className="text-[var(--text-tertiary)] text-small select-none">
            ○
          </span>
        </div>
      </div>

      {/* Terminal content */}
      <div className="p-4 font-mono text-body text-[var(--text-primary)] min-h-[120px] overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
