import Link from "next/link";
import { sweepDueQuestions } from "@/lib/close-sweep";
import { listQuestions } from "@/lib/question-store";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "OPEN",
  closed: "CLOSED",
  settled: "SETTLED",
  void: "VOID",
};

function shortDate(iso: string): string {
  return iso.slice(0, 10);
}

export default async function QuestionsPage() {
  await sweepDueQuestions();
  const questions = await listQuestions();

  return (
    <>
      <SiteHeader />
      <main className="wrap section">
      <p className="kicker">Archive</p>
      <h1 className="page-title">Questions asked</h1>

      {questions.length === 0 ? (
        <p className="mt-6 text-mute">
          No questions yet. Nothing has been asked.
        </p>
      ) : (
        <ul className="mt-10 flex flex-col border-t border-line">
          {questions.map((question) => (
             <li key={question.id} className="py-6">
              <Link
                href={`/q/${question.id}`}
                   className="block max-w-3xl text-xl text-bone hover:text-seal"
              >
                {question.text}
              </Link>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-mute">
                <div className="flex gap-2">
                  <dt>ID</dt>
                  <dd>{question.id}</dd>
                </div>
                <div className="flex gap-2">
                  <dt>STATUS</dt>
                  <dd
                    className={
                      question.status === "open" ? "text-seal" : "text-bone"
                    }
                  >
                    {STATUS_LABEL[question.status] ?? question.status}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt>CLOSE</dt>
                  <dd>{shortDate(question.closesAt)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt>SEALS</dt>
                  <dd>
                    {question.sealCount}
                    {question.status === "closed"
                      ? ` / ${question.revealCount} revealed`
                      : ""}
                  </dd>
                </div>
                {question.outcome !== null ? (
                  <div className="flex gap-2">
                    <dt>OUTCOME</dt>
                    <dd className="text-bone">
                      {question.outcome ? "YES" : "NO"}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
       )}
      </main>
      <SiteFooter />
    </>
  );
}
