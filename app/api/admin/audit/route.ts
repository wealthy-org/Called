import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAuditLog } from "@/lib/admin-store";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const entries = await listAuditLog(50);
  return NextResponse.json(
    {
      entries: entries.map((entry) => ({
        ...entry,
        at: entry.at.toISOString(),
      })),
      count: entries.length,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
