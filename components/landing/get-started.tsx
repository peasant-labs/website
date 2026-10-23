"use client";

import { INSTALL } from "@/lib/landing";
import { Check, Copy } from "@peasant-labs/fairtrade/icons";
import { useEffect, useState, useSyncExternalStore, type KeyboardEvent } from "react";

type PlatformId = (typeof INSTALL.platforms)[number]["id"];

const noSubscription = () => () => {};

function detectPlatform(): PlatformId {
  return /windows/i.test(navigator.userAgent) ? "windows" : "unix";
}

/**
 * The two commands: install for the reader's system, then kickstart. A Windows
 * visitor lands on the PowerShell line; everyone else on the shell one. The
 * command text wraps rather than scrolling, so the whole line is always on
 * screen; copy takes the exact command either way.
 */
export function GetStarted() {
  const detected = useSyncExternalStore(noSubscription, detectPlatform, () => "unix" as const);
  const [chosen, setPlatform] = useState<PlatformId | null>(null);
  const platform = chosen ?? detected;

  const install = INSTALL.platforms.find((item) => item.id === platform)!;

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const ids = INSTALL.platforms.map((item) => item.id);
    const focused = ids.findIndex((id) => (event.target as HTMLElement).id === `os-tab-${id}`);
    const position = focused >= 0 ? focused : ids.indexOf(platform);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? ids.length - 1
          : (position + (event.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
    setPlatform(ids[next]!);
    document.getElementById(`os-tab-${ids[next]}`)?.focus();
  }

  return (
    <div className="gs-shell" data-install-shell>
      <div className="gs-os" role="tablist" aria-label="operating system" onKeyDown={onKey}>
        {INSTALL.platforms.map((item) => (
          <button
            key={item.id}
            id={`os-tab-${item.id}`}
            type="button"
            role="tab"
            className="gs-os-tab"
            aria-selected={item.id === platform}
            aria-controls="os-commands"
            tabIndex={item.id === platform ? 0 : -1}
            onClick={() => setPlatform(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div id="os-commands" role="tabpanel" aria-labelledby={`os-tab-${platform}`}>
        <ol className="gs-lines">
          <CommandLine key={install.command} n={1} command={install.command} />
          <CommandLine n={2} command={INSTALL.kickstart} />
        </ol>
      </div>
    </div>
  );
}

function CommandLine({ n, command }: { n: number; command: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <li className="gs-line">
      <span className="gs-n" aria-hidden="true">
        {n}
      </span>
      <code className="gs-cmd" data-command>
        {command}
      </code>
      <button
        type="button"
        className="gs-copy"
        aria-label={copied ? `copied ${command}` : `copy ${command}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(command);
            setCopied(true);
          } catch {
            // A denied clipboard leaves the button as it was rather than claiming success.
          }
        }}
      >
        {copied ? (
          <Check aria-hidden="true" focusable="false" />
        ) : (
          <Copy aria-hidden="true" focusable="false" />
        )}
        <span>{copied ? "copied" : "copy"}</span>
      </button>
    </li>
  );
}
