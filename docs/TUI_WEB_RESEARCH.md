# TUI-in-Browser: Comprehensive Technical Research

Research for building an ASCII-art styled landing page with Terminal User Interface aesthetics.

**Stack context**: Next.js 16, React 19, Tailwind CSS 4, TypeScript.

---

## 1. Monospace Fonts: Selection & Loading

### Recommended Font Stack

```css
/* Primary recommendation for this project */
font-family: 'Geist Mono', 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono',
             'SF Mono', 'Cascadia Code', 'Consolas', 'Liberation Mono',
             'Courier New', monospace;
```

**Top picks ranked by suitability for TUI web landing pages:**

| Font | Why | Ligatures | Weights | License |
|------|-----|-----------|---------|---------|
| **Geist Mono** | Already bundled in Next.js via `next/font`. Swiss-design clarity. 9 weights from Thin to Ultra Black. | Yes (`font-feature-settings`) | 9 | SIL OFL |
| **JetBrains Mono** | Optimized for screen readability. Clear 0/O and 1/l distinction. Generous spacing reduces eye strain. | Yes (200+ ligatures) | 8 | SIL OFL |
| **Berkeley Mono** | Premium terminal aesthetic. Tight character metrics. Distinctive personality. | Yes | 4 | Commercial |
| **Fira Code** | Excellent ligatures for code display. Well-tested in terminals. | Yes (rich set) | 5 | SIL OFL |
| **IBM Plex Mono** | Corporate-grade quality. Very clean at small sizes. Good international support. | No | 7 | SIL OFL |
| **Commit Mono** | Neutral design. Optimized for legibility. Smart kerning. | No | 2 | SIL OFL |
| **Int10h Oldschool PC Fonts** | Pixel-perfect DOS/BIOS font recreations. 200+ character sets. Authentic retro look. | No | 1 | CC BY-SA 4.0 |

### Font Loading Strategy for Next.js

```tsx
// app/layout.tsx — using next/font (zero layout shift)
import { Geist_Mono } from 'next/font/google';

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap', // show fallback immediately, swap when loaded
});

export default function RootLayout({ children }) {
  return (
    <html className={mono.variable}>
      <body className="font-mono">{children}</body>
    </html>
  );
}
```

**Performance rules:**
- Use `font-display: swap` for body text, `optional` for decorative ASCII headers
- Prefer WOFF2 format (30% smaller than WOFF)
- Subset fonts to Latin + Box Drawing (U+2500-257F) + Block Elements (U+2580-259F)
- Self-host via `next/font` for zero external requests
- Use `<link rel="preconnect">` if loading from Google Fonts

### The `ch` Unit: The Key to Character Grids

In monospace fonts, `1ch` equals exactly the width of the `0` character, which equals the width of *every* character. This is the foundation of character-cell layouts:

```css
.terminal {
  /* Every character occupies exactly 1ch x 1lh */
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;  /* 1lh = 14px * 1.5 = 21px */
  letter-spacing: 0; /* critical: no extra spacing */
}
```

---

## 2. CSS Character-Cell Grid System

### The Foundational Grid

```css
/* A true 80x24 terminal grid */
.terminal-grid {
  display: grid;
  grid-template-columns: repeat(80, 1ch);
  grid-template-rows: repeat(24, 1lh);
  gap: 0;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
}

/* Place content at specific character positions */
.cell {
  grid-column: 5 / 45;  /* columns 5 through 44 */
  grid-row: 3 / 5;      /* rows 3 and 4 */
  white-space: pre;      /* preserve all whitespace */
}
```

### Responsive Terminal Grid

Since fixed 80-column grids break on mobile, use a responsive approach:

```css
.terminal-responsive {
  --cols: 80;
  --char-w: 1ch;

  display: grid;
  grid-template-columns: repeat(var(--cols), var(--char-w));
  width: min(calc(var(--cols) * var(--char-w)), 100vw);
  overflow-x: auto;

  /* Scale down on small screens */
  @media (max-width: 768px) {
    --cols: 40;
    font-size: 12px;
  }

  @media (max-width: 480px) {
    --cols: 30;
    font-size: 11px;
  }
}
```

**Alternative: font-size scaling approach**
```css
.terminal-scale {
  /* Scale the font so 80 chars fit the viewport */
  font-size: clamp(8px, calc(100vw / 82), 16px);
  /* 82 = 80 chars + 2ch padding */
}
```

### Named Grid Areas for TUI Layout

```css
.tui-layout {
  display: grid;
  grid-template-columns: repeat(80, 1ch);
  grid-template-rows:
    [title-bar] 1lh
    [menu-bar] 1lh
    [content-start] 1fr [content-end]
    [status-bar] 1lh;
  grid-template-areas:
    "title   title   title"
    "menu    menu    menu"
    "sidebar content content"
    "status  status  status";
}
```

---

## 3. Box-Drawing Characters Reference

### Single Line (Light)
```
┌─────────────────────┐
│  Content area       │
├─────────┬───────────┤
│  Left   │  Right    │
└─────────┴───────────┘
```

**Core set:**
| Char | Code | Name |
|------|------|------|
| `─` | U+2500 | Light Horizontal |
| `│` | U+2502 | Light Vertical |
| `┌` | U+250C | Light Down and Right |
| `┐` | U+2510 | Light Down and Left |
| `└` | U+2514 | Light Up and Right |
| `┘` | U+2518 | Light Up and Left |
| `├` | U+251C | Light Vertical and Right |
| `┤` | U+2524 | Light Vertical and Left |
| `┬` | U+252C | Light Down and Horizontal |
| `┴` | U+2534 | Light Up and Horizontal |
| `┼` | U+253C | Light Vertical and Horizontal |

### Double Line
```
╔═════════════════════╗
║  Content area       ║
╠═════════╦═══════════╣
║  Left   ║  Right    ║
╚═════════╩═══════════╝
```

| Char | Code | Name |
|------|------|------|
| `═` | U+2550 | Double Horizontal |
| `║` | U+2551 | Double Vertical |
| `╔` | U+2554 | Double Down and Right |
| `╗` | U+2557 | Double Down and Left |
| `╚` | U+255A | Double Up and Right |
| `╝` | U+255D | Double Up and Left |
| `╠` | U+2560 | Double Vertical and Right |
| `╣` | U+2563 | Double Vertical and Left |
| `╦` | U+2556 | Double Down and Horizontal |
| `╩` | U+2569 | Double Up and Horizontal |
| `╬` | U+256C | Double Vertical and Horizontal |

### Rounded Corners (Arc)
```
╭─────────────────────╮
│  Softer aesthetic   │
╰─────────────────────╯
```

| Char | Code | Name |
|------|------|------|
| `╭` | U+256D | Light Arc Down and Right |
| `╮` | U+256E | Light Arc Down and Left |
| `╯` | U+256F | Light Arc Up and Left |
| `╰` | U+2570 | Light Arc Up and Right |

### Block Elements
| Char | Code | Name | Use |
|------|------|------|-----|
| `█` | U+2588 | Full Block | Progress bars, fills |
| `▓` | U+2593 | Dark Shade | 75% fill |
| `▒` | U+2592 | Medium Shade | 50% fill |
| `░` | U+2591 | Light Shade | 25% fill |
| `▀` | U+2580 | Upper Half Block | Pixel art (top) |
| `▄` | U+2584 | Lower Half Block | Pixel art (bottom) |
| `▌` | U+258C | Left Half Block | Pixel art (left) |
| `▐` | U+2590 | Right Half Block | Pixel art (right) |

### Practical: Building a React Box Component

```tsx
interface BoxProps {
  width: number;
  title?: string;
  style?: 'single' | 'double' | 'rounded' | 'heavy';
  children: string;
}

const BORDERS = {
  single:  { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double:  { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  heavy:   { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
};

function AsciiBox({ width, title, style = 'single', children }: BoxProps) {
  const b = BORDERS[style];
  const inner = width - 2;

  const top = title
    ? `${b.tl}${b.h} ${title} ${b.h.repeat(inner - title.length - 3)}${b.tr}`
    : `${b.tl}${b.h.repeat(inner)}${b.tr}`;

  const bottom = `${b.bl}${b.h.repeat(inner)}${b.br}`;

  const lines = children.split('\n').map(line => {
    const padded = line.padEnd(inner);
    return `${b.v}${padded}${b.v}`;
  });

  return (
    <pre role="img" aria-label={title || 'decorative box'}>
      {[top, ...lines, bottom].join('\n')}
    </pre>
  );
}
```

### Progress Bars with Block Elements

```tsx
function AsciiProgress({ value, width = 40, label }: {
  value: number; width?: number; label?: string
}) {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;

  // Option A: Block fills
  const bar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;

  // Option B: Gradient fills
  const gradient = (v: number) => {
    if (v > 75) return '█';
    if (v > 50) return '▓';
    if (v > 25) return '▒';
    return '░';
  };

  return (
    <pre aria-label={`${label}: ${value}%`} role="progressbar"
         aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      {label && `${label}: `}{bar} {value}%
    </pre>
  );
}
```

---

## 4. Grid Pattern Backgrounds

### CSS-Only Dot Grid

```css
.dot-grid {
  background-image: radial-gradient(
    circle,
    var(--grid-dot-color, rgba(128, 128, 128, 0.15)) 1px,
    transparent 1px
  );
  background-size: 1ch 1lh; /* aligns to character grid */
}

/* Dark mode */
[data-theme="dark"] .dot-grid {
  --grid-dot-color: rgba(255, 255, 255, 0.06);
}

/* Light mode */
[data-theme="light"] .dot-grid {
  --grid-dot-color: rgba(0, 0, 0, 0.06);
}
```

### CSS-Only Line Grid

```css
.line-grid {
  background-image:
    linear-gradient(
      to right,
      var(--grid-line-color, rgba(128, 128, 128, 0.08)) 1px,
      transparent 1px
    ),
    linear-gradient(
      to bottom,
      var(--grid-line-color, rgba(128, 128, 128, 0.08)) 1px,
      transparent 1px
    );
  background-size: 1ch 1lh; /* character-cell aligned */
}
```

### CSS-Only Crosshair Grid (intersection dots)

```css
.crosshair-grid {
  background-image:
    radial-gradient(circle, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to right, var(--grid-color) 0.5px, transparent 0.5px),
    linear-gradient(to bottom, var(--grid-color) 0.5px, transparent 0.5px);
  background-size: 1ch 1lh;
}
```

### SVG Grid Pattern (more control, crisper at all scales)

```tsx
function GridPatternSVG({ cellW = 8.4, cellH = 21 }: { cellW?: number; cellH?: number }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <defs>
        <pattern id="char-grid" width={cellW} height={cellH} patternUnits="userSpaceOnUse">
          <circle cx={cellW / 2} cy={cellH / 2} r="0.5" fill="currentColor" opacity="0.1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#char-grid)" />
    </svg>
  );
}
```

### CSS Paint API (Houdini) for Custom Grid Backgrounds

```js
// grid-worklet.js
class GridPainter {
  static get inputProperties() {
    return ['--grid-size', '--grid-color', '--grid-opacity'];
  }

  paint(ctx, geom, props) {
    const size = parseInt(props.get('--grid-size')) || 10;
    const color = props.get('--grid-color').toString().trim() || '#888';
    const opacity = parseFloat(props.get('--grid-opacity')) || 0.1;

    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    for (let x = 0; x < geom.width; x += size) {
      for (let y = 0; y < geom.height; y += size) {
        ctx.beginPath();
        ctx.arc(x, y, 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

registerPaint('grid', GridPainter);
```

```css
.houdini-grid {
  --grid-size: 16;
  --grid-color: #888;
  --grid-opacity: 0.08;
  background: paint(grid);
}
```

Note: CSS Paint API has limited browser support. Use `@supports (background: paint(id))` for progressive enhancement, with a CSS fallback (radial-gradient approach).

---

## 5. Terminal Color Themes for Web

### Recommended Palettes

#### Custom TUI Light/Dark (recommended for landing page)

```css
:root {
  /* Dark mode — inspired by terminal phosphor aesthetics */
  --bg-primary: #0a0e14;       /* deep dark, not pure black */
  --bg-secondary: #111820;     /* slightly lighter panels */
  --bg-elevated: #1a2030;      /* cards, modals */
  --fg-primary: #c5cdd9;       /* main text, slight warmth */
  --fg-secondary: #8b95a5;     /* dimmed text, comments */
  --fg-muted: #4a5568;         /* very dim, decorative */
  --accent-primary: #6bc5a0;   /* green — success, primary action */
  --accent-secondary: #e0af68; /* amber — warnings, highlights */
  --accent-tertiary: #7aa2f7;  /* blue — links, info */
  --border: #1e2a3a;           /* subtle borders */
  --cursor: #c5cdd9;           /* cursor/caret */

  /* Grid overlay */
  --grid-dot: rgba(197, 205, 217, 0.04);
}

[data-theme="light"] {
  --bg-primary: #faf8f5;       /* warm cream, not pure white */
  --bg-secondary: #f0ece6;     /* slightly darker panels */
  --bg-elevated: #ffffff;      /* cards */
  --fg-primary: #2c363f;       /* dark text, not pure black */
  --fg-secondary: #6b7b8d;     /* dimmed */
  --fg-muted: #b0bac5;         /* decorative */
  --accent-primary: #2d7d5f;   /* forest green */
  --accent-secondary: #b57614; /* warm amber */
  --accent-tertiary: #2563eb;  /* blue */
  --border: #e0dbd2;           /* warm border */
  --cursor: #2c363f;

  --grid-dot: rgba(44, 54, 63, 0.04);
}
```

#### Catppuccin Mocha (dark) + Latte (light)

```css
:root[data-theme="catppuccin-dark"] {
  --bg: #1e1e2e;  --fg: #cdd6f4;
  --red: #f38ba8;     --green: #a6e3a1;
  --yellow: #f9e2af;  --blue: #89b4fa;
  --mauve: #cba6f7;   --teal: #94e2d5;
  --surface0: #313244; --surface1: #45475a;
  --overlay0: #6c7086;
}
:root[data-theme="catppuccin-light"] {
  --bg: #eff1f5;  --fg: #4c4f69;
  --red: #d20f39;     --green: #40a02b;
  --yellow: #df8e1d;  --blue: #1e66f5;
  --mauve: #8839ef;   --teal: #179299;
  --surface0: #ccd0da; --surface1: #bcc0cc;
  --overlay0: #9ca0b0;
}
```

#### Tokyo Night Storm

```css
:root[data-theme="tokyo-night"] {
  --bg: #24283b;         --bg-dark: #1f2335;
  --fg: #c0caf5;         --comment: #565f89;
  --red: #f7768e;        --green: #9ece6a;
  --yellow: #e0af68;     --blue: #7aa2f7;
  --magenta: #bb9af7;    --cyan: #7dcfff;
  --orange: #ff9e64;     --teal: #1abc9c;
  --selection: #2e3c64;
}
```

#### Dracula

```css
:root[data-theme="dracula"] {
  --bg: #282a36;         --current-line: #44475a;
  --fg: #f8f8f2;         --comment: #6272a4;
  --red: #ff5555;        --green: #50fa7b;
  --yellow: #f1fa8c;     --blue: #8be9fd;
  --purple: #bd93f9;     --pink: #ff79c6;
  --orange: #ffb86c;
}
```

#### Gruvbox

```css
:root[data-theme="gruvbox-dark"] {
  --bg: #282828;  --bg-hard: #1d2021;  --bg-soft: #32302f;
  --fg: #ebdbb2;  --gray: #928374;
  --red: #fb4934;     --green: #b8bb26;
  --yellow: #fabd2f;  --blue: #83a598;
  --purple: #d3869b;  --aqua: #8ec07c;
  --orange: #fe8019;
}
:root[data-theme="gruvbox-light"] {
  --bg: #fbf1c7;  --bg-hard: #f9f5d7;  --bg-soft: #f2e5bc;
  --fg: #3c3836;  --gray: #928374;
  --red: #9d0006;     --green: #79740e;
  --yellow: #b57614;  --blue: #076678;
  --purple: #8f3f71;  --aqua: #427b58;
  --orange: #af3a03;
}
```

#### Solarized

```css
:root[data-theme="solarized-dark"] {
  --bg: #002b36;       --bg-highlight: #073642;
  --fg: #839496;       --fg-emphasis: #93a1a1;
  --yellow: #b58900;   --orange: #cb4b16;
  --red: #dc322f;      --magenta: #d33682;
  --violet: #6c71c4;   --blue: #268bd2;
  --cyan: #2aa198;     --green: #859900;
}
:root[data-theme="solarized-light"] {
  --bg: #fdf6e3;       --bg-highlight: #eee8d5;
  --fg: #657b83;       --fg-emphasis: #586e75;
  /* accent colors remain the same */
}
```

### Classic Terminal Phosphor Colors

For an authentic retro feel:

```css
/* Green phosphor (P1) */
--terminal-green: #33ff33;
--terminal-green-dim: #0a3a0a;

/* Amber phosphor (P3) */
--terminal-amber: #ffb000;
--terminal-amber-dim: #3a2800;

/* Blue/white phosphor */
--terminal-blue: #aaccff;
--terminal-blue-dim: #0a1a2a;
```

---

## 6. Animations & Interactions

### Blinking Cursor

```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.cursor {
  display: inline-block;
  width: 1ch;
  height: 1lh;
  background: var(--cursor);
  animation: blink 1s step-end infinite;
}

/* Block cursor */
.cursor-block { width: 1ch; background: var(--fg-primary); }
/* Underline cursor */
.cursor-underline { width: 1ch; height: 2px; align-self: end; }
/* Beam cursor */
.cursor-beam { width: 2px; }
```

### Typing Animation (Pure CSS)

```css
/* Works for single-line text with known character count */
@keyframes typing {
  from { width: 0; }
  to { width: 32ch; } /* exactly N characters */
}

.typing-line {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid var(--cursor);
  animation:
    typing 2s steps(32) forwards,
    blink 0.8s step-end infinite;
  width: 0;
}
```

### Scanline Effect

```css
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    rgba(0, 0, 0, 0.03) 1px,
    rgba(0, 0, 0, 0.03) 2px
  );
  pointer-events: none;
  z-index: 10;
}

/* Animated moving scanline */
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

.scanline-sweep::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    transparent,
    rgba(255, 255, 255, 0.03),
    transparent
  );
  animation: scanline 8s linear infinite;
  pointer-events: none;
}
```

### CRT Screen Effects

```css
.crt-screen {
  /* Slight curvature */
  border-radius: 12px;

  /* Phosphor glow */
  box-shadow:
    inset 0 0 60px rgba(0, 255, 0, 0.05),
    0 0 20px rgba(0, 255, 0, 0.02);

  /* Subtle vignette */
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 0, 0, 0.3) 100%
  );

  /* Screen flicker (very subtle) */
  animation: flicker 0.15s infinite alternate;
}

@keyframes flicker {
  0% { opacity: 0.97; }
  100% { opacity: 1; }
}
```

### Text Reveal / Scroll-Triggered ASCII Animation

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';

function useInView(ref: React.RefObject<HTMLElement>, threshold = 0.3) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return isInView;
}

function AsciiReveal({ art, speed = 20 }: { art: string; speed?: number }) {
  const ref = useRef<HTMLPreElement>(null);
  const isInView = useInView(ref);
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const totalChars = art.length;
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setVisibleChars(current);
      if (current >= totalChars) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [isInView, art, speed]);

  const displayed = art.slice(0, visibleChars);
  const hidden = art.slice(visibleChars).replace(/[^\n]/g, ' ');

  return (
    <pre ref={ref} role="img" aria-label="ASCII art animation">
      <span>{displayed}</span>
      <span className="invisible">{hidden}</span>
    </pre>
  );
}
```

### Matrix Rain (Tasteful Version)

```tsx
'use client';
import { useEffect, useRef } from 'react';

function MatrixRain({ opacity = 0.04 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = '01アイウエオカキクケコ░▒▓│─┌┐└┘';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = `rgba(0, 0, 0, 0.05)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = `rgba(100, 200, 140, ${opacity})`;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, [opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
```

### ASCII Art Frame-by-Frame Animation

```tsx
const FRAMES = [
  `  ╭──╮
  │  │
  ╰──╯`,
  `  ╭───╮
  │   │
  ╰───╯`,
  `  ╭────╮
  │    │
  ╰────╯`,
];

function AsciiAnimation({ frames = FRAMES, fps = 4 }: {
  frames?: string[]; fps?: number
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [frames, fps]);

  return <pre aria-hidden="true">{frames[frame]}</pre>;
}
```

---

## 7. JavaScript/React Libraries

### Tier 1: Strongly Recommended

| Library | Purpose | Size | Notes |
|---------|---------|------|-------|
| **figlet** (via `figlet.js`) | Generate ASCII text art headers | ~2KB + fonts | 300+ fonts. Use `textSync()` at build time to avoid shipping fonts to client. |
| **Typed.js** | Typing animations | ~5KB | Mature, configurable. Supports pause (`^1000`), smart backspace, HTML content, cursor customization, React hooks pattern. |
| **Motion** (Framer Motion) | Scroll-triggered reveals, staggered text animation | ~16KB (tree-shaken) | Spring physics, `whileInView`, layout animations. Best for orchestrating complex sequences. |

### Tier 2: Worth Considering

| Library | Purpose | Size | Notes |
|---------|---------|------|-------|
| **ascii-morph** | Morph between ASCII art shapes | ~3KB | Crush-and-reconstruct animation. Deconstructs one shape, reconstructs another with random glyphs as intermediate. Works with arrays of strings. |
| **@xterm/xterm** | Full terminal emulator | ~200KB | Overkill for a landing page. Use only if you need a real interactive terminal. Supports WebGL rendering, ANSI colors, addons. Powers VS Code's terminal. |
| **terminal-in-react** | React terminal component | ~25KB | Good for interactive "try our CLI" demos. Supports custom commands, history, tab completion, plugins. |
| **asciinema-player** | Play terminal recordings | ~50KB | Renders `.cast` files. Built with JS+Rust (WASM). Supports true color, copy-paste from playback. Great for demo videos without actual video. |
| **anime.js** | Character-level staggered animations | ~10KB | `stagger(65, { from: 'center' })` for cascading text reveals. Lightweight and precise. |

### Tier 3: Niche / Special Purpose

| Library | Purpose | Notes |
|---------|---------|-------|
| **ansilove.js** | Render ANSI art in browser | Canvas-based. Supports legacy BBS art formats. Animate at baud rate. |
| **drawille** (concept) | Pixel graphics via braille characters | Each braille char = 4x2 pixel grid. For ultra-compact data visualization. Port concept to JS. |
| **Ink** (Sindre Sorhus) | React renderer for terminals | Not for browser use, but its Flexbox-in-terminal model inspires the reverse: terminal-in-browser layouts. |

### Build-Time ASCII Art Generation with Figlet

```tsx
// lib/ascii-art.ts — run at build time
import figlet from 'figlet';
import standard from 'figlet/fonts/Standard';
import slant from 'figlet/fonts/Slant';

figlet.parseFont('Standard', standard);
figlet.parseFont('Slant', slant);

export function generateAsciiHeader(text: string, font = 'Standard'): string {
  return figlet.textSync(text, {
    font,
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
  });
}

// Use in a Server Component:
// const header = generateAsciiHeader('PEASANT');
```

**Best FIGlet fonts for landing page headers:**
- `Standard` — clean, readable default
- `Slant` — modern angled look
- `ANSI Shadow` — chunky with shadow depth
- `Big` — large, impactful
- `Colossal` — maximum visual weight
- `Banner3` — thick block letters
- `Small` — compact, for subheadings
- `Digital` — tech/terminal feel

### Typed.js in React

```tsx
'use client';
import { useEffect, useRef } from 'react';
import Typed from 'typed.js';

function TerminalTyper({ strings }: { strings: string[] }) {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const typed = new Typed(el.current!, {
      strings,
      typeSpeed: 40,
      backSpeed: 25,
      backDelay: 1500,
      startDelay: 500,
      showCursor: true,
      cursorChar: '█',
      loop: true,
      smartBackspace: true,
    });
    return () => typed.destroy();
  }, [strings]);

  return (
    <div className="font-mono">
      <span className="text-[--accent-primary]">$ </span>
      <span ref={el} />
    </div>
  );
}
```

---

## 8. TUI Layout Patterns (from Lip Gloss / Bubbletea / Rich)

### Patterns from Terminal UI Frameworks

These TUI frameworks reveal the most common and effective layout patterns:

**1. Bordered Panels with Titles**
```
┌─ System Info ──────────────────────────┐
│ OS: Linux 6.1                          │
│ Uptime: 3d 14h 22m                    │
│ Load: 0.42 0.38 0.35                  │
└────────────────────────────────────────┘
```

**2. Status Bar (top/bottom fixed)**
```
╔══ PEASANT v1.0 ═════════════════════ 12:34 ═══╗
```

**3. Split Panes**
```
┌─ Sessions ──────┬─ Details ────────────────┐
│ > Session #1    │ Model: Claude Opus       │
│   Session #2    │ Tokens: 14,302           │
│   Session #3    │ Duration: 12m 34s        │
│                 │ Tools: 23 calls          │
└─────────────────┴──────────────────────────┘
```

**4. Selection Lists (Bubbletea pattern)**
```
  Use arrows to move, enter to select

  > ● Dashboard
    ○ Sessions
    ○ Trends
    ○ Settings
```

**5. Table with Column Alignment**
```
┌──────────┬──────────┬─────────┬───────┐
│ Session  │ Model    │ Tokens  │ Cost  │
├──────────┼──────────┼─────────┼───────┤
│ abc123   │ Opus     │ 14,302  │ $0.42 │
│ def456   │ Sonnet   │  8,119  │ $0.12 │
│ ghi789   │ Haiku    │  2,451  │ $0.01 │
└──────────┴──────────┴─────────┴───────┘
```

**6. Key/Value Pairs (common in TUI dashboards)**
```
  Sessions ····················· 1,247
  Total Tokens ·············· 2.4M
  Avg Duration ··············· 8m 32s
  Acceptance Rate ·············· 94%
```

**7. Horizontal Rule / Section Divider**
```
────────── Recent Activity ──────────
═══════════════════════════════════════
─── ✦ ─── ✦ ─── ✦ ─── ✦ ─── ✦ ───
```

### Border Style Constants (matching Lip Gloss)

```ts
export const BORDER_STYLES = {
  normal:  { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│', cross: '┼', tee_r: '├', tee_l: '┤', tee_d: '┬', tee_u: '┴' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│', cross: '┼', tee_r: '├', tee_l: '┤', tee_d: '┬', tee_u: '┴' },
  thick:   { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃', cross: '╋', tee_r: '┣', tee_l: '┫', tee_d: '┳', tee_u: '┻' },
  double:  { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', cross: '╬', tee_r: '╠', tee_l: '╣', tee_d: '╦', tee_u: '╩' },
} as const;
```

---

## 9. Accessibility

### ASCII Art Accessibility

Screen readers read ASCII art character-by-character, producing gibberish. Always wrap ASCII art:

```html
<!-- Correct: screen reader announces "Peasant logo" -->
<div role="img" aria-label="Peasant logo">
  <pre aria-hidden="true">
    ╔═══════════════════╗
    ║   P E A S A N T   ║
    ╚═══════════════════╝
  </pre>
</div>

<!-- For decorative ASCII that conveys no information -->
<pre aria-hidden="true">
  ░░░░░░░░░░░░░░░░░░░
</pre>
```

### Rules

1. **Every meaningful ASCII art** must have `role="img"` + `aria-label` on a container, with `aria-hidden="true"` on the `<pre>` child
2. **Decorative ASCII** (borders, dividers, background patterns) gets `aria-hidden="true"` directly
3. **Progress bars** should use `role="progressbar"` + `aria-valuenow`
4. **Typing animations** should have the full text available to screen readers (not hidden behind the animation)
5. **Animated backgrounds** (matrix rain, scanlines) must be `aria-hidden="true"` and `pointer-events: none`
6. **Respect `prefers-reduced-motion`**: disable typing animations, scanlines, flicker effects

```css
@media (prefers-reduced-motion: reduce) {
  .cursor { animation: none; opacity: 1; }
  .typing-line { width: auto; animation: none; }
  .scanlines::after { display: none; }
  .crt-screen { animation: none; }
}
```

---

## 10. Performance Considerations

### Rendering Large Monospace Text

- **Avoid DOM nodes per character.** Render entire lines as `<pre>` or `<span>` elements, not individual `<span>` per character. A 80x24 grid = 1,920 characters. Per-character spans = 1,920 DOM nodes. One `<pre>` = 1 DOM node.
- **Use `white-space: pre` or `<pre>` tags** to preserve spacing without non-breaking spaces.
- **Virtualize long terminal output.** If displaying hundreds of lines, use windowing (only render visible rows). Libraries: `react-window`, `@tanstack/virtual`.
- **Canvas for heavy animation.** Matrix rain, particle effects, and real-time ASCII rendering should use `<canvas>`, not DOM manipulation.
- **`will-change: transform`** on animated elements for GPU compositing.
- **`transform` and `opacity` are cheap to animate.** Avoid animating `width`, `height`, `left`, `top` which trigger layout recalculation.
- **`requestAnimationFrame`** for JS animations, not `setInterval`.

### Font Loading Performance

```html
<!-- Preload critical mono font -->
<link rel="preload" href="/fonts/geist-mono.woff2" as="font" type="font/woff2" crossorigin />
```

```css
/* Critical: prevent layout shift */
@font-face {
  font-family: 'GeistMono';
  src: url('/fonts/geist-mono.woff2') format('woff2');
  font-display: swap;
  unicode-range: U+0000-007F, U+2500-257F, U+2580-259F;
  /* Only load ASCII + box drawing + block elements */
}
```

### Bundle Size Awareness

When using figlet for ASCII headers, generate at **build time** (in Server Components or `getStaticProps`) and ship the result as static strings. Do not bundle figlet fonts in the client JavaScript.

---

## 11. Existing Examples & Inspiration

### Open-Source Terminal-Themed Websites

| Project | Tech Stack | Key Techniques | Stars |
|---------|------------|----------------|-------|
| **satnaing/terminal-portfolio** | React, TypeScript, Styled-Components | 6 themes, autocomplete, PWA, command history | 748 |
| **nasan016/webshell** | TypeScript, Vite | Config-driven ASCII headers, color themes, auto-complete | 363 |
| **Cveinnt/LiveTerm** | Next.js, TypeScript, Tailwind | Single config.json, theme switcher, Docker support | ~500 |
| **Kielx/terminal-portfolio** | Gatsby, WinBox.js | Draggable terminal windows, markdown content | 148 |
| **Termfolio** | Rust + WASM | Terminal in WebAssembly | 17 |

### Key Design Patterns Observed

1. **Prompt simulation**: `user@host:~$ ` prefix on every input line
2. **Command-response format**: User types command, output appears below
3. **ASCII art logos**: Large FIGlet headers on initial load
4. **Help command**: `help` or `?` lists available "commands" (really navigation)
5. **Theme switching**: `theme <name>` command to cycle color schemes
6. **Easter eggs**: Hidden commands that show ASCII art or animations
7. **Loading spinners**: `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` braille spinner characters

### Braille Spinner Animation

```tsx
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function Spinner({ label = 'Loading' }: { label?: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <span role="status" aria-label={label}>
      <span aria-hidden="true">{SPINNER_FRAMES[frame]}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
```

---

## 12. Putting It All Together: Architecture Recommendations

### Recommended Approach for Peasant Landing Page

```
app/
├── layout.tsx              # Geist Mono font, theme provider, grid bg
├── page.tsx                # Server Component: static ASCII art, content
├── globals.css             # Theme variables, grid patterns, animations
└── components/
    ├── ascii-header.tsx    # Server Component: figlet-generated header
    ├── ascii-box.tsx       # Server Component: box-drawing wrapper
    ├── terminal-typer.tsx  # Client Component: typing animation
    ├── ascii-reveal.tsx    # Client Component: scroll-triggered reveal
    ├── grid-background.tsx # Client Component: dot grid overlay
    ├── scanlines.tsx       # Client Component: CRT overlay
    └── theme-toggle.tsx    # Client Component: light/dark switcher
```

### Design Principles

1. **Server-first rendering.** ASCII art headers, box layouts, and static content are Server Components (zero JS shipped). Only typing animations and scroll-triggered effects need `'use client'`.

2. **Build-time ASCII generation.** Run figlet at build time. Ship the resulting strings, not the font files.

3. **CSS-first animations.** Blinking cursor, scanlines, and simple reveals use CSS `@keyframes`. Reserve JavaScript for complex interactions (typing, morphing).

4. **Character grid as design system.** Every spacing value is a multiple of `1ch` (horizontal) or `1lh` (vertical). Padding: `2ch`. Margins: `4ch`. This keeps everything on the invisible character grid.

5. **Progressive enhancement.** The page should be fully readable with CSS disabled (monospace text is inherently structured). Animations are layered on top.

6. **Respect user preferences.** `prefers-reduced-motion` disables all animations. `prefers-color-scheme` sets the initial theme. Both can be overridden by the user.

### Core CSS Foundation

```css
/* globals.css */
@import 'tailwindcss';

:root {
  /* Character grid metrics */
  --char-w: 1ch;
  --line-h: 1.6;
  --font-size: 14px;

  /* Theme colors (dark default) */
  --bg: #0a0e14;
  --fg: #c5cdd9;
  --fg-dim: #4a5568;
  --accent: #6bc5a0;
  --accent-2: #e0af68;
  --accent-3: #7aa2f7;
  --border: #1e2a3a;
  --grid-dot: rgba(197, 205, 217, 0.04);
}

[data-theme="light"] {
  --bg: #faf8f5;
  --fg: #2c363f;
  --fg-dim: #b0bac5;
  --accent: #2d7d5f;
  --accent-2: #b57614;
  --accent-3: #2563eb;
  --border: #e0dbd2;
  --grid-dot: rgba(44, 54, 63, 0.04);
}

html {
  font-family: var(--font-mono);
  font-size: var(--font-size);
  line-height: var(--line-h);
  background: var(--bg);
  color: var(--fg);
}

/* Character-aligned grid background */
body {
  background-image: radial-gradient(
    circle,
    var(--grid-dot) 1px,
    transparent 1px
  );
  background-size: var(--char-w) calc(var(--font-size) * var(--line-h));
}

/* Utility: pre-formatted text */
.ascii {
  white-space: pre;
  font-variant-ligatures: none; /* disable ligatures in ASCII art */
  -webkit-font-smoothing: none; /* sharper rendering */
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Summary: Recommended Library Stack

| Need | Library | Rationale |
|------|---------|-----------|
| ASCII text headers | `figlet` (build-time) | 300+ fonts, zero client-side cost |
| Typing animations | `typed.js` | Mature, small, configurable |
| Scroll animations | `motion` (Framer Motion) | Best React integration, `whileInView` |
| Grid background | Pure CSS (radial-gradient) | Zero dependencies, `1ch` x `1lh` aligned |
| Box-drawing layouts | Custom React components | Tiny, no library needed |
| Terminal embed | `@xterm/xterm` | Only if interactive terminal is needed |
| Terminal recording | `asciinema-player` | Only if demo playback is needed |
| Color theme system | CSS custom properties | Framework-agnostic, instant switching |
| Font | `next/font` + Geist Mono | Zero-config with Next.js, no layout shift |
