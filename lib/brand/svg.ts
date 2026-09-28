import {
  BRAND_COLORS,
  COMPACT_SCALE,
  HORIZONTAL_HEIGHT,
  HORIZONTAL_WIDTH,
  SYMBOL_SIZE,
  SYMBOL_STROKE_CAP,
  WORDMARK_GLYPHS,
  WORDMARK_STROKE,
  WORDMARK_VIEWBOX_HEIGHT,
  WORDMARK_VIEWBOX_WIDTH,
  type LockupKind,
  type SymbolConfig,
  lockupViewBox,
  partToPath,
  round,
  symbolGeometry,
} from "./geometry";

export type BrandColor = keyof typeof BRAND_COLORS;

export function resolveColor(color: BrandColor | string): string {
  return color in BRAND_COLORS ? BRAND_COLORS[color as BrandColor] : color;
}

export interface SymbolOptions {
  color: BrandColor | string;
  sealColor?: BrandColor | string;
  config: SymbolConfig;
  size?: number;
}

function openTag(viewBox: string, width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${round(width)}" height="${round(height)}" fill="none" role="img">`;
}

export function symbolSvg(options: SymbolOptions): string {
  const geometry = symbolGeometry(options.config);
  const color = resolveColor(options.color);
  const sealColor = resolveColor(options.sealColor ?? options.color);
  const size = options.size ?? SYMBOL_SIZE;

  return [
    openTag(geometry.viewBox, size, size),
    `  <path d="${geometry.arc}" stroke="${color}" stroke-width="${geometry.strokeWidth}" stroke-linecap="${SYMBOL_STROKE_CAP}"/>`,
    `  <rect x="${geometry.seal.x}" y="${geometry.seal.y}" width="${geometry.seal.size}" height="${geometry.seal.size}" fill="${sealColor}"/>`,
    `</svg>`,
    ``,
  ].join("\n");
}

export interface WordmarkOptions {
  color: BrandColor | string;
  height?: number;
}

export function wordmarkPaths(indent: string): string {
  return WORDMARK_GLYPHS.flatMap((glyph) =>
    glyph.parts.map((part) => `${indent}<path d="${partToPath(part)}"/>`),
  ).join("\n");
}

export function wordmarkSvg(options: WordmarkOptions): string {
  const color = resolveColor(options.color);
  const height = options.height ?? WORDMARK_VIEWBOX_HEIGHT;
  const width = round((height * WORDMARK_VIEWBOX_WIDTH) / WORDMARK_VIEWBOX_HEIGHT);

  return [
    openTag(`0 0 ${WORDMARK_VIEWBOX_WIDTH} ${WORDMARK_VIEWBOX_HEIGHT}`, width, height),
    `  <g stroke="${color}" stroke-width="${WORDMARK_STROKE}" stroke-linecap="butt" stroke-linejoin="miter">`,
    wordmarkPaths("    "),
    `  </g>`,
    `</svg>`,
    ``,
  ].join("\n");
}

export interface LockupOptions {
  kind: LockupKind;
  color: BrandColor | string;
  sealColor?: BrandColor | string;
  height?: number;
}

export const LOCKUP_SPEC: Record<LockupKind, { width: number; height: number; scale: number; offsetX: number }> = {
  horizontal: { width: HORIZONTAL_WIDTH, height: HORIZONTAL_HEIGHT, scale: 1, offsetX: 74 },
  compact: {
    width: Math.round(HORIZONTAL_WIDTH * COMPACT_SCALE),
    height: Math.round(HORIZONTAL_HEIGHT * COMPACT_SCALE),
    scale: COMPACT_SCALE,
    offsetX: 74,
  },
};

export function lockupSvg(options: LockupOptions): string {
  const color = resolveColor(options.color);
  const sealColor = resolveColor(options.sealColor ?? options.color);
  const spec = LOCKUP_SPEC[options.kind];
  const geometry = symbolGeometry({ strokeWidth: WORDMARK_STROKE, sealFactor: 2.4 });
  const viewBox = lockupViewBox(options.kind);
  const scale = options.height ? options.height / spec.height : 1;

  return [
    openTag(viewBox, spec.width * scale, spec.height * scale),
    `  <g transform="scale(${spec.scale})">`,
    `    <path d="${geometry.arc}" stroke="${color}" stroke-width="${geometry.strokeWidth}" stroke-linecap="${SYMBOL_STROKE_CAP}"/>`,
    `    <rect x="${geometry.seal.x}" y="${geometry.seal.y}" width="${geometry.seal.size}" height="${geometry.seal.size}" fill="${sealColor}"/>`,
    `    <g transform="translate(${spec.offsetX} 2)" stroke="${color}" stroke-width="${WORDMARK_STROKE}" stroke-linecap="butt" stroke-linejoin="miter">`,
    wordmarkPaths("      "),
    `    </g>`,
    `  </g>`,
    `</svg>`,
    ``,
  ].join("\n");
}
