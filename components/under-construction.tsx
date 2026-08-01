import { DangerZone } from "@/components/fairtrade-client";

type UnderConstructionProps = {
  /** Optional product name woven into the notice body. */
  projectName?: string;
};

/**
 * Page-status notice built on fairtrade's DangerZone: the component always
 * fronts "warning" + a title; we only supply the title and body wording.
 */
export function UnderConstruction({ projectName }: UnderConstructionProps) {
  const body = projectName
    ? `project documentation is still being built. content below is unfinished and unrefined slop.`
    : "this documentation is still being built. content below may be incomplete and will change as the work lands.";

  return (
    <div className="pj-under-construction" data-under-construction>
      <DangerZone title="under construction">
        <p data-reading-text>{body}</p>
      </DangerZone>
    </div>
  );
}
