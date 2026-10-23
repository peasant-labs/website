"use client";

import { Swap } from "@/components/landing/scenes/motion";
import { SAMPLE_COLLECTIVE, SAMPLE_TITLE } from "@/components/landing/scenes/sample";
import { Clock, User, Users } from "@peasant-labs/fairtrade/icons";
import { MetaItem, ProviderIcon, ProviderName, PublishBar, PublishStateLabel } from "@peasant-labs/fairtrade/ui";

const noop = () => {};

/*
 * The local session page, as the browser shows it in the record and publish
 * scenes, reduced to what the story needs: the short title, the agent's mark
 * and one figure, the publish state with its one action, and two lines of the
 * transcript. Its state crossfades in place, so publishing moves nothing.
 */
export function SessionPage({ published = false }: { published?: boolean }) {
  return (
    <div className="scn-page">
      <div className="scn-page-top" data-focus="page-head">
        <h3 className="scn-page-title">{SAMPLE_TITLE}</h3>
        <div className="scn-page-meta">
          <ProviderName harness="claude-code" />
          <MetaItem icon={Clock} value="14m" />
        </div>
        <div className="scn-page-state" data-focus="page-state">
          <Swap on={published ? 1 : 0}>
            <PublishBar state="not-published" onAction={noop} />
            <span className="scn-published">
              <PublishStateLabel state="published" />
              <MetaItem icon={Users}>{SAMPLE_COLLECTIVE.name}</MetaItem>
            </span>
          </Swap>
        </div>
      </div>
      <div className="scn-turns">
        <p className="scn-turn">
          <User aria-hidden="true" />
          Uploads to staging fail with a 403.
        </p>
        <p className="scn-turn">
          <ProviderIcon harness="claude-code" />
          Checking which key the upload signs with.
        </p>
      </div>
    </div>
  );
}
