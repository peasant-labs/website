import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The install script, served at /install — the URL the catalog page and both
 * product wizards tell people to pipe into bash.
 *
 * `force-static` prerenders this at build time, so the script is read from disk
 * once during `next build` and baked into the output rather than re-read per
 * request. Editing scripts/install.sh therefore needs a rebuild to take effect,
 * which is the right trade: the file changes about once per release.
 *
 * text/plain rather than a download: the only defence a reader has against a
 * piped-to-bash installer is reading it first, so opening the URL in a browser
 * has to show the source.
 */
export const dynamic = "force-static";

/*
 * Normalised to LF on the way out. The script is piped straight into bash, and a
 * single CR turns the first directive into `set -euo pipefail\r`, which bash
 * rejects — the install then dies before printing anything, on every machine.
 * `.gitattributes` keeps the file itself LF; this makes a Windows editor that
 * rewrites it between checkout and build unable to ship a broken installer.
 */
const SCRIPT = readFileSync(join(process.cwd(), "scripts", "install.sh"), "utf8").replace(
  /\r\n/g,
  "\n",
);

export function GET() {
  return new Response(SCRIPT, {
    headers: {
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
