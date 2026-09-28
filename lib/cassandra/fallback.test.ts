import { describe, expect, it } from "vitest";
import { HOUSE_MODELS, STRAY_TIER_ID } from "@/config/house-models";
import {
  isRetryableStatus,
  MAX_RETRIES_PER_TIER,
  retryDelay,
  runHouseForecast,
  type HouseAttempt,
} from "./fallback";
import type { HouseRunOutcome, HouseRunRequest } from "./runner";

const cassandra = HOUSE_MODELS[0];
const helenus = HOUSE_MODELS[1];

const baseInput = {
  questionId: "q-2026-10-03-abc123",
  questionText: "Will the NVDA token close at or above $210.00 on 3 Oct 2026?",
  now: new Date("2026-10-01T00:00:00Z"),
  apiKey: "test-key",
  promptTemplate: "date is CURRENT_UTC_DATE",
};

function ok(tierId: string, p = 0.42): HouseRunOutcome {
  return {
    ok: true,
    tierId,
    model: `${tierId}-model`,
    forecast: { p, why: "because" },
    raw: `{"p":${String(p)},"why":"because"}`,
    seeded: true,
  };
}

function unavailable(tierId: string, status: number | null): HouseRunOutcome {
  return {
    ok: false,
    kind: "unavailable",
    tierId,
    model: `${tierId}-model`,
    status,
    message: `http ${String(status)}`,
  };
}

function unparseable(tierId: string): HouseRunOutcome {
  return {
    ok: false,
    kind: "unparseable",
    tierId,
    model: `${tierId}-model`,
    raw: "no json here",
    reason: "no_json",
  };
}

function recorder(): {
  deps: {
    runTier: (request: HouseRunRequest) => Promise<HouseRunOutcome>;
    sleep: (ms: number) => Promise<void>;
    onAttempt: (attempt: HouseAttempt) => void;
  };
  tiers: string[];
  delays: number[];
  attempted: HouseAttempt[];
} {
  const tiers: string[] = [];
  const delays: number[] = [];
  const attempted: HouseAttempt[] = [];
  return {
    tiers,
    delays,
    attempted,
    deps: {
      runTier: (request) => {
        tiers.push(request.tier.id);
        return Promise.resolve(ok(request.tier.id));
      },
      sleep: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
      onAttempt: (attempt) => attempted.push(attempt),
    },
  };
}

describe("retryDelay", () => {
  it("doubles each attempt from the base", () => {
    expect(retryDelay(1)).toBe(500);
    expect(retryDelay(2)).toBe(1000);
    expect(retryDelay(3)).toBe(2000);
  });
});

describe("isRetryableStatus", () => {
  it("retries 429, 5xx and network failures", () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(null)).toBe(true);
  });

  it("does not retry client errors", () => {
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });
});

describe("runHouseForecast", () => {
  it("returns the primary tier on first success without retries", async () => {
    const rec = recorder();
    const result = await runHouseForecast(rec.deps, baseInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tierId).toBe(cassandra.id);
      expect(result.forecast.p).toBe(0.42);
      expect(result.attempts).toEqual([]);
    }
    expect(rec.tiers).toEqual([cassandra.id]);
    expect(rec.delays).toEqual([]);
  });

  it("retries the same tier up to 3 times before switching", async () => {
    const order: string[] = [];
    const delays: number[] = [];
    const result = await runHouseForecast(
      {
        runTier: (request) => {
          order.push(request.tier.id);
          if (request.tier.id === cassandra.id) {
            return Promise.resolve(unavailable(cassandra.id, 503));
          }
          return Promise.resolve(ok(request.tier.id, 0.6));
        },
        sleep: (ms) => {
          delays.push(ms);
          return Promise.resolve();
        },
        tiers: [cassandra, helenus],
      },
      baseInput,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tierId).toBe(helenus.id);
      expect(result.attempts).toHaveLength(MAX_RETRIES_PER_TIER);
    }
    expect(order).toEqual([
      cassandra.id,
      cassandra.id,
      cassandra.id,
      helenus.id,
    ]);
    expect(delays).toEqual([500, 1000]);
  });

  it("does NOT fall back when the answer is unparseable", async () => {
    const order: string[] = [];
    const result = await runHouseForecast(
      {
        runTier: (request) => {
          order.push(request.tier.id);
          return Promise.resolve(unparseable(request.tier.id));
        },
        sleep: () => Promise.resolve(),
        tiers: [cassandra, helenus],
      },
      baseInput,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("unparseable");
      expect(result.tierId).toBe(cassandra.id);
      expect(result.reason).toBe("no_json");
    }
    expect(order).toEqual([cassandra.id]);
  });

  it("skips a tier immediately on a non-retryable status", async () => {
    const order: string[] = [];
    const delays: number[] = [];
    const result = await runHouseForecast(
      {
        runTier: (request) => {
          order.push(request.tier.id);
          if (request.tier.id === cassandra.id) {
            return Promise.resolve(unavailable(cassandra.id, 400));
          }
          return Promise.resolve(ok(request.tier.id, 0.7));
        },
        sleep: (ms) => {
          delays.push(ms);
          return Promise.resolve();
        },
        tiers: [cassandra, helenus],
      },
      baseInput,
    );

    expect(result.ok).toBe(true);
    expect(order).toEqual([cassandra.id, helenus.id]);
    expect(delays).toEqual([]);
  });

  it("reports all_unavailable when no tier answers", async () => {
    const result = await runHouseForecast(
      {
        runTier: (request) =>
          Promise.resolve(unavailable(request.tier.id, 503)),
        sleep: () => Promise.resolve(),
        tiers: [cassandra, helenus],
        retryDelayMs: 1,
      },
      baseInput,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("all_unavailable");
      expect(result.tierId).toBeNull();
      expect(result.attempts).toHaveLength(
        MAX_RETRIES_PER_TIER * 2,
      );
    }
  });

  it("walks every configured tier by order", async () => {
    const order: string[] = [];
    await runHouseForecast(
      {
        runTier: (request) => {
          order.push(request.tier.id);
          return Promise.resolve(ok(request.tier.id));
        },
        sleep: () => Promise.resolve(),
      },
      baseInput,
    );
    expect(order).toEqual([HOUSE_MODELS[0].id]);
  });

  it("treats the stray tier as the last tier and unranked", () => {
    const last = HOUSE_MODELS[HOUSE_MODELS.length - 1];
    expect(last.id).toBe(STRAY_TIER_ID);
    expect(last.isRanked).toBe(false);
  });
});
