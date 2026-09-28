import { NextResponse } from "next/server";
import { getQuestion } from "@/lib/question-store";
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
  const question = await getQuestion(id);

  if (question === null) {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }

  return publicJson({ question }, { maxAgeSeconds: 30 });
}
