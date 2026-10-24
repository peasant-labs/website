import {
  BatteryFull,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  PanelLeft,
  Plus,
  RotateCw,
  Search,
  Share,
  Wifi,
} from "@peasant-labs/fairtrade/icons";
import type { CSSProperties, ReactNode } from "react";

/*
 * macOS, drawn in the DOM so the scenes stay animated, themeable and sharp at
 * any zoom. This is a depiction of the operating system around our product,
 * so it follows macOS Sequoia rather than fairtrade: rounded windows, the
 * system font, the real traffic-light colours, and macOS's own light and dark
 * appearances (light with the site's light theme, dark with its dark theme).
 * fairtrade's rules (radius 0, tokens only, lowercase chrome) still hold for
 * our product UI inside the windows. No Apple logo or trademark artwork.
 */

type WindowProps = {
  /** a name the scene camera can frame */
  focus?: string;
  /** false draws the window as macOS draws one behind the front window: grey buttons, dimmed title */
  active?: boolean;
  /** for a window that opens during a scene: false keeps it mounted but not yet shown */
  open?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

function Lights() {
  return (
    <span className="mac-lights">
      <i />
      <i />
      <i />
    </span>
  );
}

function Frame({
  kind,
  focus,
  active = true,
  open,
  className,
  style,
  bar,
  children,
}: WindowProps & { kind: "terminal" | "browser"; bar: ReactNode }) {
  return (
    <div
      className={`mac-win mac-win-${kind}${className ? ` ${className}` : ""}`}
      data-focus={focus}
      data-active={active ? "true" : "false"}
      data-open={open === undefined ? undefined : open ? "true" : "false"}
      style={style}
    >
      {/* the window's chrome is decoration; what the window holds keeps its own semantics */}
      <div className="mac-bar" aria-hidden="true">
        {bar}
      </div>
      <div className="mac-body">{children}</div>
    </div>
  );
}

/** A Terminal.app window: the title bar with its centred title, then the terminal. */
export function TerminalWindow({ title, ...props }: WindowProps & { title: string }) {
  return (
    <Frame
      kind="terminal"
      {...props}
      bar={
        <>
          <Lights />
          <span className="mac-title">{title}</span>
        </>
      }
    />
  );
}

/**
 * A Safari window with its one unified toolbar: sidebar, back and forward, the
 * address field, and its tools. The field shows no address unless given one:
 * the scenes keep to the words their step needs.
 */
export function SafariWindow({
  url,
  secure = false,
  favicon,
  ...props
}: WindowProps & {
  /** the address as Safari shows it, without the scheme */
  url?: string;
  /** an https address: the padlock in the field */
  secure?: boolean;
  /** the page's icon, which Safari shows before the address */
  favicon?: ReactNode;
}) {
  return (
    <Frame
      kind="browser"
      {...props}
      bar={
        <>
          <Lights />
          <span className="mac-tools mac-tools-start">
            <span className="mac-sidebar">
              <PanelLeft focusable="false" />
              <ChevronDown focusable="false" />
            </span>
            <ChevronLeft focusable="false" />
            <ChevronRight focusable="false" className="mac-tool-off" />
          </span>
          <span className="mac-address">
            {secure ? <Lock focusable="false" className="mac-address-lock" /> : null}
            <span className="mac-address-text">
              {favicon ? <span className="mac-address-icon">{favicon}</span> : null}
              {url ?? ""}
            </span>
            <RotateCw focusable="false" className="mac-address-reload" />
          </span>
          <span className="mac-tools mac-tools-end">
            <Share focusable="false" />
            <Plus focusable="false" />
            <Copy focusable="false" />
          </span>
        </>
      }
    />
  );
}

/**
 * The desktop a scene plays on: the menu bar, starting at the app in front,
 * with the status items and the clock, over a calm wallpaper of our own.
 */
export function MacDesktop({ app, children }: { app: ReactNode; children: ReactNode }) {
  return (
    <div className="mac-desk">
      <div className="mac-menubar" aria-hidden="true">
        <span className="mac-menu-app">{app}</span>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Window</span>
        <span>Help</span>
        <span className="mac-menu-end">
          <BatteryFull focusable="false" />
          <Wifi focusable="false" />
          <Search focusable="false" />
          <span>Fri Oct 23</span>
          <span>9:41 AM</span>
        </span>
      </div>
      <div className="mac-desk-area">{children}</div>
    </div>
  );
}
