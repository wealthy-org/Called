import { seededUnitInterval } from "./random";

export const BASELINE_LABEL = "baseline rule, not a model";

export type BaselineId =
  | "baseline:always-yes"
  | "baseline:parrot"
  | "baseline:hedgehog"
  | "baseline:drift"
  | "baseline:drunk";

export interface BaselineContext {
  questionId: string;
  text: string;
  source: string;
  test: string;
  opensAt: Date;
  closesAt: Date;
  resolvesAt: Date;
  priceHistory?: readonly number[];
  baseRate?: number;
}

export interface BaselineRule {
  id: BaselineId;
  name: string;
  description: string;
  predict: (context: BaselineContext) => number;
}

function clamp(value: number, low: number, high: number): number {
  if (!Number.isFinite(value)) {
    return low;
  }
  return Math.min(high, Math.max(low, value));
}

export function priceMomentum(
  history: readonly number[] | undefined,
): number {
  if (!history || history.length < 2) {
    return 0;
  }
  const first = history[0];
  const last = history[history.length - 1];
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) {
    return 0;
  }
  return (last - first) / Math.abs(first);
}

export const BASELINE_RULES: readonly BaselineRule[] = [
  {
    id: "baseline:always-yes",
    name: "Always-yes",
    description: "Always answers 0.99. The reference line every skill score is measured against.",
    predict: () => 0.99,
  },
  {
    id: "baseline:parrot",
    name: "Parrot",
    description:
      "Repeats the historical base rate of similar finished questions. Perfect reliability, zero resolution.",
    predict: (context) => clamp(context.baseRate ?? 0.5, 0.01, 0.99),
  },
  {
    id: "baseline:hedgehog",
    name: "Hedgehog",
    description: "Holds one idea hard: 0.9 or 0.1 from price momentum. Shows the overconfidence gap.",
    predict: (context) => (priceMomentum(context.priceHistory) > 0 ? 0.9 : 0.1),
  },
  {
    id: "baseline:drift",
    name: "Drift",
    description:
      "Makes a small update from price momentum, kept inside 0.35-0.75. The honest simple comparator.",
    predict: (context) => {
      const momentum = priceMomentum(context.priceHistory);
      return clamp(0.5 + momentum / 2, 0.35, 0.75);
    },
  },
  {
    id: "baseline:drunk",
    name: "Drunk",
    description: "Uniform random with a recorded seed. The floor.",
    predict: (context) => seededUnitInterval(context.questionId),
  },
];

export const BASELINE_IDS: readonly BaselineId[] = BASELINE_RULES.map(
  (rule) => rule.id,
);

export function runBaseline(
  rule: BaselineRule,
  context: BaselineContext,
): number {
  return clamp(rule.predict(context), 0, 1);
}
