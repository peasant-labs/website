"use client";

import {
  CardImg,
  ConsentDialog,
  MetaItem,
} from "@/components/fairtrade-client";
import { JOIN_AXES } from "@/components/village-consent";
import type { VillageExampleCollective } from "@/lib/projects";
import { FileText, Link2, User, UserPlus, Users } from "@peasant-labs/fairtrade/icons";
import Image from "next/image";
import collectiveImage from "@/public/collective-portrait.png";
import { useState } from "react";

/**
 * Fairtrade collective CardImg + join CTA. Join opens ConsentDialog with the
 * same identity-reveal framing as fairtrade's "join soil-and-syntax" flow,
 * retargeted to the example collective (desert archivists).
 */
export function VillageExample({
  example,
  joinLabel,
}: {
  example: VillageExampleCollective;
  joinLabel: string;
}) {
  const [joinOpen, setJoinOpen] = useState(false);

  /*
   * The dialog names the collective by its handle, the way village addresses one,
   * rather than by the display name the card is titled with.
   */
  const slug = example.title.trim().replace(/\s+/g, "-");

  return (
    <div className="pj-village-example" data-village-example>
      <CardImg
        link={false}
        className="pj-village-collective-card"
        thumb={
          /*
           * `.card-img` is the imagery-on-top card, and a card-img without the
           * img is just a card. The specimen is the page's own decoration — it
           * carries no information the copy below does not — so it is hidden
           * rather than described.
           */
          <Image
            src={collectiveImage}
            alt=""
            aria-hidden="true"
            sizes="(min-width: 48rem) 22rem, 100vw"
            className="pj-village-collective-thumb"
          />
        }
        head={
          /*
           * A collective is headed the way fairtrade heads one: the group glyph
           * leading the name of the thing, in the muted `.grow` the card-head
           * reserves for it.
           */
          <span className="grow mono pj-village-collective-head">
            <Users aria-hidden="true" />
            {example.head}
          </span>
        }
        title={example.title}
        desc={example.desc}
        bullets={[...example.bullets]}
        foot={
          <>
            <MetaItem icon={User} value={example.members}>
              members
            </MetaItem>
            <MetaItem icon={FileText} value={example.transcripts}>
              transcripts
            </MetaItem>
            <MetaItem icon={Link2}>{example.linked}</MetaItem>
          </>
        }
      />
      {/*
       * fairtrade's own join control, matched: the commons surface writes this as a
       * small primary button leading with a 14px UserPlus, not the default-height
       * button this used to be. The mark is decorative — the label already names
       * the action — and the space before it is fairtrade's own.
       */}
      <button
        type="button"
        className="btn btn-sm btn-primary pj-village-join-action"
        data-join-collective
        onClick={() => setJoinOpen(true)}
      >
        <UserPlus size={14} aria-hidden="true" /> {joinLabel}
      </button>

      <ConsentDialog
        open={joinOpen}
        title={joinLabel}
        intro={
          /*
           * One paragraph, not two: the emphasis carries the shape of the sentence,
           * so the state a reader is in, the collective they are crossing into, and
           * what everyone else keeps seeing are the three things that stand out.
           */
          <p>
            you&apos;re currently <span className="cns-em">not discoverable</span>, so your
            handle is hidden across the commons. joining{" "}
            <span className="cns-name cns-em">{slug}</span> reveals your profile to its owners
            so they can review your membership and contributions. other members still see you
            as <span className="cns-em">anon</span>.
          </p>
        }
        requireConsent
        consentLabel="i understand and consent"
        confirmLabel="reveal & join"
        confirmIcon={UserPlus}
        cancelLabel="cancel"
        onCancel={() => setJoinOpen(false)}
        onConfirm={() => setJoinOpen(false)}
        labelId="village-join-consent-title"
      >
        <dl className="pj-village-join-axes" data-join-axes>
          {JOIN_AXES.map(({ icon: Icon, key, value }) => (
            <div className="pj-village-join-axis" key={key}>
              <dt className="pj-village-join-axis-key">
                <Icon size={16} aria-hidden="true" />
                {key}
              </dt>
              <dd className="pj-village-join-axis-value">{value}</dd>
            </div>
          ))}
        </dl>
      </ConsentDialog>
    </div>
  );
}
