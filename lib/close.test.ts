import { describe, expect, it } from "vitest";
import { encryptPayload, newSalt } from "./crypto-box";
import { isCloseDue, openSealedPayload, payloadJsonFor } from "./close";
import { commitHash, stablePayloadJson } from "./seal";

const key = "test-encryption-key";
const payload = { p: 0.62, handle: "w1a2b3c4", rationale: "momentum" };
const payloadJson = stablePayloadJson(payload);

describe("isCloseDue", () => {
  const closesAt = new Date("2026-10-03T19:00:00Z");

  it("is false before the close time", () => {
    expect(isCloseDue(closesAt, new Date("2026-10-03T18:59:59.999Z"))).toBe(false);
  });

  it("is true exactly at and after the close time", () => {
    expect(isCloseDue(closesAt, closesAt)).toBe(true);
    expect(isCloseDue(closesAt, new Date("2026-10-03T19:00:00.001Z"))).toBe(true);
  });
});

describe("payloadJsonFor", () => {
  it("reproduces the exact committed string", async () => {
    const salt = newSalt();
    const commit = await commitHash(payloadJson, salt);
    const rebuilt = payloadJsonFor(payload);
    expect(rebuilt).toBe(payloadJson);
    expect(await commitHash(rebuilt, salt)).toBe(commit);
  });

  it("is insensitive to key order in the stored object", () => {
    const reordered = { rationale: "momentum", handle: "w1a2b3c4", p: 0.62 };
    expect(payloadJsonFor(reordered)).toBe(payloadJson);
  });
});

describe("openSealedPayload", () => {
  it("returns the payload when the envelope matches the reveal", async () => {
    const ciphertext = await encryptPayload(payloadJson, key);
    await expect(
      openSealedPayload({ ciphertext, salt: newSalt(), payloadJson, key }),
    ).resolves.toEqual(payload);
  });

  it("returns null when the reveal disagrees with the sealed payload", async () => {
    const ciphertext = await encryptPayload(payloadJson, key);
    const tampered = stablePayloadJson({ ...payload, p: 0.99 });
    await expect(
      openSealedPayload({ ciphertext, salt: newSalt(), payloadJson: tampered, key }),
    ).resolves.toBeNull();
  });

  it("returns null when the decryption key is wrong", async () => {
    const ciphertext = await encryptPayload(payloadJson, key);
    await expect(
      openSealedPayload({
        ciphertext,
        salt: newSalt(),
        payloadJson,
        key: "other-key",
      }),
    ).resolves.toBeNull();
  });

  it("returns null when the envelope is corrupt", async () => {
    await expect(
      openSealedPayload({
        ciphertext: "not-an-envelope",
        salt: newSalt(),
        payloadJson,
        key,
      }),
    ).resolves.toBeNull();
  });

  it("returns null when the plaintext is not a valid payload", async () => {
    const garbage = "not json at all";
    const ciphertext = await encryptPayload(garbage, key);
    await expect(
      openSealedPayload({ ciphertext, salt: newSalt(), payloadJson: garbage, key }),
    ).resolves.toBeNull();
  });
});
