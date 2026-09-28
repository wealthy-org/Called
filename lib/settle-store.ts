import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import type { SettleResult } from "./settle";

export interface ApplyResult {
  ok: true;
  questionId: string;
}

/**
 * Writes a settle() result back onto the questions row. A void stays void
 * (no outcome, no reading). A settled question stores outcome plus the
 * reading that produced it.
 */
export async function applySettleResult(
  questionId: string,
  result: SettleResult,
): Promise<ApplyResult> {
  if (!result.ok) {
    return { ok: true, questionId };
  }

  const base = {
    status: "settled" as const,
    outcome: result.outcome === "YES" ? true : false,
    readingValue:
      result.readingValue === null ? null : String(result.readingValue),
    readingBlock: result.readingBlock ?? null,
  };

  if (result.status === "void") {
    await db
      .update(questions)
      .set({
        status: "void",
        outcome: null,
        readingValue: null,
        readingBlock: null,
      })
      .where(eq(questions.id, questionId));
  } else {
    await db.update(questions).set(base).where(eq(questions.id, questionId));
  }

  return { ok: true, questionId };
}