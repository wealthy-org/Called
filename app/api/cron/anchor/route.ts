import { and, desc, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { anchors, seals } from "@/db/schema";
import { sendAnchorTx } from "@/lib/anchor";
import { latestAnchor, type AnchorRecord } from "@/lib/anchor-status";
import { ROBINHOOD_CHAIN_ID, serverEnv, type EnvSource } from "@/lib/env";

export const dynamic = "force-dynamic";

const CLAIM_TTL_MS = 15 * 60 * 1000;

function cronAuthorized(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Plants the chain head on Robinhood Chain testnet (ID 46630) as 44-byte calldata on a
 * zero-value transaction. Runs daily via `Authorization: Bearer $CRON_SECRET`.
 * No contract, no ABI, no token: the head hash and record count travel inside
 * the transaction data itself.
 *
 * The anchor is separate from sealing so chain latency or cost never blocks a
 * user. Until a record is anchored it is shown as `pending anchor` and is never
 * called proven.
 *
 * Concurrency: two triggers must not send two transactions. The unique index
 * `anchors_record_count_unique` plus a claim row make the insert the mutex. The
 * transaction is never held open across the RPC call (`db` uses max: 1).
 */
export async function POST(request: Request) {
  const env = serverEnv(process.env as EnvSource);

  if (!cronAuthorized(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "cron secret required" }, { status: 401 });
  }

  const head = await db
    .select({ hash: seals.hash, recordIndex: seals.recordIndex })
    .from(seals)
    .orderBy(desc(seals.recordIndex))
    .limit(1);

  if (head.length === 0) {
    return NextResponse.json({ anchored: false, reason: "no_records" });
  }

  const headRecord = head[0];
  const recordCount = headRecord.recordIndex + 1;

  const existing: AnchorRecord[] = await db
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

  const latest = latestAnchor(existing);

  if (latest !== null && latest.recordCount >= recordCount) {
    return NextResponse.json({
      anchored: false,
      reason: "already_anchored",
      recordCount: latest.recordCount,
      txHash: latest.txHash,
      blockNumber: latest.blockNumber,
    });
  }

  // Reclaim a claim left behind by a crashed run. Without this, an unconfirmed
  // row would make `onConflictDoNothing` fail forever and block all anchoring.
  const staleBefore = new Date(Date.now() - CLAIM_TTL_MS);
  await db
    .delete(anchors)
    .where(
      and(eq(anchors.confirmed, false), lte(anchors.createdAt, staleBefore)),
    );

  const claimId = `anchor-${recordCount}-claim`;

  const claimed = await db
    .insert(anchors)
    .values({
      id: claimId,
      headHash: headRecord.hash,
      recordCount,
      txHash: "pending",
      blockNumber: 0,
      blockTime: new Date(),
      confirmed: false,
    })
    .onConflictDoNothing()
    .returning({ id: anchors.id });

  if (claimed.length === 0) {
    return NextResponse.json({
      anchored: false,
      reason: "already_anchored",
      recordCount,
    });
  }

  try {
    const tx = await sendAnchorTx(
      {
        rpcUrl: env.ROBINHOOD_RPC_URL,
        privateKey: env.ANCHOR_PRIVATE_KEY,
        chainId: ROBINHOOD_CHAIN_ID,
      },
      headRecord.hash,
      recordCount,
    );

    const anchorId = `anchor-${recordCount}-${tx.txHash.slice(2, 12)}`;

    await db
      .update(anchors)
      .set({
        id: anchorId,
        txHash: tx.txHash,
        blockNumber: tx.blockNumber,
        blockTime: tx.blockTime,
        confirmed: true,
      })
      .where(eq(anchors.recordCount, recordCount));

    return NextResponse.json({
      anchored: true,
      anchorId,
      headHash: headRecord.hash,
      recordCount,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
      blockTime: tx.blockTime.toISOString(),
      chainId: ROBINHOOD_CHAIN_ID,
    });
  } catch (error) {
    await db
      .delete(anchors)
      .where(
        and(eq(anchors.recordCount, recordCount), eq(anchors.confirmed, false)),
      );

    return NextResponse.json(
      {
        anchored: false,
        reason: "anchor_failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
