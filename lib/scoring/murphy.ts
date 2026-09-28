import { type ScoredForecast } from "./skill";

export interface MurphyDecomposition {
  forecasts: number;
  baseRate: number;
  reliability: number;
  resolution: number;
  uncertainty: number;
  brier: number;
  remainder: number;
}

interface Group {
  n: number;
  meanP: number;
  outcomeRate: number;
}

function groupByProbability(forecasts: readonly ScoredForecast[]): Group[] {
  const buckets = new Map<number, { n: number; pSum: number; yes: number }>();

  for (const forecast of forecasts) {
    const key = Math.round(forecast.p * 1e10) / 1e10;
    const bucket = buckets.get(key) ?? { n: 0, pSum: 0, yes: 0 };
    bucket.n += 1;
    bucket.pSum += forecast.p;
    if (forecast.outcome) {
      bucket.yes += 1;
    }
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .map(([p, bucket]) => ({
      n: bucket.n,
      meanP: bucket.pSum / bucket.n,
      outcomeRate: bucket.yes / bucket.n,
      p,
    }))
    .sort((a, b) => a.p - b.p)
    .map(({ n, meanP, outcomeRate }) => ({ n, meanP, outcomeRate }));
}

export function murphyDecomposition(
  forecasts: readonly ScoredForecast[],
): MurphyDecomposition {
  if (forecasts.length === 0) {
    throw new Error("murphyDecomposition requires at least one forecast");
  }

  const total = forecasts.length;
  const baseRate = forecasts.filter((f) => f.outcome).length / total;

  let reliabilitySum = 0;
  let resolutionSum = 0;

  for (const group of groupByProbability(forecasts)) {
    reliabilitySum += group.n * (group.meanP - group.outcomeRate) ** 2;
    resolutionSum += group.n * (group.outcomeRate - baseRate) ** 2;
  }

  const reliability = reliabilitySum / total;
  const resolution = resolutionSum / total;
  const uncertainty = baseRate * (1 - baseRate);

  let brierSum = 0;
  for (const forecast of forecasts) {
    const o = forecast.outcome ? 1 : 0;
    brierSum += (forecast.p - o) ** 2;
  }
  const brier = brierSum / total;

  return {
    forecasts: total,
    baseRate,
    reliability,
    resolution,
    uncertainty,
    brier,
    remainder: brier - (reliability - resolution + uncertainty),
  };
}