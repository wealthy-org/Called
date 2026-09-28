import { loadLeaderboardPage } from "@/app/leaderboard/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await loadLeaderboardPage();
  return Response.json(data, {
    headers: { "cache-control": "no-store" },
  });
}