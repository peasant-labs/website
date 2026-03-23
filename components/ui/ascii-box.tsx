import { type ReactNode } from "react";

interface AsciiBoxProps {
  title?: string;
  variant?: "single" | "double" | "heavy";
  children: ReactNode;
  className?: string;
}

const borderWidths: Record<NonNullable<AsciiBoxProps["variant"]>, string> = {
  single: "border",
  double: "border-2",
  heavy: "border-3",
};

export function AsciiBox({
  title,
  variant = "single",
  children,
  className = "",
}: AsciiBoxProps) {
  const borderClass = borderWidths[variant];

  return (
    <div className={`relative ${className}`}>
      {title && (
        <div className="absolute -top-3 left-4 px-2 bg-[var(--bg-deep)] text-small text-[var(--text-secondary)] select-none">
          {title}
        </div>
      )}
      <div
        className={`${borderClass} border-[var(--border-default)] rounded-none bg-[var(--bg-surface)] p-4`}
      >
        {children}
      </div>
    </div>
  );
}
