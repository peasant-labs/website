"use client";

import { TerminalWindow } from "@/components/mac";
import { INSTALL } from "@/lib/landing";
import { REVEAL_CLASS } from "@/lib/theme";
import { Check, Copy } from "@peasant-labs/fairtrade/icons";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

type PlatformId = (typeof INSTALL.platforms)[number]["id"];
/* one keystroke, and the pause before the second command: both are whole within about a second and a half */
const KEY_MS = 18;
const BETWEEN_MS = 180;
/* the longest the typing can take, whichever platform is showing */
const LONGEST_MS =
  Math.max(...INSTALL.platforms.map((item) => item.command.length)) * KEY_MS +
  BETWEEN_MS +
  INSTALL.kickstart.length * KEY_MS;

const noSubscription = () => () => {};

function detectPlatform(): PlatformId {
  return /windows/i.test(navigator.userAgent) ? "windows" : "unix";
}

/**
 * The two steps, in a Terminal window: each a number, what it does in two or
 * three words, and its command at a short prompt, with its own copy button at
 * the end of the line. The window's tabs, attached under its title bar, switch
 * both commands between the reader's systems; a Windows visitor lands on the
 * PowerShell tab, everyone else on the shell one.
 *
 * The commands type themselves once, the first time the window comes into
 * view, and are whole within about a second and a half; only each character's
 * opacity changes, so nothing reflows while they type. A window already on
 * screen when the page opens, and every window under reduced motion, shows
 * them whole. A line wraps at its spaces rather than scrolling; copy takes the
 * exact command either way.
 */
export function GetStarted() {
  const detected = useSyncExternalStore(noSubscription, detectPlatform, () => "unix" as const);
  const [chosen, setPlatform] = useState<PlatformId | null>(null);
  const platform = chosen ?? detected;
  const install = INSTALL.platforms.find((item) => item.id === platform)!;

  const windowRef = useRef<HTMLDivElement>(null);
  const firstMs = install.command.length * KEY_MS;

  /*
   * The typing is the window's own state, kept on its element rather than in
   * React: the server and a reader without motion get the commands whole, and
   * the window only hides them, to type them, when it starts below the fold.
   */
  useEffect(() => {
    const element = windowRef.current;
    if (!element || !document.documentElement.classList.contains(REVEAL_CLASS)) return;
    const box = element.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;
    element.dataset.typing = "wait";
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        element.dataset.typing = "run";
        timer = window.setTimeout(() => {
          element.dataset.typing = "done";
        }, LONGEST_MS + 200);
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

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

  const tabs = (
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
  );

  return (
    <div className="gs" data-install-shell>
      <div ref={windowRef} className="gs-window" style={{ "--gs-key": `${KEY_MS}ms` } as CSSProperties}>
        <TerminalWindow title={install.title} className="gs-term">
          {tabs}
          <div id="os-commands" role="tabpanel" aria-labelledby={`os-tab-${platform}`}>
            <ol className="gs-lines">
              <CommandLine
                key={install.command}
                n={1}
                step={INSTALL.steps[0]}
                prompt={install.prompt}
                command={install.command}
                from={0}
              />
              <CommandLine
                n={2}
                step={INSTALL.steps[1]}
                prompt={install.prompt}
                command={INSTALL.kickstart}
                from={firstMs + BETWEEN_MS}
                last
              />
            </ol>
          </div>
        </TerminalWindow>
      </div>
    </div>
  );
}

function CommandLine({
  n,
  step,
  prompt,
  command,
  from,
  last = false,
}: {
  /** the step's number, and what it does in two or three words */
  n: number;
  step: string;
  prompt: string;
  command: string;
  /** when this line starts typing, after the window comes into view */
  from: number;
  last?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <li className="gs-line" style={{ "--gs-from": `${from}ms` } as CSSProperties}>
      <span className="gs-step">
        <span className="gs-n" aria-hidden="true">
          {n}
        </span>
        {step}
      </span>
      {/* the prompt and the command flow as one terminal line, wrapping together at its spaces */}
      <span className="gs-text">
        <span className="gs-prompt" aria-hidden="true">
          {prompt}{" "}
        </span>
        <code className="gs-cmd" data-command>
          {[...command].map((character, index) => (
            <span key={index} className="gs-ch" style={{ "--i": index } as CSSProperties}>
              {character}
            </span>
          ))}
        </code>
        {last ? (
          <span className="gs-caret" style={{ "--i": command.length } as CSSProperties} aria-hidden="true" />
        ) : null}
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
