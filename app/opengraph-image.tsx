import { site } from "@/lib/site";
import { ImageResponse } from "next/og";

/**
 * the shared link card — generated, not a static file, so the title
 * and tagline are pulled straight from lib/site.ts and the embed can
 * never drift from the page. re-used as-is for the twitter card.
 */
export const alt = `${site.title} — peasant`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* peasant palette — kept in step with app/globals.css "the night watch" */
const C = {
  bg: "#0c0c0e",
  border: "#2a2a2e",
  borderStrong: "#3e3e42",
  primary: "#e8e5e0",
  secondary: "#9b9689",
  tertiary: "#5c5850",
  accent: "#d4a843",
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
      `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@${weight}`,
    ).then((res) => (res.ok ? res.text() : ""));
    const url = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
    )?.[1];
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
  if (regular)
    fonts.push({ name: "mono", data: regular, weight: 400, style: "normal" });
  if (bold)
    fonts.push({ name: "mono", data: bold, weight: 700, style: "normal" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 56,
          fontFamily: "mono",
          backgroundColor: C.bg,
          backgroundImage: [
            "radial-gradient(900px 520px at 100% 0%, rgba(212,168,67,0.10), transparent 72%)",
            "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px)",
            "linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
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
            backgroundColor: "rgba(20,20,22,0.55)",
            padding: 64,
          }}
        >
          {/* header — the wheat mark + wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg
              width="58"
              height="58"
              viewBox="0 0 32 32"
              fill="none"
              stroke={C.accent}
              strokeWidth={2.1}
              strokeLinecap="round"
            >
              <path d="M16 27V8" />
              <path d="M16 21l-5.5-6" />
              <path d="M16 21l5.5-6" />
              <path d="M16 15l-5-5.5" />
              <path d="M16 15l5-5.5" />
            </svg>
            <div
              style={{ fontSize: 30, fontWeight: 700, color: C.accent }}
            >
              peasant
            </div>
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
              {site.title.toLowerCase()}
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

          {/* footer — a terminal prompt + a content-type chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", fontSize: 22 }}
            >
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
            <div
              style={{
                display: "flex",
                fontSize: 20,
                color: C.tertiary,
                border: `1px solid ${C.borderStrong}`,
                padding: "8px 18px",
              }}
            >
              editorial
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
