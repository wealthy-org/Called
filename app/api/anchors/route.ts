import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { anchors } from "@/db/schema";
import { publicJson, rateLimited } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request);
  if (limited !== null) {
    return limited;
  }

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
    .where(eq(anchors.confirmed, true))
    .orderBy(desc(anchors.recordCount));

  return publicJson(
    {
      anchors: rows.map((row) => ({
        ...row,
        blockTime: row.blockTime.toISOString(),
        createdAt: row.createdAt.toISOString(),
      })),
      count: rows.length,
    },
    { maxAgeSeconds: 60 },
  );
}
