"use client";

import { SAMPLE_ID, SAMPLE_TITLE } from "@/components/landing/scenes/sample";
import type { SceneDefinition } from "@/components/landing/scenes/stage";
import { DataTable, ProviderName, PublishStateLabel } from "@peasant-labs/fairtrade/ui";

/* fairtrade names these shapes in its component props; they are read from there */
type DataTableColumn = Parameters<typeof DataTable>[0]["columns"][number];
type PublishState = Parameters<typeof PublishStateLabel>[0]["state"];

type Row = {
  id: string;
  title: string;
  harness: "claude-code" | "codex" | "cursor" | "opencode";
  project: string;
  turns: number;
  duration: string;
  when: string;
  state: PublishState;
  collectives?: number;
  fresh?: boolean;
};

/* the sessions already on this computer, before /peasant records the new one */
const EARLIER: Row[] = [
  {
    id: "sess_8b11d2",
    title: "Add a preview of what redaction hides",
    harness: "claude-code",
    project: "peasant",
    turns: 12,
    duration: "31m",
    when: "2h ago",
    state: "published",
    collectives: 1,
  },
  {
    id: "sess_51ac09",
    title: "Move the upload script to ESM",
    harness: "codex",
    project: "shop",
    turns: 9,
    duration: "18m",
    when: "yesterday",
    state: "not-published",
  },
  {
    id: "sess_e2f4a7",
    title: "Fix the flaky checkout test",
    harness: "cursor",
    project: "shop",
    turns: 5,
    duration: "7m",
    when: "2 days ago",
    state: "published",
    collectives: 2,
  },
  {
    id: "sess_07c3b5",
    title: "Explain the retry backoff",
    harness: "opencode",
    project: "api",
    turns: 4,
    duration: "6m",
    when: "3 days ago",
    state: "not-published",
  },
];

const RECORDED: Row = {
  id: SAMPLE_ID,
  title: SAMPLE_TITLE,
  harness: "claude-code",
  project: "shop",
  turns: 7,
  duration: "14m",
  when: "just now",
  state: "not-published",
  fresh: true,
};

const COLUMNS: DataTableColumn[] = [
  {
    key: "title",
    label: "session",
    render: (_: unknown, row: Row) => (
      <span className="scn-session" data-focus={row.fresh ? "new-row" : undefined}>
        <span className="scn-session-title">{row.title}</span>
        <ProviderName harness={row.harness} />
      </span>
    ),
  },
  { key: "project", label: "project" },
  { key: "turns", label: "turns", align: "right" },
  { key: "duration", label: "duration", align: "right" },
  { key: "when", label: "when" },
  {
    key: "state",
    label: "status",
    render: (_: unknown, row: Row) => <PublishStateLabel state={row.state} collectives={row.collectives} />,
  },
];

/*
 * Record: `/peasant` typed in Claude Code, and the two lines `peasant open`
 * prints back (its own wording). The camera then pulls back to the local
 * sessions home, fairtrade's DataTable, where the new session sits on top.
 */
function Record({ phase }: { phase: number }) {
  const rows = phase >= 4 ? [RECORDED, ...EARLIER] : EARLIER;
  return (
    <div className="scn-app scn-record">
      <div className="scn-page-head">
        <h3 className="scn-h">sessions</h3>
        <span className="scn-chrome tnum">{rows.length} on this computer</span>
      </div>
      <div className="scn-table" data-focus="table" data-fresh={phase >= 4 ? "true" : "false"}>
        <DataTable caption="sessions on this computer" columns={COLUMNS} rows={rows} rowKey={(row: Row) => row.id} />
      </div>
      <div className="scn-term" data-focus="term">
        <div className="scn-term-bar">claude code · ~/src/shop</div>
        <div className="scn-term-body">
          <p>
            <span className="scn-term-dim">&gt; </span>
            {phase >= 1 ? "/peasant" : <span className="scn-caret" />}
          </p>
          {phase >= 2 ? <p>{`peasant: opened "${SAMPLE_TITLE}" · not published`}</p> : null}
          {phase >= 3 ? (
            <p className="scn-term-dim">http://localhost:8690/projects/3f9a0c2e/{SAMPLE_ID}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const RECORD_SCENE: SceneDefinition = {
  id: "record",
  window: "claude code and peasant on this computer",
  duration: 6200,
  finalPhase: 4,
  cues: [
    { at: 500, phase: 1 },
    { at: 1150, phase: 2 },
    { at: 1550, phase: 3 },
    { at: 3100, phase: 4 },
  ],
  shots: [
    { at: 0, focus: "term", move: 1, fill: 0.92 },
    { at: 2500, focus: "all", move: 1500, ease: "move" },
    { at: 4300, focus: "table", move: 1300, ease: "settle", fill: 0.98 },
  ],
  finalFocus: "all",
  Render: Record,
};
