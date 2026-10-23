import { Art } from "@/components/art";
import { DocHead, DocSteps, type GuideStep } from "@/components/docs/doc-parts";
import { OnThisPage } from "@/components/docs/on-this-page";
import type { Art as ArtSource } from "@/lib/landing";
import Link from "next/link";

type Pager = Readonly<{ label: string; href: string }>;

/**
 * A guide: header, one picture, numbered steps, and the way on. The "on this
 * page" list sits beside the article on a wide screen and is left out on a
 * narrow one, where the steps are their own table of contents.
 */
export function Guide({
  title,
  lede,
  art,
  steps,
  toc,
  previous,
  next,
}: {
  title: string;
  lede: string;
  art: ArtSource;
  steps: readonly GuideStep[];
  toc: readonly { id: string; label: string }[];
  previous: Pager;
  next: Pager;
}) {
  return (
    <main id="content" className="dx-page dx-guide-page" tabIndex={-1}>
      <article className="dx-article">
        <DocHead crumb={{ label: "docs", href: "/docs", here: "guides" }} title={title} lede={lede} />
        <Art art={art} className="dx-figure" />
        <DocSteps steps={steps} />
        <nav className="dx-pager" aria-label="more guides">
          <Link href={previous.href}>{previous.label}</Link>
          <Link href={next.href}>{next.label}</Link>
        </nav>
      </article>
      <aside className="dx-aside">
        <OnThisPage items={toc} />
      </aside>
    </main>
  );
}
