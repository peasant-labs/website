import { Art } from "@/components/art";
import { DocCommand, DocHead, DocNote } from "@/components/docs/doc-parts";
import { RedactionLabel } from "@/components/docs/redaction-label";
import { Rich } from "@/components/docs/rich-text";
import { BrandMark } from "@/components/fairtrade-client";
import { DOCS_HOME, DOCS_START } from "@/lib/docs-content";
import { metadataForRoute } from "@/lib/projects";
import Link from "next/link";

export const metadata = metadataForRoute({
  title: "docs | peasant labs",
  description: DOCS_HOME.lede,
  canonical: "/docs",
});

/**
 * The docs overview: the guides first, then the reference a first-time reader
 * needs in order — install, set up, publish — and the facts behind it.
 * Every command and claim here is checked against the peasant and village
 * sources; see lib/docs-content.ts.
 */
export default function DocsHome() {
  const { install, kickstart, publish, agents, redaction, access, cli } = DOCS_HOME;

  return (
    <main id="content" className="dx-page" tabIndex={-1}>
      <DocHead title={DOCS_HOME.title} lede={DOCS_HOME.lede} />

      <section className="dx-sec" aria-labelledby="guides">
        <h2 id="guides">start here</h2>
        <div className="dx-guides">
          {DOCS_START.map((guide) => (
            <Link key={guide.id} className="dx-guide" href={guide.href}>
              <Art art={guide.art} className="dx-guide-art" />
              <span className="dx-guide-title">{guide.title}</span>
              <span className="dx-guide-desc">
                <Rich text={guide.summary} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="dx-sec" id="install" aria-labelledby="install-title">
        <h2 id="install-title">{install.title}</h2>
        <p>
          <Rich text={install.intro} />
        </p>
        {install.platforms.map((platform) => (
          <div key={platform.label} className="dx-cmd-group">
            <h3>{platform.label}</h3>
            <DocCommand command={platform.command} />
          </div>
        ))}
        <p>
          <Rich text={install.windows} />
        </p>
      </section>

      <section className="dx-sec" id="kickstart" aria-labelledby="kickstart-title">
        <h2 id="kickstart-title">{kickstart.title}</h2>
        <DocCommand command={kickstart.command} />
        <p>{kickstart.intro}</p>
        <ol className="dx-list">
          {kickstart.steps.map((step) => (
            <li key={step}>
              <Rich text={step} />
            </li>
          ))}
        </ol>
        <DocNote>
          <Rich text={kickstart.never} />
        </DocNote>
      </section>

      <section className="dx-sec" id="publish" aria-labelledby="publish-title">
        <h2 id="publish-title">{publish.title}</h2>
        <h3>{publish.claude.title}</h3>
        <p>
          <Rich text={publish.claude.plugin} />
        </p>
        {publish.claude.commands.map((command) => (
          <DocCommand key={command} command={command} />
        ))}
        {publish.claude.body.map((paragraph) => (
          <p key={paragraph}>
            <Rich text={paragraph} />
          </p>
        ))}
        <h3>{publish.others.title}</h3>
        <p>
          <Rich text={publish.others.body} />
        </p>
        <h3>{publish.terminal.title}</h3>
        {publish.terminal.commands.map((command) => (
          <DocCommand key={command} command={command} />
        ))}
        {publish.terminal.body.map((paragraph) => (
          <p key={paragraph}>
            <Rich text={paragraph} />
          </p>
        ))}
      </section>

      <section className="dx-sec" id="agents" aria-labelledby="agents-title">
        <h2 id="agents-title">{agents.title}</h2>
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

      <section className="dx-sec" id="redaction" aria-labelledby="redaction-title">
        <h2 id="redaction-title">{redaction.title}</h2>
        <p>
          <Rich text={redaction.intro} />
        </p>
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
      </section>

      <section className="dx-sec" id="access" aria-labelledby="access-title">
        <h2 id="access-title">{access.title}</h2>
        <p>{access.intro}</p>
        <dl className="dx-defs">
          {access.terms.map((term) => (
            <div key={term.name}>
              <dt>{term.name}</dt>
              <dd>
                {term.items.length === 1 ? (
                  <Rich text={term.items[0]} />
                ) : (
                  <ul>
                    {term.items.map((item) => (
                      <li key={item}>
                        <Rich text={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="dx-sec" id="cli" aria-labelledby="cli-title">
        <h2 id="cli-title">{cli.title}</h2>
        <p>
          <Rich text={cli.intro} />
        </p>
        <div className="dx-table" role="region" aria-label="cli commands" tabIndex={0} data-contained-overflow>
          <table>
            <thead>
              <tr>
                <th scope="col">command</th>
                <th scope="col">what it does</th>
              </tr>
            </thead>
            <tbody>
              {cli.commands.map((row) => (
                <tr key={row.command}>
                  <td>
                    <code>{row.command}</code>
                  </td>
                  <td>
                    <Rich text={row.does} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
