import { ProjectRouteFocus } from "@/components/project-client";
import { SiteShell } from "@/components/site-shell";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <ProjectRouteFocus />
      {children}
    </SiteShell>
  );
}
