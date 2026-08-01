import { CopyAllCommands } from "@/components/project-client";
import { Card } from "@/components/fairtrade-client";
import { StartWizard } from "@/components/start-wizard";
import { UnderConstruction } from "@/components/under-construction";
import { PROJECTS, metadataForRoute, type ProjectLink } from "@/lib/projects";

const project = PROJECTS.peasant;

export const metadata = metadataForRoute(project.metadata);

/**
 * The wizard shows one command at a time, so "copy all" is the only way to take
 * the whole sequence in one go. It carries the commands in their authored order.
 */
const startCommands = project.start.steps
  .map((step) => step.command)
  .filter((command): command is string => command !== undefined);

/**
 * The peasant page is a plain explainer plus the sequence that gets a reader
 * running: the commands belong to peasant, so they are documented here rather
 * than in the catalog. The Entire comparison and the source-scoped evidence
 * still live on /projects.
 */
export default function PeasantPage() {
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

      <section className="pj-section" data-uses aria-labelledby="peasant-uses-heading">
        <div className="pj-section-heading">
          <h2 id="peasant-uses-heading">{project.usesTitle}</h2>
          <p data-reading-text>{project.usesIntro}</p>
        </div>
        <div className="pj-benefit-grid">
          {project.uses.map((use) => (
            <Card key={use.id} className="pj-benefit" data-peasant-use={use.id}>
              <h3>{use.title}</h3>
              <p data-reading-text>{use.body}</p>
            </Card>
          ))}
        </div>
      </section>

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
