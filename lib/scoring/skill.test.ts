import { describe, expect, it } from "vitest";
import { sharedSetSkill, skillVsAlwaysYes } from "./skill";

describe("skillVsAlwaysYes", () => {
  it("matches a hand fixture", () => {
    const forecasts = [
      { p: 0.9, outcome: true },
      { p: 0.8, outcome: true },
      { p: 0.2, outcome: false },
      { p: 0.6, outcome: true },
    ];
    expect(skillVsAlwaysYes(forecasts)).toBeCloseTo(75, 10);
  });

  it("is 100 for a perfect flag", () => {
    const forecasts = [
      { p: 1, outcome: true },
      { p: 1, outcome: true },
      { p: 0, outcome: false },
    ];
    expect(skillVsAlwaysYes(forecasts)).toBeCloseTo(100, 10);
  });

  it("is 0 for an always-yes forecaster", () => {
    const forecasts = [
      { p: 1, outcome: true },
      { p: 1, outcome: true },
      { p: 1, outcome: false },
    ];
    expect(skillVsAlwaysYes(forecasts)).toBeCloseTo(0, 10);
  });

  it("rejects an empty set", () => {
    expect(() => skillVsAlwaysYes([])).toThrow(/at least one/);
  });
});

describe("sharedSetSkill", () => {
  it("compares both sides only on the shared set", () => {
    const result = sharedSetSkill([
      {
        forecasts: [
          { p: 0.9, outcome: true },
          { p: 0.8, outcome: true },
        ],
        baselineForecasts: [
          { p: 0.85, outcome: true },
          { p: 0.7, outcome: true },
        ],
      },
    ]);
    expect(typeof result.forecasterSkill).toBe("number");
    expect(typeof result.baselineSkill).toBe("number");
  });

  it("rejects a size mismatch between sides", () => {
    expect(() =>
      sharedSetSkill([
        {
          forecasts: [{ p: 0.5, outcome: true }],
          baselineForecasts: [
            { p: 0.5, outcome: true },
            { p: 0.5, outcome: true },
          ],
        },
      ]),
    ).toThrow(/equal forecast counts/);
  });
});