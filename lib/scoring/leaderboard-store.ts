import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  failures,
  forecasters,
  questions,
  sealReveals,
  seals,
  users,
} from "@/db/schema";
import { type ForecasterScoreInput } from "./leaderboard-core";

export interface ForecasterScoreRow {
  forecasterId: string;
  handle: string;
  kind: string;
  model: string | null;
  modelVersion: string | null;
  promptHash: string | null;
  isReserve: boolean;
  isRanked: boolean;
  outcome: boolean;
  p: number;
}

export interface LoadedScores {
  groups: Map<string, ForecasterScoreRow[]>;
  failures: Map<string, number>;
}

export async function loadForecasterScores(): Promise<LoadedScores> {
  const [rows, failureRows] = await Promise.all([
    db
      .select({
        forecasterId: seals.forecasterId,
        handle: users.handle,
        kind: forecasters.kind,
        model: forecasters.model,
        modelVersion: forecasters.modelVersion,
        promptHash: forecasters.promptHash,
        isReserve: forecasters.isReserve,
        isRanked: forecasters.isRanked,
        outcome: questions.outcome,
        p: sealReveals.payloadJson,
      })
      .from(sealReveals)
      .innerJoin(seals, eq(sealReveals.sealId, seals.id))
      .innerJoin(questions, eq(seals.questionId, questions.id))
      .innerJoin(forecasters, eq(seals.forecasterId, forecasters.id))
      .leftJoin(users, eq(forecasters.ownerWallet, users.walletAddress))
      .where(eq(questions.status, "settled")),
    db
      .select({
        forecasterId: failures.forecasterId,
        count: sql<number>`count(*)::int`,
      })
      .from(failures)
      .innerJoin(questions, eq(failures.questionId, questions.id))
      .where(eq(questions.status, "settled"))
      .groupBy(failures.forecasterId),
  ]);

  const groups = new Map<string, ForecasterScoreRow[]>();
  const seen = new Set<string>();

  for (const row of rows) {
    const p = parseProbability(row.p);
    if (row.outcome === null || Number.isNaN(p)) {
      continue;
    }
    const key = row.forecasterId;
    seen.add(key);
    const group = groups.get(key) ?? [];
    group.push({
      forecasterId: row.forecasterId,
      handle: row.handle ?? `w${row.forecasterId}`,
      kind: row.kind,
      model: row.model,
      modelVersion: row.modelVersion,
      promptHash: row.promptHash,
      isReserve: row.isReserve,
      isRanked: row.isRanked,
      outcome: row.outcome,
      p,
    });
    groups.set(key, group);
  }

  const failureMap = new Map<string, number>();
  for (const row of failureRows) {
    failureMap.set(row.forecasterId, row.count);
  }

  for (const key of failureMap.keys()) {
    if (!seen.has(key)) {
      groups.set(key, []);
    }
  }

  return { groups, failures: failureMap };
}

function parseProbability(payloadJson: string): number {
  try {
    const parsed = JSON.parse(payloadJson) as { p?: unknown };
    const p = typeof parsed.p === "number" ? parsed.p : Number.NaN;
    return Number.isFinite(p) ? p : Number.NaN;
  } catch {
    return Number.NaN;
  }
}

export function toScoreInputs(loaded: LoadedScores): ForecasterScoreInput[] {
  const inputs: ForecasterScoreInput[] = [];
  for (const [forecasterId, rows] of loaded.groups) {
    const first = rows[0];
    inputs.push({
      forecasts: rows.map((row) => ({ p: row.p, outcome: row.outcome })),
      failures: loaded.failures.get(forecasterId) ?? 0,
      meta: {
        forecasterId,
        handle: first?.handle ?? `w${forecasterId}`,
        kind: first?.kind ?? "house",
        model: first?.model ?? null,
        modelVersion: first?.modelVersion ?? null,
        promptHash: first?.promptHash ?? null,
        isReserve: first?.isReserve ?? false,
        isRanked: first?.isRanked ?? true,
      },
    });
  }
  return inputs;
}