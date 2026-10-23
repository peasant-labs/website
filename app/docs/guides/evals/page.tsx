import { Guide } from "@/components/docs/guide";
import { DOCS_GUIDES } from "@/lib/docs-content";
import { EVALS_GUIDE } from "@/lib/docs-guides";
import { metadataForRoute } from "@/lib/projects";

const CARD = DOCS_GUIDES.find((guide) => guide.id === "evals")!;

export const metadata = metadataForRoute({
  title: "run an agent eval | peasant docs",
  description: EVALS_GUIDE.lede,
  canonical: CARD.href,
});

export default function EvalsGuide() {
  return (
    <Guide
      guide={EVALS_GUIDE}
      previous={{ label: "docs home", href: "/docs" }}
      next={{ label: "next: review pull requests", href: "/docs/guides/reviews" }}
    />
  );
}
