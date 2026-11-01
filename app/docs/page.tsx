import { GetStarted } from "@/components/landing/get-started";
import { Art } from "@/components/art";
import {
  DocCaptionedCommand,
  DocCommand,
  DocCommands,
  DocHead,
  DocJump,
  DocList,
  DocNote,
  DocProcedure,
} from "@/components/docs/doc-parts";
import { OnThisPage } from "@/components/docs/on-this-page";
import { RedactionLabel } from "@/components/docs/redaction-label";
import { Rich } from "@/components/docs/rich-text";
import { BrandMark } from "@/components/fairtrade-client";
import { DOCS_HOME, DOCS_HOME_TOC, DOCS_NEXT, DOCS_START } from "@/lib/docs-content";
import { metadataForRoute } from "@/lib/projects";
import Link from "next/link";

export const metadata = metadataForRoute({
  title: "docs | peasant",
  description: DOCS_HOME.lede,
  canonical: "/docs",
});

/**
 * The docs overview: install and set up first, then the guides and the
 * sections most people look for, then the reference a first-time reader needs
 * in order, with "on this page" beside it on a wide screen.
 * Every command and claim here is checked against the peasant and village
 * sources; see lib/docs-content.ts.
 */
/** A run of short paragraphs, each one idea. */
function Paragraphs({ items }: { items: readonly string[] }) {
  return items.map((item) => (
    <p key={item}>
      <Rich text={item} />
    </p>
  ));
}

export default function DocsHome() {
  const { quickstart, install, kickstart, record, signIn, publish, autoPublish, codeMap, changes, agents, redaction, access } =
    DOCS_HOME;
  const { prune, configuration, cli } = DOCS_HOME;
  const [publishStart, ...guideStarts] = DOCS_START;

  return (
    <main id="content" className="dx-page" tabIndex={-1}>
      <DocHead title={DOCS_HOME.title} lede={DOCS_HOME.lede} columns />
      <DocJump items={DOCS_HOME_TOC} />

      <div className="dx-columns">
        <div className="dx-article">
          <section className="dx-sec dx-quickstart" id={quickstart.id} aria-labelledby={`${quickstart.id}-title`}>
            <div className="dx-prose"><h2 id={`${quickstart.id}-title`}>{quickstart.title}</h2></div>
            <GetStarted showGuide={false} />
            <div className="dx-prose"><p>{quickstart.after} <Link href="#install">detailed setup</Link></p></div>
          </section>

          <section className="dx-sec dx-prose" id={install.id} aria-labelledby={`${install.id}-title`}>
            <h2 id={`${install.id}-title`}>{install.title}</h2>
            <p>
              <Rich text={install.intro} />
            </p>
            {install.platforms.map((platform) => (
              <DocCaptionedCommand key={platform.label} caption={platform.label} command={platform.command} />
            ))}
            <p>{install.installerIntro}</p>
            <DocList items={install.installer} />
            {install.windows.map((paragraph) => (
              <p key={paragraph}>
                <Rich text={paragraph} />
              </p>
            ))}
          </section>

          <section className="dx-sec dx-prose" id={kickstart.id} aria-labelledby={`${kickstart.id}-title`}>
            <h2 id={`${kickstart.id}-title`}>{kickstart.title}</h2>
            <DocCommand command={kickstart.command} />
            <p>{kickstart.intro}</p>
            <DocList items={kickstart.steps} ordered />
            <DocNote>
              <Rich text={kickstart.never} />
            </DocNote>
          </section>

          <section className="dx-sec dx-prose" id={DOCS_NEXT.id} aria-labelledby={`${DOCS_NEXT.id}-title`}>
            <h2 id={`${DOCS_NEXT.id}-title`}>{DOCS_NEXT.title}</h2>
            <p>
              <Link className="dx-link" href={publishStart.href}>{publishStart.title}</Link>. <Rich text={publishStart.summary} />
            </p>
            <div className="dx-guides">
              {guideStarts.map((guide) => (
                <Link key={guide.id} className="dx-guide" href={guide.href}>
                  <Art art={guide.art} className="dx-pic dx-guide-art" />
                  <span className="dx-guide-text">
                    <span className="dx-guide-title">{guide.title}</span>
                    <span className="dx-guide-desc">
                      <Rich text={guide.summary} />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="dx-sec dx-prose" id={record.id} aria-labelledby={`${record.id}-title`}>
            <h2 id={`${record.id}-title`}>{record.title}</h2>
            <Paragraphs items={record.intro} />
            <DocCommand command={record.command} />
            <DocList items={record.flags} />
            <p>
              <Rich text={record.single} />
            </p>
            <p>{record.emptyIntro}</p>
            <DocList items={record.empty} />
          </section>

          <section className="dx-sec dx-prose" id={signIn.id} aria-labelledby={`${signIn.id}-title`}>
            <h2 id={`${signIn.id}-title`}>{signIn.title}</h2>
            <p>{signIn.intro}</p>
            <DocCommand command={signIn.command} />
            <Paragraphs items={signIn.body} />
            <p>{signIn.logout}</p>
            <DocCommand command={signIn.logoutCommand} />
            <DocNote>
              <Rich text={signIn.note} />
            </DocNote>
          </section>

          <section className="dx-sec dx-prose" id={publish.id} aria-labelledby={`${publish.id}-title`}>
            <h2 id={`${publish.id}-title`}>{publish.title}</h2>
            <Paragraphs items={publish.before} />
            <h3>{publish.claude.title}</h3>
            <DocProcedure steps={publish.claude.steps} />
            <p>
              <Rich text={publish.claude.after} />
            </p>
            <h3>{publish.others.title}</h3>
            <p>
              <Rich text={publish.others.body} />
            </p>
            <h3>{publish.terminal.title}</h3>
            <DocProcedure steps={publish.terminal.steps} />
            {publish.terminal.body.map((paragraph) => (
              <p key={paragraph}>
                <Rich text={paragraph} />
              </p>
            ))}
            <p>{publish.terminal.flagsIntro}</p>
            <DocList items={publish.terminal.flags} />
          </section>

          <section className="dx-sec dx-prose" id={autoPublish.id} aria-labelledby={`${autoPublish.id}-title`}>
            <h2 id={`${autoPublish.id}-title`}>{autoPublish.title}</h2>
            <Paragraphs items={autoPublish.intro} />
            <p>{autoPublish.waysIntro}</p>
            <DocProcedure steps={autoPublish.ways} ordered={false} />
            <Paragraphs items={autoPublish.rules} />
            <p>{autoPublish.hooksIntro}</p>
            <DocCommands commands={autoPublish.hooks} />
            <DocList items={autoPublish.hooksNotes} />
          </section>

          <section className="dx-sec dx-prose" id={codeMap.id} aria-labelledby={`${codeMap.id}-title`}>
            <h2 id={`${codeMap.id}-title`}>{codeMap.title}</h2>
            <p>{codeMap.intro}</p>
            <DocList items={codeMap.legend} />
            <Paragraphs items={codeMap.actions} />
          </section>

          <section className="dx-sec dx-prose" id={changes.id} aria-labelledby={`${changes.id}-title`}>
            <h2 id={`${changes.id}-title`}>{changes.title}</h2>
            <p>
              <Rich text={changes.intro} />
            </p>
            <DocList items={changes.legend} />
          </section>

          <section className="dx-sec dx-prose" id={agents.id} aria-labelledby={`${agents.id}-title`}>
            <h2 id={`${agents.id}-title`}>{agents.title}</h2>
            <p>{agents.intro}</p>
            <ul className="dx-agents">
              {agents.list.map((agent) => (
                <li key={agent.name}>
                  <BrandMark name={agent.brand} size={20} />
                  <span className="dx-agent-name">{agent.name}</span>
                  {agent.note ? <span className="dx-agent-note">{agent.note}</span> : null}
                </li>
              ))}
            </ul>
            <p>{agents.outro}</p>
          </section>

          <section className="dx-sec dx-prose" id={redaction.id} aria-labelledby={`${redaction.id}-title`}>
            <h2 id={`${redaction.id}-title`}>{redaction.title}</h2>
            {redaction.intro.map((paragraph) => (
              <p key={paragraph}>
                <Rich text={paragraph} />
              </p>
            ))}
            <dl className="dx-defs">
              {redaction.categories.map((item) => (
                <div key={item.category}>
                  <dt>
                    {item.name} <RedactionLabel category={item.category} />
                  </dt>
                  <dd>
                    <Rich text={item.covers} />
                  </dd>
                </div>
              ))}
            </dl>
            {redaction.body.map((paragraph) => (
              <p key={paragraph}>
                <Rich text={paragraph} />
              </p>
            ))}
            <DocNote>{redaction.caution}</DocNote>
            <p>{redaction.server}</p>
          </section>

          <section className="dx-sec dx-prose" id={access.id} aria-labelledby={`${access.id}-title`}>
            <h2 id={`${access.id}-title`}>{access.title}</h2>
            <p>{access.intro}</p>
            <dl className="dx-defs">
              {access.terms.map((term) => (
                <div key={term.name}>
                  <dt>{term.name}</dt>
                  <dd>
                    {term.items.length === 1 ? <Rich text={term.items[0]} /> : <DocList items={term.items} />}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="dx-sec dx-prose" id={prune.id} aria-labelledby={`${prune.id}-title`}>
            <h2 id={`${prune.id}-title`}>{prune.title}</h2>
            <Paragraphs items={prune.intro} />
            <DocCommand command={prune.command} />
            <DocList items={prune.filters} />
            <Paragraphs items={prune.notes} />
          </section>

          <section className="dx-sec dx-prose" id={configuration.id} aria-labelledby={`${configuration.id}-title`}>
            <h2 id={`${configuration.id}-title`}>{configuration.title}</h2>
            <p>
              <Rich text={configuration.intro} />
            </p>
            <DocList items={configuration.files} />
            <Paragraphs items={configuration.flags} />
            <Paragraphs items={configuration.editors} />
          </section>

          <section className="dx-sec dx-prose" id={cli.id} aria-labelledby={`${cli.id}-title`}>
            <h2 id={`${cli.id}-title`}>{cli.title}</h2>
            <p>
              <Rich text={cli.intro} />
            </p>
            <dl className="dx-ref">
              {cli.commands.map((row) => (
                <div key={row.command}>
                  <dt>
                    <code>{row.command}</code>
                  </dt>
                  <dd>
                    <Rich text={row.does} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
        <aside className="dx-aside">
          <OnThisPage items={DOCS_HOME_TOC} />
        </aside>
      </div>
    </main>
  );
}
