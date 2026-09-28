import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { anchors, forecasters, questions, sealReveals, seals } from "@/db/schema";
import { anchorStatusFor, bestAnchorFor, type AnchorRecord } from "@/lib/anchor-status";
import { sweepDueQuestions } from "@/lib/close-sweep";
import type { SpreadForecast } from "@/components/spread-plot";

export interface SettlementReport {
  questionId: string;
  questionText: string;
  source: string;
  test: string;
  outcome: boolean | null;
  readingValue: string | null;
  resolvesAt: string;
  forecasts: SpreadForecast[];
  anchorStatus: string;
  anchorBlock: number | null;
  anchorTxHash: string | null;
}

export async function loadSettlementReport(): Promise<SettlementReport | null> {
  await sweepDueQuestions();

  const [settled] = await db
    .select({
      id: questions.id,
      text: questions.text,
      source: questions.source,
      test: questions.test,
      outcome: questions.outcome,
      readingValue: questions.readingValue,
      resolvesAt: questions.resolvesAt,
    })
    .from(questions)
    .where(eq(questions.status, "settled"))
    .orderBy(desc(questions.resolvesAt))
    .limit(1);

  if (settled === undefined) {
    return null;
  }

  const reveals = await db
    .select({
      forecasterId: seals.forecasterId,
      label: forecasters.name,
      payloadJson: sealReveals.payloadJson,
    })
    .from(sealReveals)
    .innerJoin(seals, eq(sealReveals.sealId, seals.id))
    .innerJoin(forecasters, eq(seals.forecasterId, forecasters.id))
    .where(eq(seals.questionId, settled.id))
    .orderBy(asc(seals.recordIndex));

  const forecasts: SpreadForecast[] = [];
  for (const reveal of reveals) {
    const p = parsePayloadProbability(reveal.payloadJson);
    if (p === null) continue;
    forecasts.push({ id: reveal.forecasterId, label: reveal.label, p });
  }

  const sealRows = await db
    .select({ recordIndex: seals.recordIndex })
    .from(seals)
    .where(eq(seals.questionId, settled.id))
    .orderBy(asc(seals.recordIndex));

  const anchorRows: AnchorRecord[] = await db
    .select({
      headHash: anchors.headHash,
      recordCount: anchors.recordCount,
      txHash: anchors.txHash,
      blockNumber: anchors.blockNumber,
      blockTime: anchors.blockTime,
    })
    .from(anchors)
    .where(eq(anchors.confirmed, true))
    .orderBy(desc(anchors.recordCount));

  const lastIndex =
    sealRows.length > 0 ? sealRows[sealRows.length - 1].recordIndex : 0;
  const anchorStatus = anchorStatusFor(lastIndex, anchorRows);
  const best = bestAnchorFor(lastIndex, anchorRows);

  return {
    questionId: settled.id,
    questionText: settled.text,
    source: settled.source,
    test: settled.test,
    outcome: settled.outcome,
    readingValue: settled.readingValue,
    resolvesAt: settled.resolvesAt.toISOString(),
    forecasts,
    anchorStatus,
    anchorBlock: best?.blockNumber ?? null,
    anchorTxHash: best?.txHash ?? null,
  };
}

function parsePayloadProbability(payloadJson: string | null): number | null {
  if (payloadJson === null) return null;
  try {
    const parsed = JSON.parse(payloadJson) as { p?: unknown };
    return typeof parsed.p === "number" && Number.isFinite(parsed.p)
      ? parsed.p
      : null;
  } catch {
    return null;
  }
}
