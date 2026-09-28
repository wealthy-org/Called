import { describe, expect, it } from "vitest";
import {
  MIN_POOL_VOLUME_USD,
  readTwap,
  type TwapReader,
} from "./dex-twap";
import { parseSource } from "./source";

const spec = parseSource("dex.twap:pool-1:30m") as {
  kind: "dex.twap";
  pool: string;
  window: string;
};

function reader(observation: unknown): TwapReader {
  return {
    twap: () => Promise.resolve(observation),
  };
}

const good = {
  pool: "pool-1",
  price: "212.5",
  volumeUsd: 90_000,
  blockNumber: 12345,
  observedAt: "2026-10-03T21:00:00Z",
  trades: 42,
};

describe("parseSource", () => {
  it("parses a dex.twap source", () => {
    expect(spec).toEqual({ kind: "dex.twap", pool: "pool-1", window: "30m" });
  });

  it("parses an oracle source", () => {
    expect(parseSource("oracle:0xfeed")).toEqual({ kind: "oracle", feed: "0xfeed" });
  });

  it("parses a bare manual source", () => {
    expect(parseSource("manual")).toEqual({ kind: "manual" });
  });

  it.each([
    "dex.twap:pool-1",
    "dex.twap:pool-1:30",
    "dex.twap::30m",
    "dex.twap:pool-1:30m:extra",
    "oracle:",
    "manual:extra",
    "http://example.com",
  ])("rejects %s", (source) => {
    expect(() => parseSource(source)).toThrow();
  });
});

describe("readTwap", () => {
  it("returns one number with its block", async () => {
    const result = await readTwap(spec, reader(good));
    expect(result).toEqual({
      ok: true,
      value: 212.5,
      blockNumber: 12345,
      observedAt: "2026-10-03T21:00:00Z",
      pool: "pool-1",
      window: "30m",
    });
  });

  it("voids when the pool is below the liquidity threshold", async () => {
    const result = await readTwap(
      spec,
      reader({ ...good, volumeUsd: MIN_POOL_VOLUME_USD - 1 }),
    );
    expect(result).toMatchObject({
      ok: false,
      reason: "below_liquidity_threshold",
    });
  });

  it("voids when the pool had no trades in the window", async () => {
    const result = await readTwap(spec, reader({ ...good, trades: 0 }));
    expect(result).toMatchObject({ ok: false, reason: "no_trades_in_window" });
  });

  it("voids when the reader throws", async () => {
    const result = await readTwap(
      spec,
      { twap: () => Promise.reject(new Error("rpc timeout")) },
    );
    expect(result).toMatchObject({ ok: false, reason: "source_unreachable" });
  });

  it.each([
    ["null", null],
    ["a string", "212.5"],
    ["a bare number", 212.5],
    ["a missing price", { ...good, price: undefined }],
    ["a non-numeric price", { ...good, price: "high" }],
    ["a missing block", { ...good, blockNumber: undefined }],
  ])("voids on %s", async (_label, observation) => {
    const result = await readTwap(spec, reader(observation));
    expect(result).toMatchObject({ ok: false, reason: "malformed_response" });
  });

  it("voids when the answer is for a different pool", async () => {
    const result = await readTwap(spec, reader({ ...good, pool: "pool-9" }));
    expect(result).toMatchObject({ ok: false, reason: "malformed_response" });
  });
});
