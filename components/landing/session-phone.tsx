"use client";

import { endedRecently } from "@/components/landing/session-viewer";
import { GitCommitHorizontal } from "@peasant-labs/fairtrade/icons";
import { adaptTranscript, TranscriptTurnCard, type TranscriptWireInput } from "@peasant-labs/fairtrade/ui";
import { useMemo, useState, useSyncExternalStore } from "react";

type TurnVM = ReturnType<typeof adaptTranscript>["turns"][number];

/* drawn in the browser: the turns' relative times are the reader's clock's, not the build's */
const noChange = () => () => {};

/**
 * The published session on a phone: no window around it, only a short slice
 * of the same sample at the column's full width, drawn by fairtrade's own
 * turn cards through `adaptTranscript`. The prompt; the turn that read .env,
 * with that tool call open on its redacted key; and the commit the session
 * became, as the transcript browser marks it. The tool call opens and closes
 * on the reader's tap, and nothing moves on its own.
 */
export function SessionPhone({
  session,
  label,
  prompt,
  turn,
  tool,
}: {
  session: TranscriptWireInput;
  label: string;
  /** the turns shown, by their index in the session */
  prompt: number;
  turn: number;
  /** the tool call of `turn` shown open, by its id */
  tool: string;
}) {
  const drawn = useSyncExternalStore(noChange, () => true, () => false);
  const [now] = useState(() => Date.now());
  const viewModel = useMemo(() => adaptTranscript(endedRecently(session, now)), [session, now]);
  const [openTools, setOpenTools] = useState<Record<string, boolean>>({ [tool]: true });
  const turnAt = (index: number): TurnVM | undefined => viewModel.turns.find((item) => item.index === index);
  const ask = turnAt(prompt);
  const read = turnAt(turn);
  const commit = viewModel.session.git?.commits?.[0];
  const stat = commit && (commit.adds != null || commit.dels != null || commit.files != null)
    ? `+${commit.adds ?? 0} −${commit.dels ?? 0}${commit.files == null ? "" : `, ${commit.files} files`}`
    : null;

  return (
    <div className="lp-phone" data-session-phone role="group" aria-label={label}>
      {drawn ? (
        <>
          {ask ? <TranscriptTurnCard turn={ask} /> : null}
          {read ? (
            <TranscriptTurnCard
              turn={read}
              openTools={openTools}
              toggleTool={(id) => setOpenTools((current) => ({ ...current, [id]: !current[id] }))}
            />
          ) : null}
          {commit ? (
            // the commit as the transcript browser marks one in its trace, in fairtrade's own marker styles
            <div className="marker txn-checkpoint lp-phone-commit">
              <span className="mkc">
                <GitCommitHorizontal size={14} aria-hidden="true" focusable="false" />
                <span className="hash mono">{commit.shortHash}</span>
                <span className="txn-cp-msg mkc-msg">{commit.message}</span>
                {stat ? <span className="txn-cp-stat tnum">{stat}</span> : null}
              </span>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
