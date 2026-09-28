import { describe, expect, it } from "vitest";
import { checkReveal, isRevealOpen, parseRevealPayload } from "./reveal";
import { commitHash, stablePayloadJson } from "./seal";

const payload = { p: 0.62, handle: "w1a2b3c4", rationale: "momentum" };
const payloadJson = stablePayloadJson(payload);
const salt = "a".repeat(32);

describe("parseRevealPayload", () => {
  it("accepts a well-formed payload", () => {
    expect(parseRevealPayload(payloadJson)).toEqual(payload);
  });

  it("rejects non-JSON", () => {
    expect(parseRevealPayload("not json")).toBeNull();
  });

  it("rejects a probability outside 0..1", () => {
    expect(parseRevealPayload(JSON.stringify({ ...payload, p: 1.5 }))).toBeNull();
    expect(parseRevealPayload(JSON.stringify({ ...payload, p: -0.1 }))).toBeNull();
  });

  it("rejects a missing handle or rationale", () => {
    expect(parseRevealPayload(JSON.stringify({ p: 0.5 }))).toBeNull();
    expect(
      parseRevealPayload(JSON.stringify({ p: 0.5, handle: "x" })),
    ).toBeNull();
  });

  it("rejects an array", () => {
    expect(parseRevealPayload("[]")).toBeNull();
  });
});

describe("isRevealOpen", () => {
  const closesAt = new Date("2026-10-03T19:00:00Z");

  it("is closed before the close time", () => {
    expect(isRevealOpen(closesAt, new Date("2026-10-03T18:59:59Z"))).toBe(false);
  });

  it("is open at and after the close time", () => {
    expect(isRevealOpen(closesAt, closesAt)).toBe(true);
    expect(isRevealOpen(closesAt, new Date("2026-10-03T19:00:01Z"))).toBe(true);
  });
});

describe("checkReveal", () => {
  it("accepts a matching payload and salt", async () => {
    const commit = await commitHash(payloadJson, salt);
    await expect(checkReveal({ commit, payloadJson, salt })).resolves.toEqual({
      ok: true,
    });
  });

  it("rejects a wrong salt", async () => {
    const commit = await commitHash(payloadJson, salt);
    const result = await checkReveal({
      commit,
      payloadJson,
      salt: "b".repeat(32),
    });
    expect(result).toMatchObject({ ok: false, reason: "commit_mismatch" });
  });

  it("rejects a tampered payload", async () => {
    const commit = await commitHash(payloadJson, salt);
    const result = await checkReveal({
      commit,
      payloadJson: stablePayloadJson({ ...payload, p: 0.99 }),
      salt,
    });
    expect(result).toMatchObject({ ok: false, reason: "commit_mismatch" });
  });

  it("rejects an empty salt", async () => {
    const commit = await commitHash(payloadJson, salt);
    const result = await checkReveal({ commit, payloadJson, salt: "" });
    expect(result).toMatchObject({ ok: false, reason: "malformed_payload" });
  });

  it("rejects a malformed payload even when the hash matches", async () => {
    const bad = "not json";
    const commit = await commitHash(bad, salt);
    const result = await checkReveal({ commit, payloadJson: bad, salt });
    expect(result).toMatchObject({ ok: false, reason: "malformed_payload" });
  });
});
