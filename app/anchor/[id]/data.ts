import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { anchors } from "@/db/schema";

export interface AnchorPageData {
  id: string;
  headHash: string;
  recordCount: number;
  txHash: string;
  blockNumber: number;
  blockTime: Date;
  createdAt: Date;
}

export async function loadAnchor(id: string): Promise<AnchorPageData | null> {
  const rows = await db
    .select({
      id: anchors.id,
      headHash: anchors.headHash,
      recordCount: anchors.recordCount,
      txHash: anchors.txHash,
      blockNumber: anchors.blockNumber,
      blockTime: anchors.blockTime,
      createdAt: anchors.createdAt,
    })
    .from(anchors)
    .where(and(eq(anchors.id, id), eq(anchors.confirmed, true)))
    .limit(1);

  return rows[0] ?? null;
}
