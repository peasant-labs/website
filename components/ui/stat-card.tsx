interface StatCardProps {
  value: string;
  label: string;
  sublabel?: string;
  className?: string;
}

export function StatCard({
  value,
  label,
  sublabel,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`border-2 border-[var(--border-default)] rounded-none bg-[var(--bg-surface)] p-4 font-mono ${className}`}
    >
      <div className="text-hero text-[var(--accent)] leading-none tracking-tight">
        {value}
      </div>
      <div className="mt-2 text-small text-[var(--text-secondary)]">
        {label}
      </div>
      {sublabel && (
        <div className="mt-1 text-caption text-[var(--text-tertiary)]">
          {sublabel}
        </div>
      )}
    </div>
  );
}
