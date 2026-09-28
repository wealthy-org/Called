import { describe, expect, it } from "vitest";
import { GENESIS_PREV_HASH } from "./hash";
import { buildChainRecord, commitHash } from "./seal";
import { verifyChain, type VerifiableRecord } from "./verify";

async function chain(length: number): Promise<VerifiableRecord[]> {
  const records: VerifiableRecord[] = [];
  let prev = GENESIS_PREV_HASH;

  for (let index = 0; index < length; index += 1) {
    const record = await buildChainRecord({
      index,
      commit: await commitHash(`{"p":0.${index + 1}}`, "abc123"),
      sealedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
      prev,
    });
    records.push(record);
    prev = record.hash;
  }

  return records;
}

describe("verifyChain", () => {
  it("accepts an empty chain as VALID", async () => {
    await expect(verifyChain([])).resolves.toEqual({
      status: "VALID",
      records: 0,
    });
  });

  it("accepts an intact chain", async () => {
    const records = await chain(5);
    await expect(verifyChain(records)).resolves.toEqual({
      status: "VALID",
      records: 5,
    });
  });

  it("names the first record whose hash was tampered with", async () => {
    const records = await chain(5);
    const tampered = records.map((record, i) =>
      i === 2 ? { ...record, hash: "b".repeat(64) } : record,
    );
    const verdict = await verifyChain(tampered);
    expect(verdict).toMatchObject({ status: "BROKEN", index: 2 });
  });

  it("names the first record whose link was broken", async () => {
    const records = await chain(5);
    const broken: VerifiableRecord[] = records.map((record, i) =>
      i === 3 ? { ...record, prev: "c".repeat(64) } : record,
    );
    const verdict = await verifyChain(broken);
    expect(verdict).toMatchObject({ status: "BROKEN", index: 3 });
  });

  it("reports index drift against position", async () => {
    const records = await chain(4);
    const drifted = records.map((record, i) =>
      i === 1 ? { ...record, index: 9 } : record,
    );
    const verdict = await verifyChain(drifted);
    expect(verdict).toMatchObject({ status: "BROKEN", index: 1 });
  });

  it("reports the first break, not a later one", async () => {
    const records = await chain(6);
    const broken = records.map((record, i) =>
      i === 1 || i === 4 ? { ...record, hash: "d".repeat(64) } : record,
    );
    const verdict = await verifyChain(broken);
    expect(verdict).toMatchObject({ status: "BROKEN", index: 1 });
  });

  it("rejects a chain whose genesis prev is not 64 zeros", async () => {
    const records = await chain(3);
    const forged = [{ ...records[0]!, prev: "1".repeat(64) }, ...records.slice(1)];
    const verdict = await verifyChain(forged);
    expect(verdict).toMatchObject({ status: "BROKEN", index: 0 });
  });

  it("gives a human readable reason for each break", async () => {
    const records = await chain(3);
    const tampered = records.map((record, i) =>
      i === 0 ? { ...record, hash: "e".repeat(64) } : record,
    );
    const verdict = await verifyChain(tampered);
    expect(verdict.status).toBe("BROKEN");
    if (verdict.status === "BROKEN") {
      expect(verdict.reason.length).toBeGreaterThan(0);
    }
  });
});
