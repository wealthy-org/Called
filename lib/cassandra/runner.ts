import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseHouseAnswer, type ParsedForecast } from "./parse";
import type { HouseModelTier } from "@/config/house-models";

export const OPENROUTER_ENDPOINT =
  "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_TIMEOUT_MS = 20_000;
export const PROMPT_DATE_TOKEN = "CURRENT_UTC_DATE";

export interface HouseRunRequest {
  tier: HouseModelTier;
  questionId: string;
  questionText: string;
  promptTemplate: string;
  now: Date;
  apiKey: string;
}

export type HouseRunOutcome =
  | {
      ok: true;
      tierId: string;
      model: string;
      forecast: ParsedForecast;
      raw: string;
      seeded: boolean;
    }
  | {
      ok: false;
      kind: "unparseable";
      tierId: string;
      model: string;
      raw: string;
      reason: string;
    }
  | {
      ok: false;
      kind: "unavailable";
      tierId: string;
      model: string;
      status: number | null;
      message: string;
    };

export interface HouseRunnerDeps {
  fetch: typeof fetch;
  endpoint?: string;
  timeoutMs?: number;
}

export function seedFromQuestionId(questionId: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < questionId.length; i += 1) {
    hash ^= questionId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function renderPrompt(
  template: string,
  questionText: string,
  now: Date,
): { system: string; user: string } {
  const stamp = now.toISOString().slice(0, 10);
  const system = template.replaceAll(PROMPT_DATE_TOKEN, stamp).trim();
  return { system, user: questionText.trim() };
}

export function buildRequestBody(
  tier: HouseModelTier,
  prompt: { system: string; user: string },
  seed: number,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: tier.model,
    temperature: tier.temperature,
    max_tokens: tier.maxTokens,
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
  };
  if (tier.supportsSeed) {
    body.seed = seed;
  }
  if (tier.supportsStructuredOutput) {
    body.response_format = { type: "json_object" };
  }
  return body;
}

export function extractContent(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }
  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) {
    return null;
  }
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : null;
}

export async function runTier(
  deps: HouseRunnerDeps,
  request: HouseRunRequest,
): Promise<HouseRunOutcome> {
  const { tier } = request;
  const prompt = renderPrompt(
    request.promptTemplate,
    request.questionText,
    request.now,
  );
  const body = buildRequestBody(
    tier,
    prompt,
    seedFromQuestionId(request.questionId),
  );

  let response: Response;
  try {
    response = await deps.fetch(deps.endpoint ?? OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(deps.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      ok: false,
      kind: "unavailable",
      tierId: tier.id,
      model: tier.model,
      status: null,
      message: error instanceof Error ? error.message : "request failed",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      kind: "unavailable",
      tierId: tier.id,
      model: tier.model,
      status: response.status,
      message: `OpenRouter responded ${response.status}`,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      kind: "unavailable",
      tierId: tier.id,
      model: tier.model,
      status: response.status,
      message: "response was not JSON",
    };
  }

  const content = extractContent(payload);
  if (content === null) {
    return {
      ok: false,
      kind: "unparseable",
      tierId: tier.id,
      model: tier.model,
      raw: JSON.stringify(payload),
      reason: "no_content",
    };
  }

  const parsed = parseHouseAnswer(content);
  if (!parsed.ok) {
    return {
      ok: false,
      kind: "unparseable",
      tierId: tier.id,
      model: tier.model,
      raw: content,
      reason: parsed.reason,
    };
  }

  return {
    ok: true,
    tierId: tier.id,
    model: tier.model,
    forecast: parsed.forecast,
    raw: content,
    seeded: tier.supportsSeed,
  };
}

let cachedPrompt: string | null = null;

export function loadForecasterPrompt(): string {
  if (cachedPrompt === null) {
    cachedPrompt = readFileSync(
      resolve(process.cwd(), "prompts", "forecaster.md"),
      "utf8",
    );
  }
  return cachedPrompt;
}
