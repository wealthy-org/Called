import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  BRAND_COLORS,
  DISPLAY_SYMBOL_CONFIG,
  ICON_SIZES,
  MICRO_SYMBOL_CONFIG,
  iconConfigFor,
  symbolGeometry,
  type LockupKind,
} from "../lib/brand/geometry";
import {
  type BrandColor,
  LOCKUP_SPEC,
  lockupSvg,
  symbolSvg,
  wordmarkSvg,
} from "../lib/brand/svg";

const ROOT = process.cwd();
const BRAND = join(ROOT, "brand");

const MONO_COLORWAYS = ["bone", "seal", "black", "white"] as const;
const SIGNATURE = "signature" as const;

interface Written {
  path: string;
  bytes: number;
}

async function emit(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf8");
  written.push({ path: path.slice(ROOT.length + 1), bytes: Buffer.byteLength(contents) });
}

const written: Written[] = [];

function symbolFor(colorway: typeof MONO_COLORWAYS[number] | typeof SIGNATURE, micro: boolean): string {
  const config = micro ? MICRO_SYMBOL_CONFIG : DISPLAY_SYMBOL_CONFIG;
  if (colorway === SIGNATURE) {
    return symbolSvg({ color: "bone", sealColor: "seal", config });
  }
  return symbolSvg({ color: colorway as BrandColor, sealColor: colorway as BrandColor, config });
}

function lockupFor(
  kind: LockupKind,
  colorway: typeof MONO_COLORWAYS[number] | typeof SIGNATURE,
): string {
  if (colorway === SIGNATURE) {
    return lockupSvg({ kind, color: "bone", sealColor: "seal" });
  }
  return lockupSvg({ kind, color: colorway as BrandColor, sealColor: colorway as BrandColor });
}

function constructionDiagram(): string {
  const geometry = symbolGeometry(DISPLAY_SYMBOL_CONFIG);
  const scale = 1.5;
  const offset = 16;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="256" height="256" fill="none">`,
    `  <line x1="${offset}" y1="64" x2="112" y2="64" stroke="${BRAND_COLORS.line}" stroke-width="1" stroke-dasharray="3 4"/>`,
    `  <line x1="64" y1="${offset}" x2="64" y2="112" stroke="${BRAND_COLORS.line}" stroke-width="1" stroke-dasharray="3 4"/>`,
    `  <circle cx="64" cy="64" r="${geometry.radius * scale}" stroke="${BRAND_COLORS.line}" stroke-width="1" stroke-dasharray="3 4"/>`,
    `  <g transform="translate(${offset} ${offset}) scale(${scale})">`,
    `    <path d="${geometry.arc}" stroke="${BRAND_COLORS.bone}" stroke-width="${geometry.strokeWidth}" stroke-linecap="butt"/>`,
    `    <rect x="${geometry.seal.x}" y="${geometry.seal.y}" width="${geometry.seal.size}" height="${geometry.seal.size}" fill="${BRAND_COLORS.seal}"/>`,
    `  </g>`,
    `</svg>`,
    ``,
  ].join("\n");
}

async function main(): Promise<void> {
  for (const colorway of [...MONO_COLORWAYS, SIGNATURE]) {
    await emit(join(BRAND, "symbol", `called-symbol-${colorway}.svg`), symbolFor(colorway, false));
    await emit(
      join(BRAND, "symbol", `called-symbol-micro-${colorway}.svg`),
      symbolFor(colorway, true),
    );
  }

  for (const colorway of MONO_COLORWAYS) {
    await emit(
      join(BRAND, "wordmark", `called-wordmark-${colorway}.svg`),
      wordmarkSvg({ color: colorway as BrandColor }),
    );
  }

  for (const kind of ["horizontal", "compact"] as const) {
    for (const colorway of [...MONO_COLORWAYS, SIGNATURE]) {
      await emit(
        join(BRAND, "lockup", `called-lockup-${kind}-${colorway}.svg`),
        lockupFor(kind, colorway),
      );
    }
  }

  for (const size of ICON_SIZES) {
    await emit(
      join(BRAND, "icons", `called-icon-${size}.svg`),
      symbolSvg({ color: "bone", sealColor: "bone", config: iconConfigFor(size), size }),
    );
  }

  await emit(join(BRAND, "construction.svg"), constructionDiagram());

  for (const entry of written) {
    console.log(`  ${entry.path}  ${entry.bytes} bytes`);
  }
  console.log(`${written.length} brand assets written`);
  console.log(
    `lockup geometry: ${JSON.stringify(LOCKUP_SPEC)}, display stroke ${DISPLAY_SYMBOL_CONFIG.strokeWidth}, micro stroke ${MICRO_SYMBOL_CONFIG.strokeWidth}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
