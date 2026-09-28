import { extractContent } from "./cassandra/runner";
import { parseHouseAnswer, type ParsedForecast } from "./cassandra/parse";

export const AGENT_SELF_RUN_LABEL = "Agent (self-run)";
export const BYOK_TIMEOUT_MS = 20_000;
export const MAX_AGENT_NAME_LENGTH = 60;
export const MAX_MODEL_LENGTH = 120;

export interface ByokRunRequest {
  providerEndpoint: string;
  model: string;
  questionText: string;
  apiKey: string;
}

export type ByokOutcome =
  | { ok: true; forecast: ParsedForecast; raw: string }
  | { ok: false; kind: "unparseable"; raw: string; reason: string }
  | { ok: false; kind: "unavailable"; status: number | null; message: string };

export interface ByokDeps {
  fetch: typeof fetch;
  timeoutMs?: number;
}

export function normalizeByokEndpoint(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("https://")) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export interface AgentInput {
  name: string;
  model: string;
  providerEndpoint: string;
  promptHash: string | null;
}

export type AgentInputResult =
  | { ok: true; value: AgentInput }
  | { ok: false; reason: string };

export function validateAgentInput(raw: {
  name?: unknown;
  model?: unknown;
  providerEndpoint?: unknown;
  promptHash?: unknown;
}): AgentInputResult {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (name.length === 0) {
    return { ok: false, reason: "name is required" };
  }
  if (name.length > MAX_AGENT_NAME_LENGTH) {
    return {
      ok: false,
      reason: `name must be at most ${MAX_AGENT_NAME_LENGTH} characters`,
    };
  }

  const model = typeof raw.model === "string" ? raw.model.trim() : "";
  if (model.length === 0) {
    return { ok: false, reason: "model is required" };
  }
  if (model.length > MAX_MODEL_LENGTH) {
    return {
      ok: false,
      reason: `model must be at most ${MAX_MODEL_LENGTH} characters`,
    };
  }

  const providerEndpoint =
    typeof raw.providerEndpoint === "string"
      ? normalizeByokEndpoint(raw.providerEndpoint)
      : null;
  if (providerEndpoint === null) {
    return {
      ok: false,
      reason: "providerEndpoint must be an https URL",
    };
  }

  let promptHash: string | null = null;
  if (typeof raw.promptHash === "string" && raw.promptHash.trim().length > 0) {
    const candidate = raw.promptHash.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(candidate)) {
      return { ok: false, reason: "promptHash must be 64 hex characters" };
    }
    promptHash = candidate;
  }

  return { ok: true, value: { name, model, providerEndpoint, promptHash } };
}

export async function runByokAgent(
  deps: ByokDeps,
  request: ByokRunRequest,
): Promise<ByokOutcome> {
  const endpoint = normalizeByokEndpoint(request.providerEndpoint);
  if (endpoint === null) {
    return {
      ok: false,
      kind: "unavailable",
      status: null,
      message: "provider endpoint must be an https URL",
    };
  }

  const body = {
    model: request.model,
    temperature: 0,
    max_tokens: 200,
    messages: [{ role: "user", content: request.questionText.trim() }],
  };

  let response: Response;
  try {
    response = await deps.fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(deps.timeoutMs ?? BYOK_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      ok: false,
      kind: "unavailable",
      status: null,
      message: error instanceof Error ? error.message : "request failed",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      kind: "unavailable",
      status: response.status,
      message: `provider responded ${response.status}`,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      kind: "unavailable",
      status: response.status,
      message: "response was not JSON",
    };
  }

  const content = extractContent(payload);
  if (content === null) {
    return {
      ok: false,
      kind: "unparseable",
      raw: JSON.stringify(payload),
      reason: "no_content",
    };
  }

  const parsed = parseHouseAnswer(content);
  if (!parsed.ok) {
    return { ok: false, kind: "unparseable", raw: content, reason: parsed.reason };
  }

  return { ok: true, forecast: parsed.forecast, raw: content };
}
