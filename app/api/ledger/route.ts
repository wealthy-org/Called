import { asc, desc, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { anchors, seals } from "@/db/schema";
import { rateLimited } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request);
  if (limited !== null) {
    return limited;
  }

  const url = new URL(request.url);
  const sinceRaw = url.searchParams.get("since");
  const parsed = sinceRaw === null ? Number.NaN : Number.parseInt(sinceRaw, 10);
  const hasSince = Number.isFinite(parsed);
  const after = hasSince ? parsed : -1;

  const records = await db
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
    .where(hasSince ? gt(seals.recordIndex, after) : undefined)
    .orderBy(asc(seals.recordIndex));

  const [head] = await db
    .select({ hash: seals.hash, recordIndex: seals.recordIndex })
    .from(seals)
    .orderBy(desc(seals.recordIndex))
    .limit(1);

  const [latestAnchor] = await db
    .select({
      id: anchors.id,
      headHash: anchors.headHash,
      recordCount: anchors.recordCount,
      txHash: anchors.txHash,
      blockNumber: anchors.blockNumber,
      blockTime: anchors.blockTime,
    })
    .from(anchors)
    .where(eq(anchors.confirmed, true))
    .orderBy(desc(anchors.createdAt))
    .limit(1);

  return NextResponse.json(
    {
      records: records.map((record) => ({
        ...record,
        sealedAt: record.sealedAt.toISOString(),
      })),
      head: head === undefined ? null : head,
      count: records.length,
      fromIndex: after + 1,
      total: head === undefined ? 0 : head.recordIndex + 1,
      anchor: latestAnchor ?? null,
    },
    {
      headers: {
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    },
  );
}
