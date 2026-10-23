import { DocBlocks } from "@/components/docs/doc-blocks";
import { DocHead, DocJump, DocSteps } from "@/components/docs/doc-parts";
import { OnThisPage } from "@/components/docs/on-this-page";
import { DOCS_GUIDES } from "@/lib/docs-content";
import type { GuideData } from "@/lib/docs-guides";
import Link from "next/link";

type Pager = Readonly<{ label: string; href: string }>;

/**
 * A guide: header with its picture, numbered steps, and the way on. The "on
 * this page" list sits beside the article on a wide screen and folds under the
 * header on a narrow one. The copy is data in lib/docs-guides.ts, which the
 * docs search reads too.
 */
export function Guide({ guide, previous, next }: { guide: GuideData; previous: Pager; next: Pager }) {
  const card = DOCS_GUIDES.find((item) => item.id === guide.id)!;
  const toc = guide.steps.map((step) => ({ id: step.id, label: step.toc }));
  const steps = guide.steps.map((step) => ({ id: step.id, title: step.title, body: <DocBlocks blocks={step.body} /> }));

  return (
    <main id="content" className="dx-page" tabIndex={-1}>
      <DocHead crumb={{ label: "docs", href: "/docs", here: "guides" }} title={card.title} lede={guide.lede} art={card.art} />
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
