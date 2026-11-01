import { Guide } from "@/components/docs/guide";
import { DOCS_GUIDES } from "@/lib/docs-content";
import { ONBOARDING_GUIDE } from "@/lib/docs-guides";
import { metadataForRoute } from "@/lib/projects";

const CARD = DOCS_GUIDES.find((guide) => guide.id === "onboarding")!;

export const metadata = metadataForRoute({
  title: `${CARD.title} | peasant docs`,
  description: ONBOARDING_GUIDE.lede,
  canonical: CARD.href,
});

export default function GuidePage() {
  return <Guide guide={ONBOARDING_GUIDE} previous={{ label: "classroom", href: "/docs/guides/classroom" }} next={{ label: "find-sessions", href: "/docs/guides/find-sessions" }} />;
}
