import { describe, expect, it } from "vitest";
import { FixedWindowLimiter, clientKey } from "./rate-limit";

function clock(start = 0) {
  let current = start;
  return {
    now: () => current,
    advance(ms: number) {
      current += ms;
    },
  };
}

describe("FixedWindowLimiter", () => {
  it("allows requests up to the limit", () => {
    const limiter = new FixedWindowLimiter(
      { limit: 3, windowMs: 1000 },
      () => 0,
    );

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
    const third = limiter.check("a");
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks the request after the limit", () => {
    const limiter = new FixedWindowLimiter(
      { limit: 2, windowMs: 1000 },
      () => 0,
    );
    limiter.check("a");
    limiter.check("a");

    const blocked = limiter.check("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("tracks separate keys independently", () => {
    const limiter = new FixedWindowLimiter(
      { limit: 1, windowMs: 1000 },
      () => 0,
    );
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
  });

  it("resets once the window elapses", () => {
    const time = clock(1000);
    const limiter = new FixedWindowLimiter(
      { limit: 1, windowMs: 5000 },
      time.now,
    );

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);

    time.advance(5000);
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("reports the seconds until the window frees up", () => {
    const time = clock(0);
    const limiter = new FixedWindowLimiter(
      { limit: 1, windowMs: 10_000 },
      time.now,
    );
    limiter.check("a");
    time.advance(4000);

    expect(limiter.check("a").retryAfterSeconds).toBe(6);
  });

  it("rejects a malformed rule", () => {
    expect(() => new FixedWindowLimiter({ limit: 0, windowMs: 1000 })).toThrow(
      /positive/,
    );
    expect(
      () => new FixedWindowLimiter({ limit: 10, windowMs: 0 }),
    ).toThrow(/positive/);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(clientKey(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "9.9.9.9" });
    expect(clientKey(headers)).toBe("9.9.9.9");
  });

  it("returns unknown when no address header is present", () => {
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
