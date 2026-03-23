Peasant
Peasant is a CLI tool that ingests AI coding assistant session data (Claude, OpenCode) and provides analytics via a local web dashboard and terminal UI. It normalizes session transcripts from multiple providers into a unified schema, stores metrics in a local SQLite database, and serves them through a web API.

Quick start

# Enter the dev shell (provides Go toolchain, gopls, staticcheck, delve)

nix develop

# Build the binary

make build # outputs bin/peasant

# Run the first-time setup wizard

peasant kickstart

# Ingest sessions from all configured providers

peasant ingest

# Start the web dashboard (background, auto-opens browser)

peasant web start

# Stop the web dashboard

peasant web stop
Commands
Command Description
peasant ingest Run the data ingestion pipeline
peasant ingest verify Verify database schema integrity
peasant push Push ingested transcripts to the Peasant village
peasant models sync Fetch and sync model reference data from models.dev
peasant sessions tag Manage session tags (add/remove/list)
peasant metrics compute Compute session metrics from stored transcripts
peasant web start Start the web dashboard server (default port 8690)
peasant web stop Stop the web dashboard server
peasant tui Launch the terminal UI
peasant kickstart Run the first-time setup wizard
peasant version Print the version
See docs/KICKSTART.md for the kickstart wizard flow and docs/TUI.md for keyboard shortcuts.

peasant push flags
Flag Description
--dry-run Show what would be pushed without actually pushing
--by-source Push sessions grouped by source (default)
--visibility <v> Set visibility (private or public)
peasant models sync flags
Flag Description
--provider <p> Filter models by provider (anthropic, google, openai)
peasant sessions tag subcommands
Subcommand Description
peasant sessions tag add <session> <tag> Add a tag to a session
peasant sessions tag remove <session> <tag> Remove a tag from a session
peasant sessions tag list <session> List all tags for a session
peasant ingest verify flags
Flag Description
--verbose Show sample data from each table
peasant ingest flags
Flag Description
--dry-run Show what would be ingested without writing
--force Re-ingest all sessions (respects staleness)
--include-active Also ingest sessions still being written
--session <ids> Filter to specific session IDs (repeatable, comma-separated). Overrides the selection index.
--since <duration> Filter to sessions from the last N period (e.g. 2w, 3m, 7d)
--source-provider <p> Override source provider (claude, opencode)
--source-path <path> Override source path for the provider (replaces config, not additive)
--output <path> Override output base path
--json Output as JSON instead of human-readable
--verbose Show file-level detail with subagent expansion
--reindex Re-process sessions with stale or missing index data
--detect-commits Detect and store git commits linked to each session
--config <path> Path to config file
When a selection index is configured (via peasant kickstart), ingest automatically filters to only the selected projects, branches, and sessions. The --session flag overrides this filter.

peasant web start flags
Flag Description
--port <n> Port to listen on (default 8690)
--foreground Run in foreground instead of forking to background
--no-browser Do not auto-open browser
--dev Proxy to Next.js dev server on localhost:3000 (implies --foreground)
--mock-data-store <sections> Use mock data for specific sections (replaces config, not additive)
peasant tui flags
Flag Description
--mock-data-store <sections> Use mock data for specific sections (replaces config, not additive)
Supported providers
Provider Constant Session format
Claude Code claude JSONL
OpenCode opencode JSON
The schema also reserves codex and gemini in the model_harness constraint for future provider support.

Ingest pipeline
peasant ingest runs a 9-stage pipeline (internal/ingest/pipeline.go):

DISCOVER -> DIFF -> FILTER -> EXTRACT+WRITE -> DB INSERT -> INDEX -> COMPUTE -> CLEANUP -> REPORT
DISCOVER — For each enabled provider, create adapter via factory and call Discover() to enumerate sessions on disk.
DIFF — Classify each session as New, Updated, Unchanged, or Active by comparing source modification times and metadata schema version against previously written output.
FILTER — Skip Unchanged and Active sessions unless --force or --include-active are set. When a selection index is configured, also skip sessions not matching the project/branch allowlist (see Selection Index).
EXTRACT+WRITE — Extract metadata and token metrics; atomically write output via a temp directory followed by a rename.
DB INSERT — Upsert dimension rows (projects, host*slugs) and session rows into SQLite. Best-effort; failures are non-fatal.
INDEX — Parse the redacted transcript (on disk) into session_entries rows via provider-specific indexers (Claude JSONL, OpenCode JSON). Best-effort; failures are non-fatal.
COMPUTE — Run 16 metric functions over indexed entries to populate session_metrics. Only runs for sessions that were successfully indexed.
CLEANUP — Remove orphan .tmp-\* directories left by interrupted prior runs.
REPORT — Return a PipelineResult with summary counts (new, updated, unchanged, active, errors) and per-session results.
Directory layout
Peasant follows the XDG Base Directory Specification. All paths respect their corresponding XDG*\* environment variable if set.

XDG Variable Default Path Contents
XDG_CONFIG_HOME ~/.config/peasant/ config.yaml
XDG_DATA_HOME ~/.local/share/peasant/ peasant.db (analytics SQLite), peasant-sync/ (ingested transcripts + metadata)
XDG_STATE_HOME ~/.local/state/peasant/ web:{port}.pid (server PID file)
Ingested output
~/.local/share/peasant/
├── peasant.db
└── peasant-sync/
└── {hostSlug}/
└── {sessionId}/
├── {sessionId}--transcript.{jsonl|json}
└── {sessionId}--metadata.json
Analytics schema
The SQLite database uses a BCNF-normalized schema with migrations from v1 to v9. All tables use STRICT mode.

Migration history
Version Feature
v1 Initial 6-table schema (projects, host*slugs, sessions, session_metrics, daily_summary, daily_summary_harness)
v2 SessionMetrics widened with v2 quality columns
v3 IngestLog audit table
v4 Push tracking (pushed_at, push_log) + Full-depth indexing (depth, parent_index, tool_input, tool_output)
v5 SessionEntriesExt EAV table for known keys (tokens_reasoning, cache_read, cache_write, model_id)
v6 Models reference table for model enrichment from models.dev
v7 Cost analytics columns (cost*\*\_usd) on session_metrics and daily_summary
v8 DailySummaryByProject table + acceptance_rate column
v9 Tags column on sessions, scope column on session_metrics
Table overview
Table Kind Description
projects Dimension One row per project; keyed by project_hash
host_slugs Dimension One row per host/remote; keyed by host_slug
sessions Fact One row per ingested session; references both dimension tables
session_metrics Fact Token counts and turn/tool stats for one session
daily_summary Aggregate Cross-provider daily rollup; recomputed on every ingest
daily_summary_harness Aggregate Per-provider daily rollup; composite PK (date_utc, model_harness)
DDL
CREATE TABLE projects (
project_hash TEXT PRIMARY KEY,
project_name TEXT NOT NULL,
project_path TEXT NOT NULL
) STRICT;

CREATE TABLE host_slugs (
host_slug TEXT PRIMARY KEY,
git_remote TEXT
) STRICT;

CREATE TABLE sessions (
session_id TEXT PRIMARY KEY,
parent_id TEXT REFERENCES sessions(session_id),
model_harness TEXT NOT NULL CHECK (model_harness IN ('claude','opencode','codex','gemini')),
model_id TEXT NOT NULL,
host_slug TEXT NOT NULL REFERENCES host_slugs(host_slug),
project_hash TEXT NOT NULL REFERENCES projects(project_hash),
start_ms INTEGER NOT NULL,
end_ms INTEGER NOT NULL,
ingested_ms INTEGER NOT NULL,
source_path TEXT NOT NULL,
source_format TEXT NOT NULL CHECK (source_format IN ('jsonl','json')),
schema_version INTEGER NOT NULL DEFAULT 1,
git_branch TEXT,
git_worktree TEXT,
git_tracking TEXT,
tool_version TEXT
) STRICT;

-- Indexes on sessions for common query patterns
CREATE INDEX idx_sessions_start ON sessions(start_ms);
CREATE INDEX idx_sessions_harness ON sessions(model_harness);
CREATE INDEX idx_sessions_project ON sessions(project_hash);
CREATE INDEX idx_sessions_host ON sessions(host_slug);
CREATE INDEX idx_sessions_parent ON sessions(parent_id) WHERE parent_id IS NOT NULL;

CREATE TABLE session_metrics (
session_id TEXT PRIMARY KEY REFERENCES sessions(session_id),
turn_count INTEGER NOT NULL DEFAULT 0,
tool_call_count INTEGER NOT NULL DEFAULT 0,
subagent_count INTEGER NOT NULL DEFAULT 0,
duration_ms INTEGER NOT NULL DEFAULT 0,
tokens_in INTEGER NOT NULL DEFAULT 0,
tokens_out INTEGER NOT NULL DEFAULT 0,
tokens_total INTEGER NOT NULL GENERATED ALWAYS AS (tokens_in + tokens_out) STORED
) STRICT;

CREATE TABLE daily_summary (
date_utc TEXT PRIMARY KEY,
session_count INTEGER NOT NULL DEFAULT 0,
tokens_in INTEGER NOT NULL DEFAULT 0,
tokens_out INTEGER NOT NULL DEFAULT 0,
tokens_total INTEGER NOT NULL DEFAULT 0,
avg_duration_ms REAL NOT NULL DEFAULT 0,
avg_turns REAL NOT NULL DEFAULT 0,
tool_call_count INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE TABLE daily_summary_harness (
date_utc TEXT NOT NULL,
model_harness TEXT NOT NULL CHECK (model_harness IN ('claude','opencode','codex','gemini')),
session_count INTEGER NOT NULL DEFAULT 0,
tokens_in INTEGER NOT NULL DEFAULT 0,
tokens_out INTEGER NOT NULL DEFAULT 0,
tokens_total INTEGER NOT NULL DEFAULT 0,
avg_duration_ms REAL NOT NULL DEFAULT 0,
avg_turns REAL NOT NULL DEFAULT 0,
tool_call_count INTEGER NOT NULL DEFAULT 0,
PRIMARY KEY (date_utc, model_harness)
) STRICT, WITHOUT ROWID;
Key design notes
tokens_total in session_metrics is a GENERATED ALWAYS AS (tokens_in + tokens_out) STORED column — it is never written directly.
daily_summary and daily_summary_harness are recomputed inside the InsertSessions transaction on every ingest; callers do not need to trigger summary updates separately.
parent_id on sessions is a self-referencing FK supporting subagent session trees.
The host_slug and project_hash FK relationships enforce referential integrity; the dimension rows are upserted before the fact rows within the same transaction.
Configuration
Peasant reads its configuration from:

$XDG_CONFIG_HOME/peasant/config.yaml # if XDG_CONFIG_HOME is set
~/.config/peasant/config.yaml # otherwise
If no config file exists, Peasant uses built-in defaults and prints a notice directing you to peasant kickstart. CLI flags (--source-provider, --source-path, --output) override the config file for a single run.

Selection index
The kickstart wizard persists the user's project/branch/session selections as a selection index in config.yaml. This controls which sessions peasant ingest processes on subsequent runs.

selection:
mode: selected # "all" = no filter, "selected" = apply allowlist
autoIngestNewBranches: false # auto-include new branches in fully-selected projects
providers:
claude:
projects: - gitRemote: "git@github.com:user/repo.git"
branches: - main - feature/foo - name: "local-project" # fallback when no git remote
sessions: # explicit session-level picks - "abc123-uuid"
selection.mode Behavior
all (default) Ingest everything from enabled providers — no filter applied
selected Only ingest sessions matching the per-provider project/branch/session allowlist
When mode is selected, the ingest pipeline resolves each discovered session's git remote and branch, then checks against the allowlist. Sessions not matching any entry are skipped. The --session CLI flag overrides the selection index entirely.

Re-running peasant kickstart loads the existing selection index so prior choices are pre-populated in the tree. peasant kickstart --reset wipes the selection along with all other data.

Web dashboard
The web dashboard (peasant web start) serves a Next.js frontend that connects to the backend via WebSocket. The server pushes data on 6 channels, each broadcast every 5 seconds:

Channel Message type Payload Page
dashboard dashboard KPIs: total sessions/tokens, avg duration/turns, acceptance rate /
sessions sessions Session list with summary stats /sessions
session_detail session_detail Full session with turns/tool calls /sessions/detail?id=...
trends trends Daily token/session counts /trends
quality quality Per-session quality metrics (outcome, signal density, retry loops, effectiveAnnotations) / (charts)
annotations annotations Annotation updates (stub — not yet implemented) —
WebSocket protocol
Connect to /api/v1/ws and send JSON messages to subscribe. Subscriptions use a ChannelSubscription struct with topic, and optionally axis and id fields:

{"type": "subscribe", "channels": [{"topic": "dashboard"}, {"topic": "quality"}]}
{"type": "subscribe", "channels": [{"topic": "session_detail", "id": "SESSION_ID"}]}
{"type": "subscribe", "channels": [{"topic": "annotations", "axis": "session", "id": "SESSION_ID"}]}
{"type": "unsubscribe", "channels": [{"topic": "dashboard"}]}
The server responds with {"type": "connected", "version": "..."} on connect, then pushes snapshots immediately on subscribe and every ServerBroadcastTick (5s) thereafter.

Topic-specific fields:

session_detail requires id (session ID)
annotations requires axis (type, session, or project) and id
All other topics have no additional fields
REST endpoints
Route Method Description
/api/v1/health GET Health check ({"status": "ok"})
/api/v1/ws GET WebSocket upgrade
/api/v1/config/mock GET Current mock configuration
/api/v1/sessions GET Session list (REST alternative to WS)
/api/v1/shutdown POST Graceful server shutdown
Running in dev mode

# Backend serves static Next.js build (production mode)

peasant web start

# Backend proxies to Next.js dev server (hot reload)

peasant web start --dev # implies --foreground

# In another terminal:

cd web && npm run dev # Next.js dev server on :3000
Progressive mock system
Peasant supports granular control over mock vs real data for development and testing. By default mock data is disabled (DefaultMockEnabled = false in internal/defaults/mock.go). Enable it via config or CLI flags to overlay mock data on specific sections while the rest uses real data.

Configuration

# config.yaml

mock:
enabled: true # Enable mock data globally
web: [dashboard, sessions, trends] # Use mock for these web sections
tui: [sessions] # Use mock for these TUI sections
api: [sessions] # Use mock for these API sections
Available sections
Component Sections
web dashboard, sessions, trends, metrics, qualitySessions
tui sessions
api sessions
CLI override
CLI flags replace configured sections (not additive), following the --source-path convention:

# Use mock data for web dashboard only

peasant web start --mock-data-store=web,dashboard

# Use mock data for all web sections

peasant web start --mock-data-store=web

# Disable all mocks (even if config enables them)

peasant web start --mock-data-store=none

# Replace TUI sections

peasant tui --mock-data-store=tui
Architecture
ProgressiveProvider (internal/api/progressive.go): Decorator that routes requests to mock or real provider based on configuration
MockProvider (internal/mock/provider.go): Mock data implementation registered via MockProviderFactory init() pattern to avoid import cycles
Typed enums (internal/defaults/mock.go): MockComponents.Web, MockSections.Dashboard, etc.
Agentic testing with the progressive mock system
The progressive mock system enables automated testing loops where an agent can start a server, send requests, and verify responses programmatically. The key enabler is --foreground, which runs the server in the calling process (no background fork), making it controllable from scripts and agent sessions.

Pattern 1: curl/wget verification
Start the server in one process and probe it from another:

# Terminal 1: start server in foreground on a test port

./bin/peasant web start --port 9999 --foreground --no-browser

# Terminal 2: verify endpoints

# Health check

curl -s http://localhost:9999/api/v1/health | jq .

# Check mock config

curl -s http://localhost:9999/api/v1/config/mock | jq .

# REST sessions endpoint

curl -s http://localhost:9999/api/v1/sessions | jq '.sessions | length'

# WebSocket subscribe (one-shot with websocat)

echo '{"type":"subscribe","channels":["dashboard"]}' \
 | websocat ws://localhost:9999/api/v1/ws \
 | head -2 | jq .
Compare mock vs real data by running two servers:

# Server A: real data

./bin/peasant web start --port 9990 --foreground --no-browser &

# Server B: mock data for quality

./bin/peasant web start --port 9991 --foreground --no-browser --mock-data-store=web,qualitySessions &

# Compare session counts

REAL=$(curl -s http://localhost:9990/api/v1/sessions | jq '.sessions | length')
MOCK=$(curl -s http://localhost:9991/api/v1/sessions | jq '.sessions | length')
echo "Real: $REAL, Mock: $MOCK"

./bin/peasant web stop --port 9990
./bin/peasant web stop --port 9991
Pattern 2: Playwright/Puppeteer browser automation
See TESTING.md for planned Playwright patterns (shell invocation, example test cases, required frontend changes). These are not yet verified — no web/e2e/ directory or data-testid attributes exist yet.

Pattern 3: Go integration tests
Existing Go tests demonstrate the patterns for testing the progressive provider and store adapter:

Mock/real routing: internal/api/progressive_test.go — TestProgressiveProvider_MockEnabled_RoutesToMock, TestProgressiveProvider_MockDisabled_RoutesToReal, TestProgressiveProvider_QualitySessions_RoutesToMock
Quality metrics round-trip: internal/api/store_adapter_test.go:595 — TestStoreDataProvider_QualitySessions_WithQualityMetrics
Session detail with entries/turns: internal/api/store_adapter_test.go:692 — TestStoreDataProvider_SessionByID_WithEntries
Empty session handling: internal/api/store_adapter_test.go:812 — TestStoreDataProvider_SessionByID_NoEntries
These tests use httptest.NewServer with NewHub(provider) to stand up a real HTTP server backed by an in-memory SQLite store. The WebSocket E2E pattern in AGENTS.md extends this with github.com/coder/websocket for channel subscription testing.

Development

# Enter dev shell

nix develop

# Build

make build

# Run all quality gates (fmt + vet + ast-grep + tests) — required before merging

make check

# Run tests with the mandatory race detector

go test -race ./...

# Run a single package

go test -race ./internal/ingest/ -v

# Run a single test

go test -race ./internal/ingest/ -run TestPipeline_DryRun -v

# Static analysis (ast-grep rules)

ast-grep scan --config sgconfig.yml .
Package map
Package Description
cmd/peasant CLI entry point; Cobra command wiring
internal/ingest 6-stage pipeline, source adapters (Claude, OpenCode), diff logic
internal/store SQLite data access layer; schema migrations; read/write queries
internal/api HTTP server, WebSocket hub, and ProgressiveProvider for mock/real data routing
internal/mock Mock data provider implementation for development/testing
internal/config Config loading, validation, and defaults
internal/defaults Single source of truth for all cross-package constants
internal/tui Bubbletea terminal UI
internal/redact Redaction level types and validation
internal/testutil Shared test fixtures: MemFS, StubGitResolver, StubAdapter
pkg/schema Unified schema types for peasant push; JSON Schema + OpenAPI 3.1 generation; YAML test fixtures
specs/ Versioned OpenAPI specs (peasantlocal-api-0.1.0.yaml, village-api-0.1.0.json, etc.) — generated via go generate or go run cmd/schema-gen/main.go
Schema versioning
The PublishRequest schema version is defined in internal/defaults/schema.go as PublishSchemaVersion. Bump this constant to generate new versioned specs:

# Edit internal/defaults/schema.go

# Change PublishSchemaVersion = "2.0"

go run cmd/schema-gen/main.go
Schema versions explained
Peasant uses three distinct schema versions for different data stores and APIs:

Schema Location Current Purpose
Database internal/store/migrations.go v9 SQLite peasant.db tables and columns
Metadata internal/ingest/metadata.go v3 {sessionId}--metadata.json files
Publish internal/defaults/schema.go "1.0" peasant push wire format (JSON)
When to bump each schema
Schema Bump when Example change
Database (vN) Adding tables, columns, or constraints to SQLite New tags table → v9
Metadata (vN) Changing the JSON structure written to --metadata.json New field in UnifiedMetadata
Publish ("M.m") Changing the JSON structure sent to village API Breaking change to PublishRequest
Database migration workflow
New database features require a migration in internal/store/migrations.go:

// internal/store/migrations.go
var migrations = []Migration{
{Version: 1, DDL: "CREATE TABLE ...", Description: "initial schema"},
// ...
{Version: 10, DDL: "CREATE TABLE new_feature...", Description: "new feature"},
}
Run verification after migrations:

./bin/peasant ingest verify
Database verification
SQL scripts for querying and verifying the database are in scripts/query-db.sql:

# Run a specific query

sqlite3 ~/.local/share/peasant/peasant.db < scripts/query-db.sql

# Or run individual queries

sqlite3 ~/.local/share/peasant/peasant.db "SELECT COUNT(\*) FROM sessions;"
sqlite3 ~/.local/share/peasant/peasant.db "PRAGMA table_info(sessions);"
The script includes queries for:

Database overview (table list, row counts)
Sessions (recent, by provider, pushed, tagged)
Session entries (by type, depth, tool usage)
Session metrics (costs, outcomes)
Daily summaries (by date, provider, project)
Models (from models.dev)
Session entries ext (EAV attributes)
Ingest/push logs
Debug checks (orphaned rows, duplicates)
