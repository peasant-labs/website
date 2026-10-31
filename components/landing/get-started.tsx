"use client";

import { DocCommand } from "@/components/docs/doc-command";
import { CopyIconButton, Tabs } from "@/components/fairtrade-client";
import { INSTALL } from "@/lib/landing";
import { ArrowRight } from "@peasant-labs/fairtrade/icons";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type PlatformId = (typeof INSTALL.platforms)[number]["id"];

const noSubscription = () => () => {};

function detectPlatform(): PlatformId {
  return /windows/i.test(navigator.userAgent) ? "windows" : "unix";
}

/** A terminal command and an agent prompt, using the docs' copyable blocks. */
export function GetStarted() {
  const detected = useSyncExternalStore(noSubscription, detectPlatform, () => "unix" as const);
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false);
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
                {[item.command, INSTALL.prompt].map((command, index) => (
                  <li key={command} className="gs-line">
                    <span className="gs-n" aria-hidden="true">
                      {index + 1}
                    </span>
                    <div className="gs-text">
                      {index === 0 ? <DocCommand command={command} /> : (
                        <div className="gs-agent-prompt">
                          <p>{command}</p>
                          <span className="gs-prompt-copy-slot">
                            {mounted && <CopyIconButton value={command} label="copy prompt for your coding agent" size="md" className="gs-prompt-copy" />}
                          </span>
                        </div>
                      )}
                      <p className="gs-note">{index === 0 ? item.note : INSTALL.notes[index]}</p>
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
