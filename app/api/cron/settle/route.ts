import { and, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions, sealReveals, seals } from "@/db/schema";
import { serverEnv, type EnvSource } from "@/lib/env";
import { settle } from "@/lib/settle";
import { applySettleResult } from "@/lib/settle-store";
import { parseSource } from "@/lib/resolver/source";
import { dispatchReading, type DispatchReaders } from "@/lib/resolver/dispatch";

export const dynamic = "force-dynamic";

function cronAuthorized(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Settles every closed question whose resolution time has arrived. Runs as a
 * cron (21:00 UTC) via `Authorization: Bearer $CRON_SECRET`. The resolver
 * reads one number from the question's source; an unreadable source voids the
 * question (never a guess). No question without a revealed prediction is
 * settled.
 */
export async function POST(request: Request) {
  const env = serverEnv(process.env as EnvSource);

  if (!cronAuthorized(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "cron secret required" }, { status: 401 });
  }

  const now = new Date();
  const due = await db
    .select({
      id: questions.id,
      source: questions.source,
      test: questions.test,
      resolvesAt: questions.resolvesAt,
      status: questions.status,
    })
    .from(questions)
    .where(
      and(
        eq(questions.status, "closed"),
        lte(questions.resolvesAt, now),
      ),
    );

  const readers: DispatchReaders = {
    twap: undefined,
    oracle: { read: () => Promise.resolve(null), allowlist: [] },
  };

  const settled = [];
  const failed = [];

  for (const question of due) {
    const revealedRows = await db
      .select({ id: sealReveals.id })
      .from(sealReveals)
      .innerJoin(seals, eq(sealReveals.sealId, seals.id))
      .where(eq(seals.questionId, question.id));

    const predictionCount = revealedRows.length;

    let source: unknown;
    try {
      const spec = parseSource(question.source);
      source = await dispatchReading(spec, readers);
    } catch (error) {
      source = {
        ok: false,
        reason: "unparseable_source",
        message: error instanceof Error ? error.message : String(error),
      };
    }

    const result = settle({
      questionId: question.id,
      test: question.test,
      status: question.status,
      resolvesAt: question.resolvesAt,
      now,
      predictionCount,
      source,
    });

    if (!result.ok) {
      failed.push({ questionId: question.id, reason: result.reason });
      continue;
    }

    await applySettleResult(question.id, result);
    settled.push({
      questionId: question.id,
      status: result.status,
      outcome: result.outcome,
      readingValue: result.readingValue,
      readingBlock: result.readingBlock,
    });
  }

  return NextResponse.json({
    now: now.toISOString(),
    due: due.length,
    settled,
    failed,
  });
}