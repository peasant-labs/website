/**
 * The site theme. fairtrade's tokens are dark on `:root` and light under
 * `[data-theme="light"]`, so the theme lives in one attribute on <html>.
 *
 * A reader who never touched the toggle follows their system setting; the
 * toggle records an explicit choice, which then wins until it is changed again.
 */
export type Theme = "dark" | "light";

export const THEME_KEY = "peasant-labs-theme";
export const THEME_EVENT = "peasant-labs-theme-change";

/*
 * Runs in <head> before the body paints, so the first frame is already in the
 * right theme. Storage can throw (private windows, blocked site data); the
 * system setting is the fallback either way.
 */
export const THEME_SCRIPT = `(function(){var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(_){}if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t})();`;

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
