# Peasant LP + Docs — Design & Implementation Plan

> A TUI-styled, feudal-themed landing page and documentation site for Peasant — the open-source CLI for ingesting, analyzing, and sharing AI coding transcripts.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Visual Identity](#2-visual-identity)
3. [Site Architecture](#3-site-architecture)
4. [Page-by-Page Breakdown](#4-page-by-page-breakdown)
5. [Feudal UX Metaphor System](#5-feudal-ux-metaphor-system)
6. [Component Library](#6-component-library)
7. [Animation & Interaction Design](#7-animation--interaction-design) ← NEW
8. [Demo & Mockup Strategy](#8-demo--mockup-strategy)
9. [Documentation Structure](#9-documentation-structure)
10. [Technical Architecture](#10-technical-architecture)
11. [Messaging & Copy Strategy](#11-messaging--copy-strategy)
12. [Competitive Positioning](#12-competitive-positioning)
13. [Design References & Inspiration](#13-design-references--inspiration)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Design Philosophy

### Core Principles

**"The terminal is the medium. The manor is the message."**

Every pixel on this site should feel like it was rendered in a terminal — but a terminal that belongs to a medieval village. We are building a website that looks like it was `cat`'d out of a scroll.

1. **Character-cell fidelity** — All elements align to a monospace character grid. Spacing is measured in `ch` (character width) and `lh` (line height). Nothing floats between grid lines.

2. **Zero border-radius** — Everything is square. Cards, buttons, inputs, images. No rounded corners, ever. This is a world of right angles, stone walls, and plowed furrows.

3. **Grid-paper background** — A subtle dot or line grid underlies the entire page, reinforcing the character-cell metaphor. It shifts between cream/dark parchment tones for light/dark mode.

4. **Monospace only** — One typeface family, used everywhere. No sans-serif headlines, no serif body copy. The constraint is the feature.

5. **Feudal immersion** — The metaphor is not decoration; it IS the UX. Users don't "upload" — they "bring to market." They don't have "teams" — they have "guilds." The feudal system is the information architecture.

6. **Honest tools for honest work** — No dark patterns, no manipulative urgency, no fake scarcity. A peasant's tool is sturdy, reliable, and does what it says. The site reflects this.

7. **Alive, not static** — This site breathes. ASCII art morphs between states. Characters assemble on scroll. Data flows visibly through pipelines. The grid pulses with life. Every section has movement — but it's purposeful movement, like wind through wheat fields, not carnival noise.

### Design DNA

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   TUI (Terminal UI)          FEUDALISM              │
│   ├── Monospace grid         ├── Village metaphor   │
│   ├── Box-drawing borders    ├── Harvest/yield      │
│   ├── ASCII art              ├── Commons/guilds     │
│   ├── Green/amber accents    ├── Medieval voice     │
│   └── Dark terminal bg       └── Heraldic motifs    │
│                                                     │
│              ┌──────────────┐                       │
│              │   PEASANT    │                       │
│              │   IDENTITY   │                       │
│              └──────────────┘                       │
│                                                     │
│   GRID SYSTEM                SQUARE GEOMETRY        │
│   ├── 8px base unit          ├── 0 border-radius    │
│   ├── ch/lh units            ├── Right angles only  │
│   ├── Graph-paper bg         ├── Card-based layout  │
│   └── Harmonic scale         └── Table aesthetics   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. Visual Identity

### Typography

**Primary font:** Geist Mono (ships with Next.js, 9 weights, excellent `font-feature-settings`)

**Fallback stack:**
```css
--font-mono: 'Geist Mono', 'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Menlo', monospace;
```

**Type scale** (Minor Third ratio, 1.200, base 16px):

| Step | Size   | Use                          |
|------|--------|------------------------------|
| -2   | 11px   | Captions, metadata           |
| -1   | 13px   | Small body, labels           |
| 0    | 16px   | Body text (base)             |
| 1    | 19px   | Section headers, large body  |
| 2    | 23px   | Page titles, feature heads   |
| 3    | 28px   | Hero subtitle                |
| 4    | 33px   | Hero headline                |
| 5    | 40px   | Display / ASCII art headers  |

### Color System

Functional 10-step scale with feudal-inspired naming. No pure black (`#000`). All grays carry a subtle warm tint (parchment feel).

**Dark Mode (Primary — "The Night Watch"):**

```
Background:
  --bg-deep:      #0c0c0e    (deepest — page bg)
  --bg-surface:   #141416    (cards, panels)
  --bg-elevated:  #1c1c1f    (hover states, active)

Grid:
  --grid-line:    rgba(255, 255, 255, 0.04)
  --grid-major:   rgba(255, 255, 255, 0.08)

Text:
  --text-primary:   #e8e5e0  (warm white — parchment)
  --text-secondary: #9b9689  (muted — aged paper)
  --text-tertiary:  #5c5850  (faint — weathered)

Borders:
  --border-default: #2a2a2e
  --border-strong:  #3e3e42

Accent (harvest gold):
  --accent:         #d4a843
  --accent-muted:   #2e2518

Signal green (terminal / success):
  --green:          #4ade80
  --green-muted:    #0f2918

Signal red (blight / error):
  --red:            #f87171
  --red-muted:      #2e1515

Signal amber (omen / warning):
  --amber:          #fbbf24
  --amber-muted:    #2e2510
```

**Light Mode ("The Parchment"):**

```
Background:
  --bg-deep:      #f5f2ec    (parchment — page bg)
  --bg-surface:   #faf8f4    (cards, panels)
  --bg-elevated:  #ffffff    (hover states, active)

Grid:
  --grid-line:    rgba(0, 0, 0, 0.05)
  --grid-major:   rgba(0, 0, 0, 0.10)

Text:
  --text-primary:   #1c1a16  (dark earth)
  --text-secondary: #6b6660  (worn stone)
  --text-tertiary:  #a39e96  (faded)

Borders:
  --border-default: #ddd8d0
  --border-strong:  #c4beb4

Accent (harvest gold):
  --accent:         #a07d2e
  --accent-muted:   #f0e8d4

Signal colors: same hues, adjusted for light bg contrast.
```

### Grid Background

CSS graph-paper pattern, perfectly aligned to the character grid:

```css
.grid-bg {
  background-image:
    linear-gradient(var(--grid-major) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-major) 1px, transparent 1px),
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size:
    calc(8 * 1ch) calc(8 * 1lh),
    calc(8 * 1ch) calc(8 * 1lh),
    1ch 1lh,
    1ch 1lh;
}
```

Major grid lines every 8 characters, minor lines every character. This creates a visible "engineering paper" texture that subtly reinforces the monospace grid.

### Spacing System

8px base, 4px for fine adjustments. All spacing is a multiple of these:

```
--space-1:   4px     (0.25rem)
--space-2:   8px     (0.5rem)   ← base unit
--space-3:  12px     (0.75rem)
--space-4:  16px     (1rem)
--space-6:  24px     (1.5rem)
--space-8:  32px     (2rem)
--space-12: 48px     (3rem)
--space-16: 64px     (4rem)
--space-24: 96px     (6rem)
--space-32: 128px    (8rem)
```

### Border System

No border-radius anywhere. Borders use three weights for hierarchy:

| Weight | Use                        |
|--------|----------------------------|
| 1px    | Subtle separators, grid    |
| 2px    | Card borders, containers   |
| 3px    | Focus states, emphasis     |

Box-drawing characters for decorative borders:
```
Single:  ┌─┐│└─┘
Double:  ╔═╗║╚═╝
Heavy:   ┏━┓┃┗━┛
```

---

## 3. Site Architecture

```
peasant.dev (or peasantcli.dev)
│
├── /                          Landing page (the scroll unfurls)
│
├── /docs                      Documentation hub
│   ├── /docs/getting-started  Apprenticeship (onboarding)
│   ├── /docs/core-concepts    The Lay of the Land
│   │   ├── architecture
│   │   ├── ingest-pipeline
│   │   ├── analytics-schema
│   │   └── village-protocol
│   ├── /docs/guides           Field Guides
│   │   ├── installation
│   │   ├── configuration
│   │   ├── ingesting-sessions
│   │   ├── exploring-metrics
│   │   ├── redacting-transcripts
│   │   ├── pushing-to-village
│   │   └── creating-collectives
│   ├── /docs/cli-reference    The Peasant's Almanac
│   │   ├── ingest
│   │   ├── push
│   │   ├── tui
│   │   ├── web
│   │   ├── sessions
│   │   ├── models
│   │   └── kickstart
│   └── /docs/configuration    Your Charter
│
└── /village                   External link → village platform
```

### Navigation Structure

```
┌──────────────────────────────────────────────────┐
│  🌾 PEASANT          Docs   Village   GitHub     │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Sidebar - docs only]    [Content]    [TOC]     │
│                                                  │
└──────────────────────────────────────────────────┘
```

- **Top nav**: Minimal. Logo + wordmark, three links, theme toggle.
- **Docs sidebar**: Section-grouped navigation with expand/collapse.
- **Right rail (docs)**: Auto-generated table of contents from headings.
- **Mobile**: Hamburger menu for sidebar, TOC collapses into a dropdown.

---

## 4. Page-by-Page Breakdown

### 4.1 Landing Page (`/`)

The landing page is one long, immersive scroll — a scroll (parchment) that unfurls as you read. Each section is a "chapter" of the peasant's story.

#### Section 1: Hero — "The Proclamation"

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          \\\|///                                             ║
║           \\|//        P E A S A N T                         ║
║            \|/                                               ║
║             |          tend your harvests.                    ║
║             |          share your yields.                    ║
║                                                              ║
║    The open-source TUI for AI coding transcript              ║
║    analytics. Reap insights from every session.              ║
║    Tithe knowledge to the Village.                           ║
║                                                              ║
║    $ go install github.com/org/peasant@latest  [GitHub]      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Content:**
- Large ASCII wheat/peasant art (generated with figlet at build time)
- Tagline: "tend your harvests. share your yields."
- One-liner: "The open-source CLI for AI coding transcript analytics."
- Two CTAs: `go install github.com/org/peasant@latest` (copy-to-clipboard) + GitHub link
- Real install command — this is a Go binary

**Animation — The Scroll Unfurls:**
- On page load, the screen starts black/empty
- A blinking cursor appears at top-left: `█`
- The cursor "types" the figlet ASCII art for "PEASANT" character by character (150ms per char)
- As the ASCII text completes, the wheat sheaf ASCII morphs in from random characters: `%@#&` → `\\\|||///` (each character slot cycles through 3-4 random chars before landing on the correct one — "decryption" effect, ~2 seconds)
- The tagline fades in line by line with a 300ms stagger
- The grid background fades in from 0 to full opacity during the wheat animation
- The install command types itself with a realistic cursor blink
- Total hero animation: ~4 seconds
- After animation completes, a subtle "wheat sway" CSS animation loops on the ASCII art (very gentle `translateX` oscillation, 8s period)

**Design:**
- Full viewport height
- Grid background most visible here — fades in during hero animation
- Dark mode default, theme toggle in corner
- The blinking cursor is a CSS-only animation (`animation: blink 1s step-end infinite`)
- `prefers-reduced-motion`: skip the typing/morphing, show final state immediately with a simple fade-in

#### Section 2: The Perception Gap — "The Lord's Lie"

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  "You think AI makes you 20% faster."            │
│                                                  │
│  The METR study found developers are             │
│  actually 19% slower — but believe                │
│  otherwise.                                      │
│                                                  │
│  Without measurement, you're                     │
│  farming blind.                                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ SESSIONS │  │  TOKENS  │  │  YIELD   │       │
│  │   247    │  │  1.2M    │  │   73%    │       │
│  │ ingested │  │ tracked  │  │ success  │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Content:**
- Lead with the METR study's shocking finding (perception vs. reality gap)
- Three animated counter boxes showing example metrics from real `peasant metrics compute` output
- "Without measurement, you're farming blind" — the problem statement

**Animation — The Revelation:**
- The quote "You think AI makes you 20% faster." types in first (typewriter, green text)
- Pause 800ms
- Then the reveal: "The METR study found developers are actually 19% slower" types in amber/warning color
- The `+20%` and `-19%` numbers animate as a dramatic counter: `+20%` visually flips/morphs into `-19%` using the ASCII morph technique (characters cycle: `+` → `*` → `#` → `-`, `2` → `8` → `3` → `1`, `0` → `5` → `9`)
- The three stat boxes below draw themselves on screen: box-drawing borders animate in (top line draws left-to-right, sides draw down, bottom closes) — like the box is being drawn by hand
- Numbers inside count up from 0 to their final value (odometer style, 1.5s duration, ease-out)
- Each stat box draws with a 200ms stagger

**Design:**
- Split layout: quote on left, stat boxes on right (stacks on mobile)
- Box borders animate using `clip-path` or `stroke-dashoffset` on SVG
- Numbers use tabular-nums font feature for stable width during counting
- `prefers-reduced-motion`: no typing, no morphing, show final state

#### Section 3: The Pipeline — "From Field to Table"

The real `peasant ingest` pipeline has 9 stages. We visualize all of them — this IS the product's core differentiator.

```
DISCOVER ──→ DIFF ──→ FILTER ──→ EXTRACT ──→ DB INSERT ──→ INDEX ──→ COMPUTE ──→ CLEANUP ──→ REPORT
    │           │         │          │            │           │          │           │           │
  find       compare    skip      parse &      upsert     build     run 16      remove     summary
 sessions   mod times  unchanged  write out   to SQLite   entries   metrics    orphan tmp   counts
```

**Content:**
- Full 9-stage pipeline from `peasant ingest` (matches `internal/ingest/pipeline.go`)
- Each stage is a clickable/hoverable node that reveals what it does
- Below: animated terminal showing the real ingest output with progress bar
- Connection to the actual commands: `peasant ingest`, `peasant ingest verify`, `peasant metrics compute`

**Animation — The Grain Flow:**
- On scroll-into-view, the pipeline animates left-to-right
- ASCII "grain particles" (`.` `·` `°` `•` `●`) flow through the arrow connectors between stages
- Each node lights up in sequence (border changes from `--border-default` to `--accent`)
- As each node activates, a small counter appears: "47 found" → "35 new" → "35 extracted" → etc.
- The particles accelerate through CLEANUP and pile up at REPORT
- Total animation duration: ~4 seconds, triggered once on scroll
- Below the pipeline, a terminal mockup types out:
  ```
  $ peasant ingest --since 2w
    DISCOVER → DIFF → FILTER → EXTRACT → DB INSERT → INDEX → COMPUTE → CLEANUP → REPORT
    ████████████████████████████████████████ 100%
    New: 35  Updated: 12  Unchanged: 12  Active: 0  Errors: 0
  ```

**Design:**
- Horizontal scroll on mobile with snap points per stage
- Each node is a box-drawing card with the stage name in bold
- Arrow connectors drawn with `──→` characters
- The flowing particles use CSS `@keyframes` with staggered `animation-delay`
- `prefers-reduced-motion`: show all stages lit up simultaneously, no particle flow

#### Section 4: The Features — "Tools of the Trade"

Four feature blocks, each with a terminal mockup on one side and description on the other. Alternating left/right layout.

**Feature 1: "Reap Your Harvests" (`peasant ingest`)**
```
$ peasant ingest --since 2w --verbose
  Discovering sessions...
  ┌──────────────────────────────────────────┐
  │ Provider     │ Sessions │ Tokens         │
  ├──────────────┼──────────┼────────────────┤
  │ Claude Code  │       34 │        890,231 │
  │ OpenCode     │       12 │        234,108 │
  └──────────────┴──────────┴────────────────┘
  New: 46  Updated: 0  Unchanged: 8  Errors: 0
```
- Multi-provider: Claude Code (JSONL), OpenCode (JSON). Codex & Gemini reserved.
- `--since 2w`, `--force`, `--include-active`, `--session <ids>` — granular control
- Selection index from `peasant kickstart` filters to your chosen projects/branches
- **Animation:** Terminal mockup types the command, then rows appear one by one with a slide-in from right. Numbers count up as they appear.

**Feature 2: "Measure Your Yields" (`peasant tui` / `peasant web start`)**
```
$ peasant tui
┌─ Sessions ──────────────────────────────────────────┐
│ ID       │ Provider │ Duration │ Turns │ Tokens     │
├──────────┼──────────┼──────────┼───────┼────────────┤
│ a3f2..   │ claude   │   23m14s │    47 │    124,891 │
│ b7e1..   │ claude   │   11m02s │    12 │     43,220 │
│ c9d4..   │ opencode │    8m45s │     8 │     31,456 │
└──────────┴──────────┴──────────┴───────┴────────────┘
  [j/k] navigate  [enter] detail  [/] search  [t] tag
```
- TUI via Bubbletea: browse sessions, explore metrics, search, tag
- Web dashboard via `peasant web start` (port 8690): real-time WebSocket updates
- 16 computed metrics per session: tokens, turns, tool calls, duration, cost, quality
- `peasant metrics compute` to recompute metrics on demand
- **Animation:** The TUI mockup renders with rows appearing in a cascade (each row 80ms stagger). A simulated cursor highlights rows as if navigating with `j`/`k`. Pressing enter "opens" a session detail view — the table morphs into a detail panel using ASCII character transitions.

**Feature 3: "Winnow the Chaff" (Redaction & Privacy)**
```
Before:                              After:
├── api_key: sk-proj-abc123...  →   ├── api_key: [REDACTED]
├── path: /Users/john/acme      →   ├── path: /Users/[USER]/[PROJECT]
├── remote: git@github.com/...  →   ├── remote: [REDACTED]
├── model: claude-opus-4-6      →   ├── model: claude-opus-4-6  ✓ kept
```
- Smart anonymization: strips PII while preserving analytical value
- Configurable per-field redaction levels
- `peasant push --dry-run` to preview exactly what gets shared
- **Animation:** The "Before" column renders first. Then a "winnowing wind" effect sweeps left-to-right (a gradient mask/wipe), and as it passes each sensitive value, the characters scramble (`s` `k` `-` `p` `r` → `[` `R` `E` `D` `]`) using the decrypt/morph effect. Non-sensitive values (like `model`) get a green `✓ kept` checkmark that fades in.

**Feature 4: "Bring to Market" (`peasant push`)**
```
$ peasant push --visibility public --dry-run
  Preparing 12 sessions for the Village...
  ┌────────────────────────────────────────┐
  │ Redacted:  12/12 transcripts           │
  │ Stripped:  API keys, paths, emails     │
  │ Retained:  metrics, tool calls, turns  │
  │ Visibility: public                     │
  └────────────────────────────────────────┘
  Ready to push. Run without --dry-run to proceed.
```
- `peasant push` with `--dry-run`, `--by-source`, `--visibility private|public`
- Sessions flow to Peasant Village — the web platform for sharing transcripts
- Every collective can set license types and access levels (invite-only, open)
- **Animation:** Split-screen. Left side: terminal typing the push command. Right side: a Village web interface mockup. As push "completes", animated data particles (small `·` characters) flow from the left terminal across the gap into the right panel, where sessions appear one by one in a list. The bridge between local and village is visually alive.

**Design (all features):**
- Each feature is a full-width row with terminal mockup + text, alternating sides
- Terminal mockups are CSS/HTML Server Components (real text, accessible)
- Each feature section triggers its animation on scroll-into-view (Intersection Observer)
- Animations use Framer Motion for orchestration + CSS for character-level effects
- All animations respect `prefers-reduced-motion` (show final state, no transitions)
- Mobile: stack vertically, terminal mockup on top, description below

#### Section 5: The Village — "The Commons"

The emotional centerpiece. This section sells the community vision.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              /\      /\      /\                         │
│             /  \    /  \    /  \     THE VILLAGE         │
│            /    \  /    \  /    \                        │
│           /______\/______\/______\   Where peasants     │
│           |  []  ||  []  ||  []  |   share their        │
│           |______||______||______|   harvests.           │
│                                                         │
│   "491 shared trajectories improved a coding            │
│    agent by 20x. Imagine what yours could do."          │
│                                                         │
│   ┌─────────────────┐  ┌─────────────────┐              │
│   │ COLLECTIVES     │  │ LICENSES        │              │
│   │ Create guilds   │  │ Set terms for   │              │
│   │ of like-minded  │  │ your shared     │              │
│   │ peasants.       │  │ harvests.       │              │
│   │                 │  │                 │              │
│   │ • Open fields   │  │ • Open (CC0)    │              │
│   │ • Invite-only   │  │ • Attribution   │              │
│   │ • By charter    │  │ • Custom deed   │              │
│   └─────────────────┘  └─────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Content:**
- ASCII village illustration (houses, church tower, fields)
- The ADP study stat: "491 trajectories improved a coding agent by 20x"
- Collectives explanation: open, invite-only, chartered
- License types: open (CC0), attribution, custom deeds
- Emphasis on data sovereignty: "Your harvest belongs to you"

**Animation — The Village Comes Alive:**
- On scroll-into-view, the village ASCII art builds itself from the ground up:
  - First: ground line draws (`____`) left to right
  - Then: walls rise (`|  |`) character by character, upward
  - Then: roofs appear (`/\`) with a quick snap
  - Then: windows (`[]`) blink on one by one
  - Then: the church spire (`^` `/|\`) rises last, tallest
  - Total build animation: ~3 seconds
- After the village builds, small "peasant" characters (`☺` or `o`) appear at the base and "walk" between buildings (CSS translateX, looping)
- The quote fades in with the familiar typewriter effect
- Collective and License cards draw their borders on-screen (same box-draw animation as stat cards)
- A subtle looping animation: tiny `·` particles drift upward from building "chimneys" (smoke effect, pure CSS)

**Design:**
- Village ASCII art is the hero element, centered
- Cards for Collectives and Licenses flanking below
- The particle/smoke effect uses CSS `@keyframes` with randomized `animation-delay` per particle
- `prefers-reduced-motion`: village appears complete, no build animation, no walking peasants

#### Section 6: The Research — "What the Scholars Say"

```
┌──────────────────────────────────────────────────────┐
│  WHAT THE SCHOLARS SAY                               │
│                                                      │
│  ┌────────────────────┐  ┌────────────────────┐      │
│  │ "Token costs vary  │  │ "AI adoption:      │      │
│  │  10x between       │  │  +21% tasks but    │      │
│  │  similar tasks."   │  │  +91% review time  │      │
│  │                    │  │  and +9% bugs."    │      │
│  │  — OpenReview '25  │  │  — Faros AI '25    │      │
│  └────────────────────┘  └────────────────────┘      │
│                                                      │
│  ┌────────────────────┐  ┌────────────────────┐      │
│  │ "Failed sessions   │  │ "Developers think  │      │
│  │  are consistently  │  │  they're 20% faster│      │
│  │  longer and more   │  │  but are actually  │      │
│  │  repetitive."      │  │  19% slower."      │      │
│  │  — ICSE '26        │  │  — METR '25        │      │
│  └────────────────────┘  └────────────────────┘      │
│                                                      │
│  Peasant gives you the data to know the truth.       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Content:**
- 4 quote cards from real research papers
- Each links to the source
- Concluding line tying research back to peasant's value prop

**Animation — Scholarly Scrolls Unroll:**
- Each quote card starts as a rolled scroll: a single line `═══════════════`
- On scroll-into-view, the scrolls "unroll" — the top and bottom borders expand outward (height animates from 0 to full) revealing the quote inside
- Quotes type in after the scroll unrolls (200ms delay, fast typewriter)
- Citation fades in last, in muted text
- Cards appear with a 150ms stagger (top-left → top-right → bottom-left → bottom-right)
- On hover: card border brightens to `--accent`, a subtle `translateY(-2px)` lift

**Design:**
- 2x2 grid of quote cards with box-drawing borders (double: `╔═╗║╚═╝`)
- Citation in muted text
- Cards have a subtle "parchment" texture in light mode
- `prefers-reduced-motion`: all cards visible immediately, no unroll

#### Section 7: Live Demo — "A Day in the Fields"

An interactive, tabbed terminal emulator showing peasant in action.

**Tabs:**
1. `kickstart` — The setup wizard running
2. `ingest` — Ingesting sessions with live output
3. `tui` — The TUI interface (VHS recording or asciinema)
4. `push` — Pushing to Village with dry-run output

**Design:**
- Full-width terminal window with macOS-style chrome (but square corners)
- Tab bar above the terminal content
- Each tab loads a different pre-recorded demo
- For `tui` tab: embedded asciinema player or VHS-generated WebM
- For command tabs: CSS typewriter animation with realistic output

#### Section 8: Quick Start — "Claim Your Croft"

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  CLAIM YOUR CROFT                                    │
│                                                      │
│  # Enter the village                                 │
│  $ go install github.com/org/peasant@latest          │
│                                                      │
│  # Survey your lands                                 │
│  $ peasant kickstart                                 │
│                                                      │
│  # Reap your first harvest                           │
│  $ peasant ingest                                    │
│                                                      │
│  # See your yields                                   │
│  $ peasant tui                                       │
│                                                      │
│  [Read the Full Guide →]    [Star on GitHub ☆]       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Content:**
- 4-step quick start in a single terminal window
- Each command has a one-line comment in feudal voice
- Two CTAs: docs link and GitHub star

**Design:**
- Single code block with syntax highlighting
- Copy button for each command
- Green `$` prompts, white commands, gray comments

#### Section 9: Footer — "The Village Notice Board"

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  🌾 PEASANT                                          │
│  honest tools for honest work                        │
│                                                      │
│  Docs          Community       Project               │
│  ├─ Getting    ├─ GitHub       ├─ License (MIT)      │
│  │  Started    ├─ Discord      ├─ Contributing       │
│  ├─ Guides     ├─ Village      ├─ Code of Conduct    │
│  ├─ CLI Ref    └─ X/Twitter    └─ Changelog          │
│  └─ Config                                           │
│                                                      │
│  ─────────────────────────────────────────────       │
│  Built by peasants, for peasants. MIT License.       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Design:**
- Three-column link list using file-tree notation (├─ └─)
- Minimal, structured, no fluff
- Battle-ment border at top: `|^|_|^|_|^|_|^|_|^|`

---

## 5. Feudal UX Metaphor System

### Core Vocabulary

| Software Concept       | Feudal Term             | Context                                    |
|------------------------|-------------------------|--------------------------------------------|
| CLI tool               | Peasant                 | The tool IS the peasant                    |
| AI transcript          | Harvest                 | The fruit of your labor                    |
| Ingest/parse           | Reap / Gather           | Bringing in the harvest                    |
| Analyze                | Thresh                  | Separating wheat from chaff                |
| Anonymize/redact       | Winnow                  | Wind carries away the husk                 |
| Metrics/analytics      | Yield / Yield Report    | What the land produced                     |
| Coding session         | A day's toil            | One unit of work                           |
| Shared platform        | The Village             | Where peasants gather and trade            |
| Share/publish          | Bring to market         | Contributing your surplus                  |
| Search                 | Forage                  | Gathering from others' fields              |
| Tags/annotations       | Marks / Brands          | How you identify and categorize            |
| Dashboard              | The Ledger              | The reeve's records                        |
| Team/collective        | Guild                   | Craftsmen banding together                 |
| Configuration          | Charter                 | Your rights and rules of engagement        |
| Database/storage       | Tithe Barn              | Where harvests are stored                  |
| Onboarding             | Apprenticeship          | Learning the craft                         |
| Error                  | Blight                  | Crop failure                               |
| Loading                | The millstone turns...  | Processing takes time                      |
| Success                | Bountiful harvest       | The fields have yielded well               |

### Metaphor Depth Tiers

**Tier 1 — Full immersion** (hero, empty states, loading, success/error, marketing):
> "Your fields lie fallow. Begin a day's toil to see your first harvest here."

**Tier 2 — Light seasoning** (section headers, nav items, status messages):
> "Your Harvests" instead of "Your Transcripts"

**Tier 3 — Functional first** (form labels, data tables, technical settings):
> Standard labels with themed section headers

**Tier 4 — No metaphor** (legal, payment, security, accessibility labels):
> Plain language only

### Voice & Tone

- **Humble but proud** — "We're just simple folk doing honest work"
- **Practical** — Peasants were pragmatists. No flowery language.
- **Communal** — "We" more than "I." The village matters.
- **Wry** — A dark, earthy humor. Not slapstick.
- **One feudal word per sentence max** in functional copy.

### ASCII Art Motifs

**Wheat sheaf** (primary brand symbol):
```
   \\\|||///
    \\|||//
     \|||/
      |||
     /|||\
    /_||_\
```

**Village silhouette** (for Village section):
```
       /\
  /\  /  \  /\
 /  \/    \/  \    ^
/    |    |    \  /|\
| [] | [] | [] |/ | \
|____|____|____|__|__\
```

**Battlement border** (section dividers):
```
|^|_|^|_|^|_|^|_|^|_|^|_|^|_|^|
```

**Scroll ends** (for callouts/quotes):
```
╔══════════════════════════════╗
║  Your charter awaits within  ║
╚══════════════════════════════╝
```

---

## 6. Component Library

### Terminal Window

The foundational component. Used for every code example, demo, and feature showcase.

```
┌─ Terminal ── peasant ─────────────── ○ ○ ○ ─┐
│                                              │
│  $ peasant ingest --since 1w                 │
│  Discovering sessions...                     │
│  Found 23 sessions across 2 providers        │
│                                              │
└──────────────────────────────────────────────┘
```

- Square corners (obviously)
- Title bar with box-drawing characters
- macOS-style dots but square (○ not ●)
- Monospace content with syntax highlighting
- Optional: typing animation, blinking cursor

### ASCII Box (Content Container)

```tsx
<AsciiBox title="Your Yields" variant="single|double|heavy">
  {children}
</AsciiBox>
```

Renders as:
```
┌─ Your Yields ────────────────────┐
│                                  │
│  Content goes here               │
│                                  │
└──────────────────────────────────┘
```

### Stat Card

```
╔══════════════╗
║   247        ║
║   sessions   ║
║   reaped     ║
╚══════════════╝
```

- Double border for emphasis
- Large number in accent color
- Label below in secondary text

### Pipeline Node

```
┌──────────┐
│  REAP    │──→
│  ingest  │
└──────────┘
```

- Single border
- Stage name in bold
- Sub-label in muted text
- Arrow connector (ASCII: ──→)

### Callout (MDX Component)

```
┃ INFO  Your charter defines which fields to reap.
┃       Run `peasant kickstart` to set it up.
```

Variants: `info` (blue), `warn` (amber), `error` (red), `success` (green)

### Code Block (MDX Component)

Terminal-style with title bar, line numbers, copy button:

```
┌─ config.yaml ────────────────────────────────┐
│  1 │ selection:                               │
│  2 │   mode: selected                         │
│  3 │   providers:                             │
│  4 │     claude:                              │
│  5 │       projects:                          │
│  6 │         - gitRemote: "git@github.com..." │
│                                    [copy ⎘]   │
└──────────────────────────────────────────────┘
```

### File Tree

```
~/.local/share/peasant/
├── peasant.db
└── peasant-sync/
    └── {hostSlug}/
        └── {sessionId}/
            ├── {sessionId}--transcript.jsonl
            └── {sessionId}--metadata.json
```

- Uses box-drawing tree characters (├── └──)
- Directories in accent color
- Files in primary text

### Navigation Sidebar (Docs)

```
┌─ DOCS ───────────────────┐
│                          │
│  ◆ Getting Started       │
│                          │
│  ▸ Core Concepts         │
│    ├─ Architecture       │
│    ├─ Ingest Pipeline    │
│    └─ Analytics Schema   │
│                          │
│  ▸ Field Guides          │
│    ├─ Installation       │
│    ├─ Configuration      │
│    └─ Ingesting          │
│                          │
│  ▸ The Almanac (CLI)     │
│    ├─ ingest             │
│    ├─ push               │
│    └─ tui                │
│                          │
└──────────────────────────┘
```

### Theme Toggle

```
[◐ The Night Watch]  ←→  [◑ The Parchment]
```

Or simpler: `[☾]` / `[☀]`

---

## 7. Animation & Interaction Design

This section defines the animation system holistically. The site should feel ALIVE — like a terminal session that never stops running.

### Global Animation Principles

1. **Everything is typed, drawn, or assembled** — Nothing simply "fades in." Content either types itself (typewriter), draws itself (box borders), assembles from chaos (ASCII morph), or flows in (data particles). The metaphor: a scribe writing on a scroll.

2. **Scroll is the clock** — Most animations trigger on scroll-into-view via Intersection Observer. The page is a timeline. Scrolling down = time passing = the story unfurling.

3. **Characters are the atoms** — All animations happen at the character level. Not pixel-level transforms — individual characters changing, appearing, cycling. This is a monospace world; the character is the smallest unit.

4. **Respect the reduced-motion contract** — Every animation has a `prefers-reduced-motion` fallback: show the final state immediately with at most a simple opacity fade.

5. **Performance over spectacle** — Use CSS animations and `transform`/`opacity` for GPU compositing. Reserve JavaScript for orchestration only. Use `<canvas>` for particle-heavy effects. Target 60fps on mid-range devices.

### Core Animation Techniques

#### A. ASCII Morph / Decrypt Effect

The signature animation. Characters in a target string cycle rapidly through random characters before "landing" on their final value — like a combination lock clicking into place, or an encrypted message decoding.

```
Frame 0:  %@#&!*$^~+      (random)
Frame 1:  P@#&!*$^~+      (P lands)
Frame 2:  PE#&!*$^~+      (E lands)
Frame 3:  PEA&!*$^~+      (A lands)
Frame 4:  PEAS!*$^~+      (S lands)
Frame 5:  PEASA*$^~+
Frame 6:  PEASAN$^~+
Frame 7:  PEASANT^~+
Frame 8:  PEASANT ~+
Frame 9:  PEASANT  +
Frame 10: PEASANT           (complete)
```

**Implementation:**
- Each character slot has an independent timer
- Characters land left-to-right with ~50ms stagger
- Random pool: `!@#$%^&*()_+-=[]{}|;:,.<>?/~` + box-drawing chars
- 3-5 cycles of random chars per slot before landing
- Total duration per word: ~80ms × character count
- Use `requestAnimationFrame` for smooth cycling
- CSS `font-variant-numeric: tabular-nums` to prevent width jitter

**Where to use:**
- Hero "PEASANT" title (on page load)
- Section headers (on scroll-into-view)
- Stat numbers (morph from `000` to final value)
- Navigation items (on hover — quick 300ms morph)
- The wheat ASCII art assembling

#### B. Typewriter Effect

Characters appear one at a time with a blinking cursor, simulating someone typing in a terminal.

**Implementation:**
- Base speed: ~40ms per character (adjustable)
- Cursor: `█` block cursor, blinks at 530ms interval (`animation: blink 1.06s step-end infinite`)
- Variation: slightly randomized per-character delay (30-60ms) for realism
- Commands type faster than output (output can appear in chunks/lines)
- Green `$` prompt appears instantly, then command types
- After command "enters" (cursor moves to next line), output appears line-by-line with 150ms delay between lines

**Where to use:**
- Hero install command
- Terminal mockup demos (command input)
- Quotes and taglines
- Quick start section

#### C. Box-Drawing Animation

Box borders draw themselves on screen, tracing the path a hand would take drawing a rectangle.

```
Step 1: ┌─────────────────┐        (top edge, left to right)
Step 2: ┌─────────────────┐        (right edge, top to bottom)
        │                 │
        │                 │
Step 3: ┌─────────────────┐        (bottom edge, right to left)
        │                 │
        │                 │
        └─────────────────┘
Step 4: ┌─────────────────┐        (left edge, bottom to top — completes)
        │                 │
        │                 │
        └─────────────────┘
```

**Implementation:**
- Use `clip-path: inset()` animation or SVG `stroke-dashoffset`
- Duration: ~600ms for a standard card
- Content inside fades in 200ms after border completes
- For multiple boxes: stagger start by 150ms each

**Where to use:**
- Stat cards (Section 2)
- Feature terminal mockups (Section 4)
- Quote cards (Section 6)
- Any `<AsciiBox>` component appearing on scroll

#### D. Data Particle Flow

Small ASCII characters flow along paths between elements, representing data moving through the system.

**Particles:** `.` `·` `°` `•` `●` (size progression for depth)

**Implementation:**
- CSS `@keyframes` with `translateX` along a path
- Each particle has randomized `animation-duration` (2-4s) and `animation-delay`
- 10-20 particles active simultaneously
- Particles fade in at start, fade out at end (`opacity` keyframes)
- Use CSS `will-change: transform, opacity` for GPU acceleration
- For complex paths (curves): use SVG `<animateMotion>` along a `<path>`

**Where to use:**
- Pipeline section: grain flowing between stages
- Village section: data flowing from terminal to village
- Push feature: sessions traveling from local to remote
- Background ambient effect: very subtle particles drifting across the grid (like dust motes)

#### E. Grid Pulse / Ripple

The background grid subtly reacts to scroll position or interactions.

**Implementation:**
- On scroll: grid lines near the current viewport center brighten slightly (radial gradient mask over the grid pattern, position tracks scroll)
- On click/interaction: a ripple emanates from the click point — grid cells briefly brighten in an expanding circle, then fade back
- Very subtle — opacity change from 0.04 to 0.08 and back. The effect should be felt more than seen.
- Use CSS custom properties + `requestAnimationFrame` for scroll-linked grid position

**Where to use:**
- Entire page background (subtle, ambient)
- Hero section (more pronounced on load)
- Interactive demo section (responds to tab clicks)

#### F. ASCII Art Frame Animation

Pre-defined ASCII art frames played in sequence, like a flipbook.

```
Frame 1:     Frame 2:     Frame 3:
  \|/          \\|//        \\\|///
   |            ||            |||
   |            ||            |||
              /||\          /|||\
```

**Implementation:**
- Define frames as string arrays
- Cycle frames using `setInterval` (200-500ms per frame)
- Use `<pre>` with absolute positioning, swap `textContent`
- Keep frame count low (3-8 frames) for performance

**Where to use:**
- Wheat sway animation in hero (3 frames, loops)
- Village smoke (2-3 frames, loops)
- Loading states throughout the site

### Section-by-Section Animation Choreography

| Section | Trigger | Primary Animation | Duration | Secondary |
|---------|---------|-------------------|----------|-----------|
| Hero | Page load | ASCII morph "PEASANT" + wheat assembly | 4s | Typewriter install cmd, cursor blink |
| Perception Gap | Scroll 20vh | Typewriter quote + number morph (+20% → -19%) | 3s | Box-draw stat cards, counter rollup |
| Pipeline | Scroll 40vh | Sequential node activation + grain particle flow | 4s | Terminal mockup typewriter below |
| Features (x4) | Each at scroll | Terminal mockup types + row cascade | 2-3s each | Character morph for redaction, particle bridge for push |
| Village | Scroll 70vh | Village ASCII builds ground-up | 3s | Walking peasants, chimney smoke loops |
| Research | Scroll 80vh | Scroll-unroll cards + typewriter quotes | 2s | Hover lift on cards |
| Demo | Scroll 85vh | Tab switch triggers new terminal content | Instant | Asciinema/VHS playback on tui tab |
| Quick Start | Scroll 90vh | Typewriter types all 4 commands sequentially | 3s | Copy button pulse on complete |
| Footer | Scroll 95vh | Battlement border draws left-to-right | 1s | Links fade in below |

### Interaction Micro-Animations

| Element | Trigger | Effect | Duration |
|---------|---------|--------|----------|
| Nav links | Hover | ASCII morph on text (quick 300ms cycle) | 300ms |
| CTA buttons | Hover | Border weight increases 1px → 2px, text brightens | 150ms |
| Copy button | Click | Button text morphs: `copy` → `✓ copied` (stays 2s) | 200ms |
| Theme toggle | Click | Grid bg cross-fades, all colors transition | 400ms |
| Terminal tabs | Click | Old content slides out left, new slides in right | 300ms |
| Code blocks | Hover | Line numbers brighten, subtle left-border glow | 200ms |
| Sidebar links (docs) | Hover | `├─` prefix character cycles through `├` `┤` `┼` `├` | 200ms |
| External links | Hover | A small `↗` arrow morphs in at the end of the text | 200ms |
| Scroll indicator | Ambient | Bouncing `▼` at bottom of hero section | Loop 2s |

### Ambient / Looping Animations

These run continuously and give the page a sense of life:

1. **Cursor blink** — All terminal mockups have a blinking `█` cursor after their last line. CSS-only: `animation: blink 1.06s step-end infinite`

2. **Wheat sway** — The hero wheat ASCII art gently oscillates. CSS: `animation: sway 8s ease-in-out infinite`. Movement: `translateX(-1px)` ↔ `translateX(1px)` — almost imperceptible.

3. **Grid breath** — The grid background opacity subtly pulses on a very long cycle: `animation: breathe 20s ease-in-out infinite`. Opacity: `0.03` ↔ `0.06`. Should feel like the page is "alive."

4. **Chimney smoke** — In the Village ASCII art, small `·` particles drift upward from building tops. CSS: `animation: rise 3s ease-out infinite` with randomized delays. 3-5 particles, each offset.

5. **Scroll progress** — A thin `━` progress bar at the very top of the page, built with box-drawing characters, grows left-to-right as the user scrolls. Width tracks `scrollY / scrollHeight`.

### Performance Budget

| Animation Type | Max Simultaneous | Technique | FPS Target |
|----------------|------------------|-----------|------------|
| ASCII morph | 1 active | JS + rAF | 60fps |
| Typewriter | 1 active | JS + rAF | 60fps |
| Box-draw | 3 active | CSS clip-path | 60fps |
| Particle flow | 20 particles | CSS transforms | 60fps |
| Grid pulse | 1 (background) | CSS custom props | 30fps OK |
| Ambient loops | 5 max | CSS only | 60fps |

**Rules:**
- Only one "heavy" animation (morph or typewriter) runs at a time
- Animations off-screen are paused via Intersection Observer
- No JS-driven animation on mobile below 768px (CSS-only fallback)
- Total animation JS budget: < 5KB gzipped
- Use `will-change` sparingly — only on actively animating elements
- Clean up animation frames on unmount (no memory leaks)

### Motion Library Choices

| Need | Library | Size | Why |
|------|---------|------|-----|
| Scroll triggers | Framer Motion `useInView` | (already in bundle) | Robust Intersection Observer wrapper |
| Orchestration | Framer Motion `stagger` | (already in bundle) | Sequencing multiple animations |
| ASCII morph | Custom hook `useAsciiMorph` | ~1KB | No library does this — build it |
| Typewriter | Custom hook `useTypewriter` | ~0.5KB | Simple enough, avoid typed.js (5KB) |
| Particle flow | CSS `@keyframes` | 0KB JS | Pure CSS is sufficient |
| Grid pulse | CSS custom properties | 0KB JS | Scroll-linked via minimal JS |
| Canvas particles | Native Canvas API | 0KB dep | Only if CSS particles aren't enough |

---

## 8. Demo & Mockup Strategy (renumbered from 7)

### Technology Stack for Demos

| Demo Type              | Technology                         | When to Use                    |
|------------------------|------------------------------------|--------------------------------|
| Command output         | CSS/HTML terminal component        | Hero, features, quick start    |
| TUI interface          | VHS recording → WebM               | TUI feature showcase           |
| Interactive playback   | asciinema-player                   | Docs, detailed walkthroughs    |
| Dashboard preview      | Browser-frame screenshot component | Web dashboard feature          |
| Pipeline flow          | SVG + Framer Motion                | Pipeline visualization         |

### Demo Recordings to Create

1. **`peasant kickstart`** — VHS tape showing the setup wizard (10s)
2. **`peasant ingest`** — VHS tape showing session discovery + ingestion (8s)
3. **`peasant tui`** — VHS tape navigating the TUI: sessions list → detail → metrics (15s)
4. **`peasant push --dry-run`** — VHS tape showing push preview (8s)
5. **Web dashboard** — Screenshot with mock data via `--mock-data-store`

### VHS Tape Files

```tape
# demo-ingest.tape
Output demo-ingest.webm
Set FontFamily "Geist Mono"
Set FontSize 16
Set Width 960
Set Height 540
Set Theme "Catppuccin Mocha"

Type "peasant ingest --since 2w" Sleep 500ms Enter
Sleep 3s
```

### CSS Terminal Mockup Spec

All terminal mockups are React Server Components:
- No JavaScript shipped to client
- Real text (accessible, selectable, searchable)
- Syntax highlighting via Shiki (build-time)
- Typing animation is the only client-side JS (optional enhancement)

---

## 8. Documentation Structure

### Guide-Style Organization

```
/docs
├── index.mdx                    "Welcome to the Village"
│                                 Overview, philosophy, what peasant does
│
├── getting-started.mdx          "Your Apprenticeship"
│                                 Install → kickstart → first ingest → view results
│                                 5-minute path to value
│
├── core-concepts/
│   ├── index.mdx                "The Lay of the Land"
│   ├── architecture.mdx         How peasant is built (Go, SQLite, Next.js)
│   ├── ingest-pipeline.mdx      The 9-stage pipeline explained
│   ├── analytics-schema.mdx     BCNF schema, migrations, tables
│   └── village-protocol.mdx     How sharing/publishing works
│
├── guides/
│   ├── index.mdx                "Field Guides"
│   ├── installation.mdx         All install methods (go install, nix, brew, binary)
│   ├── configuration.mdx        config.yaml deep dive
│   ├── ingesting-sessions.mdx   Providers, flags, selection index
│   ├── exploring-metrics.mdx    TUI + web dashboard walkthrough
│   ├── redacting-transcripts.mdx Privacy, anonymization, redaction levels
│   ├── pushing-to-village.mdx   Sharing, visibility, dry-run
│   └── creating-collectives.mdx Guilds, licenses, access levels
│
├── cli-reference/
│   ├── index.mdx                "The Peasant's Almanac"
│   ├── ingest.mdx               man-page style: SYNOPSIS, DESCRIPTION, OPTIONS, EXAMPLES
│   ├── push.mdx
│   ├── tui.mdx
│   ├── web.mdx
│   ├── sessions.mdx
│   ├── models.mdx
│   ├── kickstart.mdx
│   └── version.mdx
│
└── configuration.mdx            "Your Charter"
                                  Full config reference with defaults
```

### MDX Frontmatter Format

```mdx
---
title: "Ingesting Sessions"
description: "How to reap your harvests from Claude Code, OpenCode, and other providers"
section: "Field Guides"
order: 3
---
```

### Custom MDX Components Available

| Component          | Use                                    |
|--------------------|----------------------------------------|
| `<Callout>`        | Info/warn/error boxes in terminal style |
| `<Steps>`          | Numbered step-by-step instructions     |
| `<FileTree>`       | Directory structure display            |
| `<TerminalWindow>` | Command examples with chrome           |
| `<Tabs>`           | Switch between code examples           |
| `<Badge>`          | Version, status, provider badges       |

---

## 9. Technical Architecture

### Stack

```
Next.js (App Router)
├── @next/mdx           MDX processing
├── Geist Mono           Typography (built-in)
├── Tailwind CSS 4       Styling
├── Shiki                Syntax highlighting (build-time)
├── Framer Motion        Scroll animations, pipeline viz
├── MiniSearch           Client-side docs search
└── asciinema-player     Terminal recording playback
```

### Package Dependencies

```bash
# MDX
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx

# Remark/Rehype plugins
npm install remark-gfm remark-frontmatter remark-mdx-frontmatter
npm install rehype-slug rehype-autolink-headings rehype-pretty-code

# Utilities
npm install shiki gray-matter minisearch

# Animation
npm install framer-motion

# Docs search
npm install minisearch

# Terminal playback (optional, for TUI demos)
npm install asciinema-player
```

### File Structure

```
peasant-lp/
├── app/
│   ├── layout.tsx                 Root layout
│   ├── page.tsx                   Landing page
│   ├── globals.css                Global styles + grid bg + theme
│   └── docs/
│       ├── layout.tsx             Docs layout (sidebar + TOC)
│       └── [[...slug]]/
│           └── page.tsx           Catch-all docs route
│
├── content/
│   ├── docs/                      MDX source files
│   │   ├── index.mdx
│   │   ├── getting-started.mdx
│   │   ├── core-concepts/
│   │   ├── guides/
│   │   ├── cli-reference/
│   │   └── configuration.mdx
│   └── _nav.ts                    Navigation manifest
│
├── components/
│   ├── landing/
│   │   ├── hero.tsx               Hero section
│   │   ├── perception-gap.tsx     METR study section
│   │   ├── pipeline.tsx           Pipeline visualization
│   │   ├── features.tsx           Feature showcase
│   │   ├── village.tsx            Village/commons section
│   │   ├── research.tsx           Research quotes
│   │   ├── demo.tsx               Interactive demo
│   │   └── quickstart.tsx         Quick start section
│   ├── ui/
│   │   ├── terminal-window.tsx    Terminal chrome component
│   │   ├── ascii-box.tsx          Box-drawing container
│   │   ├── stat-card.tsx          Metric display card
│   │   ├── pipeline-node.tsx      Pipeline stage node
│   │   ├── typing-animation.tsx   Typewriter effect (client)
│   │   ├── theme-toggle.tsx       Light/dark switch (client)
│   │   └── copy-button.tsx        Copy to clipboard (client)
│   ├── docs/
│   │   ├── sidebar.tsx            Navigation sidebar
│   │   ├── toc.tsx                Table of contents
│   │   ├── prev-next.tsx          Previous/Next links
│   │   ├── search.tsx             Search dialog (client)
│   │   └── mobile-nav.tsx         Mobile navigation
│   └── mdx/
│       ├── callout.tsx            Terminal-style callout
│       ├── code-block.tsx         Code block wrapper
│       ├── steps.tsx              Step-by-step component
│       ├── file-tree.tsx          File tree display
│       ├── tabs.tsx               Tab switcher
│       └── badge.tsx              Status/version badge
│
├── lib/
│   ├── docs.ts                    getAllDocs(), getDocBySlug()
│   ├── search-index.ts            Build-time search index
│   └── toc.ts                     TOC extractor
│
├── public/
│   ├── demos/                     VHS recordings, asciinema casts
│   └── og/                        OG image assets
│
├── mdx-components.tsx             MDX component overrides
├── next.config.ts                 MDX + plugin config
└── tailwind.config.ts             Theme, colors, fonts
```

### Key Configuration

**`next.config.ts`:**
- `@next/mdx` with remark-gfm, remark-frontmatter, remark-mdx-frontmatter
- `rehype-slug`, `rehype-autolink-headings`, `rehype-pretty-code`
- Shiki theme: `vitesse-dark` (terminal-like, muted)
- `pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx']`

**Syntax highlighting theme:** `vitesse-dark` for dark mode, `vitesse-light` for light mode. Both feel terminal-native with muted, earthy tones.

### Performance Targets

| Metric              | Target    |
|----------------------|-----------|
| Lighthouse (perf)    | > 95      |
| First Contentful Paint | < 1.2s   |
| Largest Contentful Paint | < 2.5s |
| Total Blocking Time  | < 200ms   |
| CLS                  | < 0.1     |
| Bundle size (JS)     | < 100KB   |

### Server Component Strategy

- **Server Components** (zero JS): All landing page sections, all MDX content, terminal mockups, ASCII art, navigation
- **Client Components** (minimal JS): Theme toggle, typing animation, search dialog, copy button, asciinema player, tab switcher
- **Build-time**: Figlet ASCII text generation, Shiki syntax highlighting, search index, OG images

---

## 10. Messaging & Copy Strategy

### Primary Value Propositions

**For individual developers:**
> "You think AI makes you faster. Peasant shows you the truth — and how to actually improve."

**For teams:**
> "Your team runs hundreds of AI coding sessions a week. Without Peasant, those insights evaporate. With it, every session makes the next one better."

**For the community:**
> "491 shared trajectories improved a coding agent by 20x. The Village turns individual harvests into collective intelligence."

### Key Data Points for Messaging

| Stat                                              | Source          | Use In             |
|---------------------------------------------------|-----------------|--------------------|
| Devs think +20% faster, actually 19% slower       | METR '25        | Hero / problem     |
| Token costs vary 10x between similar tasks        | OpenReview '25  | Analytics value    |
| 491 trajectories → 20x agent improvement          | SWE-Gym/ADP     | Village value      |
| AI: +21% tasks, +91% review time, +9% bugs       | Faros AI '25    | Productivity paradox |
| Failed sessions are longer and more repetitive    | ICSE '26        | Pattern detection  |
| 84% of devs using or planning to use AI tools     | SO Survey '25   | Market size        |

### Tagline Options

1. `tend your harvests. share your yields.` (recommended — warm, communal)
2. `honest tools for honest work.` (secondary — values-driven)
3. `the commons for AI coding intelligence.` (Village-focused)
4. `reap what you code.` (punchy, action-oriented)

### CTA Copy

| Location       | Primary CTA              | Secondary CTA          |
|----------------|--------------------------|------------------------|
| Hero           | `$ go install peasant`   | `View on GitHub →`     |
| Features       | `Read the field guide →` | —                      |
| Village        | `Enter the Village →`    | `Start locally first →`|
| Quick Start    | `Read the full guide →`  | `Star on GitHub ☆`    |
| Docs           | `peasant kickstart →`    | —                      |

---

## 11. Competitive Positioning

### Landscape

| Tool                    | What It Does                                                        | Gap Peasant Fills                             |
|-------------------------|---------------------------------------------------------------------|-----------------------------------------------|
| **Motif CLI**           | CLI + TUI for real-time AI coding metrics (AIPM, concurrency). Closest competitor. Claude Code + Cursor. | No community sharing, no web dashboard, no Village, limited provider support |
| **SpecStory**           | VS Code extension auto-saving AI convos as Markdown. Cloud sync + search. 3K+ active devs. | IDE-only (no CLI/TUI), no community discovery, no token/cost analytics |
| **claude-code-transcripts** | Python CLI converting Claude sessions to static HTML. By Simon Willison. | No analytics, no redaction, no community, Claude-only |
| **Claudebin**           | Export Claude Code sessions as shareable URLs. Pastebin for sessions. | No analytics, no anonymization, no community browsing, Claude-only |
| **AgentLore**           | Team-level AI conversation search via ClickHouse. Claude, Cursor, Copilot. | Enterprise-heavy (requires ClickHouse), no TUI, no public community, no personal analytics |
| **WakaTime**            | Time-tracking SaaS with AI coding plugins. Tracks time + lines, not conversation quality. | No transcript viewing, no conversation analysis, SaaS/cloud-only, no community |
| **Claude `/insights`**  | Built-in HTML report analyzing last 30 days of local sessions. | Individual-only, no sharing, no cross-tool, static HTML output |
| **Claude Analytics API**| Org-level admin API for session/token/cost metrics. | Admin-only, no individual access, no TUI, no community, Claude-only |
| **PaperclipAI**         | AI agent orchestration tool — NOT a transcript analyzer. Not a competitor. | — |
| **MiroFish**            | Swarm intelligence engine — NOT a transcript analyzer. Not a competitor. | — |

### Competitive Matrix

| Capability              | Peasant | Motif CLI | SpecStory | claude-code-transcripts | Claudebin | AgentLore | WakaTime |
|-------------------------|---------|-----------|-----------|-------------------------|-----------|-----------|----------|
| Multi-tool ingestion    | **Yes** | Partial   | Yes       | No                      | No        | Yes       | Partial  |
| TUI dashboard           | **Yes** | **Yes**   | No        | No                      | No        | No        | No       |
| Web dashboard           | **Yes** | No        | Cloud     | No                      | Viewer    | Web UI    | **Yes**  |
| Local-first analytics   | **Yes** | **Yes**   | No        | No                      | No        | No        | No       |
| Community sharing       | **Yes** | No        | No        | No                      | Links only| Team only | No       |
| Anonymization/redaction | **Yes** | No        | No        | No                      | No        | Masking   | N/A      |
| Transcript deep-dive    | **Yes** | Yes       | Yes       | **Yes**                 | **Yes**   | Yes       | No       |
| Cost/token tracking     | **Yes** | Partial   | No        | No                      | No        | No        | Partial  |
| CLI-first               | **Yes** | **Yes**   | No        | **Yes**                 | Plugin    | No        | No       |
| Open source             | **Yes** | **Yes**   | Partial   | **Yes**                 | **Yes**   | **Yes**   | No       |

### Peasant's Differentiators

1. **The only "full stack"** — Ingest + analyze + redact + share, in one tool. Every competitor does 1-2 of these.
2. **Multi-provider** — Claude Code (JSONL), OpenCode (JSON). Codex & Gemini reserved in schema. Not locked to one ecosystem.
3. **Local-first** — SQLite database on your machine. Your data stays local until YOU choose to share.
4. **TUI + Web** — `peasant tui` (Bubbletea) or `peasant web start` (Next.js). Meet devs where they are.
5. **The Village** — The only platform for communal, anonymized AI transcript sharing. No competitor has this.
6. **Collectives with governance** — Not just sharing; structured collectives with configurable license types and access levels (invite-only, open).
7. **Research-backed metrics** — 16 computed metrics per session informed by real academic research (METR, Faros AI, ICSE trajectory studies), not vanity stats.
8. **Open source, fully free** — MIT licensed. No vendor lock-in. No freemium. No SaaS tax.

---

## 12. Design References & Inspiration

### Tier S — Primary Design Direction

| Site                          | What to Study                                              |
|-------------------------------|-----------------------------------------------------------|
| **Textual / Textualize** (textualize.io) | **TOP REFERENCE.** SVG-rendered terminal output, live TUI apps running in browser via iframe, widget showcase gallery. The gold standard for bringing real TUI experiences to the web. Study their `textual-web` approach and how they present the "Built with Textual" showcase. |
| **The Monospace Web** (owickstrom.github.io) | Pure character-grid perfection. `ch` units, Catppuccin, box-drawing diagrams. Our north star for grid fidelity and the monospace-only constraint. |
| **Vercel Geist Font** (vercel.com/font) | Typography specimen, Swiss grid, systematic sizing. Reference for how to present a type system with precision and restraint. Black/white, tight grid. |
| **Atuin** (atuin.sh) | CRT retro aesthetic: scanlines, green terminal glow, floating animated elements, blinking cursors, simulated terminal UI. Reference for our animation system. |

### Tier A — Reference for Specific Elements

| Site                    | Reference For                                       |
|-------------------------|-----------------------------------------------------|
| **Linear.app**          | Animation & interaction quality, sizing/hierarchy, keyboard-first UX, buttery scroll animations. NOT for monospace styling — for motion design and spatial relationships only. |
| **WebTUI** (webtui.ironclad.sh) | CSS framework for TUI components. Study the box-drawing border approach and theme plugin system (Catppuccin, Nord). Reference for component structure. |
| **terminal.shop**       | TUI-first commercial product. Dark aesthetic, cult community energy. Reference for brand voice and how a TUI tool can feel premium and desirable. |

### Tier B — Stylistic References

| Reference               | Borrow From                        |
|--------------------------|-------------------------------------|
| Catppuccin theme         | Color palette for light/dark modes  |
| Swiss typography movement | Grid rigidity, asymmetric balance  |
| Dwarf Fortress / Banished | Deep thematic metaphor in tools   |
| Docker                   | Consistent metaphor (containers)   |

---

## 13. Implementation Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Set up Next.js + MDX configuration
- [ ] Install all dependencies
- [ ] Create design tokens (CSS custom properties for colors, spacing, typography)
- [ ] Build grid background CSS
- [ ] Implement Geist Mono typography system
- [ ] Create light/dark theme with "Night Watch" / "Parchment" palettes
- [ ] Build `<TerminalWindow>` component
- [ ] Build `<AsciiBox>` component
- [ ] Set up Shiki for syntax highlighting with `vitesse-dark`/`vitesse-light`

### Phase 2: Landing Page (Week 2)

- [ ] Hero section with ASCII wheat art + typing animation
- [ ] Perception Gap section with animated stat counters
- [ ] Pipeline visualization (SVG + scroll animation)
- [ ] Feature showcase sections (4 features with terminal mockups)
- [ ] Village section with ASCII village art
- [ ] Research quotes grid
- [ ] Quick Start section
- [ ] Footer
- [ ] Mobile responsiveness for all sections

### Phase 3: Documentation (Week 3)

- [ ] Docs layout (sidebar + content + TOC)
- [ ] MDX custom components (Callout, Steps, FileTree, Tabs, Badge)
- [ ] `content/_nav.ts` navigation manifest
- [ ] Write core docs content:
  - [ ] Getting Started
  - [ ] Core Concepts (4 pages)
  - [ ] Field Guides (7 pages)
  - [ ] CLI Reference (8 pages)
  - [ ] Configuration
- [ ] Client-side search with MiniSearch
- [ ] Previous/Next navigation
- [ ] Mobile docs navigation

### Phase 4: Demos & Polish (Week 4)

- [ ] Record VHS tapes for all 5 demos
- [ ] Build interactive tabbed demo section
- [ ] Generate OG images for all pages
- [ ] Accessibility audit (screen reader, keyboard nav, reduced motion)
- [ ] Performance optimization (Lighthouse > 95)
- [ ] SEO metadata for all pages
- [ ] Final cross-browser testing
- [ ] Deploy

### Phase 5: Post-Launch

- [ ] Analytics integration
- [ ] Community feedback collection
- [ ] Iterate on docs based on user questions
- [ ] Add more VHS demo recordings as features ship

---

## Appendix A: ASCII Art Assets to Create

| Asset                | Use                    | Size       |
|----------------------|------------------------|------------|
| Wheat sheaf          | Hero, favicon, brand   | Large + sm |
| Village silhouette   | Village section         | Full-width |
| Peasant with sickle  | About / brand          | Medium     |
| Crossed tools        | Favicon                | Tiny       |
| Castle/keep          | Village platform       | Medium     |
| Shield/heraldry      | Badges, trust signals  | Small      |
| Scroll ends          | Callouts, quotes       | Decorative |
| Battlement border    | Section dividers       | Repeating  |
| Figlet "PEASANT"     | Hero headline          | Display    |

## Appendix B: Figlet Font Recommendations

For the hero ASCII text, test these figlet fonts:

| Font        | Character         | Best For         |
|-------------|-------------------|------------------|
| `standard`  | Clean, readable   | General headers  |
| `banner3`   | Large, blocky     | Hero display     |
| `small`     | Compact           | Sub-headers      |
| `gothic`    | Medieval feel     | Brand/thematic   |
| `roman`     | Classical         | Formal sections  |
| `doom`      | Heavy, dark       | Impact moments   |

## Appendix C: Key Research Sources

| Study / Source                                      | Year | Key Finding                                              |
|-----------------------------------------------------|------|----------------------------------------------------------|
| METR Developer Productivity RCT                     | 2025 | +20% perceived speed, -19% actual speed                  |
| Faros AI Productivity Paradox                       | 2025 | +21% tasks, +91% review time, +9% bugs                   |
| Agent Data Protocol (ADP)                           | 2025 | 1.3M unified trajectories, 2.2% → 40.3% accuracy        |
| SWE-Gym                                             | 2025 | 491 trajectories → substantial model improvement         |
| Token Consumption Patterns (OpenReview)              | 2025 | 10x variance, input tokens dominate cost                 |
| Understanding Code Agent Behaviour (ICSE '26)        | 2025 | Failed trajectories longer, higher variance              |
| Thought-Action-Result Trajectories                   | 2025 | Success = balanced cycles; failure = repetitive loops    |
| Google Provably Private Insights                     | 2025 | Differential privacy + TEEs for AI usage analytics       |
| WildChat                                             | 2024 | 1M+ anonymized conversations, privacy-preserving        |
| GitHub Copilot Productivity (CACM)                   | 2024 | 30% acceptance rate, 88% code retention                  |
