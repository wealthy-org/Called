import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_SIZES } from "./geometry";
import { LOCKUP_SPEC, lockupSvg, symbolSvg, wordmarkSvg } from "./svg";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

describe("symbol colourways", () => {
  it("paints the arc and the seal block in the requested colours", () => {
    const svg = symbolSvg({ color: "bone", sealColor: "seal", config: { strokeWidth: 6, sealFactor: 2.4 } });
    expect(svg).toContain('stroke="#ece9e4"');
    expect(svg).toContain('fill="#ff5a36"');
    expect(svg).toContain('stroke-linecap="butt"');
  });

  it("emits a single-colour mark when both colours match", () => {
    const svg = symbolSvg({ color: "seal", sealColor: "seal", config: { strokeWidth: 6, sealFactor: 2.4 } });
    expect(svg).toContain('stroke="#ff5a36"');
    expect(svg).toContain('fill="#ff5a36"');
    expect(svg).not.toContain("#ece9e4");
  });

  it("accepts a raw colour string as well as a token name", () => {
    const svg = symbolSvg({ color: "#123456", config: { strokeWidth: 6, sealFactor: 2.4 } });
    expect(svg).toContain('stroke="#123456"');
  });
});

describe("wordmark", () => {
  it("draws nine strokes for the six glyphs", () => {
    const svg = wordmarkSvg({ color: "bone" });
    expect(svg.match(/<path /g)).toHaveLength(9);
  });

  it("keeps the requested aspect ratio", () => {
    const svg = wordmarkSvg({ color: "bone", height: 32 });
    expect(svg).toContain('width="109"');
    expect(svg).toContain('height="32"');
  });
});

describe("lockups", () => {
  it("scales the compact lockup to half the horizontal view box", () => {
    const compact = lockupSvg({ kind: "compact", color: "bone" });
    expect(compact).toContain('viewBox="0 0 145 32"');
    expect(compact).toContain('transform="scale(0.5)"');
    expect(compact).toContain("translate(74 2)");
  });

  it("keeps the horizontal lockup at full scale", () => {
    const horizontal = lockupSvg({ kind: "horizontal", color: "bone" });
    expect(horizontal).toContain('viewBox="0 0 290 64"');
    expect(horizontal).toContain('transform="scale(1)"');
  });

  it("sizes the rendered output from the requested height", () => {
    const svg = lockupSvg({ kind: "horizontal", color: "bone", height: 32 });
    expect(svg).toContain('height="32"');
    expect(svg).toContain(LOCKUP_SPEC.horizontal.width === 290 ? 'width="145"' : 'width="0"');
  });
});

describe("generated brand assets", () => {
  const symbolFiles = [
    "brand/symbol/called-symbol-signature.svg",
    "brand/symbol/called-symbol-bone.svg",
    "brand/symbol/called-symbol-seal.svg",
    "brand/symbol/called-symbol-black.svg",
    "brand/symbol/called-symbol-white.svg",
    "brand/symbol/called-symbol-micro-signature.svg",
    "brand/construction.svg",
    "brand/brand-sheet.html",
    "brand/SPEC.md",
  ];

  it.each(symbolFiles)("ships %s and keeps it well formed", (file) => {
    const contents = read(file);
    expect(contents.length).toBeGreaterThan(0);
    if (file.endsWith(".svg")) {
      expect(contents.startsWith("<svg")).toBe(true);
      expect(contents).toContain("viewBox=");
      expect(contents.trimEnd().endsWith("</svg>")).toBe(true);
    }
  });

  it.each(ICON_SIZES)("declares its own pixel size for the %ipx icon", (size) => {
    const svg = read(`brand/icons/called-icon-${size}.svg`);
    expect(svg).toContain(`width="${size}" height="${size}"`);
    expect(svg).toContain(`stroke-width="${size <= 24 ? 8 : 6}"`);
  });

  it.each(["horizontal", "compact"] as const)("ships both colourways of the %s lockup", (kind) => {
    for (const colorway of ["bone", "seal", "black", "white", "signature"]) {
      const svg = read(`brand/lockup/called-lockup-${kind}-${colorway}.svg`);
      expect(svg).toContain("viewBox=");
    }
  });

  it("uses the micro construction for the favicon sizes and display for the rest", () => {
    expect(read("brand/icons/called-icon-16.svg")).toContain('stroke-width="8"');
    expect(read("brand/icons/called-icon-24.svg")).toContain('stroke-width="8"');
    expect(read("brand/icons/called-icon-32.svg")).toContain('stroke-width="6"');
    expect(read("brand/icons/called-icon-128.svg")).toContain('stroke-width="6"');
  });
});
