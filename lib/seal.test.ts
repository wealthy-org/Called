import { describe, expect, it } from "vitest";
import { GENESIS_PREV_HASH, sha256Hex } from "./hash";
import {
  buildChainRecord,
  commitHash,
  computeCommit,
  recordHash,
  stablePayloadJson,
  validateProbability,
  type ChainRecord,
  type SealPayload,
} from "./seal";

const payload: SealPayload = {
  p: 0.62,
  handle: "alice",
  rationale: "TWAP has held above 210 for six hours.",
};
const salt = "9f8e7d6c5b4a39281706";

describe("commitHash", () => {
  it("equals sha256 of payloadJson|salt", async () => {
    const json = stablePayloadJson(payload);
    await expect(commitHash(json, salt)).resolves.toBe(
      await sha256Hex(`${json}|${salt}`),
    );
  });

  it("is 64 hex characters", async () => {
    await expect(commitHash("{}", salt)).resolves.toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when the salt changes", async () => {
    const json = stablePayloadJson(payload);
    const first = await commitHash(json, salt);
    const second = await commitHash(json, "00000000000000000000");
    expect(first).not.toBe(second);
  });

  it("changes when one character of the payload changes", async () => {
    const a = await commitHash('{"p":0.62}', salt);
    const b = await commitHash('{"p":0.63}', salt);
    expect(a).not.toBe(b);
  });

  it("does not accept a payload+salt pair that was not committed", async () => {
    const commit = await computeCommit(payload, salt);
    const other = await computeCommit({ ...payload, p: 0.63 }, salt);
    expect(commit).not.toBe(other);
  });
});

describe("stablePayloadJson", () => {
  it("emits keys in a fixed order regardless of input order", () => {
    const reordered = {
      rationale: payload.rationale,
      handle: payload.handle,
      p: payload.p,
    } satisfies SealPayload;
    expect(stablePayloadJson(reordered)).toBe(stablePayloadJson(payload));
  });
});

describe("recordHash", () => {
  const sealedAt = new Date("2026-09-26T10:00:00.000Z");

  it("equals sha256 of index|commit|sealed_at|prev", async () => {
    const commit = await commitHash("{}", salt);
    await expect(recordHash(0, commit, sealedAt, GENESIS_PREV_HASH)).resolves.toBe(
      await sha256Hex(`0|${commit}|2026-09-26T10:00:00.000Z|${GENESIS_PREV_HASH}`),
    );
  });

  it("changes when the index changes", async () => {
    const commit = await commitHash("{}", salt);
    const first = await recordHash(0, commit, sealedAt, GENESIS_PREV_HASH);
    const second = await recordHash(1, commit, sealedAt, GENESIS_PREV_HASH);
    expect(first).not.toBe(second);
  });

  it("changes when the previous hash changes", async () => {
    const commit = await commitHash("{}", salt);
    const first = await recordHash(0, commit, sealedAt, GENESIS_PREV_HASH);
    const second = await recordHash(0, commit, sealedAt, "f".repeat(64));
    expect(first).not.toBe(second);
  });
});

describe("buildChainRecord", () => {
  const sealedAt = new Date("2026-09-26T10:00:00.000Z");

  it("links the first record to 64 zeros", async () => {
    const record = await buildChainRecord({
      index: 0,
      commit: await commitHash("{}", salt),
      sealedAt,
      prev: GENESIS_PREV_HASH,
    });
    expect(record.prev).toBe("0".repeat(64));
    expect(record.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("chains each record to the hash before it", async () => {
    const chain: ChainRecord[] = [];
    let prev = GENESIS_PREV_HASH;

    for (let index = 0; index < 3; index += 1) {
      const record = await buildChainRecord({
        index,
        commit: await commitHash(`{"p":0.${index + 1}}`, salt),
        sealedAt: new Date(sealedAt.getTime() + index * 1000),
        prev,
      });
      chain.push(record);
      prev = record.hash;
    }

    for (let i = 0; i < chain.length; i += 1) {
      const expectedPrev = i === 0 ? GENESIS_PREV_HASH : chain[i - 1]!.hash;
      expect(chain[i]!.prev).toBe(expectedPrev);
      await expect(
        recordHash(
          chain[i]!.index,
          chain[i]!.commit,
          chain[i]!.sealedAt,
          chain[i]!.prev,
        ),
      ).resolves.toBe(chain[i]!.hash);
    }
  });
});

describe("validateProbability", () => {
  it("accepts the closed unit interval", () => {
    expect(validateProbability(0)).toBeNull();
    expect(validateProbability(0.5)).toBeNull();
    expect(validateProbability(1)).toBeNull();
  });

  it("rejects out of range and non finite values", () => {
    expect(validateProbability(-0.01)).toBeTypeOf("string");
    expect(validateProbability(1.01)).toBeTypeOf("string");
    expect(validateProbability(Number.NaN)).toBeTypeOf("string");
    expect(validateProbability(Number.POSITIVE_INFINITY)).toBeTypeOf("string");
  });

  it("explains why a value was rejected", () => {
    expect(validateProbability(1.01)).toMatch(/between 0 and 1/);
    expect(validateProbability(Number.NaN)).toMatch(/finite/);
  });
});
