import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { anchors, seals } from "@/db/schema";
import { sendAnchorTx } from "@/lib/anchor";
import { latestAnchor } from "@/lib/anchor-status";
import { ROBINHOOD_CHAIN_ID, serverEnv, type EnvSource } from "@/lib/env";

export const dynamic = "force-dynamic";

function cronAuthorized(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Plants the chain head on Robinhood Chain (ID 4663) as 44-byte calldata on a
 * zero-value transaction. Runs daily and on every question close via
 * `Authorization: Bearer $CRON_SECRET`. No contract, no ABI, no token: the head
 * hash and record count travel inside the transaction data itself.
 *
 * The anchor is separate from sealing so chain latency or cost never blocks a
 * user. Until a record is anchored it is shown as `pending anchor` and is never
 * called proven.
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

  const existing = await db
    .select({
      headHash: anchors.headHash,
      recordCount: anchors.recordCount,
      txHash: anchors.txHash,
      blockNumber: anchors.blockNumber,
      blockTime: anchors.blockTime,
    })
    .from(anchors)
    .orderBy(desc(anchors.recordCount));

  const latest = latestAnchor(existing);

  if (latest !== null && latest.recordCount >= headRecord.recordIndex) {
    return NextResponse.json({
      anchored: false,
      reason: "already_anchored",
      recordCount: latest.recordCount,
      txHash: latest.txHash,
      blockNumber: latest.blockNumber,
    });
  }

  const recordCount = headRecord.recordIndex + 1;

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
      .insert(anchors)
      .values({
        id: anchorId,
        headHash: headRecord.hash,
        recordCount,
        txHash: tx.txHash,
        blockNumber: tx.blockNumber,
        blockTime: tx.blockTime,
      })
      .onConflictDoNothing();

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

export async function GET() {
  const rows = await db
    .select({
      id: anchors.id,
      headHash: anchors.headHash,
      recordCount: anchors.recordCount,
      txHash: anchors.txHash,
      blockNumber: anchors.blockNumber,
      blockTime: anchors.blockTime,
    })
    .from(anchors)
    .orderBy(desc(anchors.recordCount))
    .limit(1);

  return NextResponse.json({ anchor: rows[0] ?? null });
}
