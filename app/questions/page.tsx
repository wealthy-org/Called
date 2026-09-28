import type { Metadata } from "next";
import { sweepDueQuestions } from "@/lib/close-sweep";
import { listQuestions } from "@/lib/question-store";
import { WorkspaceFooter } from "@/components/workspace-footer";
import { SiteHeader } from "@/components/site-header";
import { QuestionsArchive } from "@/components/questions-archive";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Questions — Called",
  description:
    "A public archive of forecasting questions with fixed sources, resolution tests, and forecast history.",
};

export default async function QuestionsPage() {
  await sweepDueQuestions();
  const questions = await listQuestions();

  const summary = {
    total: questions.length,
    open: questions.filter((q) => q.status === "open").length,
    closed: questions.filter((q) => q.status === "closed").length,
    settled: questions.filter((q) => q.status === "settled").length,
    void: questions.filter((q) => q.status === "void").length,
    totalSeals: questions.reduce((sum, q) => sum + q.sealCount, 0),
  };

  const latestSettled = questions
    .filter((q) => q.status === "settled" && q.outcome !== null)
    .sort(
      (a, b) =>
        new Date(b.resolvesAt).getTime() - new Date(a.resolvesAt).getTime(),
    )[0] ?? null;

  return (
    <>
      <SiteHeader />
      <main className="wrap section">
        <QuestionsArchive
          questions={questions.map((q) => ({
            id: q.id,
            text: q.text,
            status: q.status,
            closesAt: q.closesAt,
            resolvesAt: q.resolvesAt,
            outcome: q.outcome,
            sealCount: q.sealCount,
            revealCount: q.revealCount,
          }))}
          summary={summary}
          latestSettled={
            latestSettled
              ? {
                  id: latestSettled.id,
                  text: latestSettled.text,
                  outcome: latestSettled.outcome!,
                  resolvesAt: latestSettled.resolvesAt,
                  sealCount: latestSettled.sealCount,
                }
              : null
          }
        />
      </main>
      <WorkspaceFooter />
    </>
  );
}
