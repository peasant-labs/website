"use client";

import { DocCommand } from "@/components/docs/doc-command";
import { Tabs } from "@/components/fairtrade-client";
import { INSTALL } from "@/lib/landing";
import { ArrowRight } from "@peasant-labs/fairtrade/icons";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

type PlatformId = (typeof INSTALL.platforms)[number]["id"];

const noSubscription = () => () => {};

function detectPlatform(): PlatformId {
  return /windows/i.test(navigator.userAgent) ? "windows" : "unix";
}

/**
 * The three commands on one card, in fairtrade's own parts, the same ones the
 * docs use: its tabs for the systems, then a numbered row per command, each
 * a CommandBlock with its copy button and, under it, what it does in the docs'
 * label style. The first command follows the chosen system; a Windows visitor
 * lands on the PowerShell tab. Nothing moves.
 *
 * On a phone each row reads as the docs' captioned commands do: its number and
 * what it does on a line, then the command on one line that scrolls sideways
 * inside its block; and under the card, a quiet link to the install guide.
 */
export function GetStarted() {
  const detected = useSyncExternalStore(noSubscription, detectPlatform, () => "unix" as const);
  const [chosen, setPlatform] = useState<PlatformId | null>(null);
  const platform = chosen ?? detected;

  return (
    <>
      <div className="gs" data-install-shell>
        <Tabs
          aria-label="operating system"
          value={platform}
          onChange={(id) => setPlatform(id as PlatformId)}
          tabs={INSTALL.platforms.map((item) => ({
            id: item.id,
            label: item.label,
            content: (
              <ol className="gs-lines">
                {[item.command, INSTALL.kickstart, INSTALL.push].map((command, index) => (
                  <li key={command} className="gs-line">
                    <span className="gs-n" aria-hidden="true">
                      {index + 1}
                    </span>
                    <div className="gs-text">
                      <DocCommand command={command} />
                      <p className="gs-note">{INSTALL.notes[index]}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ),
          }))}
        />
      </div>
      <Link className="gs-guide" href={INSTALL.installGuide.href}>
        {INSTALL.installGuide.label}
        <ArrowRight aria-hidden="true" focusable="false" />
      </Link>
    </>
  );
}
