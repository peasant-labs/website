"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "sending" | "done" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function SubscribeForm() {
  const mountedAt = useRef<number>(0);
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const emailValid = EMAIL_RE.test(email.trim());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending" || state === "done") return;

    const form = e.currentTarget;
    const trimmedEmail = email.trim();
    const company = (
      form.elements.namedItem("company") as HTMLInputElement
    ).value;
    const comment = (
      form.elements.namedItem("comment") as HTMLTextAreaElement
    ).value.trim();

    if (!EMAIL_RE.test(trimmedEmail)) {
      setState("error");
      setMsg("that email doesn't look right.");
      return;
    }

    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          comment,
          company,
          ts: mountedAt.current,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setState("done");
        setMsg("on the list. we'll tell you when it lands.");
      } else {
        setState("error");
        setMsg(data.error ?? "something went wrong. try again.");
      }
    } catch {
      setState("error");
      setMsg("something went wrong. try again.");
    }
  }

  const done = state === "done";

  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3">
      {/* honeypot - humans never see or tab to this */}
      <div aria-hidden="true" className="hp">
        <label htmlFor="company">company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block font-bold text-[var(--text-secondary)]"
        >
          email <span className="text-[var(--accent)] glow">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={done}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-h-[44px] w-full border border-[var(--border-strong)] bg-transparent px-3 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="comment"
          className="mb-1 block font-bold text-[var(--text-secondary)]"
        >
          a note{" "}
          <span className="text-[var(--text-tertiary)]">(optional)</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={2}
          maxLength={2000}
          disabled={done}
          placeholder="what you'd want from this"
          className="w-full resize-none border border-[var(--border-strong)] bg-transparent px-3 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={!emailValid || state === "sending" || done}
        aria-disabled={!emailValid || state === "sending" || done}
        className="min-h-[44px] w-full cursor-pointer border border-[var(--accent)] px-5 py-2.5 font-bold text-[var(--accent)] transition-all hover:bg-[var(--accent)] hover:text-[var(--bg-deep)] hover:shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_45%,transparent)] disabled:cursor-not-allowed disabled:border-[var(--border-strong)] disabled:bg-transparent disabled:text-[var(--text-tertiary)] disabled:shadow-none disabled:hover:bg-transparent disabled:hover:text-[var(--text-tertiary)] disabled:hover:shadow-none sm:w-auto"
      >
        {state === "sending" ? "sending..." : done ? "joined ✓" : "notify me"}
      </button>

      <p
        aria-live="polite"
        className={
          state === "error"
            ? "text-[var(--red)]"
            : "text-[var(--text-tertiary)]"
        }
      >
        {msg || " "}
      </p>
    </form>
  );
}
