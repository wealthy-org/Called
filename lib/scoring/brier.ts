export function brierScore(p: number, outcome: boolean): number {
  const o = outcome ? 1 : 0;
  const diff = p - o;
  return diff * diff;
}

export function brierMean(
  predictions: readonly { p: number; outcome: boolean }[],
): number {
  if (predictions.length === 0) {
    throw new Error("brierMean requires at least one prediction");
  }
  let sum = 0;
  for (const prediction of predictions) {
    sum += brierScore(prediction.p, prediction.outcome);
  }
  return sum / predictions.length;
}