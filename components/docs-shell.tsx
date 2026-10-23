import { DocsSidebar } from "@/components/docs-sidebar";
import { AppSidebarLayout } from "@/components/fairtrade-client";

/**
 * The docs and blog frame: fairtrade's app layout with the docs sidebar beside
 * the page. It replaces the marketing header and footer; the mark at the top
 * of the sidebar leads home.
 */
export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <AppSidebarLayout className="dx-app" sidebar={<DocsSidebar />}>
      <div className="dx-main">{children}</div>
    </AppSidebarLayout>
  );
}
