import { describe, expect, it } from "vitest";
import {
  DISPLAY_SYMBOL_CONFIG,
  MICRO_MAX_SIZE,
  MICRO_SYMBOL_CONFIG,
  SYMBOL_SIZE,
  WORDMARK_GLYPHS,
  WORDMARK_TEXT,
  arcPath,
  iconConfigFor,
  partToPath,
  round,
  symbolGeometry,
} from "./geometry";

describe("symbol geometry", () => {
  it("keeps the mark inside the 64 unit canvas", () => {
    const geometry = symbolGeometry(DISPLAY_SYMBOL_CONFIG);
    const outer = geometry.radius + geometry.strokeWidth / 2;
    const inner = geometry.radius - geometry.strokeWidth / 2;
    expect(outer).toBeLessThan(SYMBOL_SIZE / 2);
    expect(inner).toBeGreaterThan(0);
  });

  it("leaves the requested gap at three o'clock", () => {
    const geometry = symbolGeometry(DISPLAY_SYMBOL_CONFIG);
    const centre = SYMBOL_SIZE / 2;
    const halfGap = geometry.gapDegrees / 2;
    const span = round(centre + geometry.radius * Math.cos((halfGap * Math.PI) / 180));
    const rise = round(centre + geometry.radius * Math.sin((halfGap * Math.PI) / 180));

    expect(geometry.gapDegrees).toBe(44);
    expect(geometry.arc).toBe(
      `M ${span} ${rise} A ${geometry.radius} ${geometry.radius} 0 1 1 ${span} ${round(2 * centre - rise)}`,
    );
  });

  it("plugs the seal into the gap, straddling the arc radius", () => {
    const geometry = symbolGeometry(DISPLAY_SYMBOL_CONFIG);
    const centre = SYMBOL_SIZE / 2;
    const sealMid = geometry.seal.x + geometry.seal.size / 2;
    expect(sealMid).toBeGreaterThan(centre + geometry.radius - geometry.strokeWidth);
    expect(geometry.seal.y + geometry.seal.size).toBeLessThanOrEqual(centre + geometry.radius);
    expect(geometry.seal.y).toBeGreaterThanOrEqual(centre - geometry.radius);
  });

  it("scales the seal block with the stroke for the micro construction", () => {
    const display = symbolGeometry(DISPLAY_SYMBOL_CONFIG);
    const micro = symbolGeometry(MICRO_SYMBOL_CONFIG);
    expect(micro.seal.size).toBeGreaterThan(display.seal.size);
    expect(micro.strokeWidth).toBe(8);
  });
});

describe("icon construction selection", () => {
  it("uses the thicker micro construction at and below the threshold", () => {
    expect(iconConfigFor(16)).toBe(MICRO_SYMBOL_CONFIG);
    expect(iconConfigFor(24)).toBe(MICRO_SYMBOL_CONFIG);
    expect(iconConfigFor(MICRO_MAX_SIZE)).toBe(MICRO_SYMBOL_CONFIG);
  });

  it("uses the display construction above the threshold", () => {
    expect(iconConfigFor(32)).toBe(DISPLAY_SYMBOL_CONFIG);
    expect(iconConfigFor(128)).toBe(DISPLAY_SYMBOL_CONFIG);
  });
});

describe("arc path", () => {
  it("starts and ends on the pitch circle", () => {
    const path = arcPath(0, 0, 10, 0, 90);
    expect(path).toContain("M 10 0");
    expect(path).toContain("A 10 10 0 0 1");
  });

  it("flags a major arc when the sweep passes 180 degrees", () => {
    expect(arcPath(0, 0, 10, 0, 300)).toContain("A 10 10 0 1 1");
  });
});

describe("circle glyph helper", () => {
  it("draws two half arcs so the ring is closed", () => {
    const path = partToPath({ kind: "circle", cx: 10, cy: 10, r: 5 });
    expect(path.match(/A /g)).toHaveLength(2);
    expect(path).toContain("M 5 10");
  });
});

describe("wordmark glyphs", () => {
  it("spells Called in title case", () => {
    expect(WORDMARK_TEXT).toBe("Called");
  });

  it("keeps a uniform 10 unit optical gap between glyphs", () => {
    const gaps = WORDMARK_GLYPHS.slice(1).map(
      (glyph, index) => glyph.inkStart - WORDMARK_GLYPHS[index].inkEnd,
    );
    for (const gap of gaps) {
      expect(gap).toBeCloseTo(10, 5);
    }
  });

  it("never lets adjacent glyph ink overlap", () => {
    WORDMARK_GLYPHS.slice(1).forEach((glyph, index) => {
      expect(glyph.inkStart).toBeGreaterThan(WORDMARK_GLYPHS[index].inkEnd);
    });
  });

  it("uses the sealed-arc construction for the C", () => {
    const cap = WORDMARK_GLYPHS[0];
    expect(cap.letter).toBe("C");
    expect(cap.parts).toHaveLength(1);
    expect(cap.parts[0].kind).toBe("arc");
  });

  it("gives the round glyphs a stem or a bar, never both", () => {
    const round = WORDMARK_GLYPHS.filter((glyph) => glyph.letter !== "C" && glyph.letter !== "l");
    for (const glyph of round) {
      expect(glyph.parts).toHaveLength(2);
      expect(glyph.parts.filter((part) => part.kind === "line")).toHaveLength(1);
    }
  });
});
