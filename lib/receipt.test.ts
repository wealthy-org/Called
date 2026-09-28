import { describe, expect, it } from "vitest";
import {
  PUBLIC_KEY_BYTES,
  receiptMessage,
  receiptPublicKey,
  SEED_BYTES,
  signReceipt,
  verifyReceipt,
} from "./receipt";

const seedHex = "11".repeat(SEED_BYTES);
const otherSeedHex = "22".repeat(SEED_BYTES);

const fields = {
  receiptId: "rcpt-1",
  sealId: "seal-0-abcdef123456",
  recordIndex: 0,
  commit: "a".repeat(64),
  recordHash: "b".repeat(64),
  sealedAt: new Date("2026-09-26T10:00:00.000Z"),
  questionId: "q-2026-10-03-1a2b3c",
  forecasterId: "human:0x1234",
};

describe("receiptMessage", () => {
  it("joins fields with a pipe and a version prefix", () => {
    expect(receiptMessage(fields)).toBe(
      [
        "called-receipt-v1",
        "rcpt-1",
        "seal-0-abcdef123456",
        "q-2026-10-03-1a2b3c",
        "human:0x1234",
        "0",
        "a".repeat(64),
        "b".repeat(64),
        "2026-09-26T10:00:00.000Z",
      ].join("|"),
    );
  });

  it("changes when any single field changes", () => {
    const variants = [
      { ...fields, recordIndex: 1 },
      { ...fields, commit: "c".repeat(64) },
      { ...fields, recordHash: "c".repeat(64) },
      { ...fields, questionId: "q-2026-10-04-000000" },
      { ...fields, forecasterId: "house:cassandra" },
      { ...fields, sealedAt: new Date("2026-09-26T10:00:00.001Z") },
    ];
    const base = receiptMessage(fields);
    for (const variant of variants) {
      expect(receiptMessage(variant)).not.toBe(base);
    }
  });
});

describe("receiptPublicKey", () => {
  it("accepts a hex seed", async () => {
    const publicKey = await receiptPublicKey(seedHex);
    expect(Buffer.from(publicKey, "base64")).toHaveLength(PUBLIC_KEY_BYTES);
  });

  it("accepts a base64 seed", async () => {
    const base64 = Buffer.from(seedHex, "hex").toString("base64");
    await expect(receiptPublicKey(base64)).resolves.toBe(
      await receiptPublicKey(seedHex),
    );
  });

  it("is stable for the same seed", async () => {
    await expect(receiptPublicKey(seedHex)).resolves.toBe(
      await receiptPublicKey(seedHex),
    );
  });

  it("differs for a different seed", async () => {
    await expect(receiptPublicKey(otherSeedHex)).resolves.not.toBe(
      await receiptPublicKey(seedHex),
    );
  });

  it("rejects a wrong length key", async () => {
    await expect(receiptPublicKey("abcd")).rejects.toThrow(/32 bytes/);
  });
});

describe("signReceipt and verifyReceipt", () => {
  it("produces a 128 hex character signature", async () => {
    await expect(signReceipt(seedHex, fields)).resolves.toMatch(
      /^[0-9a-f]{128}$/,
    );
  });

  it("verifies with the matching public key", async () => {
    const publicKey = await receiptPublicKey(seedHex);
    const signature = await signReceipt(seedHex, fields);
    await expect(verifyReceipt(publicKey, fields, signature)).resolves.toBe(true);
  });

  it("is deterministic", async () => {
    await expect(signReceipt(seedHex, fields)).resolves.toBe(
      await signReceipt(seedHex, fields),
    );
  });

  it("fails with the wrong public key", async () => {
    const signature = await signReceipt(seedHex, fields);
    const wrongKey = await receiptPublicKey(otherSeedHex);
    await expect(verifyReceipt(wrongKey, fields, signature)).resolves.toBe(false);
  });

  it("fails when any field is tampered", async () => {
    const publicKey = await receiptPublicKey(seedHex);
    const signature = await signReceipt(seedHex, fields);
    await expect(
      verifyReceipt(publicKey, { ...fields, recordIndex: 7 }, signature),
    ).resolves.toBe(false);
    await expect(
      verifyReceipt(publicKey, { ...fields, commit: "c".repeat(64) }, signature),
    ).resolves.toBe(false);
  });

  it("rejects a malformed signature without throwing", async () => {
    const publicKey = await receiptPublicKey(seedHex);
    await expect(verifyReceipt(publicKey, fields, "zz")).resolves.toBe(false);
    await expect(verifyReceipt(publicKey, fields, "")).resolves.toBe(false);
  });

  it("rejects a malformed public key without throwing", async () => {
    const signature = await signReceipt(seedHex, fields);
    await expect(verifyReceipt("not-base64!!", fields, signature)).resolves.toBe(
      false,
    );
  });
});
