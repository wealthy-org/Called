import { and, eq, gt, inArray, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { agentRuns, failures, forecasters, questions } from "@/db/schema";
import {
  HOUSE_MODEL_BY_ID,
  PRIMARY_HOUSE_MODEL,
  type HouseModelTier,
} from "@/config/house-models";
import { runHouseForecast } from "@/lib/cassandra/fallback";
import {
  loadForecasterPrompt,
  runTier as runOpenRouterTier,
} from "@/lib/cassandra/runner";
import { encryptPayload, newSalt } from "@/lib/crypto-box";
import { serverEnv, type EnvSource } from "@/lib/env";
import { sha256Hex } from "@/lib/hash";
import { commitHash, stablePayloadJson } from "@/lib/seal";
import { appendSeal } from "@/lib/seal-store";

export const dynamic = "force-dynamic";

function cronAuthorized(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function ensureHouseForecaster(
  tier: HouseModelTier,
  promptHash: string,
): Promise<void> {
  await db
    .insert(forecasters)
    .values({
      id: tier.id,
      kind: "house",
      ownerWallet: null,
      name: tier.name,
      model: tier.model,
      modelVersion: null,
      providerEndpoint: null,
      promptHash,
      isReserve: tier.isReserve,
      isRanked: tier.isRanked,
    })
    .onConflictDoNothing();
}

/**
 * Runs the house model once per question when the question opens (PRD:
 * "Cassandra dijalankan oleh cron server, sekali per pertanyaan, saat
 * pertanyaan dibuka"). The attempt is claimed in `agent_runs` keyed to the
 * primary tier before any network call, so overlapping cron invocations never
 * double-run. The fallback walk uses the server `OPENROUTER_API_KEY`; an
 * unparseable answer is recorded in `failures` and never retried.
 *
 * Served on both GET and POST: the Cloudflare worker in `workers/cron/`
 * uses POST.
 */
export async function GET(request: Request) {
  return runOpenQuestions(request);
}

export async function POST(request: Request) {
  return runOpenQuestions(request);
}

async function runOpenQuestions(request: Request) {
  const env = serverEnv(process.env as EnvSource);

  if (!cronAuthorized(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "cron secret required" }, { status: 401 });
  }

  if (env.OPENROUTER_API_KEY === null) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 503 },
    );
  }

  const now = new Date();
  const due = await db
    .select({
      id: questions.id,
      text: questions.text,
      closesAt: questions.closesAt,
    })
    .from(questions)
    .where(
      and(
        eq(questions.status, "open"),
        lte(questions.opensAt, now),
        gt(questions.closesAt, now),
      ),
    );

  if (due.length === 0) {
    return NextResponse.json({
      now: now.toISOString(),
      due: 0,
      sealed: [],
      failed: [],
    });
  }

  const priorClaims = await db
    .select({ questionId: agentRuns.questionId })
    .from(agentRuns)
    .where(
      and(
        eq(agentRuns.forecasterId, PRIMARY_HOUSE_MODEL.id),
        inArray(
          agentRuns.questionId,
          due.map((q) => q.id),
        ),
      ),
    );
  const claimedIds = new Set(priorClaims.map((row) => row.questionId));

  const pending: { id: string; text: string; closesAt: Date }[] = [];
  for (const question of due) {
    if (claimedIds.has(question.id)) continue;
    const [claim] = await db
      .insert(agentRuns)
      .values({
        id: `run-${crypto.randomUUID()}`,
        forecasterId: PRIMARY_HOUSE_MODEL.id,
        questionId: question.id,
      })
      .onConflictDoNothing()
      .returning({ id: agentRuns.id });
    if (claim !== undefined) {
      pending.push(question);
    }
  }

  if (pending.length === 0) {
    return NextResponse.json({
      now: now.toISOString(),
      due: due.length,
      sealed: [],
      failed: [],
    });
  }

  const promptTemplate = loadForecasterPrompt();
  const promptHash = await sha256Hex(promptTemplate);

  const sealed: unknown[] = [];
  const failed: unknown[] = [];

  for (const question of pending) {
    console.log(`open-questions: house run for ${question.id}`);

    const result = await runHouseForecast(
      {
        runTier: (input) => runOpenRouterTier({ fetch }, input),
        onAttempt: (attempt) => {
          console.log(
            `open-questions: ${question.id} tier=${attempt.tierId} kind=${attempt.kind} attempts=${attempt.attempts}${attempt.status !== null ? ` status=${attempt.status}` : ""}`,
          );
        },
      },
      {
        questionId: question.id,
        questionText: question.text,
        now,
        apiKey: env.OPENROUTER_API_KEY,
        promptTemplate,
      },
    );

    if (result.ok) {
      const tier = HOUSE_MODEL_BY_ID.get(result.tierId);
      if (tier === undefined) {
        failed.push({ questionId: question.id, reason: "unknown_tier" });
        continue;
      }

      await ensureHouseForecaster(tier, promptHash);

      const salt = newSalt();
      const payloadJson = stablePayloadJson({
        p: result.forecast.p,
        handle: tier.name,
        rationale: result.forecast.why,
      });
      const commit = await commitHash(payloadJson, salt);
      const payloadCiphertext = await encryptPayload(
        payloadJson,
        env.PAYLOAD_ENCRYPTION_KEY,
      );

      const sealResult = await appendSeal({
        questionId: question.id,
        forecasterId: tier.id,
        ownerWallet: null,
        forecasterName: tier.name,
        commit,
        salt,
        payloadCiphertext,
        sealedAt: new Date(),
        model: tier.model,
        modelVersion: null,
        promptHash,
        kind: "house",
        receiptSigningKey: env.RECEIPT_SIGNING_KEY,
      });

      if (sealResult.ok) {
        sealed.push({
          questionId: question.id,
          tierId: tier.id,
          model: tier.model,
          p: result.forecast.p,
          sealId: sealResult.sealId,
          recordIndex: sealResult.recordIndex,
        });
        console.log(
          `open-questions: sealed ${question.id} tier=${tier.id} p=${result.forecast.p}`,
        );
      } else {
        failed.push({ questionId: question.id, reason: sealResult.reason });
        console.error(
          `open-questions: seal failed for ${question.id}: ${sealResult.reason}`,
        );
      }
      continue;
    }

    const failureTier =
      (result.tierId !== null ? HOUSE_MODEL_BY_ID.get(result.tierId) : undefined) ??
      PRIMARY_HOUSE_MODEL;
    await ensureHouseForecaster(failureTier, promptHash);

    const reason =
      result.kind === "unparseable"
        ? `unparseable answer: ${result.reason ?? "unknown"}`
        : "provider unavailable: all house tiers exhausted";

    await db.insert(failures).values({
      id: `failure-${question.id}-${failureTier.id}`,
      questionId: question.id,
      forecasterId: failureTier.id,
      rawResponse: result.raw,
      reason,
    });

    failed.push({ questionId: question.id, reason });
    console.error(`open-questions: ${question.id} failed: ${reason}`);
  }

  return NextResponse.json({
    now: now.toISOString(),
    due: due.length,
    sealed,
    failed,
  });
}
