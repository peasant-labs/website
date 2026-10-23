"use client";

import { onlineHandleFrom } from "@/lib/online-session";
import { ONLINE_URL } from "@/lib/site";
import { ExternalLink } from "@peasant-labs/fairtrade/icons";
import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};
const handleNow = () => (document.documentElement.dataset.online === "in" ? onlineHandleFrom(document.cookie) : null);

/**
 * The header's way into the online app for somebody already signed in to it:
 * their initial and "dashboard". It sits beside "log in", and the head
 * script's `data-online` on <html> picks which of the two shows before the
 * first paint; the initial fills in once the page is interactive, inside a box
 * of fixed size, so nothing moves.
 */
function useOnlineHandle(): string | null {
  return useSyncExternalStore(noSubscription, handleNow, () => null);
}

export function OnlineLink({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  const handle = useOnlineHandle();
  return (
    <a
      className={["site-online", className].filter(Boolean).join(" ")}
      href={ONLINE_URL}
      aria-label={handle ? `dashboard, signed in as @${handle}` : "dashboard"}
      title={handle ? `signed in as @${handle}` : undefined}
      onClick={onClick}
    >
      <span className="site-online-av" aria-hidden="true">
        {handle?.charAt(0).toUpperCase()}
      </span>
      dashboard
    </a>
  );
}

/**
 * The docs sidebar's account row for somebody signed in to the online app,
 * built like the sidebar's own items: the person's initial at the item-icon
 * size, their handle over "dashboard", and the external mark. The online
 * app opens in a new tab, like every other app the sidebar leads to. In the
 * collapsed rail only the initial shows, with the same words as its tooltip.
 */
export function OnlineAccount() {
  const handle = useOnlineHandle();
  const name = handle ? `dashboard, signed in as @${handle}` : "dashboard";
  return (
    <a
      className="asb-account site-online site-online-account"
      href={ONLINE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={name}
      aria-label={`${name}, opens in a new tab`}
    >
      <span className="site-online-av" aria-hidden="true">
        {handle?.charAt(0).toUpperCase()}
      </span>
      <span className="asb-label site-online-text" aria-hidden="true">
        <span className="site-online-handle">{handle ? `@${handle}` : ""}</span>
        <span className="site-online-open">dashboard</span>
      </span>
      <span className="asb-ext" aria-hidden="true">
        <ExternalLink />
      </span>
    </a>
  );
}
