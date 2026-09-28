export interface ParsedForecast {
  p: number;
  why: string;
}

export type ParseResult =
  | { ok: true; forecast: ParsedForecast }
  | { ok: false; reason: "no_json" | "no_probability" | "probability_out_of_range" };

const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/;

function coerceProbability(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim().replace(/%$/, "");
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseHouseAnswer(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "no_json" };
  }

  const match = trimmed.match(JSON_OBJECT_PATTERN);
  if (!match) {
    return { ok: false, reason: "no_json" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return { ok: false, reason: "no_json" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "no_json" };
  }

  const record = parsed as Record<string, unknown>;
  const probability = coerceProbability(record.p);
  if (probability === null) {
    return { ok: false, reason: "no_probability" };
  }

  let normalized = probability;
  if (normalized > 1 && normalized <= 100) {
    normalized = normalized / 100;
  }
  if (normalized < 0 || normalized > 1) {
    return { ok: false, reason: "probability_out_of_range" };
  }

  const why =
    typeof record.why === "string" && record.why.trim().length > 0
      ? record.why.trim()
      : "";

  return { ok: true, forecast: { p: normalized, why } };
}
