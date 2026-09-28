import { describe, expect, it } from "vitest";
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH, validateAsk } from "./ask-gate";

const now = new Date("2026-09-26T00:00:00Z");

const valid = {
  text: "Will the NVDA token close at or above $210.00 on 3 Oct 2026?",
  source: "dex.twap:pool-1:30m",
  test: "gte 210",
  resolvesAt: new Date("2026-10-03T21:00:00Z"),
  closesAt: new Date("2026-10-03T19:00:00Z"),
  now,
};

describe("validateAsk", () => {
  it("accepts a complete, precise question", () => {
    expect(validateAsk(valid)).toEqual({ ok: true });
  });

  it("rejects text that is too short", () => {
    const result = validateAsk({ ...valid, text: "NVDA up?" });
    expect(result).toMatchObject({ ok: false, reason: "text_length" });
  });

  it("rejects text that is too long", () => {
    const result = validateAsk({ ...valid, text: "a".repeat(MAX_TEXT_LENGTH + 1) });
    expect(result).toMatchObject({ ok: false, reason: "text_length" });
  });

  it("accepts text at the length boundaries", () => {
    const short = "x".repeat(MIN_TEXT_LENGTH);
    const long = "x".repeat(MAX_TEXT_LENGTH);
    expect(validateAsk({ ...valid, text: short })).toEqual({ ok: true });
    expect(validateAsk({ ...valid, text: long })).toEqual({ ok: true });
  });

  it("rejects vague wording and names the word", () => {
    const result = validateAsk({
      ...valid,
      text: "Will the NVDA token likely close higher on 3 Oct 2026?",
    });
    expect(result).toMatchObject({ ok: false, reason: "vague_word" });
    if (!result.ok) {
      expect(result.message).toContain("likely");
    }
  });

  it("rejects a missing source", () => {
    expect(validateAsk({ ...valid, source: "  " })).toMatchObject({
      ok: false,
      reason: "missing_source",
    });
  });

  it("rejects an unreadable source", () => {
    expect(validateAsk({ ...valid, source: "http://example.com" })).toMatchObject({
      ok: false,
      reason: "unreadable_source",
    });
  });

  it("accepts each supported source scheme", () => {
    for (const source of ["dex.twap:pool:30m", "oracle:feed-1", "manual"]) {
      expect(validateAsk({ ...valid, source })).toEqual({ ok: true });
    }
  });

  it("rejects an unparseable test", () => {
    expect(validateAsk({ ...valid, test: "above 210" })).toMatchObject({
      ok: false,
      reason: "unparseable_test",
    });
  });

  it("rejects a resolution date in the past", () => {
    expect(
      validateAsk({ ...valid, resolvesAt: new Date("2026-09-01T00:00:00Z") }),
    ).toMatchObject({ ok: false, reason: "past_resolve_date" });
  });

  it("rejects an invalid resolution date", () => {
    expect(validateAsk({ ...valid, resolvesAt: new Date("nope") })).toMatchObject({
      ok: false,
      reason: "missing_resolve_date",
    });
  });

  it("rejects a close date at or after the resolution date", () => {
    expect(
      validateAsk({ ...valid, closesAt: new Date("2026-10-03T21:00:00Z") }),
    ).toMatchObject({ ok: false, reason: "close_after_resolve" });
  });

  it("names the missing part in every rejection message", () => {
    const result = validateAsk({ ...valid, source: "", test: "above 210" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.reason).toBe("missing_source");
    }
  });
});
