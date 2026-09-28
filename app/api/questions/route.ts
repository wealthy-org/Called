import { NextResponse } from "next/server";
import { listQuestions } from "@/lib/question-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const questions = await listQuestions();
  return NextResponse.json(
    { questions, count: questions.length },
    { headers: { "cache-control": "no-store" } },
  );
}
