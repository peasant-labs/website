import { buildSearchIndex } from "@/lib/docs-search";

/* built once at build time from the docs and blog content, then served as a static file */
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex());
}
