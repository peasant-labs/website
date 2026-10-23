/**
 * The site theme. fairtrade's tokens are dark on `:root` and light under
 * `[data-theme="light"]`, so the theme lives in one attribute on <html>.
 *
 * A reader who never touched the toggle follows their system setting; the
 * toggle records an explicit choice, which then wins until it is changed again.
 */
export type Theme = "dark" | "light";

export const THEME_KEY = "peasant-labs-theme";

/*
 * Set by the same head script when the reader allows motion: only then do the
 * pictures and headings wait to be revealed. Without it (reduced motion, or no
 * script at all) everything is simply there.
 */
export const REVEAL_CLASS = "js-reveal";
export const THEME_EVENT = "peasant-labs-theme-change";

/*
 * Runs in <head> before the body paints, so the first frame is already in the
 * right theme and knows whether reveals may run. Storage can throw (private windows, blocked site data); the
 * system setting is the fallback either way.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement,m=window.matchMedia,t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(_){}if(t!=="dark"&&t!=="light"){t=m&&m("(prefers-color-scheme: light)").matches?"light":"dark"}d.dataset.theme=t;if(m&&m("(prefers-reduced-motion: no-preference)").matches){d.classList.add("${REVEAL_CLASS}")}})();`;

export function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme, { persist }: { persist: boolean }) {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The choice still applies for this page; it just will not survive a reload.
    }
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_EVENT, onStoreChange);
}
