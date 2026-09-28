import { describe, expect, it } from "vitest";
import { calibrationBins, calibrationSkew } from "./calibration";

describe("calibrationBins", () => {
  it("places a p of 0.5 in bin 5 of 10", () => {
    const result = calibrationBins(
      [
        { p: 0.5, outcome: true },
        { p: 0.5, outcome: false },
      ],
      10,
    );
    expect(result.bins).toBe(10);
    expect(result.data[5].n).toBe(2);
    expect(result.data[5].meanP).toBeCloseTo(0.5, 10);
    expect(result.data[5].outcomeRate).toBeCloseTo(0.5, 10);
  });

  it("places a p of exactly 1 in the last bin", () => {
    const result = calibrationBins([{ p: 1, outcome: true }], 10);
    expect(result.data[9].n).toBe(1);
    expect(result.data[9].high).toBe(1);
  });

  it("counts a perfect forecaster into the extreme bins", () => {
    const result = calibrationBins(
      [
        { p: 1, outcome: true },
        { p: 1, outcome: true },
        { p: 0, outcome: false },
        { p: 0, outcome: false },
      ],
      10,
    );
    expect(result.data[9].outcomeRate).toBe(1);
    expect(result.data[0].outcomeRate).toBe(0);
  });

  it("keeps empty bins present with null rates", () => {
    const result = calibrationBins([{ p: 0.5, outcome: true }], 10);
    expect(result.data[0].n).toBe(0);
    expect(result.data[0].meanP).toBeNull();
    expect(result.data[0].outcomeRate).toBeNull();
  });

  it("rejects bin counts outside 5..10", () => {
    expect(() => calibrationBins([{ p: 0.5, outcome: true }], 4)).toThrow(
      /between 5 and 10/,
    );
    expect(() => calibrationBins([{ p: 0.5, outcome: true }], 11)).toThrow(
      /between 5 and 10/,
    );
  });

  it("rejects out-of-range probabilities", () => {
    expect(() => calibrationBins([{ p: 1.5, outcome: true }], 10)).toThrow(
      /invalid probability/,
    );
  });
});

describe("calibrationSkew", () => {
  it("is zero for a perfectly calibrated set", () => {
    const forecasts = [
      { p: 1, outcome: true },
      { p: 1, outcome: true },
      { p: 0, outcome: false },
      { p: 0, outcome: false },
    ];
    expect(calibrationSkew(forecasts)).toBeCloseTo(0, 10);
  });

  it("is positive for overconfidence", () => {
    const forecasts = [
      { p: 0.9, outcome: false },
      { p: 0.9, outcome: false },
    ];
    expect(calibrationSkew(forecasts)).toBeGreaterThan(0.5);
  });

  it("is zero on an empty populated set", () => {
    expect(calibrationSkew([])).toBe(0);
  });
});