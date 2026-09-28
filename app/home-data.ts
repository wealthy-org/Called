import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { anchors, questions, sealReveals, seals } from "@/db/schema";
import { anchorStatusFor, type AnchorRecord } from "@/lib/anchor-status";
import { sweepDueQuestions } from "@/lib/close-sweep";
import type { QuestionDetail } from "@/lib/question-store";
import { getQuestion } from "@/lib/question-store";
import type { LedgerRecordView } from "@/app/ledger/verify";
import type { SpreadForecast } from "@/components/spread-plot";

export interface HomeResultView {
  questionId: string;
  questionText: string;
  outcome: boolean;
  readingValue: string | null;
  forecasts: SpreadForecast[];
}

export interface HomeLedgerView {
  records: LedgerRecordView[];
  total: number;
}

export interface HomeQuestionView {
  question: QuestionDetail;
}

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
    })
    .from(seals)
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
        ...record,
        sealedAt: record.sealedAt.toISOString(),
      }))
      .reverse(),
    total: head === undefined ? 0 : head.recordIndex + 1,
  };
}

export async function loadHomeResult(): Promise<HomeResultView | null> {
  const [settled] = await db
    .select({
      id: questions.id,
      text: questions.text,
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
      payloadJson: sealReveals.payloadJson,
    })
    .from(sealReveals)
    .innerJoin(seals, eq(sealReveals.sealId, seals.id))
    .where(eq(seals.questionId, settled.id));

  const forecasts: SpreadForecast[] = [];
  for (const reveal of reveals) {
    const p = parsePayloadProbability(reveal.payloadJson);
    if (p === null) {
      continue;
    }
    forecasts.push({ id: reveal.forecasterId, label: reveal.forecasterId, p });
  }

  return {
    questionId: settled.id,
    questionText: settled.text,
    outcome: settled.outcome,
    readingValue: settled.readingValue,
    forecasts,
  };
}

function parsePayloadProbability(payloadJson: string): number | null {
  try {
    const parsed = JSON.parse(payloadJson) as { p?: unknown };
    return typeof parsed.p === "number" && Number.isFinite(parsed.p)
      ? parsed.p
      : null;
  } catch {
    return null;
  }
}
