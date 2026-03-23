import Link from "next/link";
import type { PrevNext } from "@/lib/docs";

interface PrevNextProps {
  prevNext: PrevNext;
}

export function PrevNextNav({ prevNext }: PrevNextProps) {
  const { prev, next } = prevNext;

  if (!prev && !next) return null;

  return (
    <nav
      className="mt-16 pt-8 border-t border-[var(--border-default)] grid grid-cols-2 gap-4"
      aria-label="Previous and next pages"
    >
      {prev ? (
        <Link href={prev.href} className="group block">
          <div className="border border-[var(--border-default)] p-4 hover:border-[var(--accent)] transition-colors h-full">
            <span className="text-caption text-[var(--text-tertiary)] block mb-1">
              &larr; Previous
            </span>
            <span className="text-body text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              {prev.title}
            </span>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link href={next.href} className="group block text-right">
          <div className="border border-[var(--border-default)] p-4 hover:border-[var(--accent)] transition-colors h-full">
            <span className="text-caption text-[var(--text-tertiary)] block mb-1">
              Next &rarr;
            </span>
            <span className="text-body text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              {next.title}
            </span>
          </div>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
