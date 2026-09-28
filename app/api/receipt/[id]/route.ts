import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, seals } from "@/db/schema";
import { serverEnv, type EnvSource } from "@/lib/env";
import { receiptPublicKey, verifyReceipt } from "@/lib/receipt";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const [row] = await db
    .select({
      receiptId: receipts.id,
      signature: receipts.signature,
      sealId: seals.id,
      questionId: seals.questionId,
      forecasterId: seals.forecasterId,
      recordIndex: seals.recordIndex,
      commit: seals.commit,
      recordHash: seals.hash,
      sealedAt: seals.sealedAt,
    })
    .from(receipts)
    .innerJoin(seals, eq(seals.id, receipts.sealId))
    .where(eq(receipts.id, id))
    .limit(1);

  if (row === undefined) {
    return NextResponse.json({ error: "receipt not found" }, { status: 404 });
  }

  const env = serverEnv(process.env as EnvSource);
  const publicKey = await receiptPublicKey(env.RECEIPT_SIGNING_KEY);
  const valid = await verifyReceipt(
    publicKey,
    {
      receiptId: row.receiptId,
      sealId: row.sealId,
      recordIndex: row.recordIndex,
      commit: row.commit,
      recordHash: row.recordHash,
      sealedAt: row.sealedAt,
      questionId: row.questionId,
      forecasterId: row.forecasterId,
    },
    row.signature,
  );

  return NextResponse.json(
    {
      receiptId: row.receiptId,
      sealId: row.sealId,
      questionId: row.questionId,
      forecasterId: row.forecasterId,
      recordIndex: row.recordIndex,
      commit: row.commit,
      recordHash: row.recordHash,
      sealedAt: row.sealedAt.toISOString(),
      algorithm: "Ed25519",
      publicKey,
      signature: row.signature,
      valid,
    },
    {
      headers: {
        "cache-control": "public, max-age=60",
      },
    },
  );
}
