import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { anchors, questions, receipts, seals } from "@/db/schema";
import { bestAnchorFor, type AnchorRecord } from "@/lib/anchor-status";
import { serverEnv, type EnvSource } from "@/lib/env";
import { receiptPublicKey, verifyReceipt } from "@/lib/receipt";

export { explorerTxLink } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export interface ReceiptPageData {
  receiptId: string;
  sealId: string;
  questionId: string;
  forecasterId: string;
  recordIndex: number;
  commit: string;
  recordHash: string;
  sealedAt: string;
  salt: string;
  signature: string;
  publicKey: string;
  valid: boolean;
  anchorBlock: string | null;
  anchorTx: string | null;
  outcome: "YES" | "NO" | "VOID" | null;
  readingValue: string | null;
}

export async function loadReceiptPage(
  receiptId: string,
): Promise<ReceiptPageData | null> {
  const [row] = await db
    .select({
      receiptId: receipts.id,
      signature: receipts.signature,
      sealId: seals.id,
      questionId: seals.questionId,
      forecasterId: seals.forecasterId,
      recordIndex: seals.recordIndex,
      commit: seals.commit,
      salt: seals.salt,
      recordHash: seals.hash,
      sealedAt: seals.sealedAt,
      outcome: questions.outcome,
      status: questions.status,
      readingValue: questions.readingValue,
    })
    .from(receipts)
    .innerJoin(seals, eq(seals.id, receipts.sealId))
    .innerJoin(questions, eq(questions.id, seals.questionId))
    .where(eq(receipts.id, receiptId))
    .limit(1);

  if (row === undefined) {
    return null;
  }

  const env = serverEnv(process.env as EnvSource);
  const publicKey = await receiptPublicKey(env.RECEIPT_SIGNING_KEY);

  const valid = await verifyReceipt(
    publicKey,
    {
      receiptId: row.receiptId,
      sealId: row.sealId,
      questionId: row.questionId,
      forecasterId: row.forecasterId,
      recordIndex: row.recordIndex,
      commit: row.commit,
      salt: row.salt,
      recordHash: row.recordHash,
      sealedAt: row.sealedAt,
    },
    row.signature,
  );

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

  const outcome =
    row.status === "void"
      ? "VOID"
      : row.outcome === null
        ? null
        : row.outcome
          ? "YES"
          : "NO";

  return {
    receiptId: row.receiptId,
    sealId: row.sealId,
    questionId: row.questionId,
    forecasterId: row.forecasterId,
    recordIndex: row.recordIndex,
    commit: row.commit,
    recordHash: row.recordHash,
    sealedAt: row.sealedAt.toISOString(),
    salt: row.salt,
    signature: row.signature,
    publicKey,
    valid,
    anchorBlock: anchor === null ? null : String(anchor.blockNumber),
    anchorTx: anchor === null ? null : anchor.txHash,
    outcome,
    readingValue: row.readingValue,
  };
}
