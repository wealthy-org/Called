import { describe, expect, it } from "vitest";
import { murphyDecomposition } from "./murphy";

describe("murphyDecomposition", () => {
  it("decomposes a perfectly calibrated set with small remainder", () => {
    const forecasts = [
      { p: 1, outcome: true },
      { p: 1, outcome: true },
      { p: 0, outcome: false },
      { p: 0, outcome: false },
    ];
    const result = murphyDecomposition(forecasts);
    expect(result.forecasts).toBe(4);
    expect(result.baseRate).toBe(0.5);
    expect(result.reliability).toBeCloseTo(0, 10);
    expect(result.resolution).toBeCloseTo(0.25, 10);
    expect(result.uncertainty).toBeCloseTo(0.25, 10);
    expect(
      result.brier - (result.reliability - result.resolution + result.uncertainty),
    ).toBeCloseTo(result.remainder, 10);
    expect(result.brier).toBeCloseTo(0, 10);
    expect(Math.abs(result.remainder)).toBeLessThan(1e-9);
  });

  it("rewards a well-resolved set with low reliability", () => {
    const forecasts = [
      { p: 1, outcome: true },
      { p: 1, outcome: true },
      { p: 0, outcome: false },
      { p: 0, outcome: false },
    ];
    const result = murphyDecomposition(forecasts);
    expect(result.reliability).toBeCloseTo(0, 10);
    expect(result.resolution).toBeGreaterThan(0.2);
    expect(result.brier).toBeLessThan(0.1);
  });

  it("penalizes overconfidence with positive reliability", () => {
    const forecasts = [
      { p: 0.9, outcome: false },
      { p: 0.9, outcome: false },
    ];
    const result = murphyDecomposition(forecasts);
    expect(result.reliability).toBeGreaterThan(0.4);
    expect(result.brier).toBeCloseTo(0.81, 10);
  });

  it("groups identical probabilities into one bin", () => {
    const forecasts = [
      { p: 0.5, outcome: true },
      { p: 0.5, outcome: false },
    ];
    const result = murphyDecomposition(forecasts);
    expect(result.baseRate).toBe(0.5);
    expect(result.reliability).toBeCloseTo(0, 10);
    expect(result.resolution).toBeCloseTo(0, 10);
  });

  it("rejects an empty set", () => {
    expect(() => murphyDecomposition([])).toThrow(/at least one/);
  });
});