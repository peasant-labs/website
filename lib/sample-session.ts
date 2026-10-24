import type { TranscriptWireInput } from "@peasant-labs/fairtrade/ui";

/**
 * The sample session the landing page opens in the transcript viewer.
 *
 * Illustrative sample data, not a record of real work. It is written the way a
 * published transcript reads after peasant's standard redaction: credentials,
 * personal details and home-folder names are already replaced by the engine's
 * placeholders (`<AWS_ACCESS_KEY>`, `<EMAIL>`, `/Users/<USER>/…`), so a reader
 * sees what a reviewer would see. Shape notes are in `lib/demo-session.ts`.
 *
 * The token total sits on the session alone and no turn carries a usage count
 * of its own; `inputSubmissionCount` is the number of user turns below.
 */

const START = "2026-10-14T13:05:00Z";

const BENCH_SCRIPT = `import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { runSuite } from "../tests/billing/retry-suite"

// the last three models, oldest first
const MODELS = ["claude-opus-4-5", "claude-opus-5", "claude-opus-5-5"]
const SEED = 7
const CASES = 48

const args = process.argv.slice(2)
const onlyTimeouts = args.includes("--only-timeouts")
const limitAt = args.indexOf("--limit")
// seconds a single case may run before it counts as a timeout
const limitSecs = limitAt >= 0 ? Number(args[limitAt + 1]) : 120

const pct = (passed: number, total: number) => Math.round((100 * passed) / total) + "% (" + passed + "/" + total + ")"

function secs(ms: number) {
  const total = Math.round(ms / 1000)
  return Math.floor(total / 60) + "m " + String(total % 60).padStart(2, "0") + "s"
}

const results = []
for (const model of MODELS) {
  // the same seed for every model, so each one sees the same cases in the same order
  const run = await runSuite({ model, seed: SEED, cases: CASES, limitSecs, onlyTimeouts })
  results.push({ model, ...run })
  console.log(model, pct(run.passed, run.cases), run.tokens, secs(run.wallMs))
  if (run.timedOut > 0) console.log("  " + run.timedOut + " timed out")
}

const out = resolve("bench/out-" + SEED + ".json")
writeFileSync(out, JSON.stringify(results, null, 2))
console.log("wrote " + out)`;

const PACKAGE_BEFORE = `    "test": "vitest run"
  }`;

const PACKAGE_AFTER = `    "test": "vitest run",
    "bench:models": "tsx bench/models.ts"
  }`;

const FIRST_RUN = `bedrock us-east-1, key <AWS_ACCESS_KEY>, seed 7, 48 cases
claude-opus-4-5   34/48   412k tokens   9m 12s   (3 timed out)
claude-opus-5     40/48   388k tokens   7m 41s
claude-opus-5-5   45/48   301k tokens   5m 58s
wrote /Users/<USER>/src/billing/bench/out-7.json`;

const RERUN = `bedrock us-east-1, key <AWS_ACCESS_KEY>, seed 7, 3 cases
claude-opus-4-5   0/3 passed (all 3 ran to the end)
wrote /Users/<USER>/src/billing/bench/out-7.json`;

const TABLE = `| model | pass rate | tokens | wall time |
| --- | --- | --- | --- |
| claude-opus-4-5 | 71% (34/48) | 412k | 9m 12s |
| claude-opus-5 | 83% (40/48) | 388k | 7m 41s |
| claude-opus-5-5 | 94% (45/48) | 301k | 5m 58s |

Same seed (7) and the same 48 retry cases for every model.`;

export const SAMPLE_SESSION: TranscriptWireInput = {
  id: "sess_8d3f52",
  harness: "claude-code",
  model: "claude-opus-5-5",
  outcome: "resolved",
  project: "billing",
  workingDirectory: "/Users/<USER>/src/billing",
  startTime: START,
  endTime: "2026-10-14T13:50:00Z",
  durationMins: 45,
  turnCount: 12,
  inputSubmissionCount: 5,
  toolCallCount: 6,
  totalTokens: 52600,
  tokensIn: 44100,
  tokensOut: 8500,
  gitBranch: "bench-retry-models",
  gitContext: {
    branch: "bench-retry-models",
    remote: "git@github.com:example/billing.git",
    // the author is the publisher's handle, which is shown, not redacted; a made-up one for the sample
    user: "@mira_builds",
    workingDirectory: "/Users/<USER>/src/billing",
    commits: [
      {
        hash: "7c3e9a1b52d84f06a9e3c1d7b4f20856",
        message: "add a model benchmark for the billing retry suite",
        timestamp: "2026-10-14T13:49:20Z",
        filesChanged: 2,
        insertions: 36,
        deletions: 1,
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
        "hey claude, run our billing retry suite against each model, same seed, and write a table of pass rate, tokens and wall time per model",
      timestamp: START,
    },
    {
      index: 1,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "<thinking>The suite calls the models through Bedrock, so the region and credentials in the environment file decide what it can reach. Read that before writing anything.</thinking>I will check which credentials the suite can use first.",
      timestamp: "2026-10-14T13:05:40Z",
      toolCalls: [
        {
          id: "tc_read_env",
          name: "Read",
          toolKind: "read",
          filePath: ".env",
          arguments: JSON.stringify({ file_path: "/Users/<USER>/src/billing/.env" }),
          result:
            "BEDROCK_REGION=us-east-1\nAWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY>\nAWS_SECRET_ACCESS_KEY=<AWS_SECRET_KEY>\nREPORT_EMAIL=<EMAIL>",
        },
      ],
    },
    {
      index: 2,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "The suite signs its Bedrock calls with `<AWS_ACCESS_KEY>` from `.env`, has 48 retry cases, and takes a model id and a seed. I will add one script that runs it for the last three models with a single seed and prints a row for each, and a package script to start it.",
      timestamp: "2026-10-14T13:09:10Z",
      toolCalls: [
        {
          id: "tc_write_bench",
          name: "Write",
          toolKind: "edit",
          filePath: "bench/models.ts",
          arguments: JSON.stringify({ file_path: "bench/models.ts", content: BENCH_SCRIPT }),
          result: JSON.stringify({ ok: true, additions: 34, deletions: 0 }),
        },
        {
          id: "tc_edit_package",
          name: "Edit",
          toolKind: "edit",
          filePath: "package.json",
          arguments: JSON.stringify({ file_path: "package.json", old_string: PACKAGE_BEFORE, new_string: PACKAGE_AFTER }),
          result: JSON.stringify({ ok: true, additions: 2, deletions: 1 }),
        },
      ],
    },
    {
      index: 3,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content: "Running all three models on seed 7.",
      timestamp: "2026-10-14T13:12:30Z",
      toolCalls: [
        {
          id: "tc_bash_bench",
          name: "Bash",
          toolKind: "execute",
          arguments: JSON.stringify({ command: "pnpm bench:models" }),
          result: JSON.stringify({ exitCode: 0, stdout: FIRST_RUN }),
        },
      ],
    },
    {
      index: 4,
      role: "user",
      depth: 0,
      entryType: "text",
      content: "claude-opus-4-5 looks low. did those 3 cases fail, or just time out?",
      timestamp: "2026-10-14T13:36:10Z",
    },
    {
      index: 5,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "They timed out, so I will rerun only those three with a longer limit. If they pass now, the old number was unfair to that model.",
      timestamp: "2026-10-14T13:37:30Z",
      toolCalls: [
        {
          id: "tc_bash_rerun",
          name: "Bash",
          toolKind: "execute",
          arguments: JSON.stringify({ command: "pnpm bench:models --only-timeouts --limit 300" }),
          result: JSON.stringify({ exitCode: 0, stdout: RERUN }),
        },
      ],
    },
    {
      index: 6,
      role: "user",
      depth: 0,
      entryType: "text",
      content: "fine, they did not change. give me the table, one row per model",
      timestamp: "2026-10-14T13:43:20Z",
    },
    {
      index: 7,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content: TABLE,
      timestamp: "2026-10-14T13:44:00Z",
    },
    {
      index: 8,
      role: "user",
      depth: 0,
      entryType: "text",
      content: "is any of the 5.5 misses a bug in our retry budget rather than the model?",
      timestamp: "2026-10-14T13:45:40Z",
    },
    {
      index: 9,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "No. All three misses retried to the cap of 3 and still returned a stale invoice, which is the case the suite means to catch. The budget worked as written, so they count as the model's misses.",
      timestamp: "2026-10-14T13:46:30Z",
      stopReason: "end_turn",
    },
    {
      index: 10,
      role: "user",
      depth: 0,
      entryType: "text",
      content: "ok, commit the script. I will email the table to <EMAIL> myself.",
      timestamp: "2026-10-14T13:48:00Z",
    },
    {
      index: 11,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "Committed. I have not contacted <EMAIL>; the table and the raw results in /Users/<USER>/src/billing/bench/out-7.json are yours to send.",
      timestamp: "2026-10-14T13:48:50Z",
      toolCalls: [
        {
          id: "tc_bash_commit",
          name: "Bash",
          toolKind: "execute",
          arguments: JSON.stringify({
            command: 'git add bench package.json && git commit -m "add a model benchmark for the billing retry suite"',
          }),
          result: JSON.stringify({
            exitCode: 0,
            stdout: "[bench-retry-models 7c3e9a1] add a model benchmark for the billing retry suite\n 2 files changed, 36 insertions(+), 1 deletion(-)",
          }),
        },
      ],
      stopReason: "end_turn",
    },
  ],
};
