"use client";

import { INSTALL } from "@/lib/landing";
import { Fragment, useEffect, useState, useSyncExternalStore, type KeyboardEvent } from "react";

type PlatformId = (typeof INSTALL.platforms)[number]["id"];

const noSubscription = () => () => {};

function detectPlatform(): PlatformId {
  return /windows/i.test(navigator.userAgent) ? "windows" : "unix";
}

/**
 * The three commands on one panel: the systems as tabs along its top, then a
 * numbered row per command, the command itself and, under it, what it does in
 * plain words, with its own copy button at the row's end. The first command
 * follows the chosen system; a Windows visitor lands on the PowerShell one.
 * Nothing moves: the commands are whole from the start. A command wraps at its
 * spaces on a phone; copy takes the exact command either way.
 */
export function GetStarted() {
  const detected = useSyncExternalStore(noSubscription, detectPlatform, () => "unix" as const);
  const [chosen, setPlatform] = useState<PlatformId | null>(null);
  const platform = chosen ?? detected;
  const install = INSTALL.platforms.find((item) => item.id === platform)!;
  const commands = [install.command, INSTALL.kickstart, INSTALL.push];

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
    <div className="gs" data-install-shell>
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
      <ol id="os-commands" className="gs-lines" role="tabpanel" aria-labelledby={`os-tab-${platform}`}>
        {commands.map((command, index) => (
          <CommandLine key={command} n={index + 1} command={command} note={INSTALL.notes[index]!} />
        ))}
      </ol>
    </div>
  );
}

function CommandLine({ n, command, note }: { n: number; command: string; note: string }) {
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
      <span className="gs-text">
        <code className="gs-cmd" data-command>
          {/* a long address may wrap after its scheme and after each path slash, as well as at its spaces */}
          {command.split(/(?<=:\/\/)|(?<=[a-z0-9]\/)/i).map((part, index) => (
            <Fragment key={index}>
              {index ? <wbr /> : null}
              {part}
            </Fragment>
          ))}
        </code>
        <span className="gs-note">{note}</span>
      </span>
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
        {copied ? "copied" : "copy"}
      </button>
    </li>
  );
}
