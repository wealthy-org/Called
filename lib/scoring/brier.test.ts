import { describe, expect, it } from "vitest";
import { brierMean, brierScore } from "./brier";

describe("brierScore", () => {
  it("scores a p of 1 on a YES outcome as 0", () => {
    expect(brierScore(1, true)).toBe(0);
  });

  it("scores a p of 0 on a NO outcome as 0", () => {
    expect(brierScore(0, false)).toBe(0);
  });

  it("scores a perfect NO as 0", () => {
    expect(brierScore(0, true)).toBe(1);
  });

  it("scores a perfect YES as 0", () => {
    expect(brierScore(1, false)).toBe(1);
  });

  it("scores p 0.5 on YES as 0.25", () => {
    expect(brierScore(0.5, true)).toBe(0.25);
  });

  it("is symmetric: one wrong endpoint and one half equal each other", () => {
    expect(brierScore(0, true)).toBe(brierScore(1, false));
    expect(brierScore(0.5, true)).toBe(0.25);
  });

  it("matches a hand fixture", () => {
    const fixture = [
      { p: 0.9, outcome: true }, // 0.01
      { p: 0.2, outcome: false }, // 0.04
      { p: 0.6, outcome: true }, // 0.16
      { p: 0.3, outcome: true }, // 0.49
    ];
    const expectedMean = (0.01 + 0.04 + 0.16 + 0.49) / 4;
    expect(brierMean(fixture)).toBeCloseTo(expectedMean, 12);
  });
});

describe("brierMean", () => {
  it("rejects an empty set", () => {
    expect(() => brierMean([])).toThrow(/at least one/);
  });
});