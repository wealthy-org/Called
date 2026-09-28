import { describe, expect, it } from "vitest";
import {
  bytesToHex,
  GENESIS_PREV_HASH,
  hexToBytes,
  sha256Hex,
  sha256HexOfParts,
} from "./hash";

describe("sha256Hex", () => {
  it("matches the standard vector for 'abc'", async () => {
    await expect(sha256Hex("abc")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("matches the standard vector for the empty string", async () => {
    await expect(sha256Hex("")).resolves.toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("returns 64 lowercase hex characters", async () => {
    await expect(sha256Hex("called")).resolves.toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable across calls", async () => {
    const first = await sha256Hex("same input");
    const second = await sha256Hex("same input");
    expect(first).toBe(second);
  });
});

describe("sha256HexOfParts", () => {
  it("joins parts with a pipe before hashing", async () => {
    await expect(sha256HexOfParts(["a", "b", "c"])).resolves.toBe(
      await sha256Hex("a|b|c"),
    );
  });

  it("differs when part boundaries move", async () => {
    const split = await sha256HexOfParts(["ab", "c"]);
    const joined = await sha256HexOfParts(["a", "bc"]);
    expect(split).not.toBe(joined);
  });
});

describe("hex helpers", () => {
  it("round-trips bytes to hex and back", () => {
    const original = new Uint8Array([0, 1, 15, 16, 171, 255]);
    expect(bytesToHex(original)).toBe("00010f10abff");
    expect(hexToBytes("00010f10abff")).toEqual(original);
  });

  it("rejects odd-length hex", () => {
    expect(() => hexToBytes("abc")).toThrow(/even length/);
  });

  it("rejects non-hex characters", () => {
    expect(() => hexToBytes("zz")).toThrow(/invalid hex/);
  });
});

describe("GENESIS_PREV_HASH", () => {
  it("is 64 zeros", () => {
    expect(GENESIS_PREV_HASH).toBe("0".repeat(64));
    expect(GENESIS_PREV_HASH).toHaveLength(64);
  });
});
