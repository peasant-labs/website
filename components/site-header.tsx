"use client";

import { BrandMark } from "@/components/fairtrade-client";
import { LoginDialog, useLoginDialog } from "@/components/login-dialog";
import { OnlineLink } from "@/components/online-link";
import { Mark } from "@/components/mark";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LOGIN_URL, MENU_NAV } from "@/lib/site";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const DESKTOP = "(min-width: 48rem)";

/* The menu's stops: links and buttons that are drawn. One of "log in" and "dashboard" is always hidden. */
function menuStops(sheet: HTMLElement | null) {
  return [...(sheet?.querySelectorAll<HTMLElement>("a, button") ?? [])].filter(
    (element) => element.getClientRects().length > 0,
  );
}

/* The page behind an open menu stays put; the lock is released synchronously so a link can scroll. */
function lockScroll(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

/**
 * The header every marketing page wears.
 *
 * On a wide screen it is a sticky bar that steps out of the way while you read
 * down and comes back as soon as you scroll up; it draws its bottom rule only
 * once the page has moved. It offers no install: the page's own buttons and the
 * footer do.
 *
 * On a phone it is a compact bar with one menu button. The menu is an opaque
 * sheet that fills the screen under the bar, with the header's destinations,
 * the theme and sign-in; it traps focus while open and closes on its button,
 * Escape, a link, or a route change, handing focus back to the button.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [openedOn, setOpenedOn] = useState(pathname);
  const login = useLoginDialog();

  // A route change closes the menu.
  if (open && openedOn !== pathname) {
    setOpen(false);
  }

  const close = useCallback(({ restoreFocus = true }: { restoreFocus?: boolean } = {}) => {
    lockScroll(false);
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  // Scroll: the rule appears once the page moves; on a wide screen the bar hides going down.
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const desktop = window.matchMedia(DESKTOP);
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setScrolled(y > 4);
        const delta = y - last;
        if (!desktop.matches || y < 96) setHidden(false);
        else if (delta > 6) setHidden(true);
        else if (delta < -6) setHidden(false);
        last = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // While open: Escape and outside taps close; the page behind does not scroll.
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const first = menuStops(sheetRef.current)[0];
    first?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) close({ restoreFocus: false });
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Focus stays inside the button and the sheet while the menu is open.
  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (!open || event.key !== "Tab") return;
    const stops = [
      buttonRef.current,
      ...menuStops(sheetRef.current),
    ].filter((element): element is HTMLElement => element !== null);
    const index = stops.indexOf(document.activeElement as HTMLElement);
    const next = event.shiftKey ? index - 1 : index + 1;
    if (next < 0 || next >= stops.length) {
      event.preventDefault();
      stops[event.shiftKey ? stops.length - 1 : 0]?.focus();
    }
  }

  const linkClosesMenu = () => close({ restoreFocus: false });

  return (
    <header
      ref={headerRef}
      className="site-bar"
      data-hidden={hidden && !open ? "true" : "false"}
      data-scrolled={scrolled || open ? "true" : "false"}
      onKeyDown={trapFocus}
    >
      <div className="site-wrap site-bar-inner">
        <Link className="site-brand" href="/">
          <Mark className="site-brand-mark" />
          peasant
        </Link>
        <SiteNav />
        <div className="site-bar-actions">
          <ThemeToggle className="site-icon-btn site-bar-wide" />
          <a
            className="btn btn-secondary site-btn site-login site-bar-wide"
            href={LOGIN_URL}
            onClick={(event) => login.show(event)}
          >
            <BrandMark name="github" />
            log in
          </a>
          <OnlineLink className="btn btn-secondary site-btn site-bar-wide" />
          <button
            ref={buttonRef}
            type="button"
            className="site-icon-btn site-menu-btn"
            aria-expanded={open}
            aria-controls="site-sheet"
            aria-label={open ? "close the menu" : "open the menu"}
            onClick={() => {
              if (open) close();
              else {
                setOpenedOn(pathname);
                setOpen(true);
              }
            }}
          >
            <span className="site-menu-icon" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <div
        ref={sheetRef}
        id="site-sheet"
        className="site-sheet"
        data-open={open ? "true" : "false"}
        aria-hidden={open ? undefined : true}
        inert={!open}
      >
        <nav className="site-wrap site-sheet-nav" aria-label="menu">
          {MENU_NAV.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              className="site-sheet-link"
              style={{ "--i": index } as CSSProperties}
              aria-current={
                pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined
              }
              onClick={linkClosesMenu}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div
          className="site-wrap site-sheet-actions"
          style={{ "--i": MENU_NAV.length } as CSSProperties}
        >
          <ThemeToggle className="site-sheet-theme" labelled />
          <a
            className="btn btn-secondary site-btn site-login"
            href={LOGIN_URL}
            onClick={(event) => {
              linkClosesMenu();
              login.show(event, buttonRef.current);
            }}
          >
            <BrandMark name="github" />
            log in
          </a>
          <OnlineLink className="btn btn-secondary site-btn" onClick={linkClosesMenu} />
        </div>
      </div>
      <LoginDialog open={login.open} next={login.next} onClose={login.close} returnFocusRef={login.returnFocusRef} />
    </header>
  );
}
