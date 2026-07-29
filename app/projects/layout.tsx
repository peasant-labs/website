import { ProjectInteractions } from "@/components/project-client";
import Link from "next/link";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="project-shell" data-project-shell>
      <header className="pj-header">
        <div className="pj-header-inner">
          <Link className="pj-brand" href="/projects">
            peasant labs
          </Link>
          <ProjectInteractions />
        </div>
      </header>
      {children}
    </div>
  );
}
