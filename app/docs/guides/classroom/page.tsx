import { Guide } from "@/components/docs/guide";
import { DOCS_GUIDES } from "@/lib/docs-content";
import { CLASSROOM_GUIDE } from "@/lib/docs-guides";
import { metadataForRoute } from "@/lib/projects";

const CARD = DOCS_GUIDES.find((guide) => guide.id === "classroom")!;

export const metadata = metadataForRoute({
  title: `${CARD.title} | peasant docs`,
  description: CLASSROOM_GUIDE.lede,
  canonical: CARD.href,
});

export default function GuidePage() {
  return <Guide guide={CLASSROOM_GUIDE} previous={{ label: "review pull requests", href: "/docs/guides/reviews" }} next={{ label: "onboarding", href: "/docs/guides/onboarding" }} />;
}
