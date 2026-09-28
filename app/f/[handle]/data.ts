import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  failures,
  forecasters,
  questions,
  sealReveals,
  seals,
  users,
} from "@/db/schema";
import { brierScore } from "@/lib/scoring/brier";
import { calibrationBins, calibrationSkew } from "@/lib/scoring/calibration";
import {
  PROVISIONAL_THRESHOLD,
  summarizeForecaster,
  type LeaderboardEntry,
} from "@/lib/scoring/leaderboard-core";
import { murphyDecomposition } from "@/lib/scoring/murphy";
import type { ScoredForecast } from "@/lib/scoring/skill";

export interface ProfileHistoryRow {
  questionId: string;
  text: string;
  p: number;
  outcome: boolean;
  brier: number;
  status: string;
}

export interface ProfileMetrics {
  n: number;
  brier: number | null;
  skill: number | null;
  failures: number;
  provisional: boolean;
}

export interface ProfileMurphy {
  baseRate: number;
  reliability: number;
  resolution: number;
  uncertainty: number;
  brier: number;
  remainder: number;
}

export interface ProfileCalibrationBin {
  binIndex: number;
  low: number;
  high: number;
  n: number;
  meanP: number | null;
  outcomeRate: number | null;
}

export interface ProfileData {
  forecasterId: string;
  handle: string;
  kind: string;
  name: string;
  model: string | null;
  modelVersion: string | null;
  promptHash: string | null;
  isReserve: boolean;
  metrics: ProfileMetrics;
  murphy: ProfileMurphy | null;
  calibration: { bins: number; skew: number; data: ProfileCalibrationBin[] } | null;
  history: ProfileHistoryRow[];
}

async function resolveForecasterIds(handle: string): Promise<string[]> {
  const [userRow] = await db
    .select({ walletAddress: users.walletAddress })
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);

  if (userRow) {
    const owned = await db
      .select({ id: forecasters.id })
      .from(forecasters)
      .where(eq(forecasters.ownerWallet, userRow.walletAddress));
    const human = `human:${userRow.walletAddress.toLowerCase()}`;
    const others = owned.map((row) => row.id).filter((id) => id !== human);
    return [human, ...others];
  }

  if (handle.startsWith("w")) {
    const candidate = handle.slice(1);
    const [row] = await db
      .select({ id: forecasters.id })
      .from(forecasters)
      .where(eq(forecasters.id, candidate))
      .limit(1);
    if (row) {
      return [row.id];
    }
  }

  const byName = await db
    .select({ id: forecasters.id })
    .from(forecasters)
    .where(eq(forecasters.name, handle));
  return byName.map((row) => row.id);
}

export async function loadProfile(handle: string): Promise<ProfileData | null> {
  const ids = await resolveForecasterIds(handle);
  if (ids.length === 0) {
    return null;
  }
  const forecasterId = ids[0];

  const [meta] = await db
    .select({
      id: forecasters.id,
      name: forecasters.name,
      kind: forecasters.kind,
      model: forecasters.model,
      modelVersion: forecasters.modelVersion,
      promptHash: forecasters.promptHash,
      isReserve: forecasters.isReserve,
      ownerWallet: forecasters.ownerWallet,
    })
    .from(forecasters)
    .where(eq(forecasters.id, forecasterId))
    .limit(1);

  let ownerHandle: string | null = null;
  if (meta?.ownerWallet) {
    const [owner] = await db
      .select({ handle: users.handle })
      .from(users)
      .where(eq(users.walletAddress, meta.ownerWallet))
      .limit(1);
    ownerHandle = owner?.handle ?? null;
  }

  const rows = await db
    .select({
      questionId: questions.id,
      text: questions.text,
      status: questions.status,
      outcome: questions.outcome,
      payloadJson: sealReveals.payloadJson,
    })
    .from(sealReveals)
    .innerJoin(seals, eq(sealReveals.sealId, seals.id))
    .innerJoin(questions, eq(seals.questionId, questions.id))
    .where(and(eq(seals.forecasterId, forecasterId), eq(questions.status, "settled")));

  const forecasts: ScoredForecast[] = [];
  const history: ProfileHistoryRow[] = [];

  for (const row of rows) {
    const p = parseProbability(row.payloadJson);
    if (row.outcome === null || Number.isNaN(p)) {
      continue;
    }
    forecasts.push({ p, outcome: row.outcome });
    history.push({
      questionId: row.questionId,
      text: row.text,
      p,
      outcome: row.outcome,
      brier: brierScore(p, row.outcome),
      status: row.status,
    });
  }

  const failureRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(failures)
    .innerJoin(questions, eq(failures.questionId, questions.id))
    .where(and(eq(failures.forecasterId, forecasterId), eq(questions.status, "settled")));
  const failureCount = failureRows[0]?.count ?? 0;

  const summary: LeaderboardEntry = summarizeForecaster({
    forecasts,
    failures: failureCount,
    meta: {
      forecasterId,
      handle: ownerHandle ?? handle,
      kind: meta?.kind ?? "house",
      model: meta?.model ?? null,
      modelVersion: meta?.modelVersion ?? null,
      promptHash: meta?.promptHash ?? null,
      isReserve: meta?.isReserve ?? false,
      isRanked: true,
    },
  });

  const murphy = forecasts.length > 0 ? murphyDecomposition(forecasts) : null;
  const calibration =
    forecasts.length > 0
      ? (() => {
          const { bins, data } = calibrationBins(forecasts, 10);
          return { bins, skew: calibrationSkew(forecasts), data };
        })()
      : null;

  return {
    forecasterId,
    handle: ownerHandle ?? handle,
    kind: meta?.kind ?? "house",
    name: meta?.name ?? handle,
    model: meta?.model ?? null,
    modelVersion: meta?.modelVersion ?? null,
    promptHash: meta?.promptHash ?? null,
    isReserve: meta?.isReserve ?? false,
    metrics: {
      n: summary.n,
      brier: summary.brier,
      skill: summary.skill,
      failures: summary.failures,
      provisional: summary.n < PROVISIONAL_THRESHOLD,
    },
    murphy,
    calibration,
    history,
  };
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
