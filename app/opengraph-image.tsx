import { HERO } from "@/lib/landing";
import { site } from "@/lib/site";
import { ImageResponse } from "next/og";

/**
 * the shared link card — generated, not a static file, so the title
 * and tagline are pulled straight from lib/site.ts and the embed can
 * never drift from the page. re-used as-is for the twitter card.
 */
export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* fairtrade's dark theme, as literal values: the card renders outside any stylesheet */
const C = {
  bg: "#070706",
  border: "#3c382f",
  primary: "#f8f5ed",
  secondary: "#b8b3a4",
  accent: "#cba35c",
};

/**
 * google serves a plain .ttf — the format satori needs — when the
 * request carries no modern browser user-agent. on any failure we
 * return null and ImageResponse falls back to its bundled font, so a
 * build with no network still succeeds (just without the brand mono).
 */
async function loadFont(weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Mono:wght@${weight}`,
    ).then((res) => (res.ok ? res.text() : ""));
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const [regular, bold] = await Promise.all([loadFont(400), loadFont(700)]);
  const fonts: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700;
    style: "normal";
  }[] = [];
  if (regular) fonts.push({ name: "mono", data: regular, weight: 400, style: "normal" });
  if (bold) fonts.push({ name: "mono", data: bold, weight: 700, style: "normal" });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 56,
        fontFamily: "mono",
        backgroundColor: C.bg,
      }}
    >
      {/* bordered surface — echoes the site's framed cards */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: `1px solid ${C.border}`,
          padding: 64,
        }}
      >
        {/* header — the wheat mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg
            width="40"
            height="49"
            viewBox="0 0 18 22"
            fill="none"
            stroke={C.accent}
            strokeWidth={1.6}
            strokeLinecap="square"
          >
            <path d="M9 21V3" />
            <path d="M9 7 5 4" />
            <path d="M9 7l4-3" />
            <path d="M9 11 5 8" />
            <path d="M9 11l4-3" />
            <path d="M9 15l-4-3" />
            <path d="M9 15l4-3" />
          </svg>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.primary }}>peasant</div>
        </div>

        {/* the pitch */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: C.primary,
              maxWidth: 940,
            }}
          >
            {HERO.title}
          </div>
          <div
            style={{
              fontSize: 25,
              lineHeight: 1.5,
              color: C.secondary,
              maxWidth: 740,
            }}
          >
            {site.tagline}
          </div>
        </div>

        {/* footer — a terminal prompt */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 22 }}>
            <span style={{ color: C.accent, fontWeight: 700 }}>&gt;&nbsp;</span>
            <span style={{ color: C.secondary }}>peasantlabs.org</span>
            <span
              style={{
                width: 12,
                height: 24,
                marginLeft: 8,
                backgroundColor: C.accent,
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
