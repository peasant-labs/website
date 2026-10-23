"use client";

import { Dialog, SignInProviders } from "@/components/fairtrade-client";
import { githubSignInUrl, LOGIN_URL, PRIVACY_URL } from "@/lib/site";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";

const PROVIDERS = [{ id: "github", label: "github" }];

/* fired after the dialog takes its flag out of the address, so the address is read again */
const ADDRESS_EVENT = "peasant-labs-login-address";

/** what an address asks of the dialog: `?login` opens it, `next` is where to return after signing in. */
export type LoginRequest = { next: string | null };

/** reads the `login` flag and its `next` from a location's search string; null when there is no flag. */
export function readLoginRequest(search: string): LoginRequest | null {
  const params = new URLSearchParams(search);
  return params.has("login") ? { next: params.get("next") } : null;
}

/** takes `login` and `next` out of the address, so a reload does not open the dialog again. */
function forgetLoginRequest() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("login") && !url.searchParams.has("next")) return;
  url.searchParams.delete("login");
  url.searchParams.delete("next");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event(ADDRESS_EVENT));
}

function subscribeToAddress(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(ADDRESS_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(ADDRESS_EVENT, onChange);
  };
}

/** a plain click opens the dialog in place; a modified one (new tab, new window) follows the link. */
function opensInPlace(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * The log-in dialog's state for a page frame. It is open while the address
 * carries `?login` (where the online app sends signed-out visitors) or after a
 * "log in" link was clicked; closing it takes `login` and `next` out of the
 * address. Any link to the log-in address on the page opens it in place.
 *
 * The address is read as an external store rather than with useSearchParams,
 * so a prerendered page does not bail out to client rendering.
 */
export function useLoginDialog() {
  const search = useSyncExternalStore(subscribeToAddress, () => window.location.search, () => "");
  const asked = readLoginRequest(search);
  const [clicked, setClicked] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  /** opens the dialog for a link's click; `returnFocusTo` takes focus back when it closes. */
  const show = useCallback(
    (event: { preventDefault(): void } & Parameters<typeof opensInPlace>[0], returnFocusTo: HTMLElement | null = null) => {
      if (!opensInPlace(event)) return;
      event.preventDefault();
      returnFocusRef.current = returnFocusTo;
      setClicked(true);
    },
    [],
  );

  const close = useCallback(() => {
    setClicked(false);
    forgetLoginRequest();
  }, []);

  // the page's other "log in" links (a call to action, a sign-up button) open it in place too
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || !(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (link?.getAttribute("href") === LOGIN_URL) show(event);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [show]);

  return { open: clicked || asked !== null, next: asked?.next ?? null, show, close, returnFocusRef };
}

/**
 * The log-in dialog: what the online app's log-in page offers, over the page
 * the reader is on. GitHub sign-in starts on the online app, which returns the
 * person to `next` (a path on the online app) or to its home.
 *
 * fairtrade's Dialog traps focus, closes on Escape and on the scrim, locks the
 * page's scroll and hands focus back. It is drawn on <body>, so a header that
 * slides or blurs never becomes its containing block.
 */
export function LoginDialog({
  open,
  onClose,
  next = null,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  next?: string | null;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  if (!open) return null;
  return createPortal(
    <Dialog
      open
      onClose={onClose}
      title="log in to peasant"
      labelId="login-dialog-title"
      className="site-login-dialog"
      returnFocusRef={returnFocusRef}
      footer={
        <a className="site-link site-login-privacy" href={PRIVACY_URL}>
          privacy notice
        </a>
      }
    >
      <SignInProviders
        className="site-login-github"
        providers={PROVIDERS}
        onSignIn={() => window.location.assign(githubSignInUrl(next))}
      />
      <p className="site-login-cli">
        in the terminal: <code>peasant village login</code>
      </p>
    </Dialog>,
    document.body,
  );
}
