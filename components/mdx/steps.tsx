import { Children, type ReactNode } from "react";

interface StepsProps {
  children: ReactNode;
}

export function Steps({ children }: StepsProps) {
  const items = Children.toArray(children);

  return (
    <div className="my-8 relative">
      {items.map((child, i) => {
        const stepNum = i + 1;
        const isLast = i === items.length - 1;

        return (
          <div key={i} className="flex gap-4 relative">
            {/* Step number and connecting line */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-7 h-7 border border-[var(--accent)] flex items-center justify-center text-small text-[var(--accent)] font-bold bg-[var(--bg-deep)]">
                {stepNum}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-[var(--border-default)] min-h-4" />
              )}
            </div>

            {/* Step content */}
            <div className={`pb-8 pt-0.5 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
              {child}
            </div>
          </div>
        );
      })}
    </div>
  );
}
