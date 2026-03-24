"use client";

import { docsNav } from "@/content/_nav";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  // Derive the current slug from the pathname
  // "/docs" -> [], "/docs/core-concepts/ingest-pipeline" -> ["core-concepts", "ingest-pipeline"]
  const stripped = pathname.replace(/^\/docs\/?/, "");
  const currentSlug = stripped === "" ? [] : stripped.split("/");
  const currentPath = currentSlug.join("/");

  const navigation = docsNav.map((section) => {
    const items = section.items.map((item) => {
      const itemPath = item.slug.join("/");
      const href =
        item.slug.length === 0 ? "/docs" : `/docs/${item.slug.join("/")}`;
      return {
        ...item,
        active: currentPath === itemPath,
        href,
      };
    });

    return {
      ...section,
      items,
      hasActive: items.some((i) => i.active),
    };
  });

  return (
    <nav
      className="w-full h-full overflow-y-auto text-small"
      aria-label="Documentation navigation"
    >
      {navigation.map((section, sIdx) => (
        <details
          key={section.title}
          open={section.hasActive || undefined}
          className={`${sIdx === 0 ? "" : "mt-4"} group`}
        >
          <summary className="cursor-pointer select-none list-none text-[var(--text-secondary)] tracking-widest text-caption mb-2 hover:text-[var(--text-primary)] transition-colors [&::-webkit-details-marker]:hidden">
            <span className="text-[var(--text-tertiary)] mr-1 inline-block transition-transform group-open:rotate-90">
              &gt;
            </span>
            {section.title}
          </summary>

          <ul className="ml-2 border-l border-[var(--border-default)]">
            {section.items.map((item, i) => {
              const isLast = i === section.items.length - 1;
              const marker = isLast ? "\u2514\u2500" : "\u251C\u2500";

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center py-1 pl-1 transition-colors
                      ${
                        item.active
                          ? "text-[var(--accent)] border-l-2 border-[var(--accent)] -ml-px bg-[var(--accent-muted)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                      }
                    `}
                  >
                    <span
                      className={`mr-1.5 font-mono text-caption select-none shrink-0 ${
                        item.active
                          ? "text-[var(--accent)]"
                          : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {marker}
                    </span>
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </nav>
  );
}
