"use client";

import { DocCommand } from "@/components/docs/doc-command";
import { BrandMark, CopyIconButton, Tabs } from "@/components/fairtrade-client";
import { AGENTS, INSTALL } from "@/lib/landing";
import { ArrowRight } from "@peasant-labs/fairtrade/icons";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type PlatformId = (typeof INSTALL.platforms)[number]["id"];

const noSubscription = () => () => {};

function detectPlatform(): PlatformId {
  return /windows/i.test(navigator.userAgent) ? "windows" : "unix";
}

/** Install in the terminal, then copy a message into the coding agent. */
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
                <li className="gs-line">
                  <div className="gs-text">
                    <h3 className="gs-action">{INSTALL.actions[0]}</h3>
                    {item.id === "windows" && <p className="gs-note">{item.note}</p>}
                    <DocCommand command={item.command} />
                  </div>
                </li>
                <li className="gs-line">
                  <div className="gs-text">
                    <h3 className="gs-action">{INSTALL.actions[1]}</h3>
                    <ul className="gs-agents" aria-label="supported coding agents">
                      {AGENTS.list.map((agent) => (
                        <li key={agent.mark}><BrandMark name={agent.mark} /><span>{agent.name}</span></li>
                      ))}
                    </ul>
                    <div className="gs-agent-prompt">
                      <p>{INSTALL.prompt}</p>
                      <span className="gs-prompt-copy-slot">
                        {mounted && <CopyIconButton value={INSTALL.prompt} label="copy prompt for your coding agent" size="md" className="gs-prompt-copy" />}
                      </span>
                    </div>
                  </div>
                </li>
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
