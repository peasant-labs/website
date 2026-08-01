import type { TranscriptWireInput } from "@peasant-labs/fairtrade/ui";

/**
 * A demonstration session for the transcript viewer on /projects.
 *
 * This is illustrative sample data, not a record of real work: it exists so a
 * first-time reader can see the shape of what peasant keeps before installing
 * anything. It is deliberately kept in its own module so nothing on the
 * evidence-backed side of `lib/projects.ts` can be mistaken for it.
 *
 * Shape notes, verified against `adaptTranscript` in
 * @peasant-labs/fairtrade 0.0.9:
 *   - the wire payload is FLAT; session fields sit beside `turns`.
 *   - a tool call's filter group is derived from its `name` ("Read" -> read,
 *     "Edit" -> edits, "Bash" -> bash, "Grep" -> search), not from `toolKind`.
 *   - thinking is carried either by `entryType: "thinking"` or by a leading
 *     <thinking>...</thinking> block inside `content`.
 *   - `arguments` and `result` are JSON-encoded strings, as on the real wire.
 */

const START = "2026-07-24T14:02:00Z";

const TURN_ROW_BEFORE = `export function PublishPanel({ session }: PublishPanelProps) {
  return (
    <form action={publish}>
      <SessionSummary session={session} />
      <button type="submit">publish</button>
    </form>
  )
}`;

const TURN_ROW_AFTER = `export function PublishPanel({ session }: PublishPanelProps) {
  const findings = useRedactionFindings(session.id)
  return (
    <form action={publish}>
      <SessionSummary session={session} />
      <RedactionPreview findings={findings} />
      <button type="submit" disabled={findings.pending}>publish</button>
    </form>
  )
}`;

export const DEMO_SESSION: TranscriptWireInput = {
  id: "sess_7f2a91",
  harness: "claude-code",
  model: "claude-opus-5",
  outcome: "resolved",
  project: "peasant",
  workingDirectory: "~/src/peasant",
  startTime: START,
  endTime: "2026-07-24T14:13:00Z",
  durationMins: 11,
  turnCount: 7,
  toolCallCount: 5,
  totalTokens: 21600,
  tokensIn: 18100,
  tokensOut: 3500,
  gitBranch: "redaction-preview",
  gitContext: {
    branch: "redaction-preview",
    remote: "git@github.com:peasant-labs/peasant.git",
    user: "you",
    workingDirectory: "~/src/peasant",
    commits: [
      {
        hash: "4c1de99a7b3f0e5182d4ab6c93f7e021",
        message: "show redaction findings before publish",
        timestamp: "2026-07-24T14:12:00Z",
        filesChanged: 3,
        insertions: 64,
        deletions: 9,
        session: true,
      },
    ],
  },
  turns: [
    {
      index: 0,
      role: "user",
      depth: 0,
      entryType: "text",
      content:
        "Before a session gets published I want to see exactly what redaction is going to hide. Add a preview to the publish panel.",
      timestamp: START,
      tokensIn: 340,
      tokensOut: 0,
    },
    {
      index: 1,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "<thinking>The publish panel already loads the session summary, so the findings can hang off the same id. I should read the panel before changing it, and check whether a findings hook already exists.</thinking>Let me read the publish panel first, then see whether redaction findings are already exposed anywhere.",
      timestamp: "2026-07-24T14:02:40Z",
      tokensIn: 0,
      tokensOut: 480,
      toolCalls: [
        {
          id: "tc_read_panel",
          name: "Read",
          toolKind: "read",
          filePath: "web/src/components/publish/PublishPanel.tsx",
          arguments: JSON.stringify({
            file_path: "web/src/components/publish/PublishPanel.tsx",
          }),
          result: TURN_ROW_BEFORE,
        },
      ],
    },
    {
      index: 2,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content: "Checking whether the redaction pass already reports findings I can reuse.",
      timestamp: "2026-07-24T14:04:10Z",
      tokensIn: 0,
      tokensOut: 260,
      toolCalls: [
        {
          id: "tc_grep_findings",
          name: "Grep",
          toolKind: "search",
          arguments: JSON.stringify({ pattern: "RedactionFinding", glob: "**/*.go" }),
          result: JSON.stringify({
            matches: [
              "internal/redact/report.go:18: type RedactionFinding struct {",
              "internal/redact/report.go:44: func Report(s *Session) []RedactionFinding {",
              "internal/api/publish.go:71: findings := redact.Report(session)",
            ],
          }),
        },
      ],
    },
    {
      index: 3,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "`redact.Report` already returns the findings and `publish.go` computes them. I only need to surface them, so I will add a preview component and render it above the submit button.",
      timestamp: "2026-07-24T14:06:25Z",
      tokensIn: 0,
      tokensOut: 720,
      toolCalls: [
        {
          id: "tc_edit_panel",
          name: "Edit",
          toolKind: "edit",
          filePath: "web/src/components/publish/PublishPanel.tsx",
          arguments: JSON.stringify({
            file_path: "web/src/components/publish/PublishPanel.tsx",
            old_string: TURN_ROW_BEFORE,
            new_string: TURN_ROW_AFTER,
          }),
          result: JSON.stringify({ ok: true, additions: 4, deletions: 1 }),
        },
      ],
    },
    {
      index: 4,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content: "Running the panel tests to confirm the disabled state behaves while findings load.",
      timestamp: "2026-07-24T14:08:50Z",
      tokensIn: 0,
      tokensOut: 300,
      toolCalls: [
        {
          id: "tc_bash_tests",
          name: "Bash",
          toolKind: "execute",
          arguments: JSON.stringify({ command: "go test ./internal/redact/... && pnpm vitest run publish" }),
          result: JSON.stringify({
            exitCode: 0,
            stdout: "ok  peasant/internal/redact  0.42s\n\n publish  8 passed (8)",
          }),
        },
      ],
    },
    {
      index: 5,
      role: "user",
      depth: 0,
      entryType: "text",
      content: "Good. Does the publish button stay disabled if the redaction pass fails outright?",
      timestamp: "2026-07-24T14:10:15Z",
      tokensIn: 210,
      tokensOut: 0,
    },
    {
      index: 6,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "It does. `findings.pending` stays true when the pass errors, so the button never enables on a failure — publishing cannot proceed without a completed review.",
      timestamp: "2026-07-24T14:12:30Z",
      tokensIn: 0,
      tokensOut: 380,
      stopReason: "end_turn",
      toolCalls: [
        {
          id: "tc_read_hook",
          name: "Read",
          toolKind: "read",
          filePath: "web/src/components/publish/useRedactionFindings.ts",
          arguments: JSON.stringify({
            file_path: "web/src/components/publish/useRedactionFindings.ts",
          }),
          result: `export function useRedactionFindings(id: string) {
  const { data, error } = useSWR(\`/api/redact/\${id}\`, fetcher)
  return { findings: data?.findings ?? [], pending: !data || Boolean(error) }
}`,
        },
      ],
    },
  ],
};
