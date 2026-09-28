import { NextResponse } from "next/server";
import { loadProfile } from "@/app/f/[handle]/data";
import { publicJson, rateLimited } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const limited = rateLimited(request);
  if (limited !== null) {
    return limited;
  }

  const { handle } = await context.params;
  const profile = await loadProfile(handle);

  if (profile === null) {
    return NextResponse.json({ error: "forecaster not found" }, { status: 404 });
  }

  return publicJson({ forecaster: profile }, { maxAgeSeconds: 30 });
}
