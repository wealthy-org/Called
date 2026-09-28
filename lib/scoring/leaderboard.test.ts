import { describe, expect, it } from "vitest";
import {
  buildLeaderboard,
  PROVISIONAL_THRESHOLD,
  summarizeForecaster,
  type LeaderboardEntry,
} from "./leaderboard-core";

const meta = {
  forecasterId: "human:0xabc",
  handle: "alice",
  kind: "human",
  model: null,
  modelVersion: null,
  promptHash: null,
  isReserve: false,
  isRanked: true,
};

describe("summarizeForecaster", () => {
  it("flags n < 20 as provisional", () => {
    const forecasts = Array.from({ length: PROVISIONAL_THRESHOLD - 1 }, () => ({
      p: 0.5,
      outcome: true,
    }));
    expect(summarizeForecaster({ forecasts, failures: 0, meta }).provisional).toBe(
      true,
    );
  });

  it("is ranked at exactly 20 or more", () => {
    const forecasts = Array.from({ length: PROVISIONAL_THRESHOLD }, () => ({
      p: 0.5,
      outcome: true,
    }));
    expect(summarizeForecaster({ forecasts, failures: 0, meta }).provisional).toBe(
      false,
    );
  });

  it("returns null skill and brier with no forecasts", () => {
    const entry = summarizeForecaster({ forecasts: [], failures: 2, meta });
    expect(entry.n).toBe(0);
    expect(entry.skill).toBeNull();
    expect(entry.brier).toBeNull();
    expect(entry.failures).toBe(2);
    expect(entry.provisional).toBe(true);
  });

  it("computes brier and skill from the forecasts only", () => {
    const forecasts = [
      { p: 1, outcome: true },
      { p: 1, outcome: true },
      { p: 0, outcome: false },
    ];
    const entry = summarizeForecaster({ forecasts, failures: 1, meta });
    expect(entry.n).toBe(3);
    expect(entry.brier).toBeCloseTo(0, 10);
    expect(entry.skill).toBeCloseTo(100, 10);
    expect(entry.failures).toBe(1);
  });
});

describe("buildLeaderboard", () => {
  const base: LeaderboardEntry = {
    ...meta,
    n: 20,
    brier: 0.25,
    skill: 50,
    failures: 0,
    provisional: false,
  };

  it("excludes provisional entries from ranking", () => {
    const ranked = buildLeaderboard([base]);
    expect(ranked.length).toBe(1);
  });

  it("excludes entries whose forecaster is not ranked", () => {
    const unranked = { ...base, handle: "stray", isRanked: false, skill: 999 };
    expect(buildLeaderboard([unranked])).toEqual([]);
    expect(buildLeaderboard([base, unranked]).map((e) => e.handle)).toEqual([
      "alice",
    ]);
  });

  it("sorts by skill descending", () => {
    const low = { ...base, handle: "low", skill: 10 };
    const high = { ...base, handle: "high", skill: 90 };
    expect(buildLeaderboard([low, high]).map((e) => e.handle)).toEqual([
      "high",
      "low",
    ]);
  });

  it("breaks ties by n descending", () => {
    const fewer = { ...base, handle: "fewer", skill: 50, n: 20 };
    const more = { ...base, handle: "more", skill: 50, n: 40 };
    expect(buildLeaderboard([fewer, more]).map((e) => e.handle)).toEqual([
      "more",
      "fewer",
    ]);
  });

  it("does not mutate its input", () => {
    const input = [base, { ...base, handle: "z", skill: 5 }];
    const before = input.map((e) => e.handle);
    buildLeaderboard(input);
    expect(input.map((e) => e.handle)).toEqual(before);
  });
});