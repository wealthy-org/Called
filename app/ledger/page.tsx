import Link from "next/link";
import { sql } from "@/db";
import { VerifyButton, type LedgerRecordView } from "./verify";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 5;

export const metadata = {
  title: "Ledger — Called",
  description: "Append-only seal records, verifiable in your browser.",
};

export default async function LedgerPage() {
  const result = await sql`
    select
      s.record_index as "index",
      s.id as "sealId",
      s.question_id as "questionId",
      s.forecaster_id as "forecasterId",
      s.commit,
      s.sealed_at as "sealedAt",
      s.prev_hash as "prev",
      s.hash
    from seals s
    order by s.record_index desc
    limit ${RECENT_LIMIT}
  `;

  const recent = [...result].reverse() as unknown as LedgerRecordView[];
  const totalResult = await sql<{ count: string }[]>`
    select count(*)::text as count from seals
  `;
  const total = Number(totalResult[0]?.count ?? 0);
  const fromIndex = recent.length > 0 ? recent[0].index : 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12">
      <header className="border-b border-line pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
          append-only
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-bone">
          Ledger
        </h1>
        <p className="mt-3 max-w-prose text-sm text-mute">
          Every sealed forecast, in the order it was sealed. Each record carries
          the hash of the record before it, so a removed or edited record breaks
          every link after it. Verify recomputes all of it in your browser.
        </p>
      </header>

      <section className="py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
            {total === 0
              ? "no records yet"
              : `showing ${RECENT_LIMIT} most recent of ${total}`}
          </h2>
          {total > RECENT_LIMIT && fromIndex > 0 ? (
            <span className="font-mono text-xs text-mute">
              from index {fromIndex}
            </span>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-mute">
            Nothing has been sealed yet. The first seal starts the chain.
          </p>
        ) : (
          <>
            <ol className="mt-4 border-t border-line">
              {recent.map((record) => (
                <li
                  key={record.index}
                  className="grid gap-1 border-b border-line py-4 sm:grid-cols-[4rem_1fr] sm:gap-4"
                >
                  <span className="font-display text-xl font-extrabold text-seal tabular-nums">
                    {record.index}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/q/${record.questionId}`}
                      className="font-mono text-sm text-bone underline decoration-line underline-offset-4 hover:decoration-seal"
                    >
                      {record.questionId}
                    </Link>
                    <p className="mt-1 font-mono text-xs break-all text-mute">
                      {record.hash}
                    </p>
                    <p className="mt-1 font-mono text-xs text-mute">
                      {record.forecasterId} · {new Date(
                        record.sealedAt,
                      ).toISOString()}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6">
              <VerifyButton records={recent} />
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-line pt-6">
        <p className="max-w-prose text-xs text-mute">
          Verifying a window only proves the window is internally consistent. To
          prove a head was not rewritten after the fact, compare it against a
          published anchor.
        </p>
      </footer>
    </main>
  );
}
