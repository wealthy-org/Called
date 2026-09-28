import { describe, expect, it } from "vitest";
import { GENESIS_PREV_HASH } from "@/lib/hash";
import { recordHash } from "@/lib/seal";
import { verifyRecords, type LedgerRecordView } from "./verify";

async function makeChain(length: number): Promise<LedgerRecordView[]> {
  const records: LedgerRecordView[] = [];
  let prev = GENESIS_PREV_HASH;

  for (let index = 0; index < length; index += 1) {
    const record = {
      index,
      sealId: `seal-${index}`,
      questionId: "q-2026-10-03-abcdef",
      forecasterId: "human:0xabc",
      commit: "a".repeat(64),
      sealedAt: new Date(Date.UTC(2026, 9, 3, 21, index)).toISOString(),
      prev,
    };
    const hash = await recordHash(
      record.index,
      record.commit,
      new Date(record.sealedAt),
      record.prev,
    );
    records.push({ ...record, hash });
    prev = hash;
  }

  return records;
}

describe("verifyRecords", () => {
  it("reports VALID for an intact chain", async () => {
    const records = await makeChain(5);
    expect(await verifyRecords(records)).toEqual({ status: "VALID" });
  });

  it("reports VALID for an empty chain", async () => {
    expect(await verifyRecords([])).toEqual({ status: "VALID" });
  });

  it("reports VALID for a single genesis record", async () => {
    const records = await makeChain(1);
    expect(records[0].prev).toBe(GENESIS_PREV_HASH);
    expect(await verifyRecords(records)).toEqual({ status: "VALID" });
  });

  it("names the record whose own hash was tampered", async () => {
    const records = await makeChain(4);
    const broken = records.map((record, index) =>
      index === 2 ? { ...record, hash: "f".repeat(64) } : record,
    );
    const result = await verifyRecords(broken);
    expect(result).toMatchObject({ status: "BROKEN", index: 2 });
  });

  it("names the record whose prev link was tampered", async () => {
    const records = await makeChain(4);
    const broken = records.map((record, index) =>
      index === 3 ? { ...record, prev: "0".repeat(64) } : record,
    );
    expect(await verifyRecords(broken)).toMatchObject({
      status: "BROKEN",
      index: 3,
    });
  });

  it("names the first break when several records are broken", async () => {
    const records = await makeChain(5);
    const broken = records.map((record, index) =>
      index === 1 || index === 4
        ? { ...record, hash: "f".repeat(64) }
        : record,
    );
    expect(await verifyRecords(broken)).toMatchObject({
      status: "BROKEN",
      index: 1,
    });
  });

  it("rejects a reordered chain", async () => {
    const records = await makeChain(3);
    const swapped = [records[0], records[2], records[1]];
    const result = await verifyRecords(swapped);
    expect(result.status).toBe("BROKEN");
    if (result.status === "BROKEN") {
      expect(result.index).toBeGreaterThanOrEqual(0);
    }
  });

  it("cannot detect a fully recomputed forgery, which is what anchoring is for", async () => {
    const records = await makeChain(2);
    const second = records[1];
    const forgedCommit = "b".repeat(64);
    const forged = {
      ...second,
      commit: forgedCommit,
      hash: await recordHash(
        second.index,
        forgedCommit,
        new Date(second.sealedAt),
        second.prev,
      ),
    };
    expect(await verifyRecords([records[0], forged])).toEqual({
      status: "VALID",
    });
  });

  it("detects a changed commit that was not rehashed", async () => {
    const records = await makeChain(2);
    const forged = { ...records[1], commit: "b".repeat(64) };
    expect(await verifyRecords([records[0], forged])).toMatchObject({
      status: "BROKEN",
      index: 1,
    });
  });
});
