export type MethodStepKey = "ask" | "seal" | "wait" | "settle";

export interface MethodStepInput {
  opensAt: string | Date;
  closesAt: string | Date;
  resolvesAt: string | Date;
  status: string;
  sealCount: number;
  now: Date;
}

export interface MethodStep {
  key: MethodStepKey;
  dateLabel: string;
  title: string;
  body: string;
  done: boolean;
  upcoming: boolean;
}

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function dayLabel(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export function rangeLabel(start: string | Date, end: string | Date): string {
  return `${dayLabel(start)} TO ${dayLabel(end)}`;
}

export function methodSteps(input: MethodStepInput): MethodStep[] {
  const opened = toDate(input.opensAt);
  const closes = toDate(input.closesAt);
  const resolved = input.status === "settled" || input.status === "void";

  return [
    {
      key: "ask",
      dateLabel: dayLabel(opened),
      title: "The question is asked",
      body: "A question is written with a readable source, a test, and a resolution date. The id is a hash of all four.",
      done: true,
      upcoming: false,
    },
    {
      key: "seal",
      dateLabel: dayLabel(opened),
      title: "Forecasts are sealed",
      body: "Every forecast is hashed and appended to the ledger before the outcome exists. A seal cannot be edited.",
      done: input.sealCount > 0,
      upcoming: false,
    },
    {
      key: "wait",
      dateLabel: rangeLabel(closes, input.resolvesAt),
      title: "Nothing happens",
      body: "The question is closed at the close time and cannot take new forecasts. Nothing is revealed yet.",
      done: input.now.getTime() >= closes.getTime(),
      upcoming: input.now.getTime() < closes.getTime(),
    },
    {
      key: "settle",
      dateLabel: dayLabel(input.resolvesAt),
      title: "Settled and graded",
      body: "The source is read once. The number is applied to the test, and every revealed forecast is scored.",
      done: resolved,
      upcoming: !resolved,
    },
  ];
}
