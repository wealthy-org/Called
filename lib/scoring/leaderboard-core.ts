import { type ScoredForecast, skillVsAlwaysYes } from "./skill";

export const PROVISIONAL_THRESHOLD = 20;

export interface LeaderboardEntry {
  forecasterId: string;
  handle: string;
  kind: string;
  model: string | null;
  modelVersion: string | null;
  promptHash: string | null;
  n: number;
  brier: number | null;
  skill: number | null;
  failures: number;
  provisional: boolean;
  isReserve: boolean;
  isRanked: boolean;
}

export interface ForecasterScoreInput {
  forecasts: ScoredForecast[];
  failures: number;
  meta: {
    forecasterId: string;
    handle: string;
    kind: string;
    model: string | null;
    modelVersion: string | null;
    promptHash: string | null;
    isReserve: boolean;
    isRanked: boolean;
  };
}

export function summarizeForecaster(input: ForecasterScoreInput): LeaderboardEntry {
  const { forecasts, failures, meta } = input;

  if (forecasts.length === 0) {
    return {
      ...meta,
      n: 0,
      brier: null,
      skill: null,
      failures,
      provisional: true,
    };
  }

  let brierSum = 0;
  for (const forecast of forecasts) {
    const o = forecast.outcome ? 1 : 0;
    brierSum += (forecast.p - o) ** 2;
  }
  const brier = brierSum / forecasts.length;

  return {
    ...meta,
    n: forecasts.length,
    brier,
    skill: skillVsAlwaysYes(forecasts),
    failures,
    provisional: forecasts.length < PROVISIONAL_THRESHOLD,
  };
}

export function buildLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries
    .filter((entry) => !entry.provisional)
    .sort((a, b) => {
      const aSkill = a.skill ?? -Infinity;
      const bSkill = b.skill ?? -Infinity;
      if (aSkill !== bSkill) {
        return bSkill - aSkill;
      }
      if (a.n !== b.n) {
        return b.n - a.n;
      }
      return a.handle.localeCompare(b.handle);
    });
}