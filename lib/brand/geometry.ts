export const BRAND_COLORS = {
  void: "#0a0a0b",
  ink: "#111113",
  line: "#26262b",
  bone: "#ece9e4",
  mute: "#a19d95",
  seal: "#ff5a36",
  black: "#000000",
  white: "#ffffff",
} as const;

export const SYMBOL_SIZE = 64;
export const SYMBOL_RADIUS = 21;
export const SYMBOL_GAP_DEGREES = 44;
export const SYMBOL_STROKE_CAP = "butt" as const;

export interface SymbolConfig {
  strokeWidth: number;
  sealFactor: number;
}

export const DISPLAY_SYMBOL_CONFIG: SymbolConfig = { strokeWidth: 6, sealFactor: 2.4 };
export const MICRO_SYMBOL_CONFIG: SymbolConfig = { strokeWidth: 8, sealFactor: 2.4 };
export const MICRO_MAX_SIZE = 31;
export const ICON_SIZES = [16, 24, 32, 48, 64, 128] as const;

export function iconConfigFor(size: number): SymbolConfig {
  return size <= MICRO_MAX_SIZE ? MICRO_SYMBOL_CONFIG : DISPLAY_SYMBOL_CONFIG;
}

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function polar(cx: number, cy: number, radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: round(cx + radius * Math.cos(radians)),
    y: round(cy + radius * Math.sin(radians)),
  };
}

export function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number,
): string {
  const sweep = ((endDeg - startDeg) % 360 + 360) % 360 || 360;
  const largeArc = sweep > 180 ? 1 : 0;
  const start = polar(cx, cy, radius, startDeg);
  const end = polar(cx, cy, radius, endDeg);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export type GlyphPart =
  | { kind: "arc"; cx: number; cy: number; r: number; startDeg: number; endDeg: number }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number };

export function partToPath(part: GlyphPart): string {
  if (part.kind === "arc") {
    return arcPath(part.cx, part.cy, part.r, part.startDeg, part.endDeg);
  }
  if (part.kind === "line") {
    return `M ${part.x1} ${part.y1} L ${part.x2} ${part.y2}`;
  }
  const left = round(part.cx - part.r);
  const right = round(part.cx + part.r);
  return `M ${left} ${part.cy} A ${part.r} ${part.r} 0 1 0 ${right} ${part.cy} A ${part.r} ${part.r} 0 1 0 ${left} ${part.cy}`;
}

export interface SymbolGeometry {
  viewBox: string;
  radius: number;
  strokeWidth: number;
  gapDegrees: number;
  arc: string;
  seal: { x: number; y: number; size: number };
}

export function symbolGeometry(config: SymbolConfig): SymbolGeometry {
  const centre = SYMBOL_SIZE / 2;
  const half = SYMBOL_GAP_DEGREES / 2;
  const sealSize = round(config.strokeWidth * config.sealFactor);

  return {
    viewBox: `0 0 ${SYMBOL_SIZE} ${SYMBOL_SIZE}`,
    radius: SYMBOL_RADIUS,
    strokeWidth: config.strokeWidth,
    gapDegrees: SYMBOL_GAP_DEGREES,
    arc: arcPath(centre, centre, SYMBOL_RADIUS, half, 360 - half),
    seal: {
      x: round(centre + SYMBOL_RADIUS - sealSize / 2),
      y: round(centre - sealSize / 2),
      size: sealSize,
    },
  };
}

export const WORDMARK_TOP = 10;
export const WORDMARK_BASELINE = 50;
export const WORDMARK_ROUND_CY = 36;
export const WORDMARK_ROUND_R = 14;
export const WORDMARK_CAP_CY = 30;
export const WORDMARK_CAP_R = 20;
export const WORDMARK_CAP_GAP = 22;
export const WORDMARK_STROKE = 6;
export const WORDMARK_VIEWBOX_WIDTH = 218;
export const WORDMARK_VIEWBOX_HEIGHT = 64;

const ROUND = WORDMARK_ROUND_R;
const ROUND_CY = WORDMARK_ROUND_CY;

function stemGlyph(cx: number, top: number): GlyphPart[] {
  const stemX = cx + ROUND;
  return [
    { kind: "circle", cx, cy: ROUND_CY, r: ROUND },
    { kind: "line", x1: stemX, y1: top, x2: stemX, y2: WORDMARK_BASELINE },
  ];
}

function barredGlyph(cx: number): GlyphPart[] {
  return [
    { kind: "circle", cx, cy: ROUND_CY, r: ROUND },
    {
      kind: "line",
      x1: cx - ROUND,
      y1: ROUND_CY,
      x2: cx + ROUND,
      y2: ROUND_CY,
    },
  ];
}

export interface Glyph {
  letter: string;
  inkStart: number;
  inkEnd: number;
  parts: readonly GlyphPart[];
}

export const WORDMARK_GLYPHS: readonly Glyph[] = [
  {
    letter: "C",
    inkStart: 5,
    inkEnd: 49.5,
    parts: [
      {
        kind: "arc",
        cx: 28,
        cy: WORDMARK_CAP_CY,
        r: WORDMARK_CAP_R,
        startDeg: WORDMARK_CAP_GAP,
        endDeg: 360 - WORDMARK_CAP_GAP,
      },
    ],
  },
  { letter: "a", inkStart: 59.5, inkEnd: 93.5, parts: stemGlyph(76.5, WORDMARK_ROUND_CY - ROUND) },
  {
    letter: "l",
    inkStart: 103.5,
    inkEnd: 109.5,
    parts: [{ kind: "line", x1: 106.5, y1: WORDMARK_TOP, x2: 106.5, y2: WORDMARK_BASELINE }],
  },
  {
    letter: "l",
    inkStart: 119.5,
    inkEnd: 125.5,
    parts: [{ kind: "line", x1: 122.5, y1: WORDMARK_TOP, x2: 122.5, y2: WORDMARK_BASELINE }],
  },
  { letter: "e", inkStart: 135.5, inkEnd: 169.5, parts: barredGlyph(152.5) },
  { letter: "d", inkStart: 179.5, inkEnd: 213.5, parts: stemGlyph(196.5, WORDMARK_TOP) },
];

export const WORDMARK_TEXT = WORDMARK_GLYPHS.map((glyph) => glyph.letter).join("");
export const WORDMARK_INK_LEFT = WORDMARK_GLYPHS[0].inkStart;
export const WORDMARK_INK_RIGHT = WORDMARK_GLYPHS[WORDMARK_GLYPHS.length - 1].inkEnd;

export type LockupKind = "horizontal" | "compact";

export const HORIZONTAL_WIDTH = 290;
export const HORIZONTAL_HEIGHT = 64;
export const WORDMARK_OFFSET_X = 74;
export const COMPACT_SCALE = 0.5;

export function lockupViewBox(kind: LockupKind): string {
  return kind === "horizontal"
    ? `0 0 ${HORIZONTAL_WIDTH} ${HORIZONTAL_HEIGHT}`
    : `0 0 ${HORIZONTAL_WIDTH * COMPACT_SCALE} ${HORIZONTAL_HEIGHT * COMPACT_SCALE}`;
}
