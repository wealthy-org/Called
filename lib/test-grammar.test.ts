import { describe, expect, it } from "vitest";
import { evaluateTest, isParseableTest, parseTest } from "./test-grammar";

describe("parseTest", () => {
  it.each(["gte 210", "lte 210", "gt 210", "lt 210", "eq 210", "neq 210"])(
    "parses %s",
    (raw) => {
      expect(() => parseTest(raw)).not.toThrow();
    },
  );

  it("parses between with two bounds", () => {
    expect(parseTest("between 100 200")).toEqual({
      kind: "between",
      low: 100,
      high: 200,
    });
  });

  it("parses decimals and negatives", () => {
    expect(parseTest("gte 210.50")).toEqual({
      kind: "compare",
      operator: "gte",
      value: 210.5,
    });
    expect(parseTest("lt -3")).toEqual({
      kind: "compare",
      operator: "lt",
      value: -3,
    });
  });

  it("is case and whitespace insensitive", () => {
    expect(parseTest("  GTE   210 ")).toEqual(parseTest("gte 210"));
  });

  it.each([
    ["", "empty"],
    ["gte", "missing number"],
    ["gte 210 extra", "extra token"],
    ["above 210", "unknown operator"],
    ["gte abc", "non numeric"],
    ["between 200 100", "reversed bounds"],
    ["between 100", "missing bound"],
  ])("rejects %s (%s)", (raw) => {
    expect(() => parseTest(raw)).toThrow();
    expect(isParseableTest(raw)).toBe(false);
  });
});

describe("evaluateTest", () => {
  it("evaluates comparisons", () => {
    expect(evaluateTest(parseTest("gte 210"), 210)).toBe(true);
    expect(evaluateTest(parseTest("gte 210"), 209.99)).toBe(false);
    expect(evaluateTest(parseTest("gt 210"), 210)).toBe(false);
    expect(evaluateTest(parseTest("lte 210"), 210)).toBe(true);
    expect(evaluateTest(parseTest("lt 210"), 210)).toBe(false);
    expect(evaluateTest(parseTest("eq 210"), 210)).toBe(true);
    expect(evaluateTest(parseTest("neq 210"), 211)).toBe(true);
  });

  it("treats between as inclusive on both bounds", () => {
    const expression = parseTest("between 100 200");
    expect(evaluateTest(expression, 100)).toBe(true);
    expect(evaluateTest(expression, 200)).toBe(true);
    expect(evaluateTest(expression, 150)).toBe(true);
    expect(evaluateTest(expression, 99)).toBe(false);
    expect(evaluateTest(expression, 201)).toBe(false);
  });
});
