import {
  COMPACT_SCALE,
  HORIZONTAL_HEIGHT,
  SYMBOL_SIZE,
  WORDMARK_GLYPHS,
  WORDMARK_VIEWBOX_HEIGHT,
  WORDMARK_VIEWBOX_WIDTH,
  lockupViewBox,
  partToPath,
  symbolGeometry,
  type LockupKind,
} from "@/lib/brand/geometry";

const DISPLAY = { strokeWidth: 6, sealFactor: 2.4 };
const MICRO = { strokeWidth: 8, sealFactor: 2.4 };
const MICRO_SIZE = 24;

interface MarkProps {
  size?: number;
  sealColor?: string;
  className?: string;
}

export function CalledMark({ size = 28, sealColor = "var(--seal)", className }: MarkProps) {
  const config = size <= MICRO_SIZE ? MICRO : DISPLAY;
  const geometry = symbolGeometry(config);

  return (
    <svg
      viewBox={geometry.viewBox}
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d={geometry.arc}
        stroke="currentColor"
        strokeWidth={geometry.strokeWidth}
        strokeLinecap="butt"
      />
      <rect
        x={geometry.seal.x}
        y={geometry.seal.y}
        width={geometry.seal.size}
        height={geometry.seal.size}
        fill={sealColor}
      />
    </svg>
  );
}

interface WordmarkProps {
  height?: number;
  className?: string;
}

export function CalledWordmark({ height = 24, className }: WordmarkProps) {
  const width = Math.round((height * WORDMARK_VIEWBOX_WIDTH) / WORDMARK_VIEWBOX_HEIGHT);

  return (
    <svg
      viewBox={`0 0 ${WORDMARK_VIEWBOX_WIDTH} ${WORDMARK_VIEWBOX_HEIGHT}`}
      width={width}
      height={height}
      fill="none"
      role="img"
      aria-label="Called"
      className={className}
    >
      <g stroke="currentColor" strokeWidth={6} strokeLinecap="butt" strokeLinejoin="miter">
        {WORDMARK_GLYPHS.flatMap((glyph) =>
          glyph.parts.map((part, index) => <path key={`${glyph.letter}${index}`} d={partToPath(part)} />),
        )}
      </g>
    </svg>
  );
}

interface LockupProps {
  kind?: LockupKind;
  height?: number;
  sealColor?: string;
  className?: string;
}

export function CalledLockup({
  kind = "compact",
  height,
  sealColor = "var(--seal)",
  className,
}: LockupProps) {
  const scale = kind === "compact" ? COMPACT_SCALE : 1;
  const baseHeight = HORIZONTAL_HEIGHT * scale;
  const resolvedHeight = height ?? baseHeight;
  const ratio = resolvedHeight / baseHeight;
  const geometry = symbolGeometry({ strokeWidth: 6, sealFactor: 2.4 });
  const width = Math.round((kind === "compact" ? 290 * COMPACT_SCALE : 290) * ratio);

  return (
    <svg
      viewBox={lockupViewBox(kind)}
      width={width}
      height={resolvedHeight}
      fill="none"
      role="img"
      aria-label="Called"
      className={className}
    >
      <g transform={`scale(${scale})`}>
        <path
          d={geometry.arc}
          stroke="currentColor"
          strokeWidth={geometry.strokeWidth}
          strokeLinecap="butt"
        />
        <rect
          x={geometry.seal.x}
          y={geometry.seal.y}
          width={geometry.seal.size}
          height={geometry.seal.size}
          fill={sealColor}
        />
        <g
          transform="translate(74 2)"
          stroke="currentColor"
          strokeWidth={6}
          strokeLinecap="butt"
          strokeLinejoin="miter"
        >
          {WORDMARK_GLYPHS.flatMap((glyph) =>
            glyph.parts.map((part, index) => (
              <path key={`${glyph.letter}${index}`} d={partToPath(part)} />
            )),
          )}
        </g>
      </g>
    </svg>
  );
}

export const CALLED_SYMBOL_SIZE = SYMBOL_SIZE;
