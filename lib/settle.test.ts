import { describe, expect, it } from "vitest";
import { settle, type SettleInput } from "./settle";

const base: SettleInput = {
  questionId: "q-2026-10-03-a1b2c3",
  test: "gte 210",
  status: "closed",
  resolvesAt: new Date("2026-10-03T21:00:00Z"),
  now: new Date("2026-10-03T21:05:00Z"),
  predictionCount: 4,
  source: {
    value: 212.5,
    blockNumber: 12345,
    observedAt: "2026-10-03T21:00:00Z",
  },
};

function withSource(source: unknown): SettleInput {
  return { ...base, source };
}

describe("settle", () => {
  it("applies the test and records the reading", () => {
    const result = settle(base);
    expect(result).toEqual({
      ok: true,
      status: "settled",
      outcome: "YES",
      readingValue: 212.5,
      readingBlock: 12345,
      observedAt: "2026-10-03T21:00:00Z",
      reason: null,
    });
  });

  it("returns NO when the test fails", () => {
    const failed = { value: 209.99, blockNumber: 12345, observedAt: "2026-10-03T21:00:00Z" };
    const result = settle(withSource(failed));
    expect(result).toMatchObject({ ok: true, outcome: "NO", readingValue: 209.99 });
  });

  it("voids instead of guessing when the source is unreadable", () => {
    const result = settle(withSource({ ok: false, reason: "source_unreachable", message: "rpc timeout" }));
    expect(result).toEqual({
      ok: true,
      status: "void",
      outcome: "VOID",
      readingValue: null,
      readingBlock: null,
      observedAt: null,
      reason: "rpc timeout",
    });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a number", 42],
    ["a non-numeric value", { value: "high", blockNumber: 1, observedAt: "x" }],
    ["a NaN value", { value: Number.NaN, blockNumber: 1, observedAt: "x" }],
    ["a missing block", { value: 1, observedAt: "x" }],
    ["a missing observedAt", { value: 1, blockNumber: 1 }],
  ])("voids when the source is %s", (_label, source) => {
    const result = settle(withSource(source));
    expect(result).toMatchObject({ ok: true, status: "void", outcome: "VOID" });
  });

  it("refuses to settle a question with no predictions", () => {
    const result = settle({ ...base, predictionCount: 0 });
    expect(result).toMatchObject({ ok: false, reason: "no_predictions" });
  });

  it("refuses to settle before the resolution time", () => {
    const result = settle({ ...base, now: new Date("2026-10-03T20:59:00Z") });
    expect(result).toMatchObject({ ok: false, reason: "not_closed" });
  });

  it("refuses to settle a question that is still open", () => {
    const result = settle({ ...base, status: "open" });
    expect(result).toMatchObject({ ok: false, reason: "not_closed" });
  });

  it("refuses to settle twice", () => {
    expect(settle({ ...base, status: "settled" })).toMatchObject({
      ok: false,
      reason: "already_settled",
    });
    expect(settle({ ...base, status: "void" })).toMatchObject({
      ok: false,
      reason: "already_settled",
    });
  });

  it("rejects an unparseable test", () => {
    const result = settle({ ...base, test: "above 210" });
    expect(result).toMatchObject({ ok: false, reason: "invalid_test" });
  });

  it("never receives probabilities, only a count", () => {
    const result = settle(base);
    expect(Object.keys(result).sort()).toEqual(
      [
        "ok",
        "observedAt",
        "outcome",
        "readingBlock",
        "readingValue",
        "reason",
        "status",
      ].sort(),
    );
  });

  it("settles a between test inclusively", () => {
    const result = settle({
      ...base,
      test: "between 200 220",
      source: { value: 220, blockNumber: 1, observedAt: "2026-10-03T21:00:00Z" },
    });
    expect(result).toMatchObject({ ok: true, outcome: "YES" });
  });

  it("reads a source that carries a block number as a number", () => {
    const result = settle({
      ...base,
      source: { value: 212.5, blockNumber: 77, observedAt: "2026-10-03T21:00:00Z" },
    });
    expect(result).toMatchObject({ ok: true, readingBlock: 77 });
  });
});
