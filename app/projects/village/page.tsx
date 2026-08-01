import { CopyAllCommands } from "@/components/project-client";
import { StartWizard } from "@/components/start-wizard";
import { UnderConstruction } from "@/components/under-construction";
import { VillageExample } from "@/components/village-example";
import { VillageGovernance } from "@/components/village-governance";
import { PROJECTS, metadataForRoute, type ProjectLink } from "@/lib/projects";

const project = PROJECTS.village;

export const metadata = metadataForRoute(project.metadata);

/**
 * The wizard shows one command at a time, so "copy all" is the only way to take
 * the whole sequence in one go. Same pattern as peasant.
 */
const startCommands = project.start.steps
  .map((step) => step.command)
  .filter((command): command is string => command !== undefined);

/**
 * Village is a short launch surface: title, the peasant-style get-started wizard,
 * and a join-community example.
 */
export default function VillagePage() {
  return (
    <main id="content" className="pj-main" tabIndex={-1}>
      <UnderConstruction projectName={project.name} />

      <header className="pj-catalog-hero">
        <div className="pj-hero-copy">
          <h1 id="project-heading" tabIndex={-1}>
            {project.hero.title}
          </h1>
          <p className="pj-lede" data-reading-text>
            {project.hero.body}
          </p>
        </div>
      </header>

      <section
        id="get-started"
        className="pj-section pj-start"
        data-start
        aria-labelledby="start-heading"
      >
        <div className="pj-section-heading">
          <h2 id="start-heading">{project.start.title}</h2>
          <p data-reading-text>{project.start.intro}</p>
        </div>

        <div className="pj-start-body">
          <div className="pj-start-actions">
            <CopyAllCommands
              commands={startCommands}
              label={project.start.copyAllLabel}
            />
          </div>
          <StartWizard
            steps={project.start.steps}
            label={project.start.stepsLabel}
            continueLabel={project.start.continueLabel}
            doneLabel={project.start.doneLabel}
            backLabel={project.start.backLabel}
          />
        </div>
      </section>

      <section
        className="pj-section pj-village-join"
        data-village-join
        aria-labelledby="village-join-heading"
      >
        <div className="pj-village-join-copy">
          <h2 id="village-join-heading">{project.community.title}</h2>
          <p data-reading-text>{project.community.body}</p>
        </div>

        <VillageExample example={project.example} joinLabel={project.community.joinLabel} />
      </section>

      <VillageGovernance title={project.governance.title} body={project.governance.body} />

      <nav className="pj-related" aria-label={`related to ${project.name}`}>
        {project.related.map((link: ProjectLink) => (
          <a
            key={link.id}
            href={link.href}
            className={`btn ${link.id === "all-projects" ? "btn-primary" : "btn-secondary"}`}
            data-related-link={link.id}
            {...(link.kind === "public-source"
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </main>
  );
}
