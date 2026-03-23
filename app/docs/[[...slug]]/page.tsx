import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllDocSlugs, getDocBySlug, getPrevNext } from "@/lib/docs";
import { PrevNextNav } from "@/components/docs/prev-next";

export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  return slugs.map((slug) => ({
    slug: slug.length === 0 ? undefined : slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSlug = slug ?? [];
  const doc = getDocBySlug(resolvedSlug);

  if (!doc) {
    return { title: "Not Found" };
  }

  return {
    title: doc.frontmatter.title ?? "Peasant Docs",
    description: doc.frontmatter.description,
  };
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const resolvedSlug = slug ?? [];

  const doc = getDocBySlug(resolvedSlug);
  if (!doc) {
    notFound();
  }

  // Derive the import path relative to content/docs/
  const importPath = doc.filepath.replace(
    process.cwd() + "/content/docs/",
    ""
  );

  let Content: React.ComponentType;
  try {
    const mod = await import(`@/content/docs/${importPath}`);
    Content = mod.default;
  } catch {
    notFound();
  }

  const prevNext = getPrevNext(resolvedSlug);

  return (
    <>
      <Content />
      <PrevNextNav prevNext={prevNext} />
    </>
  );
}
