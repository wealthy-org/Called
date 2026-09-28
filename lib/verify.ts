import { GENESIS_PREV_HASH } from "./hash";
import { recordHash } from "./seal";

export interface VerifiableRecord {
  index: number;
  commit: string;
  sealedAt: Date;
  prev: string;
  hash: string;
}

export type ChainVerdict =
  | { status: "VALID"; records: number }
  | { status: "BROKEN"; index: number; reason: string };

export async function verifyChain(
  records: readonly VerifiableRecord[],
): Promise<ChainVerdict> {
  let prev = GENESIS_PREV_HASH;

  for (let position = 0; position < records.length; position += 1) {
    const record = records[position]!;

    if (record.index !== position) {
      return {
        status: "BROKEN",
        index: position,
        reason: `record index is ${record.index}, expected ${position}`,
      };
    }

    if (record.prev !== prev) {
      return {
        status: "BROKEN",
        index: position,
        reason: "previous hash does not match the prior record",
      };
    }

    const expected = await recordHash(
      record.index,
      record.commit,
      record.sealedAt,
      record.prev,
    );
    if (record.hash !== expected) {
      return {
        status: "BROKEN",
        index: position,
        reason: "record hash does not match its components",
      };
    }

    prev = record.hash;
  }

  return { status: "VALID", records: records.length };
}
