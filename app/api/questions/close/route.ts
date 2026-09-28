import { and, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { serverEnv, type EnvSource } from "@/lib/env";
import { closeQuestion } from "@/lib/seal-store";

export const dynamic = "force-dynamic";

function cronAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Closes every open question whose `closes_at` has passed. Cron-only for now:
 * `Authorization: Bearer $CRON_SECRET`. Manual settling is a separate flow that
 * needs two admin approvals and an audit log entry.
 *
 * Served on both GET and POST: Vercel's scheduler uses GET, the Cloudflare
 * worker in `workers/cron/` uses POST.
 */
export async function GET(request: Request) {
  return closeDue(request);
}

export async function POST(request: Request) {
  return closeDue(request);
}

async function closeDue(request: Request) {
  const env = serverEnv(process.env as EnvSource);
  const isCron = cronAuthorized(request, env.CRON_SECRET);

  if (!isCron) {
    return NextResponse.json(
      { error: "cron secret or admin session required" },
      { status: 401 },
    );
  }

  const now = new Date();
  const due = await db
    .select({ id: questions.id })
    .from(questions)
    .where(
      and(
        eq(questions.status, "open"),
        lte(questions.closesAt, now),
      ),
    );

  const closed = [];
  const skipped = [];

  for (const question of due) {
    const result = await closeQuestion({ questionId: question.id, now });
    if (result.ok) {
      closed.push({ questionId: result.questionId, revealed: result.revealed });
    } else {
      skipped.push({ questionId: question.id, reason: result.reason });
    }
  }

  return NextResponse.json({
    now: now.toISOString(),
    due: due.length,
    closed,
    skipped,
  });
}
