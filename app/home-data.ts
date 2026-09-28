import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  anchors,
  forecasters,
  questions,
  receipts,
  sealReveals,
  seals,
} from "@/db/schema";
import {
  anchorStatusFor,
  bestAnchorFor,
  type AnchorRecord,
} from "@/lib/anchor-status";
import { sweepDueQuestions } from "@/lib/close-sweep";
import { methodSteps, type MethodStep } from "@/lib/method-log";
import type { QuestionDetail } from "@/lib/question-store";
import { getQuestion } from "@/lib/question-store";
import type { LedgerRecordView } from "@/app/ledger/verify";
import type { SpreadForecast } from "@/components/spread-plot";

export interface HomeResultView {
  questionId: string;
  questionText: string;
  test: string;
  outcome: boolean;
  readingValue: string | null;
  forecasts: SpreadForecast[];
}

export interface HomeLedgerRow extends LedgerRecordView {
  label: string;
  reason: string;
}

export interface HomeLedgerView {
  records: HomeLedgerRow[];
  total: number;
}

export interface HomeReceiptView {
  receiptId: string;
  questionId: string;
  recordIndex: number;
  sealedAt: string;
  chainHash: string;
  probability: number | null;
  anchorStatus: string;
  anchorBlock: number | null;
}

export interface HomeMethodView {
  questionId: string | null;
  steps: MethodStep[];
  receipt: HomeReceiptView | null;
}

export interface HomeQuestionView {
  question: QuestionDetail;
}

const MAX_HOME_RESULT_FORECASTS = 5;

export interface HomeSessionView {
  headHash: string | null;
  recordCount: number;
  anchorStatus: string;
  anchorId: string | null;
}

export async function loadHomeSession(): Promise<HomeSessionView> {
  const [head] = await db
    .select({ hash: seals.hash, recordIndex: seals.recordIndex })
    .from(seals)
    .orderBy(desc(seals.recordIndex))
    .limit(1);

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

  if (head === undefined) {
    return {
      headHash: null,
      recordCount: 0,
      anchorStatus: "no records yet",
      anchorId: null,
    };
  }

  const status = anchorStatusFor(head.recordIndex, anchorRows);
  const [latest] = await db
    .select({ id: anchors.id })
    .from(anchors)
    .where(eq(anchors.confirmed, true))
    .orderBy(desc(anchors.recordCount))
    .limit(1);

  return {
    headHash: head.hash,
    recordCount: head.recordIndex + 1,
    anchorStatus: status,
    anchorId: latest?.id ?? null,
  };
}

export async function loadHomeQuestion(): Promise<HomeQuestionView | null> {
  await sweepDueQuestions();
  const [row] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.status, "open"))
    .orderBy(asc(questions.closesAt))
    .limit(1);

  if (row === undefined) {
    return null;
  }

  const question = await getQuestion(row.id);
  return question === null ? null : { question };
}

export async function loadHomeLedger(): Promise<HomeLedgerView> {
  const recent = await db
    .select({
      index: seals.recordIndex,
      sealId: seals.id,
      questionId: seals.questionId,
      forecasterId: seals.forecasterId,
      commit: seals.commit,
      sealedAt: seals.sealedAt,
      prev: seals.prevHash,
      hash: seals.hash,
      label: forecasters.name,
      payloadJson: sealReveals.payloadJson,
    })
    .from(seals)
    .innerJoin(forecasters, eq(seals.forecasterId, forecasters.id))
    .leftJoin(sealReveals, eq(sealReveals.sealId, seals.id))
    .orderBy(desc(seals.recordIndex))
    .limit(5);

  const [head] = await db
    .select({ recordIndex: seals.recordIndex })
    .from(seals)
    .orderBy(desc(seals.recordIndex))
    .limit(1);

  return {
    records: recent
      .map((record) => ({
        index: record.index,
        sealId: record.sealId,
        questionId: record.questionId,
        forecasterId: record.forecasterId,
        commit: record.commit,
        sealedAt: record.sealedAt.toISOString(),
        prev: record.prev,
        hash: record.hash,
        label: record.label,
        reason: readPayloadRationale(record.payloadJson),
      }))
      .reverse(),
    total: head === undefined ? 0 : head.recordIndex + 1,
  };
}

export async function loadHomeResult(options?: {
  maxForecasts?: number | null;
}): Promise<HomeResultView | null> {
  const limit = options?.maxForecasts ?? MAX_HOME_RESULT_FORECASTS;

  const [settled] = await db
    .select({
      id: questions.id,
      text: questions.text,
      test: questions.test,
      outcome: questions.outcome,
      readingValue: questions.readingValue,
    })
    .from(questions)
    .where(eq(questions.status, "settled"))
    .orderBy(desc(questions.resolvesAt))
    .limit(1);

  if (settled === undefined || settled.outcome === null) {
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
    if (limit !== null && forecasts.length >= limit) {
      break;
    }
    const p = parsePayloadProbability(reveal.payloadJson);
    if (p === null) {
      continue;
    }
    forecasts.push({ id: reveal.forecasterId, label: reveal.label, p });
  }

  return {
    questionId: settled.id,
    questionText: settled.text,
    test: settled.test,
    outcome: settled.outcome,
    readingValue: settled.readingValue,
    forecasts,
  };
}

export async function loadHomeMethod(): Promise<HomeMethodView> {
  const question = await loadHomeQuestion();
  const steps =
    question === null
      ? methodSteps({
          opensAt: new Date(),
          closesAt: new Date(),
          resolvesAt: new Date(),
          status: "closed",
          sealCount: 0,
          now: new Date(),
        })
      : methodSteps({
          opensAt: question.question.opensAt,
          closesAt: question.question.closesAt,
          resolvesAt: question.question.resolvesAt,
          status: question.question.status,
          sealCount: question.question.sealCount,
          now: new Date(),
        });

  return {
    questionId: question?.question.id ?? null,
    steps,
    receipt: await loadHomeReceipt(),
  };
}

export async function loadHomeReceipt(): Promise<HomeReceiptView | null> {
  const [row] = await db
    .select({
      receiptId: receipts.id,
      questionId: seals.questionId,
      recordIndex: seals.recordIndex,
      sealedAt: seals.sealedAt,
      chainHash: seals.hash,
      payloadJson: sealReveals.payloadJson,
    })
    .from(receipts)
    .innerJoin(seals, eq(receipts.sealId, seals.id))
    .leftJoin(sealReveals, eq(sealReveals.sealId, seals.id))
    .orderBy(desc(seals.recordIndex))
    .limit(1);

  if (row === undefined) {
    return null;
  }

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

  const anchor = bestAnchorFor(row.recordIndex, anchorRows);

  return {
    receiptId: row.receiptId,
    questionId: row.questionId,
    recordIndex: row.recordIndex,
    sealedAt: row.sealedAt.toISOString(),
    chainHash: row.chainHash,
    probability: parsePayloadProbability(row.payloadJson),
    anchorStatus: anchorStatusFor(row.recordIndex, anchorRows),
    anchorBlock: anchor?.blockNumber ?? null,
  };
}

function readPayloadRationale(payloadJson: string | null): string {
  if (payloadJson === null) {
    return "";
  }
  try {
    const parsed = JSON.parse(payloadJson) as { rationale?: unknown };
    return typeof parsed.rationale === "string" ? parsed.rationale : "";
  } catch {
    return "";
  }
}

function parsePayloadProbability(payloadJson: string | null): number | null {
  if (payloadJson === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(payloadJson) as { p?: unknown };
    return typeof parsed.p === "number" && Number.isFinite(parsed.p)
      ? parsed.p
      : null;
  } catch {
    return null;
  }
}
