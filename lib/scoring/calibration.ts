import { type ScoredForecast } from "./skill";

export interface CalibrationBin {
  binIndex: number;
  low: number;
  high: number;
  n: number;
  meanP: number | null;
  outcomeRate: number | null;
}

export interface CalibrationResult {
  bins: number;
  data: CalibrationBin[];
}

function isFiniteProbability(p: number): boolean {
  return Number.isFinite(p) && p >= 0 && p <= 1;
}

export function calibrationBins(
  forecasts: readonly ScoredForecast[],
  binCount = 10,
): CalibrationResult {
  if (!Number.isInteger(binCount) || binCount < 5 || binCount > 10) {
    throw new Error("calibrationBins requires a bin count between 5 and 10");
  }
  if (forecasts.length === 0) {
    throw new Error("calibrationBins requires at least one forecast");
  }

  const width = 1 / binCount;
  const counts = Array.from({ length: binCount }, () => 0);
  const pSums = Array.from({ length: binCount }, () => 0);
  const yesCounts = Array.from({ length: binCount }, () => 0);

  for (const forecast of forecasts) {
    if (!isFiniteProbability(forecast.p)) {
      throw new Error(`invalid probability: ${forecast.p}`);
    }
    let index = Math.floor(forecast.p / width);
    if (index >= binCount) {
      index = binCount - 1;
    }
    counts[index] += 1;
    pSums[index] += forecast.p;
    if (forecast.outcome) {
      yesCounts[index] += 1;
    }
  }

  const data = counts.map((n, index) => {
    const low = index * width;
    return {
      binIndex: index,
      low,
      high: index === binCount - 1 ? 1 : low + width,
      n,
      meanP: n === 0 ? null : pSums[index] / n,
      outcomeRate: n === 0 ? null : yesCounts[index] / n,
    };
  });

  return { bins: binCount, data };
}

export function calibrationSkew(forecasts: readonly ScoredForecast[]): number {
  if (forecasts.length === 0) {
    return 0;
  }
  const { data } = calibrationBins(forecasts, 10);
  const populated = data.filter((bin) => bin.n > 0);
  if (populated.length === 0) {
    return 0;
  }
  const diff = populated.reduce(
    (sum, bin) => sum + ((bin.outcomeRate ?? 0) - (bin.meanP ?? 0)) ** 2,
    0,
  );
  return Math.sqrt(diff / populated.length);
}