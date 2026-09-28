import Link from "next/link";
import { RewordBox } from "@/app/q/[id]/reword-box";
import { SealForm } from "@/app/q/[id]/seal-form";
import type { QuestionDetail } from "@/lib/question-store";

const STATUS_LABEL: Record<string, string> = {
  open: "OPEN",
  closed: "CLOSED",
  settled: "SETTLED",
  void: "VOID",
};

export function HomeQuestion({ question }: { question: QuestionDetail }) {
  return (
    <div className="grid gap-14 lg:grid-cols-[1.25fr_1fr]">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
          Open question
        </p>
        <Link
          href={`/q/${question.id}`}
          className="mt-3 block text-2xl leading-snug text-bone hover:text-seal"
        >
          {question.text}
        </Link>

        <dl className="mt-6 border-y border-line">
          <MetaRow label="Source" value={question.source} />
          <MetaRow label="Test" value={question.test} />
          <MetaRow label="Closes" value={question.closesAt.slice(0, 10)} />
          <MetaRow
            label="Status"
            value={STATUS_LABEL[question.status] ?? question.status}
            accent={question.status === "open"}
          />
        </dl>

        <div className="mt-6">
          <RewordBox
            originalId={question.id}
            date={question.closesAt.slice(0, 10)}
            source={question.source}
            test={question.test}
          />
        </div>
      </div>

      <div className="rounded-panel border border-line bg-ink p-7">
        <h3 className="font-display text-[28px] leading-none text-bone">
          Your forecast
        </h3>
        <p className="mt-2 text-[13.5px] text-mute">
          Sealed now, revealed only after the question closes.
        </p>
        <div className="mt-6">
          <SealForm questionId={question.id} />
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-line py-2 last:border-b-0">
      <dt className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
        {label}
      </dt>
      <dd
        className={`font-mono text-[13px] break-all ${
          accent ? "text-seal" : "text-bone"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
