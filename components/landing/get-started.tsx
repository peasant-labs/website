"use client";

import { DocCommand } from "@/components/docs/doc-command";
import { Tabs } from "@/components/fairtrade-client";
import { INSTALL } from "@/lib/landing";
import { ArrowRight } from "@peasant-labs/fairtrade/icons";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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
 * On a phone each row reads as the docs' captioned commands do: a small step
 * label, what it does, then the command on one line that scrolls sideways
 * inside its block; and under the card, a quiet link to the install guide.
 * A command that scrolls is a scroll area a keyboard can reach, named the way
 * fairtrade names its own one-line commands; one that shows whole stays out of
 * the tab order.
 */
export function GetStarted() {
  const detected = useSyncExternalStore(noSubscription, detectPlatform, () => "unix" as const);
  const [chosen, setPlatform] = useState<PlatformId | null>(null);
  const platform = chosen ?? detected;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const lines = [...card.querySelectorAll<HTMLElement>(".cli-cmd-line")];
    const mark = () => {
      for (const line of lines) {
        if (line.scrollWidth > line.clientWidth + 1) {
          const command = [...(line.querySelector("code")?.childNodes ?? [])]
            .filter((node) => !(node instanceof Element && node.classList.contains("cli-cmd-sigil")))
            .map((node) => node.textContent)
            .join("");
          line.tabIndex = 0;
          line.setAttribute("role", "region");
          line.setAttribute("aria-label", `command: ${command}`);
        } else {
          line.removeAttribute("tabindex");
          line.removeAttribute("role");
          line.removeAttribute("aria-label");
        }
      }
    };
    const observer = new ResizeObserver(mark);
    for (const line of lines) observer.observe(line);
    return () => observer.disconnect();
  }, [platform]);

  return (
    <>
      <div ref={cardRef} className="gs" data-install-shell>
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
