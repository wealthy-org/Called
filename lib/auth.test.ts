import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import {
  buildSiweMessage,
  newNonce,
  sessionCookieOptions,
  sessionToken,
  verifySiweMessage,
  type SiweMessageFields,
} from "./auth";

const account = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
);
const otherAccount = privateKeyToAccount(
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
);

const fields: SiweMessageFields = {
  domain: "called.finance",
  address: account.address,
  statement: "Sign in to Called.",
  uri: "https://called.finance",
  version: "1",
  chainId: 4663,
  nonce: "0123456789abcdef0123456789abcdef",
  issuedAt: new Date().toISOString(),
};

const expected = {
  expectedNonce: fields.nonce,
  expectedChainId: 4663,
  expectedDomain: "called.finance",
  expectedUri: "https://called.finance",
};

describe("newNonce", () => {
  it("returns 32 hex characters", () => {
    expect(newNonce()).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is unpredictable", () => {
    expect(newNonce()).not.toBe(newNonce());
  });
});

describe("buildSiweMessage", () => {
  it("renders the EIP-4361 field order", () => {
    const message = buildSiweMessage(fields);
    const lines = message.split("\n");
    expect(lines[0]).toBe("called.finance wants you to sign in with your wallet:");
    expect(lines[1]).toBe(account.address);
    expect(lines[3]).toBe(fields.statement);
    expect(message).toContain("Version: 1");
    expect(message).toContain("Chain ID: 4663");
    expect(message).toContain(`Nonce: ${fields.nonce}`);
  });

  it("omits expiration time unless asked", () => {
    expect(buildSiweMessage(fields)).not.toContain("Expiration Time");
    expect(
      buildSiweMessage(fields, "2026-01-01T00:00:00.000Z"),
    ).toContain("Expiration Time: 2026-01-01T00:00:00.000Z");
  });
});

describe("verifySiweMessage", () => {
  it("accepts a valid signature", async () => {
    const message = buildSiweMessage(fields);
    const signature = await account.signMessage({ message });
    const result = await verifySiweMessage({
      message,
      signature,
      ...expected,
    });
    expect(result).toEqual({ ok: true, address: account.address });
  });

  it("rejects a nonce replay", async () => {
    const message = buildSiweMessage(fields);
    const signature = await account.signMessage({ message });
    const result = await verifySiweMessage({
      message,
      signature,
      ...expected,
      expectedNonce: "ffffffffffffffffffffffffffffffff",
    });
    expect(result).toMatchObject({ ok: false, reason: "nonce mismatch" });
  });

  it("rejects the wrong chain", async () => {
    const message = buildSiweMessage({ ...fields, chainId: 1 });
    const signature = await account.signMessage({ message });
    const result = await verifySiweMessage({ message, signature, ...expected });
    expect(result).toMatchObject({ ok: false, reason: "chain id mismatch" });
  });

  it("rejects a different domain", async () => {
    const message = buildSiweMessage({ ...fields, domain: "evil.example" });
    const signature = await account.signMessage({ message });
    const result = await verifySiweMessage({ message, signature, ...expected });
    expect(result).toMatchObject({ ok: false, reason: "domain mismatch" });
  });

  it("rejects a signature from another wallet", async () => {
    const message = buildSiweMessage(fields);
    const signature = await otherAccount.signMessage({ message });
    const result = await verifySiweMessage({ message, signature, ...expected });
    expect(result).toMatchObject({
      ok: false,
      reason: "signature does not match address",
    });
  });

  it("rejects a signature over a different message", async () => {
    const signature = await account.signMessage({
      message: buildSiweMessage({ ...fields, statement: "Sign in to evil." }),
    });
    const result = await verifySiweMessage({
      message: buildSiweMessage(fields),
      signature,
      ...expected,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an expired message", async () => {
    const message = buildSiweMessage(fields, "2020-01-01T00:00:00.000Z");
    const signature = await account.signMessage({ message });
    const result = await verifySiweMessage({ message, signature, ...expected });
    expect(result).toMatchObject({ ok: false, reason: "message expired" });
  });

  it("rejects a message with no address line", async () => {
    const message = "URI: https://called.finance\nNonce: x";
    const result = await verifySiweMessage({
      message,
      signature: "0x",
      ...expected,
    });
    expect(result).toMatchObject({
      ok: false,
      reason: "message has no wallet address",
    });
  });
});

describe("sessionToken", () => {
  it("is stable for the same address and secret", async () => {
    const first = await sessionToken(account.address, "s3cret");
    const second = await sessionToken(account.address, "s3cret");
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for a different secret", async () => {
    expect(await sessionToken(account.address, "a")).not.toBe(
      await sessionToken(account.address, "b"),
    );
  });

  it("differs for a different address", async () => {
    expect(await sessionToken(account.address, "s")).not.toBe(
      await sessionToken(otherAccount.address, "s"),
    );
  });
});

describe("sessionCookieOptions", () => {
  it("is httpOnly, secure and sameSite lax", () => {
    expect(sessionCookieOptions.httpOnly).toBe(true);
    expect(sessionCookieOptions.secure).toBe(true);
    expect(sessionCookieOptions.sameSite).toBe("lax");
    expect(sessionCookieOptions.path).toBe("/");
  });
});
