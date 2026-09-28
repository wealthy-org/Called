import "server-only";
import {
  buildLeaderboard,
  summarizeForecaster,
  type LeaderboardEntry,
  type ForecasterScoreInput,
} from "@/lib/scoring/leaderboard-core";
import {
  loadForecasterScores,
  toScoreInputs,
} from "@/lib/scoring/leaderboard-store";
import type { ScoredForecast } from "@/lib/scoring/skill";

export interface LeaderboardPageData {
  ranked: LeaderboardEntry[];
  provisional: LeaderboardEntry[];
  forecastSeries: Record<string, ScoredForecast[]>;
}

export async function loadLeaderboardPage(): Promise<LeaderboardPageData> {
  const loaded = await loadForecasterScores();
  const scoreInputs = toScoreInputs(loaded);

  const entries = scoreInputs.map(summarizeForecaster);
  const forecastSeries: Record<string, ScoredForecast[]> = {};
  for (const input of scoreInputs) {
    if (input.forecasts.length > 0) {
      forecastSeries[input.meta.forecasterId] = input.forecasts;
    }
  }

  const ranked = buildLeaderboard(entries);
  const provisional = entries.filter(
    (entry) => entry.provisional || entry.isReserve,
  );

  return { ranked, provisional, forecastSeries };
}

export type { ForecasterScoreInput, LeaderboardEntry };