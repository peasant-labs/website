"use client";

import { useRef, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────

interface TrailParticle {
  x: number;
  y: number;
  char: string;
  opacity: number;
  life: number;
  maxLife: number;
  shuffleTimer: number;
}

interface SmokeCloud {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: 0 | 1 | 2; // 0=small 5x3, 1=medium 9x4, 2=large 13x5
  life: number;
  maxLife: number;
  startY: number;
}

interface Peasant {
  x: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  baseSpeed: number;
  type: "walker" | "talker" | "child" | "musician" | "marketBuyer";
  frame: number;
  state: number;
  stateTimer: number;
  partnerX?: number;
  speechBubble: string;
  speechTimer: number;
  stopped: boolean;
  stopTimer: number;
  fleeing: boolean;
  fleeTimer: number;
  grabbed: boolean;
  grabOffsetX: number;
  grabOffsetY: number;
  falling: boolean;
  fallVelocity: number;
  resumeTimer: number;
}

interface Bird {
  x: number;
  y: number;
  speed: number;
  frame: number;
  formation: boolean;
  formationOffset: number;
}

interface Paraglider {
  x: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  frame: number;
  vy: number;
}

interface WindowState {
  on: boolean;
  nextToggle: number;
  hasCat: boolean;
}

// ─── Building Templates ─────────────────────────────────────────────

interface BuildingDef {
  w: number;
  h: number;
  type: "house" | "church" | "guildhall" | "tower" | "tavern" | "market" | "house2" | "house3";
  layer: 0 | 1 | 2;
  chimneyPos: number; // offset from left edge
  windowRows: number;
  windowsPerRow: number;
  hasSign?: string;
  hasCross?: boolean;
  hasFlag?: boolean;
}

// ─── Building ASCII Art Templates ────────────────────────────────────

const COTTAGE_1: string[] = [
  "         /\\         ",
  "        /  \\        ",
  "       /    \\       ",
  "      /      \\      ",
  "     / ~~~~~~ \\     ",
  "    / ~~~~~~~~ \\    ",
  "   /~~~~~~~~~~~~\\   ",
  "   |            |   ",
  "   |  []    []  |   ",
  "   |            |   ",
  "   |  []    []  |   ",
  "   |            |   ",
  "   |     __     |   ",
  "   |    |  |    |   ",
  "   |    |  |    |   ",
  "   |____|  |____|   ",
];

const COTTAGE_2: string[] = [
  "          _/\\_          ",
  "         / ~~ \\         ",
  "        / ~~~~ \\        ",
  "       / ~~~~~~ \\       ",
  "      / ~~~~~~~~ \\      ",
  "     /~~~~~~~~~~~~\\     ",
  "    /~~~~~~~~~~~~~~\\    ",
  "    |              |    ",
  "    |  []      []  |    ",
  "    |              |    ",
  "    |  []      []  |    ",
  "    |              |    ",
  "    |   |      |   |    ",
  "    |   |      |   |    ",
  "    |___|______|___|    ",
];

const CHURCH: string[] = [
  "                +                ",
  "               /|\\               ",
  "              / | \\              ",
  "             /  |  \\             ",
  "            /   |   \\            ",
  "           /    |    \\           ",
  "          /     |     \\          ",
  "         /      |      \\         ",
  "        /       |       \\        ",
  "       /________|________\\       ",
  "       |                 |       ",
  "       |    _________    |       ",
  "       |   |         |   |       ",
  "       |   |         |   |       ",
  "       |   |         |   |       ",
  "       |   |         |   |       ",
  "       |   |_________|   |       ",
  "       |                 |       ",
  "       |  []         []  |       ",
  "       |                 |       ",
  "       |    _________    |       ",
  "       |   (         )   |       ",
  "       |    (       )    |       ",
  "       |     (     )     |       ",
  "       |      (   )      |       ",
  "       |       ( )       |       ",
  "       |_________________|       ",
  "       |   /         \\   |       ",
  "       |  /           \\  |       ",
  "       | /             \\ |       ",
];

const TAVERN: string[] = [
  "             ___/\\___             ",
  "           /::::::::::\\           ",
  "          /::::::::::::\\          ",
  "         /::::::::::::::\\         ",
  "        /::::::::::::::::\\        ",
  "       /::::::::::::::::::\\       ",
  "      /____________________\\      ",
  "      |                    |      ",
  "      |  []      |    []   |      ",
  "      |          |         |      ",
  "      |  []      |    []   |      ",
  "      |          |         |      ",
  "      |  []      |    []   |      ",
  "      |          |         |      ",
  "      |     [        ]     |      ",
  "      |     |        |     |      ",
  "      |     |        |     |      ",
  "      |_____|        |_____|      ",
];

const TOWN_HALL: string[] = [
  "   _|_|_|_|_|_|_|_|_|_|_|_|_|_|   ",
  "  |                            |  ",
  "  |                            |  ",
  "  |  []       [####]       []  |  ",
  "  |                            |  ",
  "  |  []                    []  |  ",
  "  |                            |  ",
  "  |  []                    []  |  ",
  "  |                            |  ",
  "  |  []       [####]       []  |  ",
  "  |                            |  ",
  "  |         /========\\         |  ",
  "  |       ||  ||  ||  ||       |  ",
  "  |       ||  ||  ||  ||       |  ",
  "  |       ||  ||  ||  ||       |  ",
  "  |       ||  ||  ||  ||       |  ",
  "  |_______||__||__||__||_______|  ",
];

const TOWER: string[] = [
  "        _       ",
  "       |>|      ",
  "      /  \\      ",
  "     /    \\     ",
  "    /      \\    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    | []   |    ",
  "    |      |    ",
  "    |  /\\  |    ",
  "    |_|  |_|    ",
];

// Template width lookup (source of truth for building widths)
function maxLineWidth(lines: string[]): number {
  let max = 0;
  for (const l of lines) if (l.length > max) max = l.length;
  return max;
}

const TEMPLATE_WIDTH: Record<string, number> = {
  house: maxLineWidth(COTTAGE_1),
  house3: maxLineWidth(COTTAGE_1),
  house2: maxLineWidth(COTTAGE_2),
  church: maxLineWidth(CHURCH),
  tavern: maxLineWidth(TAVERN),
  guildhall: maxLineWidth(TOWN_HALL),
  tower: maxLineWidth(TOWER),
  market: maxLineWidth(COTTAGE_1), // market uses cottage template as fallback
};

// Chimney column offset per template (relative to building x)
const CHIMNEY_OFFSET: Record<string, number> = {
  house: 12,
  house3: 12,
  house2: 14,
  church: 16,
  tavern: 17,
  guildhall: 16,
  tower: 7,
  market: 12,
};

// ─── Constants ───────────────────────────────────────────────────────

const COLORS = {
  buildingWall: "#3e3e42",
  roof: "#5c5850",
  windowLit: "#d4a843",
  windowDark: "#1c1c1f",
  smoke: "#5c5850",
  peasant: "#9b9689",
  bird: "#5c5850",
  trail: "#d4a843",
  paragliderCanopy: "#d4a843",
  speechBubble: "#6b8aad",
  door: "#2a2a2e",
  flag: "#d4a843",
  stoneTexture: "#4a4a4e",
  stoneDark: "#333336",
};

const TRAIL_CHARS = ["*", "\u00B7", "\u00B0", "+", "\u00D7", "\u2591", "\u2592", "\u2593"];
const BIRD_FRAMES = ["~", "^", "~", "v"];
const SHUFFLE_CHARS = [
  "*", "#", "@", "%", "&", "!", "?", "+", "=", "~",
  "\u2591", "\u2592", "\u2593", "\u2588", "\u00B7", "\u00B0",
];

const TRAIL_MAX_LIFE = 1500;
const TRAIL_SPAWN_THROTTLE = 50;
const FLEE_RADIUS = 60;
const GRAB_RADIUS = 120;
const SHUFFLE_RADIUS = 80;
const SHUFFLE_DECAY = 800;

// ─── Component ───────────────────────────────────────────────────────

export function AsciiVillage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dpr = window.devicePixelRatio || 1;

    // ── Mutable state ──
    const S = {
      charW: 0,
      charH: 0,
      cols: 0,
      rows: 0,
      canvasW: 0,
      canvasH: 0,
      frame: 0,
      prevTimestamp: 0,
      animId: 0,
      lastTrailSpawn: 0,
      lastTrailSpawnX: -9999,
      lastTrailSpawnY: -9999,
      windDirection: 0.5,
      windTarget: 0.5,
      windChangeTimer: 0,

      trailParticles: [] as TrailParticle[],
      smokeClouds: [] as SmokeCloud[],
      smokeTimers: [] as number[], // per-chimney spawn timers
      talkParticles: [] as { x: number; y: number; char: string; opacity: number; life: number; vy: number; vx: number; shuffleTimer: number }[],

      peasants: [] as Peasant[],
      birds: [] as Bird[],
      paragliders: [] as Paraglider[],

      // Building layout computed on resize
      buildingLayout: [] as {
        def: BuildingDef;
        x: number;        // col position
        baseRow: number;   // bottom row
        topRow: number;    // top of roof
        chimneyCol: number;
        chimneyRow: number;
        windows: WindowState[][];
      }[],

      // Mouse
      mouseX: -9999,
      mouseY: -9999,
      mouseActive: false,
      mouseDown: false,
      grabbedPeasantIdx: -1,

      shuffleMap: new Map<string, { original: string; originalColor: string; timer: number; shuffled: string }>(),
      gridChars: [] as { char: string; color: string; col: number; row: number }[],

      stars: [] as { col: number; row: number; twinkleOffset: number }[],

      flagFrame: 0,
      initialized: false,
      paused: false,
    };

    const fontSize = window.innerWidth < 640 ? 10 : 13;

    // ── Draw helpers ──
    function drawChar(
      char: string,
      gridCol: number,
      gridRow: number,
      color: string,
      opacity = 1
    ) {
      if (opacity <= 0 || gridRow < 0) return;
      ctx!.globalAlpha = opacity;
      ctx!.fillStyle = color;
      ctx!.fillText(char, gridCol * S.charW, gridRow * S.charH);
    }

    function drawCharPx(
      char: string,
      px: number,
      py: number,
      color: string,
      opacity = 1
    ) {
      if (opacity <= 0) return;
      ctx!.globalAlpha = opacity;
      ctx!.fillStyle = color;
      ctx!.fillText(char, px, py);
    }

    function registerChar(
      char: string,
      col: number,
      row: number,
      color: string
    ) {
      S.gridChars.push({ char, color, col, row });
    }

    function drawAndRegister(
      char: string,
      col: number,
      row: number,
      color: string,
      opacity = 1
    ) {
      if (char === " " || row < 0) return;
      drawChar(char, col, row, color, opacity);
    }

    function drawStr(
      str: string,
      startCol: number,
      row: number,
      color: string,
      opacity = 1,
      register = true
    ) {
      for (let i = 0; i < str.length; i++) {
        if (str[i] !== " ") {
          if (register) {
            drawAndRegister(str[i], startCol + i, row, color, opacity);
          } else {
            drawChar(str[i], startCol + i, row, color, opacity);
          }
        }
      }
    }

    // ── Generate building strip for a layer ──
    // Returns array of BuildingDef that tile across the full width with NO gaps
    function generateBuildingStrip(layer: 0 | 1 | 2): BuildingDef[] {
      const templates: BuildingDef[][] = [
        // Layer 0 (far): small buildings
        [
          { w: 8, h: 5, type: "house", layer: 0, chimneyPos: 2, windowRows: 2, windowsPerRow: 1 },
          { w: 10, h: 6, type: "house2", layer: 0, chimneyPos: 3, windowRows: 2, windowsPerRow: 2 },
          { w: 7, h: 4, type: "house3", layer: 0, chimneyPos: 2, windowRows: 1, windowsPerRow: 1 },
          { w: 12, h: 7, type: "church", layer: 0, chimneyPos: 5, windowRows: 3, windowsPerRow: 2, hasCross: true },
          { w: 9, h: 5, type: "house", layer: 0, chimneyPos: 3, windowRows: 2, windowsPerRow: 1 },
        ],
        // Layer 1 (mid): medium buildings
        [
          { w: 12, h: 7, type: "house", layer: 1, chimneyPos: 3, windowRows: 3, windowsPerRow: 2 },
          { w: 15, h: 8, type: "tavern", layer: 1, chimneyPos: 4, windowRows: 3, windowsPerRow: 3 },
          { w: 10, h: 6, type: "house2", layer: 1, chimneyPos: 3, windowRows: 2, windowsPerRow: 2 },
          { w: 14, h: 9, type: "church", layer: 1, chimneyPos: 5, windowRows: 4, windowsPerRow: 2, hasCross: true },
          { w: 11, h: 7, type: "house3", layer: 1, chimneyPos: 4, windowRows: 3, windowsPerRow: 2 },
          { w: 8, h: 5, type: "tower", layer: 1, chimneyPos: 3, windowRows: 3, windowsPerRow: 1, hasFlag: true },
        ],
        // Layer 2 (foreground): template-based buildings
        [
          { w: TEMPLATE_WIDTH.house, h: COTTAGE_1.length, type: "house", layer: 2, chimneyPos: CHIMNEY_OFFSET.house, windowRows: 0, windowsPerRow: 0 },
          { w: TEMPLATE_WIDTH.guildhall, h: TOWN_HALL.length, type: "guildhall", layer: 2, chimneyPos: CHIMNEY_OFFSET.guildhall, windowRows: 0, windowsPerRow: 0, hasFlag: true },
          { w: TEMPLATE_WIDTH.church, h: CHURCH.length, type: "church", layer: 2, chimneyPos: CHIMNEY_OFFSET.church, windowRows: 0, windowsPerRow: 0, hasCross: true },
          { w: TEMPLATE_WIDTH.tower, h: TOWER.length, type: "tower", layer: 2, chimneyPos: CHIMNEY_OFFSET.tower, windowRows: 0, windowsPerRow: 0, hasFlag: true },
          { w: TEMPLATE_WIDTH.tavern, h: TAVERN.length, type: "tavern", layer: 2, chimneyPos: CHIMNEY_OFFSET.tavern, windowRows: 0, windowsPerRow: 0 },
          { w: TEMPLATE_WIDTH.house2, h: COTTAGE_2.length, type: "house2", layer: 2, chimneyPos: CHIMNEY_OFFSET.house2, windowRows: 0, windowsPerRow: 0 },
          { w: TEMPLATE_WIDTH.house3, h: COTTAGE_1.length, type: "house3", layer: 2, chimneyPos: CHIMNEY_OFFSET.house3, windowRows: 0, windowsPerRow: 0 },
        ],
      ];

      const pool = templates[layer];
      const result: BuildingDef[] = [];
      let totalW = 0;

      // Fill until we exceed canvas width + some margin
      const targetW = S.cols + 10;
      let idx = Math.floor(Math.random() * pool.length);
      while (totalW < targetW) {
        const tmpl = pool[idx % pool.length];
        result.push({ ...tmpl });
        totalW += tmpl.w;
        idx++;
      }
      return result;
    }

    // ── Compute building layout ──
    function computeBuildingLayout() {
      S.buildingLayout = [];
      S.smokeTimers = [];

      const layerConfigs = [
        { layer: 2 as const, baseRowOffset: 1.0 },
      ];

      for (const lc of layerConfigs) {
        const strip = generateBuildingStrip(lc.layer);
        let curX = -2; // start slightly off-screen left

        const baseRow = lc.layer === 2
          ? S.rows - 1
          : Math.floor(S.rows * lc.baseRowOffset);

        for (const def of strip) {
          // Select template to count windows
          let template: string[];
          switch (def.type) {
            case "church": template = CHURCH; break;
            case "guildhall": template = TOWN_HALL; break;
            case "tower": template = TOWER; break;
            case "tavern": template = TAVERN; break;
            case "house2": template = COTTAGE_2; break;
            default: template = COTTAGE_1; break;
          }

          const totalH = template.length;
          const topRow = baseRow - totalH + 1;

          const chimneyCol = curX + (CHIMNEY_OFFSET[def.type] ?? def.chimneyPos);
          const chimneyRow = topRow - 1;

          // Generate window states by counting [] pairs in the template
          const windows: WindowState[][] = [];
          for (let r = 0; r < template.length; r++) {
            const rowWindows: WindowState[] = [];
            const line = template[r];
            for (let c = 0; c < line.length - 1; c++) {
              if (line[c] === "[" && line[c + 1] === "]") {
                rowWindows.push({
                  on: Math.random() > 0.3,
                  nextToggle: 3000 + Math.random() * 12000,
                  hasCat: Math.random() > 0.85,
                });
              }
            }
            if (rowWindows.length > 0) {
              windows.push(rowWindows);
            }
          }

          S.buildingLayout.push({
            def,
            x: curX,
            baseRow,
            topRow,
            chimneyCol,
            chimneyRow,
            windows,
          });

          S.smokeTimers.push(Math.random() * 3000);

          curX += def.w + 1 + Math.floor(Math.random() * 4);
        }
      }
    }

    // ── Init simulation ──
    function initSimulation() {
      computeBuildingLayout();

      const groundRow = S.rows - 1;

      // ── Walkers (5)
      S.peasants = [];
      const walkerConfigs = [
        { xFrac: 0.15, dir: 1, speed: 0.014 },
        { xFrac: 0.52, dir: -1, speed: 0.016 },
        { xFrac: 0.82, dir: 1, speed: 0.015 },
      ];
      for (const wc of walkerConfigs) {
        S.peasants.push({
          x: Math.floor(S.cols * wc.xFrac),
          y: groundRow,
          dir: wc.dir as 1 | -1,
          speed: wc.speed,
          baseSpeed: wc.speed,
          type: "walker",
          frame: Math.random() * 100,
          state: 0,
          stateTimer: 3000 + Math.random() * 5000,
          speechBubble: "",
          speechTimer: 0,
          stopped: false,
          stopTimer: 0,
          fleeing: false,
          fleeTimer: 0,
          grabbed: false,
          grabOffsetX: 0,
          grabOffsetY: 0,
          falling: false,
          fallVelocity: 0,
          resumeTimer: 0,
        });
      }

      // ── Talking pairs (2 pairs)
      const talkerPositions = [0.18, 0.70];
      for (const xf of talkerPositions) {
        const baseX = Math.floor(S.cols * xf);
        S.peasants.push({
          x: baseX,
          y: groundRow,
          dir: 1,
          speed: 0,
          baseSpeed: 0,
          type: "talker",
          frame: Math.random() * 100,
          state: 0,
          stateTimer: 1000 + Math.random() * 2000,
          partnerX: baseX + 10,
          speechBubble: "",
          speechTimer: 0,
          stopped: false,
          stopTimer: 0,
          fleeing: false,
          fleeTimer: 0,
          grabbed: false,
          grabOffsetX: 0,
          grabOffsetY: 0,
          falling: false,
          fallVelocity: 0,
          resumeTimer: 0,
        });
      }

      // Children, musician, and market buyer removed for simplicity

      // ── Birds (4) — fewer, fly lower (below stars/clouds)
      S.birds = [];
      for (let i = 0; i < 2; i++) {
        S.birds.push({
          x: Math.random() * S.cols * 0.4,
          y: Math.floor(S.rows * 0.3) + Math.random() * Math.floor(S.rows * 0.15),
          speed: 0.005,
          frame: Math.random() * 4,
          formation: true,
          formationOffset: i * 3,
        });
      }
      for (let i = 0; i < 2; i++) {
        S.birds.push({
          x: Math.random() * S.cols,
          y: Math.floor(S.rows * 0.35) + Math.random() * Math.floor(S.rows * 0.2),
          speed: 0.003 + Math.random() * 0.004,
          frame: Math.random() * 4,
          formation: false,
          formationOffset: 0,
        });
      }

      // ── Paraglider (1)
      S.paragliders = [
        {
          x: -20,
          y: Math.floor(S.rows * 0.08),
          dir: 1,
          speed: 0.008,
          frame: 0,
          vy: 0.0008,
        },
      ];

      S.smokeClouds = [];
      S.trailParticles = [];
      S.talkParticles = [];
      S.windDirection = 0.5;
      S.windTarget = 0.5;
      S.windChangeTimer = 5000;

      // Stars — scale with screen size, spread across upper 60% of sky
      S.stars = [];
      const skyArea = S.cols * Math.floor(S.rows * 0.6);
      const starCount = Math.max(80, Math.floor(skyArea / 30));
      for (let i = 0; i < starCount; i++) {
        S.stars.push({
          col: Math.floor(Math.random() * S.cols),
          row: Math.floor(Math.random() * (S.rows * 0.6)),
          twinkleOffset: Math.random() * 1000,
        });
      }

      S.initialized = true;
    }

    // ── Setup canvas ──
    function setupCanvas() {
      const rect = container!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      S.canvasW = w;
      S.canvasH = h;

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.imageSmoothingEnabled = false;

      ctx!.font = `${fontSize}px "Geist Mono", "JetBrains Mono", "Courier New", monospace`;
      ctx!.textBaseline = "top";

      const metrics = ctx!.measureText("M");
      S.charW = metrics.width;
      S.charH = fontSize * 1.35;

      S.cols = Math.floor(w / S.charW);
      S.rows = Math.floor(h / S.charH);

      if (!S.initialized) {
        initSimulation();
      } else {
        computeBuildingLayout();
      }
    }

    // ── Theme-aware colors ──
    function getThemeColors() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      return {
        buildingWall: isLight ? '#7a756d' : '#3e3e42',
        roof: isLight ? '#6b6660' : '#5c5850',
        windowLit: isLight ? '#8a6820' : '#d4a843',
        windowDark: isLight ? '#b5afa5' : '#1c1c1f',
        smoke: isLight ? '#7a756d' : '#5c5850',
        peasant: isLight ? '#4a4540' : '#9b9689',
        bird: isLight ? '#6b6660' : '#5c5850',
        trail: isLight ? '#8a6820' : '#d4a843',
        paragliderCanopy: isLight ? '#8a6820' : '#d4a843',
        speechBubble: isLight ? '#2a5a7b' : '#6b8aad',
        mountain: isLight ? '#a39e96' : '#3e3e42',
        mountainSnow: isLight ? '#ddd8d0' : '#9b9689',
        door: isLight ? '#6b6660' : '#2a2a2e',
        flag: isLight ? '#8a6820' : '#d4a843',
        stoneTexture: isLight ? '#8a857d' : '#4a4a4e',
        stoneDark: isLight ? '#7a756d' : '#333336',
      };
    }

    let themeColors = getThemeColors();

    const themeObserver = new MutationObserver(() => {
      themeColors = getThemeColors();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // ══════════════════════════════════════════════════════════════════
    // BUILDING RENDERING — Pre-built ASCII art templates
    // ══════════════════════════════════════════════════════════════════

    function drawBuilding(
      bl: typeof S.buildingLayout[0],
      _bi: number,
      _now: number
    ) {
      const def = bl.def;
      const bx = bl.x;
      const baseRow = bl.baseRow;
      const layerOpacity = def.layer === 1 ? 0.4 : 1.0;
      // Select template based on type
      let template: string[];
      switch (def.type) {
        case "church": template = CHURCH; break;
        case "guildhall": template = TOWN_HALL; break;
        case "tower": template = TOWER; break;
        case "tavern": template = TAVERN; break;
        case "house2": template = COTTAGE_2; break;
        default: template = COTTAGE_1; break;
      }

      // Draw template bottom-aligned to baseRow
      const startRow = baseRow - template.length + 1;
      for (let r = 0; r < template.length; r++) {
        const row = template[r];
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (ch !== " ") {
            drawAndRegister(ch, bx + c, startRow + r, themeColors.buildingWall, layerOpacity);
          }
        }
      }

      // Draw windows with lit/dark state (override [] positions with coloring)
      // Flatten window states from bl.windows (which is WindowState[][])
      const flatWindows: WindowState[] = [];
      for (const wRow of bl.windows) {
        for (const ws of wRow) {
          flatWindows.push(ws);
        }
      }

      let wIdx = 0;
      for (let r = 0; r < template.length; r++) {
        const row = template[r];
        for (let c = 0; c < row.length - 1; c++) {
          if (row[c] === "[" && row[c + 1] === "]") {
            if (wIdx < flatWindows.length) {
              const ws = flatWindows[wIdx];
              ws.nextToggle -= 16;
              if (ws.nextToggle <= 0) {
                ws.on = !ws.on;
                ws.nextToggle = 3000 + Math.random() * 12000;
              }
              const wColor = (ws.on && def.layer === 2) ? themeColors.windowLit : themeColors.windowDark;
              drawAndRegister("[", bx + c, startRow + r, wColor, layerOpacity);
              drawAndRegister("]", bx + c + 1, startRow + r, wColor, layerOpacity);
            }
            wIdx++;
          }
        }
      }
    }

    function drawAllBuildings(now: number) {
      // Draw layer 2 only (foreground)
      for (let layer = 2; layer <= 2; layer++) {
        for (let bi = 0; bi < S.buildingLayout.length; bi++) {
          const bl = S.buildingLayout[bi];
          if (bl.def.layer !== layer) continue;
          drawBuilding(bl, bi, now);
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // STARS — Twinkling stars in the sky (dark mode only)
    // ══════════════════════════════════════════════════════════════════

    function drawStars() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) return;

      for (const star of S.stars) {
        const twinkle = Math.sin((S.frame * 0.02 + star.twinkleOffset) * 0.5);
        if (twinkle > -0.3) {
          const char = twinkle > 0.5 ? "*" : twinkle > 0 ? "+" : ".";
          const opacity = 0.3 + twinkle * 0.3;
          drawChar(char, star.col, star.row, themeColors.peasant, opacity);
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // CELESTIAL BODY — Sun (light) or Moon (dark)
    // ══════════════════════════════════════════════════════════════════

    function drawCelestialBody() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const cx = Math.floor(S.cols * 0.85);
      const cy = Math.floor(S.rows * 0.15);

      if (isLight) {
        const sunColor = themeColors.windowLit;
        drawChar("\\", cx - 3, cy - 1, sunColor, 0.5);
        drawChar("|", cx, cy - 1, sunColor, 0.5);
        drawChar("/", cx + 2, cy - 1, sunColor, 0.5);
        drawChar("/", cx + 3, cy - 1, sunColor, 0.5);
        drawChar("-", cx - 3, cy, sunColor, 0.5);
        drawChar("-", cx - 2, cy, sunColor, 0.5);
        drawChar("O", cx, cy, sunColor, 0.8);
        drawChar("-", cx + 2, cy, sunColor, 0.5);
        drawChar("-", cx + 3, cy, sunColor, 0.5);
        drawChar("/", cx - 3, cy + 1, sunColor, 0.5);
        drawChar("/", cx - 2, cy + 1, sunColor, 0.5);
        drawChar("|", cx, cy + 1, sunColor, 0.5);
        drawChar("\\", cx + 2, cy + 1, sunColor, 0.5);
        drawChar("\\", cx + 3, cy + 1, sunColor, 0.5);
      } else {
        // Flipped crescent — opens to the right
        //     .-
        //      )
        //       )
        //       )
        //      )
        //     -'
        const moonColor = themeColors.windowLit;
        drawChar(".", cx, cy - 3, moonColor, 0.5);
        drawChar("-", cx + 1, cy - 3, moonColor, 0.6);
        drawChar(")", cx + 2, cy - 2, moonColor, 0.8);
        drawChar(")", cx + 2, cy - 1, moonColor, 0.9);
        drawChar(")", cx + 2, cy, moonColor, 0.9);
        drawChar(")", cx + 2, cy + 1, moonColor, 0.8);
        drawChar("'", cx, cy + 2, moonColor, 0.5);
        drawChar("-", cx + 1, cy + 2, moonColor, 0.6);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // MOUNTAINS — Snow-capped range behind everything
    // ══════════════════════════════════════════════════════════════════

    function drawMountains() {
      // Mountains removed
    }

    // ══════════════════════════════════════════════════════════════════
    // TREES — Simple vegetation at edges of the scene
    // ══════════════════════════════════════════════════════════════════

    function drawTrees() {
      const treeColor = "#3e3e42";
      const treeOpacity = 0.6;
      const groundRow = S.rows - 1;

      // Tree positions: at edges of the scene
      const treePositions = [
        Math.floor(S.cols * 0.02),
        Math.floor(S.cols * 0.06),
        Math.floor(S.cols * 0.94),
        Math.floor(S.cols * 0.97),
      ];

      for (const tx of treePositions) {
        // Simple tree:
        //  /|\
        // / | \
        //   |
        drawChar("/", tx - 1, groundRow - 3, treeColor, treeOpacity);
        drawChar("|", tx, groundRow - 3, treeColor, treeOpacity);
        drawChar("\\", tx + 1, groundRow - 3, treeColor, treeOpacity);
        drawChar("/", tx - 2, groundRow - 2, treeColor, treeOpacity);
        drawChar("|", tx, groundRow - 2, treeColor, treeOpacity);
        drawChar("\\", tx + 2, groundRow - 2, treeColor, treeOpacity);
        drawChar("|", tx, groundRow - 1, treeColor, treeOpacity);
      }

      // Bushes between some buildings on the back layer row
      const bushColor = "#3e3e42";
      const backBaseRow = Math.floor(S.rows * 0.72);
      const bushPositions = [
        Math.floor(S.cols * 0.15),
        Math.floor(S.cols * 0.45),
        Math.floor(S.cols * 0.78),
      ];
      for (const bx of bushPositions) {
        drawStr("(())", bx, backBaseRow, bushColor, 0.35);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // SMOKE — Trail-like puffs rising from chimneys
    // ══════════════════════════════════════════════════════════════════

    function drawSmokeCloud(cloud: SmokeCloud) {
      // Puffs start small and grow as they rise — sparse outline only
      const progress = cloud.startY > 0 ? Math.max(0, 1 - (cloud.y / cloud.startY)) : 0;
      const col = Math.floor(cloud.x / S.charW);
      const row = Math.floor(cloud.y / S.charH);

      // Opacity: start at 0.5, fade to 0.15 at top but stay visible
      const opacity = Math.max(0.15, 0.5 - progress * 0.35);

      if (progress < 0.2) {
        // Small: 5 chars  `. - .`
        drawChar(".", col, row, themeColors.smoke, opacity);
        drawChar("-", col + 2, row, themeColors.smoke, opacity);
        drawChar(".", col + 4, row, themeColors.smoke, opacity);
      } else if (progress < 0.4) {
        // Medium: 8 chars  `.  --  .`
        drawChar(".", col, row, themeColors.smoke, opacity);
        drawChar("-", col + 3, row, themeColors.smoke, opacity);
        drawChar("-", col + 4, row, themeColors.smoke, opacity);
        drawChar(".", col + 7, row, themeColors.smoke, opacity);
      } else {
        // Large: 11 chars  `.   ----   .`
        drawChar(".", col, row, themeColors.smoke, opacity);
        drawChar("-", col + 4, row, themeColors.smoke, opacity);
        drawChar("-", col + 5, row, themeColors.smoke, opacity);
        drawChar("-", col + 6, row, themeColors.smoke, opacity);
        drawChar("-", col + 7, row, themeColors.smoke, opacity);
        drawChar(".", col + 11, row, themeColors.smoke, opacity);
      }
    }

    function updateSmoke(dt: number, _now: number) {
      // Update wind
      S.windChangeTimer -= dt;
      if (S.windChangeTimer <= 0) {
        S.windTarget = -1 + Math.random() * 2;
        S.windChangeTimer = 4000 + Math.random() * 6000;
      }
      S.windDirection += (S.windTarget - S.windDirection) * 0.002 * dt;

      // Only the first 2 buildings with chimneys emit smoke (trail-like, frequent puffs)
      const smokingChimneys: number[] = [];
      for (let bi = 0; bi < S.buildingLayout.length && smokingChimneys.length < 2; bi++) {
        const bl = S.buildingLayout[bi];
        if (bl.def.chimneyPos > 0) {
          smokingChimneys.push(bi);
        }
      }

      for (const bi of smokingChimneys) {
        const bl = S.buildingLayout[bi];
        if (bi < S.smokeTimers.length) {
          S.smokeTimers[bi] -= dt;
          if (S.smokeTimers[bi] <= 0) {
            // Emit continuously every 600ms for constant trail
            S.smokeTimers[bi] = 600;

            if (S.smokeClouds.length < 25) {
              const life = 30000 + Math.random() * 10000;
              S.smokeClouds.push({
                x: bl.chimneyCol * S.charW,
                y: bl.chimneyRow * S.charH,
                vx: S.windDirection * 5 + (Math.random() - 0.5) * 2,
                vy: -(10 + Math.random() * 5),
                size: 0 as 0 | 1 | 2,
                life,
                maxLife: life,
                startY: bl.chimneyRow * S.charH,
              });
            }
          }
        }
      }

      // Update and draw smoke puffs
      for (let i = S.smokeClouds.length - 1; i >= 0; i--) {
        const c = S.smokeClouds[i];
        c.life -= dt;

        // Remove if dead OR above nav bar area (y < charH * 2)
        if (c.life <= 0 || c.y < S.charH * 2) {
          S.smokeClouds.splice(i, 1);
          continue;
        }

        // Wind drift
        c.vx += S.windDirection * 0.3 * (dt / 1000);
        c.x += c.vx * (dt / 1000);
        c.y += c.vy * (dt / 1000);

        drawSmokeCloud(c);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // DECORATIVE CLOUDS — static/slow-moving in sky area
    // ══════════════════════════════════════════════════════════════════

    // Cloud templates — variable widths
    const CLOUD_TEMPLATES = [
      // Small
      ["  ___  ", " /   \\ ", "/     \\", "\\_____/"],
      // Medium
      ["    _______    ", "  _/       \\_  ", " /           \\ ", " \\___________/ "],
      // Large
      ["      ___________      ", "   __/           \\__   ", "  /                 \\  ", "  \\_________________ / "],
    ];

    // 3 decorative clouds at fixed horizontal positions, drifting slowly
    const decorativeClouds = [
      { xFrac: 0.08, row: 6, driftOffset: 0, template: 0 },
      { xFrac: 0.42, row: 3, driftOffset: 150, template: 2 },
      { xFrac: 0.75, row: 8, driftOffset: 300, template: 1 },
    ];

    function drawClouds(now: number) {
      const cloudOpacity = 0.25;
      for (const dc of decorativeClouds) {
        const drift = Math.floor((now * 0.001 + dc.driftOffset) * S.windDirection * 0.5) % S.cols;
        const baseCol = Math.floor(dc.xFrac * S.cols) + drift;
        const r = dc.row;
        const tmpl = CLOUD_TEMPLATES[dc.template];

        for (let row = 0; row < tmpl.length; row++) {
          const line = tmpl[row];
          for (let c = 0; c < line.length; c++) {
            if (line[c] !== " ") {
              drawChar(line[c], baseCol + c, r + row, themeColors.smoke, cloudOpacity);
            }
          }
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // PEASANTS — Big 2D blocky figures ~5-6 chars wide, 5-6 rows tall
    // ══════════════════════════════════════════════════════════════════

    function drawBigPeasant(
      col: number,
      row: number,
      dir: 1 | -1,
      frame: number,
      isChild: boolean,
      color = themeColors.peasant,
      speaking = false
    ) {
      const step = Math.floor(frame) % 4;
      const isMoving = Math.abs(frame) > 0.01 && step !== 0;

      if (isChild) {
        // Child: 5 wide, 5 rows tall — harmonious proportions
        //  ___
        // (o o)
        // (_u_)
        // |###|
        //  | |
        // _/ \_
        const headRow = row - 4;

        // Row 0: head top
        drawAndRegister("_", col + 1, headRow, color);
        drawAndRegister("_", col + 2, headRow, color);
        drawAndRegister("_", col + 3, headRow, color);

        // Row 1: face with eyes
        drawAndRegister("(", col, headRow + 1, color);
        drawAndRegister("o", col + 1, headRow + 1, color);
        drawAndRegister(" ", col + 2, headRow + 1, color);
        drawAndRegister("o", col + 3, headRow + 1, color);
        drawAndRegister(")", col + 4, headRow + 1, color);

        // Row 2: mouth
        drawAndRegister("(", col, headRow + 2, color);
        drawAndRegister("_", col + 1, headRow + 2, color);
        drawAndRegister(speaking ? "o" : "u", col + 2, headRow + 2, color);
        drawAndRegister("_", col + 3, headRow + 2, color);
        drawAndRegister(")", col + 4, headRow + 2, color);

        // Row 3: tunic body
        drawAndRegister("|", col, headRow + 3, color);
        const bodyChar1 = (isMoving && Math.random() > 0.85) ? (Math.random() > 0.5 ? "\u2593" : "\u2592") : "#";
        const bodyChar2 = (isMoving && Math.random() > 0.85) ? (Math.random() > 0.5 ? "\u2593" : "\u2592") : "#";
        const bodyChar3 = (isMoving && Math.random() > 0.85) ? (Math.random() > 0.5 ? "\u2593" : "\u2592") : "#";
        drawAndRegister(bodyChar1, col + 1, headRow + 3, color);
        drawAndRegister(bodyChar2, col + 2, headRow + 3, color);
        drawAndRegister(bodyChar3, col + 3, headRow + 3, color);
        drawAndRegister("|", col + 4, headRow + 3, color);

        // Row 4: legs + feet — animated
        if (step === 0 || step === 2) {
          drawAndRegister("_", col, headRow + 4, color);
          drawAndRegister("/", col + 1, headRow + 4, color);
          drawAndRegister(" ", col + 2, headRow + 4, color);
          drawAndRegister("\\", col + 3, headRow + 4, color);
          drawAndRegister("_", col + 4, headRow + 4, color);
        } else if (step === 1) {
          drawAndRegister("/", col, headRow + 4, color);
          drawAndRegister(" ", col + 1, headRow + 4, color);
          drawAndRegister(" ", col + 2, headRow + 4, color);
          drawAndRegister("\\", col + 3, headRow + 4, color);
          drawAndRegister("_", col + 4, headRow + 4, color);
        } else {
          drawAndRegister("_", col, headRow + 4, color);
          drawAndRegister("/", col + 1, headRow + 4, color);
          drawAndRegister(" ", col + 2, headRow + 4, color);
          drawAndRegister(" ", col + 3, headRow + 4, color);
          drawAndRegister("\\", col + 4, headRow + 4, color);
        }
        return;
      }

      // Full-size peasant: 8 wide, 8 rows tall — symmetric medieval with hat/cap
      //     __
      //    /  \        ← hat/cap
      //   | oo |       ← face with eyes
      //   | -- |       ← mouth (-- when closed, <> when speaking)
      //    \__/        ← chin
      //   /|##|\       ← tunic with arms
      //   ||##||       ← body
      //   _|  |_       ← legs/feet
      const headRow = row - 7;

      // Row 0: hat top — centered at col+3, col+4
      drawAndRegister("_", col + 3, headRow, color);
      drawAndRegister("_", col + 4, headRow, color);

      // Row 1: hat brim — /  \  at col+2, col+5
      drawAndRegister("/", col + 2, headRow + 1, color);
      drawAndRegister("\\", col + 5, headRow + 1, color);

      // Row 2: face with eyes — | at col+1 and col+6, eyes at col+3 and col+4
      drawAndRegister("|", col + 1, headRow + 2, color);
      drawAndRegister("o", col + 3, headRow + 2, color);
      drawAndRegister("o", col + 4, headRow + 2, color);
      drawAndRegister("|", col + 6, headRow + 2, color);

      // Row 3: mouth — | at col+1 and col+6, mouth at col+3 and col+4
      drawAndRegister("|", col + 1, headRow + 3, color);
      const mouthChar = speaking ? "<" : "-";
      const mouthChar2 = speaking ? ">" : "-";
      drawAndRegister(mouthChar, col + 3, headRow + 3, color);
      drawAndRegister(mouthChar2, col + 4, headRow + 3, color);
      drawAndRegister("|", col + 6, headRow + 3, color);

      // Row 4: chin — \__/ at col+2..col+5
      drawAndRegister("\\", col + 2, headRow + 4, color);
      drawAndRegister("_", col + 3, headRow + 4, color);
      drawAndRegister("_", col + 4, headRow + 4, color);
      drawAndRegister("/", col + 5, headRow + 4, color);

      // Row 5: tunic upper — /|##|\ at col+1..col+6
      drawAndRegister("/", col + 1, headRow + 5, color);
      drawAndRegister("|", col + 2, headRow + 5, color);
      drawAndRegister("#", col + 3, headRow + 5, color);
      drawAndRegister("#", col + 4, headRow + 5, color);
      drawAndRegister("|", col + 5, headRow + 5, color);
      drawAndRegister("\\", col + 6, headRow + 5, color);

      // Row 6: tunic lower — ||##|| at col+1..col+6
      drawAndRegister("|", col + 1, headRow + 6, color);
      drawAndRegister("|", col + 2, headRow + 6, color);
      drawAndRegister("#", col + 3, headRow + 6, color);
      drawAndRegister("#", col + 4, headRow + 6, color);
      drawAndRegister("|", col + 5, headRow + 6, color);
      drawAndRegister("|", col + 6, headRow + 6, color);

      // Row 7: feet — _|  |_ at col+1..col+6 (animated)
      drawAndRegister("_", col + 1, headRow + 7, color);
      drawAndRegister("|", col + 2, headRow + 7, color);
      drawAndRegister("|", col + 5, headRow + 7, color);
      drawAndRegister("_", col + 6, headRow + 7, color);
    }

    // ── Dog: small blocky shape following walker ──
    // ── Dog: detailed feudal hound ──
    function drawDog(col: number, row: number, dir: 1 | -1, frame: number) {
      //  ∩ ∩
      // ▐█▌─·  (right)  or  ·─▐█▌  (left)
      //  ║ ║ ~                ~ ║ ║
      const step = Math.floor(frame) % 2;
      const tail = step === 0 ? "~" : "^";
      // Movement shimmer for dog body
      const dogShimmer = () => Math.random() > 0.8 ? (Math.random() > 0.5 ? "\u2593" : "\u2592") : "#";
      if (dir === 1) {
        // Ears
        drawAndRegister("\u2229", col + 1, row - 2, themeColors.peasant, 0.7);
        drawAndRegister("\u2229", col + 3, row - 2, themeColors.peasant, 0.7);
        // Head + body
        drawAndRegister("\u2590", col, row - 1, themeColors.peasant, 0.6);
        drawAndRegister(dogShimmer(), col + 1, row - 1, themeColors.peasant, 0.7);
        drawAndRegister(dogShimmer(), col + 2, row - 1, themeColors.peasant, 0.7);
        drawAndRegister("\u258C", col + 3, row - 1, themeColors.peasant, 0.6);
        drawAndRegister("-", col + 4, row - 1, themeColors.peasant, 0.5);
        drawAndRegister("\u00B7", col + 5, row - 1, themeColors.peasant, 0.5);
        // Legs + tail
        drawAndRegister("|", col + 1, row, themeColors.peasant, 0.6);
        drawAndRegister("|", col + 3, row, themeColors.peasant, 0.6);
        drawAndRegister(tail, col - 1, row - 1, themeColors.peasant, 0.5);
      } else {
        drawAndRegister("\u2229", col + 1, row - 2, themeColors.peasant, 0.7);
        drawAndRegister("\u2229", col + 3, row - 2, themeColors.peasant, 0.7);
        drawAndRegister("\u00B7", col - 1, row - 1, themeColors.peasant, 0.5);
        drawAndRegister("-", col, row - 1, themeColors.peasant, 0.5);
        drawAndRegister("\u2590", col + 1, row - 1, themeColors.peasant, 0.6);
        drawAndRegister(dogShimmer(), col + 2, row - 1, themeColors.peasant, 0.7);
        drawAndRegister(dogShimmer(), col + 3, row - 1, themeColors.peasant, 0.7);
        drawAndRegister("\u258C", col + 4, row - 1, themeColors.peasant, 0.6);
        drawAndRegister("|", col + 1, row, themeColors.peasant, 0.6);
        drawAndRegister("|", col + 3, row, themeColors.peasant, 0.6);
        drawAndRegister(tail, col + 5, row - 1, themeColors.peasant, 0.5);
      }
    }

    // ── Cat: sitting on ground ──
    function drawCat(col: number, row: number, frame: number) {
      //  /\_/\
      // ( o.o )
      //  > ^ <
      //  ~~~~~  tail
      const blink = Math.floor(frame) % 12 === 0;
      const tailWag = Math.floor(frame) % 3;
      drawAndRegister("/", col, row - 2, themeColors.peasant, 0.6);
      drawAndRegister("\\", col + 1, row - 2, themeColors.peasant, 0.6);
      drawAndRegister("_", col + 2, row - 2, themeColors.peasant, 0.6);
      drawAndRegister("/", col + 3, row - 2, themeColors.peasant, 0.6);
      drawAndRegister("\\", col + 4, row - 2, themeColors.peasant, 0.6);
      drawAndRegister("(", col - 1, row - 1, themeColors.peasant, 0.6);
      drawAndRegister(blink ? "-" : "o", col + 1, row - 1, themeColors.peasant, 0.7);
      drawAndRegister(".", col + 2, row - 1, themeColors.peasant, 0.6);
      drawAndRegister(blink ? "-" : "o", col + 3, row - 1, themeColors.peasant, 0.7);
      drawAndRegister(")", col + 5, row - 1, themeColors.peasant, 0.6);
      drawAndRegister(">", col, row, themeColors.peasant, 0.5);
      drawAndRegister("^", col + 2, row, themeColors.peasant, 0.6);
      drawAndRegister("<", col + 4, row, themeColors.peasant, 0.5);
      // Tail
      const tailChar = ["~", "~", "^"][tailWag];
      drawAndRegister(tailChar, col + 5, row, themeColors.peasant, 0.4);
    }

    // ── Rabbit: small hopping creature ──
    function drawRabbit(col: number, row: number, frame: number) {
      // () ()
      //  (·.·)
      //  (")(")
      const hop = Math.floor(frame) % 4;
      const yOff = hop === 1 ? -1 : 0;
      drawAndRegister("(", col, row - 2 + yOff, themeColors.peasant, 0.5);
      drawAndRegister(")", col + 1, row - 2 + yOff, themeColors.peasant, 0.5);
      drawAndRegister("(", col + 3, row - 2 + yOff, themeColors.peasant, 0.5);
      drawAndRegister(")", col + 4, row - 2 + yOff, themeColors.peasant, 0.5);
      drawAndRegister("(", col, row - 1 + yOff, themeColors.peasant, 0.6);
      drawAndRegister("\u00B7", col + 1, row - 1 + yOff, themeColors.peasant, 0.6);
      drawAndRegister(".", col + 2, row - 1 + yOff, themeColors.peasant, 0.5);
      drawAndRegister("\u00B7", col + 3, row - 1 + yOff, themeColors.peasant, 0.6);
      drawAndRegister(")", col + 4, row - 1 + yOff, themeColors.peasant, 0.6);
      drawAndRegister("(", col, row + yOff, themeColors.peasant, 0.5);
      drawAndRegister("\"", col + 1, row + yOff, themeColors.peasant, 0.5);
      drawAndRegister(")", col + 2, row + yOff, themeColors.peasant, 0.5);
      drawAndRegister("(", col + 3, row + yOff, themeColors.peasant, 0.5);
      drawAndRegister("\"", col + 4, row + yOff, themeColors.peasant, 0.5);
    }

    // ── Peasant flee logic ──
    function handlePeasantFlee(p: Peasant, dt: number) {
      if (p.grabbed || p.falling) return;

      const px = p.x * S.charW;
      const py = p.y * S.charH;
      const dx = px - S.mouseX;
      const dy = py - S.mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (S.mouseActive && !S.mouseDown && dist < FLEE_RADIUS && !p.fleeing) {
        p.fleeing = true;
        p.fleeTimer = 1000;
        p.dir = dx >= 0 ? 1 : -1;
        // 1.5x speed, not 2.5x
        p.speed = (p.baseSpeed || 0.015) * 1.5;
        if (p.speed < 0.015) p.speed = 0.025;
      }

      if (p.fleeing) {
        p.fleeTimer -= dt;
        if (p.fleeTimer <= 0) {
          p.fleeing = false;
          p.speed = p.baseSpeed;
        }
      }
    }

    // ── Update and draw peasants ──
    function updatePeasants(dt: number, now: number) {
      const groundRow = S.rows - 1;

      for (let pi = 0; pi < S.peasants.length; pi++) {
        const p = S.peasants[pi];
        p.frame += dt * 0.003;

        // Handle falling
        if (p.falling) {
          p.fallVelocity += 0.15 * dt;
          p.y += p.fallVelocity * dt * 0.001;
          if (p.y >= groundRow) {
            p.y = groundRow;
            p.falling = false;
            p.fallVelocity = 0;
            p.resumeTimer = 400;
          }
          const col = Math.floor(p.x);
          const row = Math.floor(p.y);
          drawBigPeasant(col, row, p.dir, p.frame, p.type === "child", themeColors.windowLit);
          continue;
        }

        // Resume timer
        if (p.resumeTimer > 0) {
          p.resumeTimer -= dt;
          const col = Math.floor(p.x);
          drawBigPeasant(col, groundRow, p.dir, p.frame, p.type === "child");
          continue;
        }

        // Grabbed
        if (p.grabbed) {
          p.x = S.mouseX / S.charW - 3;  // center horizontally (half of 8-wide peasant)
          p.y = S.mouseY / S.charH + 4;  // offset down so cursor grabs head (head is ~4 rows above feet for 8-tall peasant)
          // Add wobble based on frame count
          const wobble = Math.sin(S.frame * 0.15) * 0.5;
          const col = Math.floor(p.x + wobble);
          const row = Math.floor(p.y);
          drawBigPeasant(col, row, p.dir, p.frame, p.type === "child", themeColors.windowLit);
          continue;
        }

        handlePeasantFlee(p, dt);

        const col = Math.floor(p.x);

        // Speech bubble
        if (p.speechTimer > 0) {
          p.speechTimer -= dt;
          if (p.speechBubble) {
            const bubbleRow = p.type === "child" ? groundRow - 6 : groundRow - 9;
            drawStr(p.speechBubble, col, bubbleRow, themeColors.speechBubble, 0.8);
          }
        }

        // Fleeing movement
        if (p.fleeing) {
          p.x += p.dir * p.speed * dt;
          if (p.x > S.cols + 5) p.x = -5;
          if (p.x < -5) p.x = S.cols + 5;
          drawBigPeasant(col, groundRow, p.dir, p.frame, p.type === "child");
          continue;
        }

        switch (p.type) {
          case "walker": {
            if (p.stopped) {
              p.stopTimer -= dt;
              if (p.stopTimer <= 0) p.stopped = false;
              drawBigPeasant(col, groundRow, p.dir, 0, false);
            } else {
              p.x += p.dir * p.speed * dt;
              if (p.x > S.cols + 5) p.x = -5;
              if (p.x < -5) p.x = S.cols + 5;

              p.stateTimer -= dt;
              if (p.stateTimer <= 0 && Math.random() > 0.7) {
                p.stopped = true;
                p.stopTimer = 1500 + Math.random() * 3000;
                p.stateTimer = 5000 + Math.random() * 8000;
                if (Math.random() > 0.5) {
                  p.speechBubble = "?";
                  p.speechTimer = 1000;
                }
              } else if (p.stateTimer <= 0) {
                p.stateTimer = 3000 + Math.random() * 5000;
              }

              drawBigPeasant(col, groundRow, p.dir, p.frame, false);
            }

            break;
          }

          case "talker": {
            if (p.partnerX === undefined) break;
            const px = Math.floor(p.partnerX);

            p.stateTimer -= dt;
            if (p.stateTimer <= 0) {
              p.state = (p.state + 1) % 6;
              p.stateTimer = 800 + Math.random() * 1500;
              if (p.state === 1 || p.state === 3 || p.state === 5) {
                p.speechBubble = ["...", "!", "?", "!!", "~", ">>", "***"][Math.floor(Math.random() * 7)];
                p.speechTimer = 1200;
              }
            }

            // Determine which speaker is active (continuous speaking)
            const isSpeaking = p.state === 1 || p.state === 3 || p.state === 5;
            const speakerIsFirst = p.state % 2 === 1;

            // Draw peasants with speaking flag
            drawBigPeasant(col, groundRow, 1, 0, false, themeColors.peasant, isSpeaking && speakerIsFirst);
            drawBigPeasant(px, groundRow, -1, 0, false, themeColors.peasant, isSpeaking && !speakerIsFirst);

            const speaker = speakerIsFirst ? col : px;

            // Draw speech bubble text above speaker when speechTimer active
            if (p.speechTimer > 0) {
              drawStr(p.speechBubble, speaker + 1, groundRow - 9, themeColors.speechBubble, 0.9);
            }

            // Spawn speech particles from MOUTH — max 20, one every 300ms
            // Mouth is at (groundRow - 4), side depends on facing direction
            if (isSpeaking && S.talkParticles.length < 20) {
              const spawnInterval = Math.floor(300 / 16);
              if (S.frame % spawnInterval === 0) {
                const talkChars = ["~", "\u00B7", "\u00B0", "*", "+"];
                const mouthRow = groundRow - 4;
                // Spawn from the side of the mouth facing the listener
                const mouthCol = speakerIsFirst ? speaker + 5 : speaker + 2;
                const spawnX = mouthCol * S.charW + (Math.random() - 0.5) * S.charW;
                const spawnY = mouthRow * S.charH;
                S.talkParticles.push({
                  x: spawnX,
                  y: spawnY,
                  char: talkChars[Math.floor(Math.random() * talkChars.length)],
                  opacity: 0.8,
                  life: 6000,
                  vy: -0.3 * S.charH, // very slow rise, survives much longer
                  vx: (Math.random() - 0.5) * 0.2, // tiny random drift
                  shuffleTimer: 200,
                });
              }
            }
            break;
          }

          case "child": {
            p.x += p.dir * p.speed * dt;
            p.stateTimer -= dt;
            if (p.stateTimer <= 0) {
              p.dir = (p.dir * -1) as 1 | -1;
              p.stateTimer = 1500 + Math.random() * 2000;
            }
            if (p.x > S.cols * 0.45) p.dir = -1;
            if (p.x < S.cols * 0.25) p.dir = 1;
            drawBigPeasant(col, groundRow, p.dir, p.frame * 1.2, true);
            break;
          }

          case "musician": {
            drawBigPeasant(col, groundRow, 1, 0, false);
            p.stateTimer -= dt;
            if (p.stateTimer <= 0) {
              p.state = (p.state + 1) % 4;
              p.stateTimer = 600;
            }
            const noteChars = ["\u266A", "\u266B", "\u266A", " "];
            const noteChar = noteChars[p.state];
            if (noteChar !== " ") {
              const noteY = groundRow - 7 - (p.state % 3);
              const noteX = col + 6 + (p.state % 2);
              drawAndRegister(noteChar, noteX, noteY, themeColors.peasant, 0.5);
            }
            break;
          }

          case "marketBuyer": {
            p.x += p.dir * p.speed * dt;
            if (p.x > S.cols + 5) p.x = -5;
            if (p.x < -5) p.x = S.cols + 5;
            drawBigPeasant(col, groundRow, p.dir, p.frame, false);
            break;
          }
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // BIRDS — Much slower (60-70% reduction)
    // ══════════════════════════════════════════════════════════════════

    function updateBirds(dt: number) {
      const leaderBird = S.birds.find((b) => b.formation);

      for (const bird of S.birds) {
        bird.frame += dt * 0.001; // slower flap

        if (bird.formation && leaderBird) {
          const leaderX = leaderBird.x;
          const leaderY = leaderBird.y;
          bird.x = leaderX + bird.formationOffset * (bird === leaderBird ? 0 : 1);
          bird.y = leaderY + Math.abs(bird.formationOffset) * 0.5;
          if (bird === leaderBird) {
            bird.x += bird.speed * dt;
          }
        } else {
          bird.x += bird.speed * dt;
        }

        if (bird.x > S.cols + 3) {
          bird.x = -3;
          bird.y = 1 + Math.random() * Math.floor(S.rows * 0.25);
        }

        const bChar = BIRD_FRAMES[Math.floor(bird.frame) % BIRD_FRAMES.length];
        drawAndRegister(
          bChar,
          Math.floor(bird.x),
          Math.floor(bird.y),
          themeColors.bird,
          0.7
        );
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // PARAGLIDERS — Full canopy, person visible
    // ══════════════════════════════════════════════════════════════════

    function updateParagliders(dt: number) {
      for (const pg of S.paragliders) {
        pg.x += pg.dir * pg.speed * dt;
        pg.y += pg.vy * dt;
        pg.frame += dt * 0.002;

        const bottomThird = S.rows * 0.6;
        if (pg.dir === 1 && (pg.x > S.cols + 30 || pg.y > bottomThird)) {
          pg.x = -30;
          pg.y = Math.floor(S.rows * (0.05 + Math.random() * 0.1));
        } else if (pg.dir === -1 && (pg.x < -30 || pg.y > bottomThird)) {
          pg.x = S.cols + 30;
          pg.y = Math.floor(S.rows * (0.05 + Math.random() * 0.1));
        }

        const col = Math.floor(pg.x);
        const row = Math.floor(pg.y);
        const bobble = Math.floor(pg.frame) % 2;

        // Medieval kite / hang glider — clear triangular shape
        //     .------.
        //    / \\    / \\
        //   /   \\  /   \\
        //  /     \\/     \\
        //  '------''------'
        //       \\  /
        //        \\/
        //        °
        //       /|\\
        const kRow = row - 6 + bobble;
        const d = pg.dir;

        // Kite canopy — wide diamond/triangle shape
        // Row 0: top peak
        drawAndRegister(".", col - 4, kRow, themeColors.paragliderCanopy);
        drawStr("------", col - 3, kRow, themeColors.paragliderCanopy);
        drawAndRegister(".", col + 3, kRow, themeColors.paragliderCanopy);
        // Row 1: upper wing
        drawAndRegister("/", col - 5, kRow + 1, themeColors.paragliderCanopy);
        drawStr("--------", col - 4, kRow + 1, themeColors.paragliderCanopy);
        drawAndRegister("\\", col + 4, kRow + 1, themeColors.paragliderCanopy);
        // Row 2: lower wing
        drawAndRegister("'", col - 5, kRow + 2, themeColors.paragliderCanopy);
        drawStr("--------", col - 4, kRow + 2, themeColors.paragliderCanopy);
        drawAndRegister("'", col + 4, kRow + 2, themeColors.paragliderCanopy);

        // Suspension lines converging to person
        drawAndRegister("\\", col - 2, kRow + 3, themeColors.peasant, 0.5);
        drawAndRegister("/", col + 2, kRow + 3, themeColors.peasant, 0.5);
        drawAndRegister("\\", col - 1, kRow + 4, themeColors.peasant, 0.5);
        drawAndRegister("/", col + 1, kRow + 4, themeColors.peasant, 0.5);

        // Person hanging below
        drawAndRegister("o", col, kRow + 5, themeColors.peasant);
        drawAndRegister("/", col - 1, kRow + 6, themeColors.peasant, 0.7);
        drawAndRegister("|", col, kRow + 6, themeColors.peasant, 0.7);
        drawAndRegister("\\", col + 1, kRow + 6, themeColors.peasant, 0.7);
        // Legs
        drawAndRegister("/", col - 1, kRow + 7, themeColors.peasant, 0.6);
        drawAndRegister("\\", col + 1, kRow + 7, themeColors.peasant, 0.6);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // MOUSE TRAIL — Stay in place, shuffle chars, fade
    // ══════════════════════════════════════════════════════════════════

    function updateTrail(dt: number) {
      for (let i = S.trailParticles.length - 1; i >= 0; i--) {
        const p = S.trailParticles[i];
        p.life -= dt;
        if (p.life <= 0) {
          S.trailParticles.splice(i, 1);
          continue;
        }

        // Shuffle char every ~200ms
        p.shuffleTimer -= dt;
        if (p.shuffleTimer <= 0) {
          p.char = TRAIL_CHARS[Math.floor(Math.random() * TRAIL_CHARS.length)];
          p.shuffleTimer = 180 + Math.random() * 40;
        }

        // Particle stays in place — no velocity
        // Fade out opacity
        const fadeOpacity = p.opacity * (p.life / p.maxLife);
        drawCharPx(p.char, p.x, p.y, themeColors.trail, fadeOpacity);
      }
    }

    // ── Mouse proximity shuffle ──
    function updateShuffle(dt: number) {
      if (!S.mouseActive) {
        for (const [key, entry] of S.shuffleMap) {
          entry.timer -= dt;
          if (entry.timer <= 0) {
            S.shuffleMap.delete(key);
          }
        }
        return;
      }

      const mx = S.mouseX;
      const my = S.mouseY;
      const mouseCol = mx / S.charW;
      const mouseRow = my / S.charH;
      const radiusCols = SHUFFLE_RADIUS / S.charW;
      const radiusRows = SHUFFLE_RADIUS / S.charH;

      for (const gc of S.gridChars) {
        const dc = gc.col - mouseCol;
        const dr = gc.row - mouseRow;
        const dist = Math.sqrt(dc * dc + dr * dr);
        const maxDist = Math.sqrt(radiusCols * radiusCols + radiusRows * radiusRows);

        if (dist < maxDist) {
          const key = `${gc.col},${gc.row}`;
          const existing = S.shuffleMap.get(key);

          if (existing) {
            existing.timer = SHUFFLE_DECAY;
            if (Math.random() > 0.85) {
              existing.shuffled = SHUFFLE_CHARS[Math.floor(Math.random() * SHUFFLE_CHARS.length)];
            }
          } else {
            S.shuffleMap.set(key, {
              original: gc.char,
              originalColor: gc.color,
              timer: SHUFFLE_DECAY,
              shuffled: SHUFFLE_CHARS[Math.floor(Math.random() * SHUFFLE_CHARS.length)],
            });
          }
        }
      }

      for (const [key, entry] of S.shuffleMap) {
        const parts = key.split(",");
        const c = parseInt(parts[0]);
        const r = parseInt(parts[1]);
        const dc = c - mouseCol;
        const dr = r - mouseRow;
        const dist = Math.sqrt(dc * dc + dr * dr);
        const maxDist = Math.sqrt(radiusCols * radiusCols + radiusRows * radiusRows);

        if (dist >= maxDist) {
          entry.timer -= dt;
          if (entry.timer <= 0) {
            S.shuffleMap.delete(key);
          }
        }
      }
    }

    function drawShuffledChars() {
      for (const [key, entry] of S.shuffleMap) {
        if (entry.timer <= 0) continue;
        const parts = key.split(",");
        const c = parseInt(parts[0]);
        const r = parseInt(parts[1]);
        const opacity = Math.min(1, entry.timer / (SHUFFLE_DECAY * 0.5)) * 0.8;
        drawChar(entry.shuffled, c, r, themeColors.trail, opacity);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // SETUP AND MAIN LOOP
    // ══════════════════════════════════════════════════════════════════

    setupCanvas();

    const onResize = () => setupCanvas();
    window.addEventListener("resize", onResize);

    // Mouse handlers
    const heroSection = container.closest("section");
    let mouseLeaveTimer: ReturnType<typeof setTimeout> | null = null;

    const onMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return;

      const rect = canvas!.getBoundingClientRect();
      S.mouseX = e.clientX - rect.left;
      S.mouseY = e.clientY - rect.top;
      S.mouseActive = true;

      if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
      mouseLeaveTimer = setTimeout(() => {
        S.mouseActive = false;
      }, 200);

      // Spawn trail particles based on DISTANCE (no time throttle)
      const dx = S.mouseX - S.lastTrailSpawnX;
      const dy = S.mouseY - S.lastTrailSpawnY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 15 && S.trailParticles.length < 30) {
        S.lastTrailSpawnX = S.mouseX;
        S.lastTrailSpawnY = S.mouseY;
        S.trailParticles.push({
          x: S.mouseX,
          y: S.mouseY,
          char: TRAIL_CHARS[Math.floor(Math.random() * TRAIL_CHARS.length)],
          opacity: 0.5,
          life: 1200,
          maxLife: 1200,
          shuffleTimer: 200,
        });
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (reducedMotion) return;

      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      S.mouseDown = true;

      let closestIdx = -1;
      let closestDist = GRAB_RADIUS;

      for (let i = 0; i < S.peasants.length; i++) {
        const p = S.peasants[i];
        if (p.grabbed) continue;
        const px = (p.x + 3) * S.charW;  // +3 to center on 8-wide peasant
        const py = (p.y - 4) * S.charH;  // -4 to center vertically on 8-tall peasant
        const dist = Math.sqrt((px - mx) * (px - mx) + (py - my) * (py - my));
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      if (closestIdx >= 0) {
        S.grabbedPeasantIdx = closestIdx;
        const p = S.peasants[closestIdx];
        p.grabbed = true;
        p.fleeing = false;
        p.stopped = false;
      }
    };

    const onMouseUp = () => {
      S.mouseDown = false;
      if (S.grabbedPeasantIdx >= 0) {
        const p = S.peasants[S.grabbedPeasantIdx];
        p.grabbed = false;
        p.falling = true;
        p.fallVelocity = 0;
        S.grabbedPeasantIdx = -1;
      }
    };

    const onMouseLeave = () => {
      S.mouseActive = false;
      if (S.grabbedPeasantIdx >= 0) {
        const p = S.peasants[S.grabbedPeasantIdx];
        p.grabbed = false;
        p.falling = true;
        p.fallVelocity = 0;
        S.grabbedPeasantIdx = -1;
      }
      S.mouseDown = false;
    };

    if (heroSection) {
      heroSection.addEventListener("mousemove", onMouseMove);
      heroSection.addEventListener("mouseleave", onMouseLeave);
      heroSection.addEventListener("mousedown", onMouseDown);
      heroSection.addEventListener("mouseup", onMouseUp);
    }

    // ── Pause/play toggle listener ──
    const onAnimationToggle = () => {
      S.paused = !S.paused;
    };
    window.addEventListener("peasant-animation-toggle", onAnimationToggle);

    // ── Static render for reduced motion ──
    if (reducedMotion) {
      ctx.clearRect(0, 0, S.canvasW, S.canvasH);
      S.gridChars = [];
      drawStars();
      drawCelestialBody();
      drawMountains();
      drawClouds(0);
      drawAllBuildings(0);
      drawTrees();

      ctx.globalAlpha = 1;

      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("peasant-animation-toggle", onAnimationToggle);
        themeObserver.disconnect();
        if (heroSection) {
          heroSection.removeEventListener("mousemove", onMouseMove);
          heroSection.removeEventListener("mouseleave", onMouseLeave);
          heroSection.removeEventListener("mousedown", onMouseDown);
          heroSection.removeEventListener("mouseup", onMouseUp);
        }
      };
    }

    // ── Animation loop ──
    let simAccumulator = 0;
    const SIM_STEP = 1000 / 15;

    const animate = (timestamp: number) => {
      S.animId = requestAnimationFrame(animate);

      const rawDt = S.prevTimestamp ? timestamp - S.prevTimestamp : 16;
      const dt = Math.min(rawDt, 33); // cap at ~30fps, prevents jumps on unfocus
      S.prevTimestamp = timestamp;

      // When paused, skip simulation updates but still render the frozen frame.
      // Mouse flee and drag still work (handled inside updatePeasants with dt=0).
      const paused = S.paused;
      const effectiveDt = paused ? 0 : dt;

      if (!paused) S.frame++;

      ctx!.clearRect(0, 0, S.canvasW, S.canvasH);
      S.gridChars = [];

      if (!paused) {
        simAccumulator += dt;
      }
      const simTick = simAccumulator >= SIM_STEP;
      if (simTick) {
        simAccumulator -= SIM_STEP;
      }

      const simDt = simTick ? SIM_STEP : 0;

      // Stars and celestial body behind everything
      drawStars();
      drawCelestialBody();

      // Draw mountains behind everything
      drawMountains();

      // Decorative clouds in the sky
      drawClouds(timestamp);

      // Draw all buildings (3 layers, packed tightly)
      drawAllBuildings(timestamp);

      // Draw trees at edges
      drawTrees();

      // Smoke — updates every frame (frozen when paused)
      updateSmoke(effectiveDt, timestamp);

      // Peasants — pass 0 for movement dt when paused, but still render + allow drag
      updatePeasants(paused ? 0 : (simTick ? simDt : 0), timestamp);

      // Update and draw talk particles — rise straight up, shuffle every 250ms, disappear after 4s
      for (let i = S.talkParticles.length - 1; i >= 0; i--) {
        const tp = S.talkParticles[i];
        tp.y += tp.vy * (dt / 1000);
        // Decrement life counter
        tp.life -= dt;
        // Shuffle character every 250ms through speech chars
        tp.shuffleTimer -= dt;
        if (tp.shuffleTimer <= 0) {
          const shuffleSet = ["~", "\u00B7", "\u00B0", "*", "+", "#", "@"];
          tp.char = shuffleSet[Math.floor(Math.random() * shuffleSet.length)];
          tp.shuffleTimer = 250;
        }
        if (tp.life <= 0 || tp.y < 0) {
          S.talkParticles.splice(i, 1);
          continue;
        }
        drawCharPx(tp.char, tp.x, tp.y, themeColors.speechBubble, 0.8);
      }

      // Birds and paragliders
      updateBirds(paused ? 0 : (simTick ? simDt : dt * 0.3));
      updateParagliders(effectiveDt);

      // Mouse trail
      updateTrail(effectiveDt);

      ctx!.globalAlpha = 1;
    };

    S.animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(S.animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("peasant-animation-toggle", onAnimationToggle);
      themeObserver.disconnect();
      if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
      if (heroSection) {
        heroSection.removeEventListener("mousemove", onMouseMove);
        heroSection.removeEventListener("mouseleave", onMouseLeave);
        heroSection.removeEventListener("mousedown", onMouseDown);
        heroSection.removeEventListener("mouseup", onMouseUp);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 1 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
}
