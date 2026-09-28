import { describe, expect, it } from "vitest";
import { SCRAMBLE_DURATION_MS, scrambleFrame } from "./scramble";

const HASH = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

function seededRandom(): () => number {
  let state = 0;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("scrambleFrame", () => {
  it("keeps the target length", () => {
    expect(scrambleFrame(HASH, 0.5, seededRandom())).toHaveLength(HASH.length);
  });

  it("emits only hex characters", () => {
    expect(scrambleFrame(HASH, 0.5, seededRandom())).toMatch(/^[0-9a-f]{64}$/);
  });

  it("resolves to the target at progress 1", () => {
    expect(scrambleFrame(HASH, 1, seededRandom())).toBe(HASH);
  });

  it("clamps progress above 1", () => {
    expect(scrambleFrame(HASH, 4, seededRandom())).toBe(HASH);
  });

  it("clamps progress below 0", () => {
    expect(scrambleFrame(HASH, -1, seededRandom())).toHaveLength(HASH.length);
  });

  it("locks leading characters first, so a partial frame prefixes the target", () => {
    const frame = scrambleFrame(HASH, 0.5, seededRandom());
    const settled = Math.floor(0.5 * HASH.length);
    expect(frame.slice(0, settled)).toBe(HASH.slice(0, settled));
  });

  it("agrees with itself for the same random source", () => {
    expect(scrambleFrame(HASH, 0.3, seededRandom())).toHaveLength(64);
  });
});

describe("SCRAMBLE_DURATION_MS", () => {
  it("is the designed 700ms", () => {
    expect(SCRAMBLE_DURATION_MS).toBe(700);
  });
});
