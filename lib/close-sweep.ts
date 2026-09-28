import "server-only";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import {
  sweepDueQuestions as sweepCore,
  type CloseSweepResult,
} from "./close-sweep-core";
import { closeQuestion } from "./seal-store";

/**
 * Lazy close: no cron is required for a question to leave `open`. Any page or
 * API that reads questions calls this first, so a question is closed the moment
 * someone looks at it after `closes_at`. The Cloudflare cron still runs as a
 * backstop for quiet periods.
 */
export async function sweepDueQuestions(now = new Date()): Promise<CloseSweepResult> {
  return sweepCore(now, {
    listDue: async (at) => {
      const rows = await db
        .select({ id: questions.id })
        .from(questions)
        .where(and(eq(questions.status, "open"), lte(questions.closesAt, at)));
      return rows.map((row) => row.id);
    },
    close: async (questionId, at) => {
      const result = await closeQuestion({ questionId, now: at });
      if (result.ok) {
        return { ok: true, revealed: result.revealed };
      }
      return { ok: false, reason: result.reason };
    },
  });
}
