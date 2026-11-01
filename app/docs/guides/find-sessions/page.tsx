import { Guide } from "@/components/docs/guide";
import { DOCS_GUIDES } from "@/lib/docs-content";
import { FIND_SESSIONS_GUIDE } from "@/lib/docs-guides";
import { metadataForRoute } from "@/lib/projects";

const CARD = DOCS_GUIDES.find((guide) => guide.id === "find-sessions")!;

export const metadata = metadataForRoute({
  title: `${CARD.title} | peasant docs`,
  description: FIND_SESSIONS_GUIDE.lede,
  canonical: CARD.href,
});

export default function GuidePage() {
  return <Guide guide={FIND_SESSIONS_GUIDE} previous={{ label: "onboarding", href: "/docs/guides/onboarding" }} next={{ label: "docs home", href: "/docs" }} />;
}
