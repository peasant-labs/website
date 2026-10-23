"use client";

import { onlineHandleFrom } from "@/lib/online-session";
import { ONLINE_URL } from "@/lib/site";
import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};
const handleNow = () => (document.documentElement.dataset.online === "in" ? onlineHandleFrom(document.cookie) : null);

/**
 * The header's way into the online app for somebody already signed in to it:
 * their initial and "open online". It sits beside "log in", and the head
 * script's `data-online` on <html> picks which of the two shows before the
 * first paint; the initial fills in once the page is interactive, inside a box
 * of fixed size, so nothing moves.
 */
export function OnlineLink({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  const handle = useSyncExternalStore(noSubscription, handleNow, () => null);
  return (
    <a
      className={["site-online", className].filter(Boolean).join(" ")}
      href={ONLINE_URL}
      aria-label={handle ? `open online, signed in as @${handle}` : "open online"}
      title={handle ? `signed in as @${handle}` : undefined}
      onClick={onClick}
    >
      <span className="site-online-av" aria-hidden="true">
        {handle?.charAt(0).toUpperCase()}
      </span>
      open online
    </a>
  );
}
