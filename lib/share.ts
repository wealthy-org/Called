import { provenLabel, type AnchorStatus } from "./anchor-status";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatSharePercent(probability: number): string {
  if (!Number.isFinite(probability)) {
    return "0%";
  }
  const clamped = Math.min(1, Math.max(0, probability));
  return `${Math.round(clamped * 100)}%`;
}

export function formatShareDate(sealedAt: Date): string {
  return `${sealedAt.getUTCDate()} ${MONTHS[sealedAt.getUTCMonth()]}`;
}

export function shareStatement(input: {
  probability: number | null;
  sealedAt: Date;
}): string {
  const date = formatShareDate(input.sealedAt);
  if (input.probability === null) {
    return `Sealed a forecast on ${date}, before the outcome existed.`;
  }
  return `Sealed ${formatSharePercent(input.probability)} on ${date}, before the outcome existed.`;
}

export function shareHeadline(input: {
  probability: number | null;
  sealedAt: Date;
  outcome: "YES" | "NO" | "VOID" | null;
}): string {
  const resolved = input.outcome === "YES" || input.outcome === "NO";
  if (!resolved || input.probability === null) {
    return shareStatement(input);
  }
  return `Sealed ${formatSharePercent(input.probability)} — the outcome was ${input.outcome}.`;
}

export function shareVerificationUrl(origin: string, receiptId: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/receipt/${receiptId}`;
}

export function shareProvenWord(status: AnchorStatus): string {
  return provenLabel(status);
}
