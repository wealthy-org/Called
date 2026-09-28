import { describe, expect, it } from "vitest";
import {
  ANCHOR_CALLDATA_BYTES,
  ANCHOR_TAG,
  decodeAnchorCalldata,
  encodeAnchorCalldata,
  normalizeHeadHash,
  verifyAnchorCalldata,
} from "./anchor";
import { sha256Hex } from "./hash";

const HEAD = sha256Hex("called-anchor-fixture");

describe("encodeAnchorCalldata", () => {
  it("produces exactly 44 bytes", async () => {
    const data = encodeAnchorCalldata(await HEAD, 42);
    expect(data).toMatch(/^0x[0-9a-f]+$/);
    expect((data.length - 2) / 2).toBe(ANCHOR_CALLDATA_BYTES);
    expect(ANCHOR_CALLDATA_BYTES).toBe(44);
  });

  it("starts with 0x plus the ASCII tag", async () => {
    const data = encodeAnchorCalldata(await HEAD, 42);
    expect(data.slice(2, 2 + ANCHOR_TAG.length * 2)).toBe("43414c4c");
  });

  it("embeds the head hash right after the tag", async () => {
    const head = await HEAD;
    const data = encodeAnchorCalldata(head, 42);
    expect(data.slice(2 + ANCHOR_TAG.length * 2, 2 + ANCHOR_TAG.length * 2 + 64)).toBe(
      head,
    );
  });

  it("embeds the record count as 8 bytes big-endian", async () => {
    const data = encodeAnchorCalldata(await HEAD, 258);
    expect(data.slice(-16)).toBe("0000000000000102");
  });

  it("encodes a zero record count", async () => {
    const data = encodeAnchorCalldata(await HEAD, 0);
    expect(data.slice(-16)).toBe("0000000000000000");
  });
});

describe("decodeAnchorCalldata", () => {
  it("round-trips a large but safe count", async () => {
    const head = await HEAD;
    const decoded = decodeAnchorCalldata(encodeAnchorCalldata(head, 9_876_543_210));
    expect(decoded).toEqual({
      tag: ANCHOR_TAG,
      headHash: head,
      recordCount: 9_876_543_210,
    });
  });

  it("rejects calldata of the wrong length", async () => {
    const data = encodeAnchorCalldata(await HEAD, 1);
    expect(() => decodeAnchorCalldata(data.slice(0, -2))).toThrow(/44 bytes/);
  });

  it("rejects an unexpected tag", async () => {
    expect(() => decodeAnchorCalldata(`0x${"00".repeat(44)}`)).toThrow(
      /unexpected anchor tag/,
    );
  });
});

describe("verifyAnchorCalldata", () => {
  it("accepts calldata that matches a recomputed head hash", async () => {
    const head = await sha256Hex("recomputed-head");
    const data = encodeAnchorCalldata(head, 7);
    expect(verifyAnchorCalldata(data, head, 7)).toBe(true);
  });

  it("rejects a mismatched head hash", async () => {
    const data = encodeAnchorCalldata(await HEAD, 7);
    expect(verifyAnchorCalldata(data, "a".repeat(64), 7)).toBe(false);
  });

  it("rejects a mismatched record count", async () => {
    const head = await HEAD;
    const data = encodeAnchorCalldata(head, 7);
    expect(verifyAnchorCalldata(data, head, 8)).toBe(false);
  });

  it("never throws on malformed input", () => {
    expect(verifyAnchorCalldata("0x", "nope", 0)).toBe(false);
    expect(verifyAnchorCalldata("garbage", "a".repeat(64), 0)).toBe(false);
  });
});

describe("normalizeHeadHash", () => {
  it("lowercases and strips the 0x prefix", () => {
    expect(normalizeHeadHash(`0x${"AB".repeat(32)}`)).toBe("ab".repeat(32));
  });

  it("rejects a hash of the wrong length", () => {
    expect(() => normalizeHeadHash("abcd")).toThrow(/64 lowercase hex/);
  });
});
