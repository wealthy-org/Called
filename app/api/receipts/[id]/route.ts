import { NextResponse } from "next/server";
import { loadReceiptPage } from "@/app/receipt/[id]/data";
import { publicJson, rateLimited } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimited(request);
  if (limited !== null) {
    return limited;
  }

  const { id } = await context.params;
  const receipt = await loadReceiptPage(id);

  if (receipt === null) {
    return NextResponse.json({ error: "receipt not found" }, { status: 404 });
  }

  return publicJson({ receipt }, { maxAgeSeconds: 30 });
}
