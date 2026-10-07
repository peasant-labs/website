import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The Windows install script, served at /install.ps1 — the URL the Windows
 * install guide tells people to pipe into PowerShell:
 *
 *     irm https://peasantlabs.org/install.ps1 | iex
 *
 * The .ps1 extension is part of the address rather than decoration: it is how a
 * reader recognises what they are about to run, and how an editor opening the URL
 * gets PowerShell highlighting.
 *
 * `force-static` prerenders this at build time, so the script is read from disk
 * once during `next build` and baked into the output rather than re-read per
 * request. Editing scripts/install.ps1 therefore needs a rebuild to take effect,
 * which is the right trade: the file changes about once per release.
 *
 * text/plain rather than a download: the only defence a reader has against a
 * piped-to-a-shell installer is reading it first, so opening the URL in a browser
 * has to show the source.
 */
export const dynamic = "force-static";

/*
 * A leading byte-order mark is stripped. PowerShell tolerates either line ending,
 * unlike bash — so the CR normalisation the sibling bash route needs is not the
 * hazard here. A BOM is: `irm` decodes the body to a string, and a U+FEFF left at
 * the front of that string is a character `iex` then tries to parse as code,
 * which fails on the first token with nothing useful said about why. The script
 * is committed ASCII-only and BOM-free; this makes an editor that adds one on the
 * way through unable to ship a broken installer.
 */
const SCRIPT = readFileSync(join(process.cwd(), "scripts", "install.ps1"), "utf8").replace(
  /^﻿/,
  "",
);

export function GET() {
  return new Response(SCRIPT, {
    headers: {
      /*
       * charset=utf-8 so `irm` decodes the body as UTF-8 rather than guessing.
       * The script itself is ASCII-only, which is what keeps it readable when it
       * is saved and run under Windows PowerShell 5.1: that host reads a
       * BOM-less .ps1 as the machine's ANSI code page, so a non-ASCII character
       * in the source renders as mojibake on the console.
       */
      "content-type": "text/plain; charset=utf-8",
      /*
       * Short, and revalidated: a stale installer keeps handing out the previous
       * release long after a new one lands, and the script resolves its own
       * version at run time anyway, so there is nothing to gain from a long TTL.
       */
      "cache-control": "public, max-age=300, must-revalidate",
    },
  });
}
