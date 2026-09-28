import { describe, expect, it } from "vitest";
import { decryptPayload, encryptPayload, newSalt } from "./crypto-box";

const secret = "test-payload-encryption-key";

describe("newSalt", () => {
  it("returns 32 hex characters", () => {
    expect(newSalt()).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is different on every call", () => {
    const salts = new Set(Array.from({ length: 32 }, () => newSalt()));
    expect(salts.size).toBe(32);
  });
});

describe("encryptPayload / decryptPayload", () => {
  it("round-trips the plaintext", async () => {
    const plaintext = '{"p":0.62,"handle":"wabc123","rationale":"why"}';
    const envelope = await encryptPayload(plaintext, secret);
    await expect(decryptPayload(envelope, secret)).resolves.toBe(plaintext);
  });

  it("never exposes the plaintext in the envelope", async () => {
    const envelope = await encryptPayload("top-secret-payload", secret);
    expect(envelope).not.toContain("top-secret-payload");
  });

  it("uses a fresh iv so the same plaintext encrypts differently", async () => {
    const first = await encryptPayload("same", secret);
    const second = await encryptPayload("same", secret);
    expect(first).not.toBe(second);
  });

  it("returns null for the wrong key", async () => {
    const envelope = await encryptPayload("payload", secret);
    await expect(decryptPayload(envelope, "other-key")).resolves.toBeNull();
  });

  it("returns null for a tampered envelope", async () => {
    const envelope = await encryptPayload("payload", secret);
    const [iv, data] = envelope.split(".");
    const flipped = `${data!.slice(0, -2)}${data!.endsWith("ff") ? "00" : "ff"}`;
    await expect(decryptPayload(`${iv}.${flipped}`, secret)).resolves.toBeNull();
  });

  it("returns null for a malformed envelope", async () => {
    await expect(decryptPayload("no-separator", secret)).resolves.toBeNull();
    await expect(decryptPayload("zz.zz", secret)).resolves.toBeNull();
  });
});
