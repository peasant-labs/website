import { BatteryFull, ChevronLeft, ChevronRight, Lock, RotateCw, Wifi } from "@peasant-labs/fairtrade/icons";
import type { CSSProperties, ReactNode } from "react";

/**
 * A macOS window drawn in the page's own tokens: the three window buttons, then
 * either a centred title (a terminal or an app) or a browser's address bar.
 * The corners stay square, as everywhere else on the site; the window buttons
 * and the bar are what read as macOS.
 *
 * The bar is decoration, so it is hidden from assistive technology; whatever
 * the window holds keeps its own semantics.
 */
export function MacWindow({
  kind,
  title,
  url,
  focus,
  className,
  style,
  children,
}: {
  kind: "terminal" | "browser";
  /** the terminal's title */
  title?: string;
  /** the browser's address, without the scheme */
  url?: string;
  /** a name the scene camera can frame */
  focus?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={`mac-win mac-win-${kind}${className ? ` ${className}` : ""}`} data-focus={focus} style={style}>
      <div className="mac-bar" aria-hidden="true">
        <span className="mac-lights">
          <i />
          <i />
          <i />
        </span>
        {kind === "browser" ? (
          <>
            <span className="mac-nav">
              <ChevronLeft focusable="false" />
              <ChevronRight focusable="false" />
            </span>
            <span className="mac-url">
              <Lock focusable="false" />
              <span className="mac-url-text">{url}</span>
              <RotateCw focusable="false" />
            </span>
          </>
        ) : (
          <span className="mac-title">{title}</span>
        )}
      </div>
      <div className="mac-body">{children}</div>
    </div>
  );
}

/**
 * The desktop a scene plays on: the menu bar with the app in front, and the
 * wallpaper the windows sit on.
 */
export function MacDesktop({ app, children }: { app: string; children: ReactNode }) {
  return (
    <div className="mac-desk">
      <div className="mac-menubar" aria-hidden="true">
        <span className="mac-menu-app">{app}</span>
        <span>file</span>
        <span>edit</span>
        <span>view</span>
        <span>window</span>
        <span>help</span>
        <span className="mac-menu-end">
          <Wifi focusable="false" />
          <BatteryFull focusable="false" />
          <span className="tnum">9:41</span>
        </span>
      </div>
      <div className="mac-desk-area">{children}</div>
    </div>
  );
}
