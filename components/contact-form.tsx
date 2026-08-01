"use client";

import { Button, Input, Textarea } from "@peasant-labs/fairtrade/ui";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

type State = "idle" | "sending" | "done" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/*
 * fairtrade's controls spread every unrecognised prop onto the element they
 * render, but their generated types stop at the props they name. These casts
 * restore the native attributes the form needs — same pattern the project
 * already uses for Button in project-client.
 */
type SubmitButtonProps = Parameters<typeof Button>[0] &
  ButtonHTMLAttributes<HTMLButtonElement>;
type EmailInputProps = Parameters<typeof Input>[0] &
  Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;
type NoteAreaProps = Parameters<typeof Textarea>[0] &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">;

const SubmitButton = Button as ComponentType<SubmitButtonProps>;
const EmailInput = Input as ComponentType<EmailInputProps>;
const NoteArea = Textarea as ComponentType<NoteAreaProps>;

/**
 * The same signup the editorial page carries, dressed in the design system so
 * it sits under the site header without a token fork. It posts to the same
 * `/api/subscribe` route, honeypot and time-trap included — the endpoint drops
 * anything that fills the hidden field or answers faster than a human can.
 */
export function ContactForm() {
  const mountedAt = useRef<number>(0);
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const done = state === "done";
  const emailValid = EMAIL_RE.test(email.trim());
  const blocked = !emailValid || state === "sending" || done;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending" || done) return;

    const trimmedEmail = email.trim();
    const company = (
      event.currentTarget.elements.namedItem("company") as HTMLInputElement
    ).value;

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
          comment: comment.trim(),
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

  return (
    <form onSubmit={onSubmit} noValidate className="pj-contact-form" data-contact-form>
      {/* honeypot — humans never see or tab to this */}
      <div aria-hidden="true" className="pj-honeypot">
        <label htmlFor="company">company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <EmailInput
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        disabled={done}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        label={
          <>
            email{" "}
            <span className="pj-required" aria-hidden="true">
              *
            </span>
          </>
        }
      />

      <NoteArea
        id="comment"
        name="comment"
        rows={2}
        maxLength={2000}
        disabled={done}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="what you'd want from this"
        label={
          <>
            a note <span className="pj-optional">(optional)</span>
          </>
        }
      />

      <SubmitButton type="submit" disabled={blocked} aria-disabled={blocked}>
        {state === "sending" ? "sending..." : done ? "joined ✓" : "notify me"}
      </SubmitButton>

      <p
        aria-live="polite"
        className="pj-contact-status"
        data-contact-status={state === "error" ? "error" : "note"}
      >
        {msg || " "}
      </p>
    </form>
  );
}
