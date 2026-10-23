/**
 * Whether the reader is signed in to the online app, as far as this site can
 * tell: the online app keeps a hint cookie, `peasant_online`, on the domain the
 * two sites share. It holds the person's handle and nothing else; it carries
 * no token and grants nothing. The online app still decides who is signed in,
 * so a stale hint only leads to its log-in popup.
 *
 * The header reads it to offer "dashboard" in place of "log in".
 */
export const ONLINE_HINT_COOKIE = "peasant_online";

/*
 * Runs in <head> before the body paints, so the header's first frame already
 * shows the right way in (no swap, no shift): it marks <html data-online> "in"
 * or "out". Arriving with `?login` means the online app found no session and
 * sent the reader here to log in, so a hint left behind is cleared first.
 */
export const ONLINE_HINT_SCRIPT = `(function(){try{var d=document.documentElement,m=document.cookie.match(/(?:^|; )${ONLINE_HINT_COOKIE}=([^;]*)/);if(m&&/[?&]login(?:[=&]|$)/.test(location.search)){var c="${ONLINE_HINT_COOKIE}=; max-age=0; path=/";document.cookie=c;document.cookie=c+"; domain="+location.hostname.replace(/^www\\./,"")+"; secure; samesite=lax";m=null}d.dataset.online=m&&m[1]?"in":"out"}catch(_){}})();`;

/** The handle a cookie string's hint names, or null when there is none. */
export function onlineHandleFrom(cookie: string): string | null {
  const match = cookie.match(new RegExp(`(?:^|; )${ONLINE_HINT_COOKIE}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
