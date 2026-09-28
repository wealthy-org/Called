export type Milestone = {
  label: "close" | "resolve";
  at: string;
  reached: boolean;
};

export function milestoneFor(
  status: "open" | "closed" | "settled" | "void",
  closesAt: string,
  resolvesAt: string,
  now: Date,
): Milestone {
  if (status === "settled" || status === "void") {
    return { label: "resolve", at: resolvesAt, reached: true };
  }
  if (status === "closed" || now.getTime() >= new Date(closesAt).getTime()) {
    return { label: "resolve", at: resolvesAt, reached: false };
  }
  return { label: "close", at: closesAt, reached: false };
}

export function partsUntil(target: string, now: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  elapsed: boolean;
} {
  const totalMs = new Date(target).getTime() - now.getTime();
  const clamped = Math.max(0, totalMs);
  return {
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped % 86_400_000) / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1_000),
    totalMs,
    elapsed: totalMs <= 0,
  };
}

export function formatCountdown(target: string, now: Date): string {
  const { days, hours, minutes, seconds, elapsed } = partsUntil(target, now);
  if (elapsed) {
    return "due";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
