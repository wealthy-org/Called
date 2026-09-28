import { describe, expect, it } from "vitest";
import { dateSegment, questionId } from "./question-id";

const base = {
  text: "Will the NVDA token close at or above $210.00 on 3 Oct 2026?",
  date: "2026-10-03",
  source: "dex.twap:pool-1:30m",
  test: "gte 210",
};

describe("dateSegment", () => {
  it("passes through an ISO date string", () => {
    expect(dateSegment("2026-10-03T21:00:00Z")).toBe("2026-10-03");
  });

  it("formats a Date as YYYY-MM-DD", () => {
    expect(dateSegment(new Date("2026-10-03T21:00:00Z"))).toBe("2026-10-03");
  });
});

describe("questionId", () => {
  it("matches q-<date>-<6 hex>", async () => {
    const id = await questionId(base);
    expect(id).toMatch(/^q-2026-10-03-[0-9a-f]{6}$/);
  });

  it("is deterministic for identical input", async () => {
    await expect(questionId(base)).resolves.toBe(await questionId({ ...base }));
  });

  it("changes when one word of the text changes", async () => {
    const reworded = await questionId({
      ...base,
      text: base.text.replace("NVDA", "AMD"),
    });
    expect(reworded).not.toBe(await questionId(base));
  });

  it("changes when the date changes", async () => {
    const moved = await questionId({ ...base, date: "2026-10-04" });
    expect(moved).not.toBe(await questionId(base));
  });

  it("changes when the source changes", async () => {
    const other = await questionId({ ...base, source: "dex.twap:pool-2:30m" });
    expect(other).not.toBe(await questionId(base));
  });

  it("changes when the test changes", async () => {
    const other = await questionId({ ...base, test: "gt 210" });
    expect(other).not.toBe(await questionId(base));
  });

  it("uses only the date portion of a timestamped date", async () => {
    await expect(
      questionId({ ...base, date: "2026-10-03T21:00:00Z" }),
    ).resolves.toBe(await questionId(base));
  });
});
