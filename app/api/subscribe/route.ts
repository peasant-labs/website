/**
 * email signup → forwarded server-side to a google form.
 *
 * the google form endpoint and entry ids never reach the browser. every
 * submission passes an anti-spam gauntlet before it is forwarded:
 *   1. same-origin guard      (no cross-site abuse of the endpoint)
 *   2. honeypot field         (bots fill hidden inputs)
 *   3. time-trap              (humans don't submit in < 2.5s)
 *   4. per-ip rate limit      (best-effort, in-process)
 *   5. strict email validation
 *
 * silent drops (honeypot / time-trap) still return 200 so bots cannot
 * tell what tripped them.
 */

const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLScdKejzjdOSRckshWUgOXQIYwmkEecZPrOmkE4RbA6ypKvgaQ/formResponse";
const EMAIL_ENTRY = "entry.1583556340";
const COMMENT_ENTRY = "entry.850883314"; // optional
const MAX_COMMENT = 2000;

const MIN_FILL_MS = 2_500; // faster than this = bot
const MAX_FILL_MS = 1000 * 60 * 60; // older than an hour = stale
const RATE_MAX = 5; // submissions ...
const RATE_WINDOW_MS = 10 * 60 * 1000; // ... per ip per 10 minutes
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// C0 control chars + DEL (incl. newlines / tabs) — built from an
// escaped string so no raw control bytes live in source.
const CONTROL_RE = new RegExp("[\\u0000-\\u001F\\u007F]", "g");

const hits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    // keep the map from growing unbounded
    for (const [k, v] of hits)
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
  }
  return recent.length > RATE_MAX;
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin requests may omit Origin
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ ok: false }, 403);

  let data: {
    email?: unknown;
    comment?: unknown; // optional, free text
    company?: unknown; // honeypot — must stay empty
    ts?: unknown; // client mount timestamp
  };
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "bad request" }, 400);
  }

  // 2. honeypot — pretend success, forward nothing
  if (typeof data.company === "string" && data.company.trim() !== "")
    return json({ ok: true });

  // 3. time-trap — pretend success, forward nothing
  const elapsed = Date.now() - Number(data.ts);
  if (
    !Number.isFinite(elapsed) ||
    elapsed < MIN_FILL_MS ||
    elapsed > MAX_FILL_MS
  )
    return json({ ok: true });

  // 4. rate limit
  if (rateLimited(clientIp(request)))
    return json({ ok: false, error: "slow down — try again shortly." }, 429);

  // 5. email validation
  const email =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email))
    return json({ ok: false, error: "that email doesn't look right." }, 400);

  // optional comment — control chars collapsed to spaces, capped
  const comment =
    typeof data.comment === "string"
      ? data.comment.replace(CONTROL_RE, " ").trim().slice(0, MAX_COMMENT)
      : "";

  // forward to google forms (server-to-server, no cors)
  try {
    const body = new URLSearchParams({ [EMAIL_ENTRY]: email });
    if (comment) body.set(COMMENT_ENTRY, comment);
    const res = await fetch(GOOGLE_FORM_ACTION, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok && res.status !== 0)
      return json({ ok: false, error: "could not reach the field." }, 502);
  } catch {
    return json({ ok: false, error: "could not reach the field." }, 502);
  }

  return json({ ok: true });
}

// any other verb
export function GET() {
  return json({ ok: false, error: "method not allowed" }, 405);
}
