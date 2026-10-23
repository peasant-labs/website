import { Guide } from "@/components/docs/guide";
import { DOCS_GUIDES } from "@/lib/docs-content";
import { REVIEWS_GUIDE } from "@/lib/docs-guides";
import { metadataForRoute } from "@/lib/projects";

const CARD = DOCS_GUIDES.find((guide) => guide.id === "reviews")!;

export const metadata = metadataForRoute({
  title: "review pull requests | peasant docs",
  description: REVIEWS_GUIDE.lede,
  canonical: CARD.href,
});

export default function ReviewsGuide() {
  return (
    <Guide
      guide={REVIEWS_GUIDE}
      previous={{ label: "previous: run an agent eval", href: "/docs/guides/evals" }}
      next={{ label: "docs home", href: "/docs" }}
    />
  );
}
