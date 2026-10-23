import { DocHead, DocJump, DocSteps, type GuideStep } from "@/components/docs/doc-parts";
import { OnThisPage } from "@/components/docs/on-this-page";
import type { Art as ArtSource } from "@/lib/landing";
import Link from "next/link";

type Pager = Readonly<{ label: string; href: string }>;

/**
 * A guide: header with its picture, numbered steps, and the way on. The "on
 * this page" list sits beside the article on a wide screen and folds under the
 * header on a narrow one.
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
    <main id="content" className="dx-page" tabIndex={-1}>
      <DocHead crumb={{ label: "docs", href: "/docs", here: "guides" }} title={title} lede={lede} art={art} />
      <DocJump items={toc} />
      <div className="dx-columns">
        <article className="dx-article" aria-labelledby="page-heading">
          <DocSteps steps={steps} />
          <nav className="dx-pager" aria-label="more guides">
            <Link href={previous.href}>{previous.label}</Link>
            <Link href={next.href}>{next.label}</Link>
          </nav>
        </article>
        <aside className="dx-aside">
          <OnThisPage items={toc} />
        </aside>
      </div>
    </main>
  );
}
