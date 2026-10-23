import type { TranscriptWireInput } from "@peasant-labs/fairtrade/ui";

/**
 * The sample session the landing page opens in the transcript viewer.
 *
 * Illustrative sample data, not a record of real work. It is written the way a
 * published transcript reads after peasant's standard redaction: credentials,
 * personal details and home-folder names are already replaced by the engine's
 * placeholders (`<AWS_ACCESS_KEY>`, `<EMAIL>`, `/Users/<USER>/…`), so a reader
 * sees what a reviewer would see. Shape notes are in `lib/demo-session.ts`.
 */

const START = "2026-09-14T09:20:00Z";

const UPLOAD_BEFORE = `export async function uploadBuild(file: string) {
  const s3 = new S3Client({ region: "eu-west-1" })
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: basename(file), Body: await readFile(file) }))
}`;

const UPLOAD_AFTER = `export async function uploadBuild(file: string, env: Env) {
  const s3 = new S3Client({ region: "eu-west-1", credentials: fromIni({ profile: \`shop-\${env}\` }) })
  await s3.send(new PutObjectCommand({ Bucket: bucketFor(env), Key: basename(file), Body: await readFile(file) }))
}`;

export const SAMPLE_SESSION: TranscriptWireInput = {
  id: "sess_c41e07",
  harness: "claude-code",
  model: "claude-opus-5",
  outcome: "resolved",
  project: "shop",
  workingDirectory: "/Users/<USER>/src/shop",
  startTime: START,
  endTime: "2026-09-14T09:34:00Z",
  durationMins: 14,
  turnCount: 7,
  toolCallCount: 4,
  totalTokens: 18400,
  tokensIn: 15200,
  tokensOut: 3200,
  gitBranch: "fix-staging-upload",
  gitContext: {
    branch: "fix-staging-upload",
    remote: "git@github.com:example/shop.git",
    // the author is the publisher's handle, which is shown, not redacted; a made-up one for the sample
    user: "@ada",
    workingDirectory: "/Users/<USER>/src/shop",
    commits: [
      {
        hash: "9b20f4e1c7d35a8e6f01b2c3d4e5f6a7",
        message: "use a per-environment aws profile for build uploads",
        timestamp: "2026-09-14T09:33:00Z",
        filesChanged: 2,
        insertions: 11,
        deletions: 4,
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
        "Uploads to staging fail with a 403 since this morning. Can you find out why?",
      timestamp: START,
      tokensIn: 310,
      tokensOut: 0,
    },
    {
      index: 1,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "<thinking>A 403 from S3 is usually the wrong credentials rather than a missing bucket. The environment file decides which account the upload signs with, so read it before the code.</thinking>I will check which credentials the upload uses first.",
      timestamp: "2026-09-14T09:20:40Z",
      tokensIn: 0,
      tokensOut: 420,
      toolCalls: [
        {
          id: "tc_read_env",
          name: "Read",
          toolKind: "read",
          filePath: ".env",
          arguments: JSON.stringify({ file_path: "/Users/<USER>/src/shop/.env" }),
          result:
            "S3_BUCKET=shop-builds\nAWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY>\nAWS_SECRET_ACCESS_KEY=<AWS_SECRET_KEY>\nALERT_EMAIL=<EMAIL>",
        },
      ],
    },
    {
      index: 2,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "The upload signs every request with `<AWS_ACCESS_KEY>` from `.env`, and that key belongs to the production account, so staging rejects it. Reading the upload code to see where the client is built.",
      timestamp: "2026-09-14T09:23:10Z",
      tokensIn: 0,
      tokensOut: 380,
      toolCalls: [
        {
          id: "tc_read_upload",
          name: "Read",
          toolKind: "read",
          filePath: "scripts/upload.ts",
          arguments: JSON.stringify({ file_path: "scripts/upload.ts" }),
          result: UPLOAD_BEFORE,
        },
      ],
    },
    {
      index: 3,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "I will give each environment its own AWS profile and bucket, so staging can never sign with the production key again.",
      timestamp: "2026-09-14T09:26:30Z",
      tokensIn: 0,
      tokensOut: 690,
      toolCalls: [
        {
          id: "tc_edit_upload",
          name: "Edit",
          toolKind: "edit",
          filePath: "scripts/upload.ts",
          arguments: JSON.stringify({
            file_path: "scripts/upload.ts",
            old_string: UPLOAD_BEFORE,
            new_string: UPLOAD_AFTER,
          }),
          result: JSON.stringify({ ok: true, additions: 3, deletions: 3 }),
        },
      ],
    },
    {
      index: 4,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content: "Running the upload against staging with the new profile.",
      timestamp: "2026-09-14T09:29:50Z",
      tokensIn: 0,
      tokensOut: 260,
      toolCalls: [
        {
          id: "tc_bash_upload",
          name: "Bash",
          toolKind: "execute",
          arguments: JSON.stringify({ command: "pnpm upload --env staging dist/shop.tar.gz" }),
          result: JSON.stringify({
            exitCode: 0,
            stdout: "signed as shop-staging\nuploaded dist/shop.tar.gz to shop-builds-staging (2.4 MB)",
          }),
        },
      ],
    },
    {
      index: 5,
      role: "user",
      depth: 0,
      entryType: "text",
      content: "Works. Should the old key in .env be rotated? If so, tell <EMAIL> before you do.",
      timestamp: "2026-09-14T09:32:15Z",
      tokensIn: 190,
      tokensOut: 0,
    },
    {
      index: 6,
      role: "assistant",
      depth: 0,
      entryType: "text",
      content:
        "Yes. It sat in /Users/<USER>/src/shop/.env, where every script could read it, so rotate it in the production account and remove it from the file. The upload no longer needs it. I have not contacted <EMAIL>; that message is yours to send.",
      timestamp: "2026-09-14T09:33:40Z",
      tokensIn: 0,
      tokensOut: 310,
      stopReason: "end_turn",
    },
  ],
};
