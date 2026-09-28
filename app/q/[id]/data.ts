import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { anchors, forecasters, questions, receipts, sealReveals, seals } from "@/db/schema";
import { anchorStatusFor, type AnchorRecord } from "@/lib/anchor-status";
import { parseRevealPayload } from "@/lib/reveal";
import { readSession } from "@/lib/session";
import { db } from "@/db";

export type RevealRow = {
  sealId: string;
  forecasterId: string;
  name: string;
  kind: string;
  isReserve: boolean;
  recordIndex: number;
  commit: string;
  recordHash: string;
  sealedAt: string;
  revealedAt: string | null;
  p: number;
  rationale: string;
  anchorStatus: "sealed" | "pending anchor" | "anchored";
};

export type MySealRow = {
  sealId: string;
  recordIndex: number;
  commit: string;
  recordHash: string;
  sealedAt: string;
  receiptId: string;
  anchorStatus: "sealed" | "pending anchor" | "anchored";
};

export type QuestionDossier = {
  question: {
    id: string;
    text: string;
    source: string;
    test: string;
    status: "open" | "closed" | "settled" | "void";
    opensAt: string;
    closesAt: string;
    resolvesAt: string;
    outcome: boolean | null;
    readingValue: string | null;
    readingBlock: number | null;
    sealCount: number;
    revealCount: number;
  };
  reveals: RevealRow[];
  mySeal: MySealRow | null;
};

async function confirmedAnchors(): Promise<AnchorRecord[]> {
  return db
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
}

export async function loadQuestionDossier(
  id: string,
): Promise<QuestionDossier | null> {
  const question = await db.query.questions.findFirst({
    where: eq(questions.id, id),
  });

  if (!question) return null;

  const anchorRows = await confirmedAnchors();

  const q: QuestionDossier["question"] = {
    id: question.id,
    text: question.text,
    source: question.source,
    test: question.test,
    status: question.status as QuestionDossier["question"]["status"],
    opensAt: question.opensAt.toISOString(),
    closesAt: question.closesAt.toISOString(),
    resolvesAt: question.resolvesAt.toISOString(),
    outcome: question.outcome,
    readingValue: question.readingValue,
    readingBlock: question.readingBlock,
    sealCount: 0,
    revealCount: 0,
  };

  const sealRows = await db
    .select({
      id: seals.id,
      questionId: seals.questionId,
      forecasterId: seals.forecasterId,
      commit: seals.commit,
      sealedAt: seals.sealedAt,
      recordIndex: seals.recordIndex,
      prevHash: seals.prevHash,
      hash: seals.hash,
    })
    .from(seals)
    .where(eq(seals.questionId, id))
    .orderBy(asc(seals.recordIndex));

  q.sealCount = sealRows.length;

  const sealIds = sealRows.map((s) => s.id);

  const revealRows =
    sealIds.length === 0
      ? []
      : await db
          .select({
            sealId: sealReveals.sealId,
            revealedAt: sealReveals.revealedAt,
            payloadJson: sealReveals.payloadJson,
          })
          .from(sealReveals)
          .where(inArray(sealReveals.sealId, sealIds));

  const revealMap = new Map<string, { revealedAt: Date; payloadJson: string }>();
  for (const r of revealRows) {
    revealMap.set(r.sealId, {
      revealedAt: r.revealedAt,
      payloadJson: r.payloadJson,
    });
  }

  q.revealCount = revealMap.size;

  const forecasterIds = [...new Set(sealRows.map((s) => s.forecasterId))];
  const forecasterRows =
    forecasterIds.length === 0
      ? []
      : await db
          .select({
            id: forecasters.id,
            name: forecasters.name,
            kind: forecasters.kind,
            isReserve: forecasters.isReserve,
          })
          .from(forecasters)
          .where(inArray(forecasters.id, forecasterIds));

  const forecasterMap = new Map(
    forecasterRows.map((f) => [f.id, f]),
  );

  const reveals: RevealRow[] = [];

  for (const seal of sealRows) {
    const reveal = revealMap.get(seal.id);
    if (!reveal) continue;

    const parsed = parseRevealPayload(reveal.payloadJson);
    if (!parsed) continue;

    const f = forecasterMap.get(seal.forecasterId);

    reveals.push({
      sealId: seal.id,
      forecasterId: seal.forecasterId,
      name: f?.name ?? seal.forecasterId,
      kind: f?.kind ?? "human",
      isReserve: f?.isReserve ?? false,
      recordIndex: seal.recordIndex,
      commit: seal.commit,
      recordHash: seal.hash,
      sealedAt: seal.sealedAt.toISOString(),
      revealedAt: reveal.revealedAt.toISOString(),
      p: parsed.p,
      rationale: parsed.rationale,
      anchorStatus: anchorStatusFor(seal.recordIndex, anchorRows),
    });
  }

  let mySeal: MySealRow | null = null;
  const session = await readSession();

  if (session !== null) {
    const myForecasterId = `human:${session.address.toLowerCase()}`;
    const mySealRow = sealRows.find((s) => s.forecasterId === myForecasterId);

    if (mySealRow) {
      const [receiptRow] = await db
        .select({ id: receipts.id })
        .from(receipts)
        .where(eq(receipts.sealId, mySealRow.id))
        .limit(1);

      mySeal = {
        sealId: mySealRow.id,
        recordIndex: mySealRow.recordIndex,
        commit: mySealRow.commit,
        recordHash: mySealRow.hash,
        sealedAt: mySealRow.sealedAt.toISOString(),
        receiptId: receiptRow?.id ?? mySealRow.id,
        anchorStatus: anchorStatusFor(mySealRow.recordIndex, anchorRows),
      };
    }
  }

  return { question: q, reveals, mySeal };
}
