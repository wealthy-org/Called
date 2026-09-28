import { listQuestions } from "@/lib/question-store";
import { publicJson, rateLimited } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimited(request);
  if (limited !== null) {
    return limited;
  }

  const questions = await listQuestions();
  return publicJson({ questions, count: questions.length }, { maxAgeSeconds: 30 });
}
