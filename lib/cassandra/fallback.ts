import { HOUSE_TIERS_BY_ORDER, type HouseModelTier } from "@/config/house-models";
import type { ParsedForecast } from "./parse";
import type { HouseRunOutcome, HouseRunRequest } from "./runner";

export const MAX_RETRIES_PER_TIER = 3;
export const RETRY_BASE_DELAY_MS = 500;

export interface HouseAttempt {
  tierId: string;
  model: string;
  attempts: number;
  kind: "unparseable" | "unavailable";
  status: number | null;
  message?: string;
  reason?: string;
}

export type HouseForecastResult =
  | {
      ok: true;
      tierId: string;
      model: string;
      forecast: ParsedForecast;
      raw: string;
      seeded: boolean;
      attempts: HouseAttempt[];
    }
  | {
      ok: false;
      kind: "unparseable" | "all_unavailable";
      tierId: string | null;
      model: string | null;
      reason: string | null;
      raw: string | null;
      attempts: HouseAttempt[];
    };

export interface HouseFallbackDeps {
  runTier: (request: HouseRunRequest) => Promise<HouseRunOutcome>;
  sleep?: (ms: number) => Promise<void>;
  retryDelayMs?: number;
  tiers?: readonly HouseModelTier[];
  onAttempt?: (attempt: HouseAttempt) => void;
}

export interface HouseForecastInput {
  questionId: string;
  questionText: string;
  now: Date;
  apiKey: string;
  promptTemplate: string;
}

export function isRetryableStatus(status: number | null): boolean {
  if (status === null) {
    return true;
  }
  return status === 429 || status >= 500;
}

export function retryDelay(attempt: number, baseMs = RETRY_BASE_DELAY_MS): number {
  return baseMs * 2 ** (attempt - 1);
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function runHouseForecast(
  deps: HouseFallbackDeps,
  input: HouseForecastInput,
): Promise<HouseForecastResult> {
  const tiers = deps.tiers ?? HOUSE_TIERS_BY_ORDER;
  const sleep = deps.sleep ?? defaultSleep;
  const baseDelay = deps.retryDelayMs ?? RETRY_BASE_DELAY_MS;
  const attempts: HouseAttempt[] = [];

  for (const tier of tiers) {
    let used = 0;

    while (used < MAX_RETRIES_PER_TIER) {
      used += 1;
      const outcome = await deps.runTier({
        tier,
        questionId: input.questionId,
        questionText: input.questionText,
        promptTemplate: input.promptTemplate,
        now: input.now,
        apiKey: input.apiKey,
      });

      if (outcome.ok) {
        return {
          ok: true,
          tierId: outcome.tierId,
          model: outcome.model,
          forecast: outcome.forecast,
          raw: outcome.raw,
          seeded: outcome.seeded,
          attempts,
        };
      }

      const attempt: HouseAttempt = {
        tierId: outcome.tierId,
        model: outcome.model,
        attempts: used,
        kind: outcome.kind,
        status: outcome.kind === "unavailable" ? outcome.status : null,
        message: outcome.kind === "unavailable" ? outcome.message : undefined,
        reason: outcome.kind === "unparseable" ? outcome.reason : undefined,
      };
      attempts.push(attempt);
      deps.onAttempt?.(attempt);

      if (outcome.kind === "unparseable") {
        return {
          ok: false,
          kind: "unparseable",
          tierId: outcome.tierId,
          model: outcome.model,
          reason: outcome.reason,
          raw: outcome.raw,
          attempts,
        };
      }

      const retryable = isRetryableStatus(outcome.status);
      if (!retryable || used >= MAX_RETRIES_PER_TIER) {
        break;
      }

      await sleep(retryDelay(used, baseDelay));
    }
  }

  return {
    ok: false,
    kind: "all_unavailable",
    tierId: null,
    model: null,
    reason: null,
    raw: null,
    attempts,
  };
}
