import Link from "next/link";
import { Mark } from "@/components/mark";
import { SubscribeForm } from "@/components/subscribe-form";

export default function Home() {
  return (
    <main id="content" className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      {/* logo — the plant only */}
      <Link
        href="/"
        aria-label="peasant — home"
        className="-m-3 inline-flex cursor-pointer p-3 text-[var(--accent)] transition-opacity duration-200 hover:opacity-70"
      >
        <Mark className="h-11 w-11" />
      </Link>

      {/* title — same size as the body, set apart by weight + color */}
      <h1 className="mt-14 font-bold text-[var(--text-primary)]">
        peasants deserve their share
      </h1>

      {/* text */}
      <article className="measure mt-8 space-y-5 text-[var(--text-secondary)]">
        <p>
          using coding agent harnesses leaves traces on your machine —
          transcripts of every message and tool call. much of the software
          engineering lifecycle now lives there: what you built, what you
          valued, what you accepted.
        </p>
        <p>
          so who wins? you take a cut — faster iteration, more code. the larger
          winner is the company you rent: it can plunder your trove of
          transcripts with impunity, and there is nowhere to give the data
          back, no way to prove it was ever yours.
        </p>
        <p>
          the speedup fizzles the moment you add one other human. handed a
          stranger&apos;s ten-thousand line pull request, i would rather see
          the process behind it — but those sessions are buried in a mountain
          of jsonl, impossible to find.
        </p>
        <p>
          the problems run deep: no agency over your data or the platforms that
          host it; no infrastructure for attribution or attestation; government
          too slow, maze-like, and misaligned to help. it collapses into a
          collective action problem — one that needs coordination and outreach.
        </p>
        <p>
          what we need is a contributor-oriented platform that carries agent
          traces alongside the code they produced — owner-set access control,
          redaction by default, attribution that survives the diff.
        </p>
        <p className="font-bold text-[var(--text-primary)]">
          the harvest belongs to the hands that sowed it.
        </p>
      </article>

      {/* form */}
      <section className="measure mt-16">
        <p className="text-[var(--text-secondary)]">
          leave an email — one message when the work is published, nothing
          else.
        </p>
        <SubscribeForm />
      </section>
    </main>
  );
}
