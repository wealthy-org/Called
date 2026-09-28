import { NextResponse } from "next/server";
import { loadLeaderboardPage } from "@/app/leaderboard/data";
import { rateLimited } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request);
  if (limited !== null) {
    return limited;
  }

  const data = await loadLeaderboardPage();
  return NextResponse.json(data, {
    headers: {
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}
