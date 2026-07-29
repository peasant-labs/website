import { EvidenceCitations, ProjectDetail } from "@/components/project-detail";
import { PROJECTS, metadataForRoute } from "@/lib/projects";

const project = PROJECTS.peasant;

export const metadata = metadataForRoute(project.metadata);

function PeasantFlow() {
  return (
    <section className="pj-section pj-flow" data-project-flow aria-labelledby="peasant-flow-heading">
      <div className="pj-section-heading">
        <h2 id="peasant-flow-heading">{project.flow.title}</h2>
        <p data-reading-text>{project.flow.intro}</p>
      </div>
      <ol>
        {project.flow.steps.map((step, index) => (
          <li key={step}>
            <span className="tnum" aria-hidden="true">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <EvidenceCitations ids={project.flow.evidence} />
    </section>
  );
}

function PeasantProof() {
  return (
    <section className="pj-section pj-proof" data-project-proof aria-labelledby="peasant-proof-heading">
      <h2 id="peasant-proof-heading">{project.proof.title}</h2>
      <p data-reading-text>{project.proof.body}</p>
      <ul>
        {project.proof.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <EvidenceCitations ids={project.proof.evidence} />
    </section>
  );
}

export default function PeasantPage() {
  return <ProjectDetail project={project} flow={<PeasantFlow />} proof={<PeasantProof />} />;
}
