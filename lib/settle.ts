import { evaluateTest, parseTest, type TestExpression } from "./test-grammar";

export type SettleOutcome = "YES" | "NO" | "VOID";

export interface SettleReading {
  value: number;
  blockNumber: number;
  observedAt: string;
}

export type SettleError =
  | "no_predictions"
  | "not_closed"
  | "unreadable_source"
  | "invalid_test"
  | "already_settled";

export type SettleResult =
  | {
      ok: true;
      status: "settled" | "void";
      outcome: SettleOutcome;
      readingValue: number | null;
      readingBlock: number | null;
      observedAt: string | null;
      reason: string | null;
    }
  | { ok: false; reason: SettleError; message: string };

export interface SettleInput {
  questionId: string;
  test: string;
  status: "open" | "closed" | "settled" | "void";
  resolvesAt: Date;
  now: Date;
  predictionCount: number;
  source: unknown;
}

/**
 * Settle reads the question, the single source reading, and a prediction COUNT.
 * It never receives individual probabilities, so a resolver can not be
 * influenced by what was predicted. An unreadable source yields `void`,
 * never a guess.
 */
export function settle(input: SettleInput): SettleResult {
  if (input.status === "settled" || input.status === "void") {
    return {
      ok: false,
      reason: "already_settled",
      message: `question is already ${input.status}`,
    };
  }

  if (input.predictionCount <= 0) {
    return {
      ok: false,
      reason: "no_predictions",
      message: "a question with no revealed predictions cannot be settled",
    };
  }

  if (input.status === "open") {
    return {
      ok: false,
      reason: "not_closed",
      message: "question must be closed before it can be settled",
    };
  }

  if (input.now.getTime() < input.resolvesAt.getTime()) {
    return {
      ok: false,
      reason: "not_closed",
      message: "resolution time has not arrived",
    };
  }

  let expression: TestExpression;
  try {
    expression = parseTest(input.test);
  } catch (error) {
    return {
      ok: false,
      reason: "invalid_test",
      message: `test could not be parsed: ${describe(error)}`,
    };
  }

  if (isUnreadable(input.source)) {
    const reason = readReason(input.source);
    return {
      ok: true,
      status: "void",
      outcome: "VOID",
      readingValue: null,
      readingBlock: null,
      observedAt: null,
      reason,
    };
  }

  const reading = input.source as SettleReading;
  const passed = evaluateTest(expression, reading.value);

  return {
    ok: true,
    status: "settled",
    outcome: passed ? "YES" : "NO",
    readingValue: reading.value,
    readingBlock: reading.blockNumber,
    observedAt: reading.observedAt,
    reason: null,
  };
}

function isUnreadable(source: unknown): boolean {
  if (typeof source !== "object" || source === null) {
    return true;
  }
  const record = source as Record<string, unknown>;
  if (record.ok === false) {
    return true;
  }
  if (typeof record.value !== "number" || !Number.isFinite(record.value)) {
    return true;
  }
  return (
    typeof record.blockNumber !== "number" ||
    typeof record.observedAt !== "string"
  );
}

function readReason(source: unknown): string {
  if (typeof source === "object" && source !== null) {
    const message = (source as Record<string, unknown>).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return "the resolution source could not be read";
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
