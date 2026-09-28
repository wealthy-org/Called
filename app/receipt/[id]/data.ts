import { eq } from "drizzle-orm";
import { db } from "@/db";
import { anchors, questions, receipts, seals } from "@/db/schema";
import { serverEnv, type EnvSource } from "@/lib/env";
import { receiptPublicKey, verifyReceipt } from "@/lib/receipt";

export const dynamic = "force-dynamic";

const EXPLORER_BASE = "https://explorer.testnet.chain.robinhood.com";

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

  const head = await db
    .select({
      blockNumber: anchors.blockNumber,
      txHash: anchors.txHash,
    })
    .from(anchors)
    .where(eq(anchors.recordCount, row.recordIndex))
    .limit(1);

  const anchor = head[0];

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
    anchorBlock: anchor === undefined ? null : String(anchor.blockNumber),
    anchorTx: anchor === undefined ? null : anchor.txHash,
    outcome,
    readingValue: row.readingValue,
  };
}

export function explorerTxLink(txHash: string | null): string | null {
  return txHash === null ? null : `${EXPLORER_BASE}/tx/${txHash}`;
}
