export type ScoredForecast = { p: number; outcome: boolean };

function brier(p: number, outcome: boolean): number {
  const o = outcome ? 1 : 0;
  const diff = p - o;
  return diff * diff;
}

export function skillVsAlwaysYes(
  forecasts: readonly ScoredForecast[],
): number {
  if (forecasts.length === 0) {
    throw new Error("skillVsAlwaysYes requires at least one forecast");
  }

  let brierSum = 0;
  let baselineSum = 0;
  for (const forecast of forecasts) {
    brierSum += brier(forecast.p, forecast.outcome);
    baselineSum += brier(1, forecast.outcome);
  }

  const forecasterBrier = brierSum / forecasts.length;
  const baselineBrier = baselineSum / forecasts.length;

  if (baselineBrier <= 0) {
    return 0;
  }
  return ((baselineBrier - forecasterBrier) / baselineBrier) * 100;
}

export function sharedSetSkill(
  sets: {
    forecasts: readonly ScoredForecast[];
    baselineForecasts: readonly ScoredForecast[];
  }[],
): { forecasterSkill: number; baselineSkill: number } {
  const totalForecast = sets.flatMap((s) => s.forecasts);
  const totalBaseline = sets.flatMap((s) => s.baselineForecasts);
  if (totalForecast.length === 0) {
    throw new Error("sharedSetSkill requires at least one forecast");
  }
  if (totalForecast.length !== totalBaseline.length) {
    throw new Error("shared set requires equal forecast counts");
  }
  return {
    forecasterSkill: skillVsAlwaysYes(totalForecast),
    baselineSkill: skillVsAlwaysYes(totalBaseline),
  };
}