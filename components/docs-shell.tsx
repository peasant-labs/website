import { DocsSidebar } from "@/components/docs-sidebar";

/**
 * The docs and blog frame: the docs sidebar beside the page. It replaces the
 * marketing header and footer; the mark at the top of the sidebar leads home.
 */
export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dx-app">
      <DocsSidebar />
      <div className="dx-main">{children}</div>
    </div>
  );
}
