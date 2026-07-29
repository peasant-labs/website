import { ProjectCommand } from "@/components/project-client";
import {
  EVIDENCE,
  type EvidenceId,
  type EvidenceRecord,
  type HeroFigureContent,
  type ProjectPageContent,
} from "@/lib/projects";
import { Breadcrumb, Card } from "@peasant-labs/fairtrade/ui";
import type { ReactNode } from "react";

export function EvidenceCitations({ ids }: { ids: readonly EvidenceId[] }) {
  return (
    <ul className="pj-citations" aria-label="evidence">
      {ids.map((id) => {
        const evidence: EvidenceRecord = EVIDENCE[id];
        const content = (
          <>
            <span className="pj-citation-label">{evidence.label}</span>
            <span className="pj-citation-scope">
              {evidence.sourceScope}; verified {evidence.verifiedOn}
            </span>
          </>
        );

        return (
          <li key={id}>
            {evidence.publicHref ? (
              <a
                href={evidence.publicHref}
                target="_blank"
                rel="noopener noreferrer"
                data-evidence-id={id}
                data-source-scope={evidence.sourceScope}
                data-verified-on={evidence.verifiedOn}
                data-reverify-by={evidence.reverifyBy}
              >
                {content}
              </a>
            ) : (
              <span
                data-evidence-id={id}
                data-source-scope={evidence.sourceScope}
                data-verified-on={evidence.verifiedOn}
                data-reverify-by={evidence.reverifyBy}
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function HeroFigure({ figure }: { figure: HeroFigureContent }) {
  return (
    <figure
      className="pj-figure pj-hero-figure"
      data-project-figure
      data-hero-figure
      aria-label={figure.accessibleName}
    >
      <div className="pj-figure-state" data-figure-state>
        <span className="pj-figure-label">{figure.stateText}</span>
      </div>
      <figcaption>{figure.caption}</figcaption>
    </figure>
  );
}

function InstructionList({
  kind,
  items,
}: {
  kind: "access" | "run";
  items: ProjectPageContent["access"] | ProjectPageContent["run"];
}) {
  return (
    <div className="pj-instruction-list" data-access={kind === "access" ? "true" : undefined}>
      {items.map((item) => (
        <Card
          key={item.id}
          className="pj-instruction"
          data-instruction-kind={kind}
          data-instruction-id={item.id}
        >
          <h3>{item.title}</h3>
          <p data-reading-text>{item.body}</p>
          <p className="pj-qualification" data-qualification>
            {item.qualification}
          </p>
          {item.command ? (
            <ProjectCommand command={item.command} label={`${item.title}: ${item.command}`} />
          ) : null}
          {item.action ? (
            <a
              className="btn btn-primary pj-instruction-action"
              href={item.action.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.action.accessibleName}
              data-instruction-action
            >
              {item.action.label}
            </a>
          ) : null}
          <EvidenceCitations ids={item.evidence} />
        </Card>
      ))}
    </div>
  );
}

function EvidenceLedger({ ids }: { ids: readonly EvidenceId[] }) {
  return (
    <details className="pj-evidence-disclosure" data-evidence-disclosure>
      <summary data-evidence-summary>
        open the full evidence ledger / {ids.length} source records with scope, revision, and provenance
      </summary>
      <ul className="pj-evidence-ledger" data-project-evidence>
        {ids.map((id) => {
          const evidence: EvidenceRecord = EVIDENCE[id];
          const details = (
            <>
              <strong>{evidence.label}</strong>
              <span>{evidence.sourceScope}</span>
              <span>{evidence.revisionOrVersion}</span>
              <span>{evidence.internalProvenance}</span>
              <span className="tnum">
                verified {evidence.verifiedOn}; reverify by {evidence.reverifyBy}
              </span>
            </>
          );

          return (
            <li
              key={id}
              data-evidence-id={id}
              data-source-scope={evidence.sourceScope}
              data-verified-on={evidence.verifiedOn}
              data-reverify-by={evidence.reverifyBy}
            >
              {evidence.publicHref ? (
                <a href={evidence.publicHref} target="_blank" rel="noopener noreferrer">
                  {details}
                </a>
              ) : (
                details
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export function ProjectDetail({
  project,
  flow,
  proof,
}: {
  project: ProjectPageContent;
  flow: ReactNode;
  proof: ReactNode;
}) {
  return (
    <main id="content" className="pj-main" tabIndex={-1}>
      <Breadcrumb
        label="project path"
        items={[
          { label: "peasant labs", href: "/" },
          { label: "projects", href: "/projects" },
          { label: project.name },
        ]}
      />

      <header className="pj-detail-hero">
        <div className="pj-hero-copy">
          <p className="pj-product-name">{project.name}</p>
          <h1 id="project-heading" tabIndex={-1}>
            {project.hero.title}
          </h1>
          <p className="pj-lede" data-reading-text>
            {project.hero.body}
          </p>
          <EvidenceCitations ids={project.hero.evidence} />
        </div>
        <aside
          className="pj-availability"
          data-availability
          data-advertised-state={project.availability.state}
          aria-labelledby={`${project.slug}-availability-title`}
        >
          <h2 id={`${project.slug}-availability-title`}>{project.availability.title}</h2>
          <p data-reading-text>{project.availability.body}</p>
          <p className="pj-qualification" data-qualification>
            {project.availability.qualification}
          </p>
          <EvidenceCitations ids={project.availability.evidence} />
        </aside>
        <HeroFigure figure={project.figure} />
      </header>

      <section className="pj-section" aria-labelledby={`${project.slug}-features`}>
        <div className="pj-section-heading">
          <h2 id={`${project.slug}-features`}>what it establishes</h2>
          <p data-reading-text>
            five source-backed capabilities, each qualified by the state that was actually reviewed.
          </p>
        </div>
        <div className="pj-feature-grid">
          {project.features.map((feature) => (
            <Card
              key={feature.id}
              className="pj-feature"
              data-project-feature={feature.id}
              data-advertised-state={feature.state}
            >
              <h3>{feature.title}</h3>
              <p data-reading-text>{feature.body}</p>
              <p className="pj-qualification" data-qualification>
                {feature.qualification}
              </p>
              <EvidenceCitations ids={feature.evidence} />
            </Card>
          ))}
        </div>
      </section>

      {flow}
      {proof}

      <section className="pj-section" aria-labelledby={`${project.slug}-access`}>
        <div className="pj-section-heading">
          <h2 id={`${project.slug}-access`}>access</h2>
          <p data-reading-text>availability comes before commands. private prerequisites stay explicit.</p>
        </div>
        <InstructionList kind="access" items={project.access} />
      </section>

      <section className="pj-section" aria-labelledby={`${project.slug}-run`}>
        <div className="pj-section-heading">
          <h2 id={`${project.slug}-run`}>run after access</h2>
          <p data-reading-text>commands are literal, but only apply in the scope stated beside them.</p>
        </div>
        <InstructionList kind="run" items={project.run} />
      </section>

      <section className="pj-section" aria-labelledby={`${project.slug}-stories`}>
        <div className="pj-section-heading">
          <h2 id={`${project.slug}-stories`}>where it helps</h2>
          <p data-reading-text>concrete actors, actions, and observable outcomes.</p>
        </div>
        <div className="pj-story-grid">
          {project.stories.map((story) => (
            <article key={story.id} className="pj-story" data-project-story={story.id}>
              <h3 className="pj-user-content">{story.actor}</h3>
              <dl>
                <div>
                  <dt>need</dt>
                  <dd>{story.need}</dd>
                </div>
                <div>
                  <dt>action</dt>
                  <dd>{story.action}</dd>
                </div>
                <div>
                  <dt>outcome</dt>
                  <dd>{story.outcome}</dd>
                </div>
              </dl>
              <EvidenceCitations ids={story.evidence} />
            </article>
          ))}
        </div>
      </section>

      <section className="pj-section" aria-labelledby={`${project.slug}-output`}>
        <div className="pj-section-heading">
          <h2 id={`${project.slug}-output`}>representative output</h2>
          <p data-reading-text>illustrative records remain labelled and never stand in for availability.</p>
        </div>
        {project.outputs.map((output) => (
          <article key={output.id} className="pj-output" data-project-output={output.id}>
            <h3>{output.label}</h3>
            <p className="pj-qualification" data-qualification>
              {output.qualification}
            </p>
            <div
              className="pj-output-scroll"
              data-contained-overflow
              role="region"
              aria-label={`${output.label} output`}
              tabIndex={0}
            >
              <pre>
                <code>{output.lines.join("\n")}</code>
              </pre>
            </div>
            <EvidenceCitations ids={output.evidence} />
          </article>
        ))}
      </section>

      <section className="pj-section" aria-labelledby={`${project.slug}-evidence`}>
        <div className="pj-section-heading">
          <h2 id={`${project.slug}-evidence`}>evidence ledger</h2>
          <p data-reading-text>
            public links open signed-out sources. private records show their revision and internal provenance without a dead link.
          </p>
        </div>
        <EvidenceLedger ids={project.requiredEvidence} />
      </section>

      <nav className="pj-related" aria-label={`related to ${project.name}`}>
        {project.related.map((link) => (
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
