import Link from "next/link";
import { notFound } from "next/navigation";
import { milestoneFor } from "@/lib/countdown";
import { getQuestion } from "@/lib/question-store";
import { Countdown } from "./countdown";
import { SealForm } from "./seal-form";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "OPEN",
  closed: "CLOSED",
  settled: "SETTLED",
  void: "VOID",
};

export default async function QuestionPage({
  params,
}: PageProps<"/q/[id]">) {
  const { id } = await params;
  const question = await getQuestion(id);

  if (!question) {
    notFound();
  }

  const now = new Date();
  const milestone = milestoneFor(
    question.status,
    question.closesAt,
    question.resolvesAt,
    now,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="font-mono text-xs text-mute">
        <Link href="/questions" className="hover:text-bone">
          Questions
        </Link>
      </p>

      <h1 className="mt-3 text-2xl leading-snug text-bone">{question.text}</h1>

      <dl className="mt-6 flex flex-col gap-y-2 font-mono text-sm">
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-mute">ID</dt>
          <dd className="text-bone">{question.id}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-mute">SOURCE</dt>
          <dd className="text-bone">{question.source}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-mute">TEST</dt>
          <dd className="text-bone">{question.test}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-mute">STATUS</dt>
          <dd className={question.status === "open" ? "text-seal" : "text-bone"}>
            {STATUS_LABEL[question.status] ?? question.status}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-28 shrink-0 text-mute">SEALS</dt>
          <dd className="text-bone">
            {question.sealCount}
            {question.status !== "open"
              ? ` / ${question.revealCount} revealed`
              : ""}
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-line pt-4">
        <p className="font-mono text-xs uppercase text-mute">
          {milestone.label === "close" ? "Seals close in" : "Resolves in"}
        </p>
        <p className="mt-1">
          {milestone.reached ? (
            <span className="font-mono text-bone">reached</span>
          ) : (
            <Countdown target={milestone.at} />
          )}
        </p>
      </div>

      {question.status === "open" ? (
        <section className="mt-8 border-t border-line pt-6">
          <h2 className="font-display text-xl text-bone">Seal a prediction</h2>
          <div className="mt-4">
            <SealForm questionId={question.id} />
          </div>
        </section>
      ) : null}

      {question.status === "settled" || question.status === "void" ? (
        <div className="mt-6 border-t border-line pt-4">
          <p className="font-mono text-xs uppercase text-mute">Result</p>
          <p className="mt-1 font-display text-3xl text-bone">
            {question.status === "void"
              ? "VOID"
              : question.outcome
                ? "YES"
                : "NO"}
          </p>
          {question.readingValue !== null ? (
            <p className="mt-1 font-mono text-xs text-mute">
              reading {question.readingValue}
              {question.readingBlock !== null
                ? ` at block ${question.readingBlock}`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
