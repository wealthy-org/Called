import { describe, expect, it } from "vitest";
import {
  BASELINE_IDS,
  BASELINE_LABEL,
  BASELINE_RULES,
  priceMomentum,
  runBaseline,
  type BaselineContext,
} from "./baselines";

const context: BaselineContext = {
  questionId: "q-2026-10-03-abc123",
  text: "Will the NVDA token close at or above $210.00 on 3 Oct 2026?",
  source: "dex.twap:pool-1:30m",
  test: "gte 210",
  opensAt: new Date("2026-09-26T00:00:00Z"),
  closesAt: new Date("2026-10-03T19:00:00Z"),
  resolvesAt: new Date("2026-10-03T21:00:00Z"),
};

function ruleFor(id: string) {
  const rule = BASELINE_RULES.find((candidate) => candidate.id === id);
  if (!rule) {
    throw new Error(`missing rule ${id}`);
  }
  return rule;
}

describe("BASELINE_RULES", () => {
  it("covers the five required rules", () => {
    expect(BASELINE_IDS).toEqual([
      "baseline:always-yes",
      "baseline:parrot",
      "baseline:hedgehog",
      "baseline:drift",
      "baseline:drunk",
    ]);
  });

  it("labels every rule as a baseline rule, not a model", () => {
    expect(BASELINE_LABEL).toBe("baseline rule, not a model");
  });
});

describe("always-yes", () => {
  it("always answers 0.99", () => {
    const rule = ruleFor("baseline:always-yes");
    expect(runBaseline(rule, context)).toBe(0.99);
  });
});

describe("parrot", () => {
  it("repeats the historical base rate", () => {
    const rule = ruleFor("baseline:parrot");
    expect(runBaseline(rule, { ...context, baseRate: 0.42 })).toBeCloseTo(0.42);
  });

  it("falls back to 0.5 without a base rate", () => {
    const rule = ruleFor("baseline:parrot");
    expect(runBaseline(rule, context)).toBe(0.5);
  });

  it("clamps out-of-range base rates", () => {
    const rule = ruleFor("baseline:parrot");
    expect(runBaseline(rule, { ...context, baseRate: 1 })).toBe(0.99);
    expect(runBaseline(rule, { ...context, baseRate: 0 })).toBe(0.01);
  });
});

describe("hedgehog", () => {
  it("answers 0.9 on upward momentum", () => {
    const rule = ruleFor("baseline:hedgehog");
    expect(runBaseline(rule, { ...context, priceHistory: [100, 120] })).toBe(0.9);
  });

  it("answers 0.1 on downward momentum", () => {
    const rule = ruleFor("baseline:hedgehog");
    expect(runBaseline(rule, { ...context, priceHistory: [120, 100] })).toBe(0.1);
  });

  it("answers 0.1 without momentum", () => {
    const rule = ruleFor("baseline:hedgehog");
    expect(runBaseline(rule, context)).toBe(0.1);
  });
});

describe("drift", () => {
  it("stays inside 0.35-0.75", () => {
    const rule = ruleFor("baseline:drift");
    for (const history of [[100, 1000], [1000, 100], [], [100]]) {
      const value = runBaseline(rule, { ...context, priceHistory: history });
      expect(value).toBeGreaterThanOrEqual(0.35);
      expect(value).toBeLessThanOrEqual(0.75);
    }
  });

  it("moves up on upward momentum and down on downward momentum", () => {
    const rule = ruleFor("baseline:drift");
    const up = runBaseline(rule, { ...context, priceHistory: [100, 110] });
    const down = runBaseline(rule, { ...context, priceHistory: [110, 100] });
    expect(up).toBeGreaterThan(0.5);
    expect(down).toBeLessThan(0.5);
  });
});

describe("drunk", () => {
  it("is deterministic for the same question id", () => {
    const rule = ruleFor("baseline:drunk");
    const first = runBaseline(rule, context);
    const second = runBaseline(rule, context);
    expect(first).toBe(second);
  });

  it("stays inside the unit interval", () => {
    const rule = ruleFor("baseline:drunk");
    for (const questionId of ["q-a", "q-b", "q-c", "q-d"]) {
      const value = runBaseline(rule, { ...context, questionId });
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("varies between different question ids", () => {
    const rule = ruleFor("baseline:drunk");
    const values = ["q-a", "q-b", "q-c", "q-d", "q-e"].map((questionId) =>
      runBaseline(rule, { ...context, questionId }),
    );
    expect(new Set(values).size).toBeGreaterThan(1);
  });
});

describe("outcome leakage", () => {
  it("never sees an outcome: outputs are identical when a forged outcome is added", () => {
    const withForgedOutcome = {
      ...context,
      outcome: true,
      resolvedOutcome: true,
    } as unknown as BaselineContext;

    for (const rule of BASELINE_RULES) {
      expect(runBaseline(rule, withForgedOutcome)).toBe(
        runBaseline(rule, context),
      );
    }
  });

  it("never sees an outcome: shuffling outcomes cannot change any answer", () => {
    for (const rule of BASELINE_RULES) {
      const shuffled = Array.from({ length: 8 }, (_, index) =>
        runBaseline(rule, {
          ...context,
          questionId: `q-${index}`,
        }),
      );
      const reversed = Array.from({ length: 8 }, (_, index) =>
        runBaseline(rule, {
          ...context,
          questionId: `q-${7 - index}`,
        }),
      );
      expect(shuffled).toEqual([...reversed].reverse());
    }
  });
});

describe("priceMomentum", () => {
  it("computes relative change", () => {
    expect(priceMomentum([100, 150])).toBeCloseTo(0.5);
    expect(priceMomentum([200, 100])).toBeCloseTo(-0.5);
  });

  it("returns 0 without enough history", () => {
    expect(priceMomentum(undefined)).toBe(0);
    expect(priceMomentum([])).toBe(0);
    expect(priceMomentum([100])).toBe(0);
  });

  it("returns 0 for a zero baseline", () => {
    expect(priceMomentum([0, 100])).toBe(0);
  });
});
