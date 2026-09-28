import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { anchors, seals } from "@/db/schema";
import {
  anchorStatusFor,
  latestAnchor,
} from "@/lib/anchor-status";
import type { LedgerRecordView } from "./verify";

export interface LedgerRecord extends LedgerRecordView {
  anchorStatus: "sealed" | "pending anchor" | "anchored";
}

export interface LedgerPageData {
  recent: LedgerRecord[];
  total: number;
  headHash: string | null;
  headIndex: number;
  anchorStatus: "sealed" | "pending anchor" | "anchored";
  latestAnchor: {
    headHash: string;
    recordCount: number;
    txHash: string;
    blockNumber: number;
    blockTime: string;
  } | null;
}

export async function loadLedgerPage(): Promise<LedgerPageData> {
  const RECENT_LIMIT = 5;

  const [recentRows, countRows, confirmedAnchors] = await Promise.all([
    db
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
      .limit(RECENT_LIMIT),

    db
      .select({ count: seals.id })
      .from(seals),

    db
      .select({
        headHash: anchors.headHash,
        recordCount: anchors.recordCount,
        txHash: anchors.txHash,
        blockNumber: anchors.blockNumber,
        blockTime: anchors.blockTime,
      })
      .from(anchors)
      .where(eq(anchors.confirmed, true))
      .orderBy(desc(anchors.recordCount)),
  ]);

  const total = countRows.length;

  const reversed = [...recentRows].reverse();
  const recent: LedgerRecord[] = reversed.map((row) => ({
    index: row.index,
    sealId: row.sealId,
    questionId: row.questionId,
    forecasterId: row.forecasterId,
    commit: row.commit,
    sealedAt: row.sealedAt.toISOString(),
    prev: row.prev,
    hash: row.hash,
    anchorStatus: anchorStatusFor(row.index, confirmedAnchors),
  }));

  const headRow = recentRows[0] ?? null;
  const headHash = headRow?.hash ?? null;
  const headIndex = headRow?.index ?? -1;

  const anchorStatus: "sealed" | "pending anchor" | "anchored" =
    headIndex < 0
      ? "sealed"
      : headHash !== null
        ? anchorStatusFor(headIndex, confirmedAnchors)
        : "sealed";

  const latest = latestAnchor(confirmedAnchors);
  const latestAnchorData = latest
    ? {
        headHash: latest.headHash,
        recordCount: latest.recordCount,
        txHash: latest.txHash,
        blockNumber: latest.blockNumber,
        blockTime: latest.blockTime.toISOString(),
      }
    : null;

  return {
    recent,
    total,
    headHash,
    headIndex,
    anchorStatus,
    latestAnchor: latestAnchorData,
  };
}
