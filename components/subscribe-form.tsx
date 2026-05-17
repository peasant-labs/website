"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "sending" | "done" | "error";

export function SubscribeForm() {
  const mountedAt = useRef<number>(0);
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending" || state === "done") return;

    const form = e.currentTarget;
    const email = (
      form.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    const company = (
      form.elements.namedItem("company") as HTMLInputElement
    ).value;
    const comment = (
      form.elements.namedItem("comment") as HTMLTextAreaElement
    ).value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
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
          email,
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
          email <span className="text-[var(--accent)]">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={done}
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
        disabled={state === "sending" || done}
        className="min-h-[44px] w-full cursor-pointer border border-[var(--accent)] px-5 py-2.5 font-bold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--bg-deep)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
