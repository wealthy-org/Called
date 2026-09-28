import { describe, expect, it } from "vitest";
import { MAX_READING_AGE_MS, readOracle, type OracleReader } from "./oracle";
import { isOracleFeedAllowlisted, parseSource } from "./source";

const now = new Date("2026-10-03T21:00:00Z");
const allowlist = ["0xFeed1", "0xfeed2"];

const spec = parseSource("oracle:0xFeed1") as {
  kind: "oracle";
  feed: string;
};

function reader(payload: unknown): OracleReader {
  return { read: () => Promise.resolve(payload) };
}

const good = {
  value: "212.5",
  blockNumber: 12345,
  observedAt: "2026-10-03T21:00:00Z",
  updatedAt: "2026-10-03T20:59:00Z",
};

describe("isOracleFeedAllowlisted", () => {
  it("matches case insensitively", () => {
    expect(isOracleFeedAllowlisted("0xFEED1", allowlist)).toBe(true);
  });

  it("rejects an unknown feed", () => {
    expect(isOracleFeedAllowlisted("0xbeef", allowlist)).toBe(false);
  });
});

describe("readOracle", () => {
  it("returns one number with its block", async () => {
    const result = await readOracle(spec, reader(good), { allowlist, now });
    expect(result).toEqual({
      ok: true,
      value: 212.5,
      blockNumber: 12345,
      observedAt: "2026-10-03T21:00:00Z",
    });
  });

  it("refuses a feed that is not verified", async () => {
    const unlisted = parseSource("oracle:0xbeef") as {
      kind: "oracle";
      feed: string;
    };
    const result = await readOracle(unlisted, reader(good), { allowlist, now });
    expect(result).toMatchObject({ ok: false, reason: "unverified_feed" });
  });

  it("voids when the feed is unreachable", async () => {
    const result = await readOracle(
      spec,
      { read: () => Promise.reject(new Error("rpc timeout")) },
      { allowlist, now },
    );
    expect(result).toMatchObject({ ok: false, reason: "source_unreachable" });
  });

  it("voids a stale reading", async () => {
    const stale = {
      ...good,
      updatedAt: new Date(now.getTime() - MAX_READING_AGE_MS - 1).toISOString(),
    };
    const result = await readOracle(spec, reader(stale), { allowlist, now });
    expect(result).toMatchObject({ ok: false, reason: "stale_reading" });
  });

  it("accepts a reading exactly at the age limit", async () => {
    const edge = {
      ...good,
      updatedAt: new Date(now.getTime() - MAX_READING_AGE_MS).toISOString(),
    };
    const result = await readOracle(spec, reader(edge), { allowlist, now });
    expect(result).toMatchObject({ ok: true, value: 212.5 });
  });

  it.each([
    ["null", null],
    ["a missing value", { ...good, value: undefined }],
    ["a non-numeric value", { ...good, value: "high" }],
    ["a missing block", { ...good, blockNumber: undefined }],
    ["a bad updatedAt", { ...good, updatedAt: "soon" }],
  ])("voids on %s", async (_label, payload) => {
    const result = await readOracle(spec, reader(payload), { allowlist, now });
    expect(result).toMatchObject({ ok: false, reason: "malformed_response" });
  });
});
