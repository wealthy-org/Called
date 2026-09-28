import Link from "next/link";
import { CalibrationPanel } from "@/app/leaderboard/calibration-panel";
import { LeaderboardSection } from "@/app/leaderboard/leaderboard-section";
import { loadLeaderboardPage } from "@/app/leaderboard/data";
import { Hero } from "@/components/hero";
import { HomeQuestion } from "@/components/home-question";
import { ReceiptSlip } from "@/components/receipt-slip";
import { RevealObserver } from "@/components/reveal";
import { SpreadPlot } from "@/components/spread-plot";
import { VerifyButton } from "@/app/ledger/verify";
import {
  loadHomeLedger,
  loadHomeQuestion,
  loadHomeResult,
  loadHomeSession,
} from "./home-data";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function shorten(hash: string): string {
  return hash.length > 18 ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : hash;
}

export default async function Home() {
  const [session, question, ledger, leaderboard, result] = await Promise.all([
    loadHomeSession(),
    loadHomeQuestion(),
    loadHomeLedger(),
    loadLeaderboardPage(),
    loadHomeResult(),
  ]);

  return (
    <>
      <RevealObserver />
      <HomeHeader />

      <Hero
        headHash={session.headHash}
        recordCount={session.recordCount}
        anchorStatus={session.anchorStatus}
      />

      <Section id="question" index={0}>
        <SectionHeader
          title="Open question"
          body="One question is live at a time. Read the source and the test, then seal a probability and a single sentence."
        />
        {question === null ? (
          <Empty>No question is open right now. Nothing is being asked.</Empty>
        ) : (
          <HomeQuestion question={question.question} />
        )}
      </Section>

      <Section id="result" index={1}>
        <SectionHeader
          title="Result"
          body="When the source reports a number, the test settles the question. Every forecaster is plotted at the probability they sealed."
        />
        {result === null ? (
          <Empty>
            No settled questions yet. Results appear here once a question is
            resolved.
          </Empty>
        ) : (
          <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.4fr]">
            <div>
              <p className="font-display text-[96px] leading-[0.82] font-black text-bone">
                {result.outcome ? "YES" : "NO"}
              </p>
              <p className="mt-3 max-w-[360px] text-mute">
                {result.questionText}
              </p>
              {result.readingValue !== null ? (
                <p className="mt-2 font-mono text-xs text-mute">
                  reading {result.readingValue}
                </p>
              ) : null}
            </div>
            <SpreadPlot forecasts={result.forecasts} outcome={result.outcome} />
          </div>
        )}
      </Section>

      <Section id="ledger" index={2} tone="ink">
        <SectionHeader
          title="Ledger"
          body="Every seal is a link in one hash chain. Verify recomputes it in your browser."
        />
        <div className="flex flex-wrap items-center gap-4">
          <VerifyButton records={ledger.records} />
          <Link
            href="/ledger"
            className="inline-flex min-h-11 items-center rounded-field border border-line px-4 font-mono text-xs uppercase text-bone hover:border-seal hover:text-seal"
          >
            Full ledger
          </Link>
        </div>

        {ledger.records.length === 0 ? (
          <Empty>
            Nothing has been sealed yet. The first seal starts the chain.
          </Empty>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-panel border border-line">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <caption className="sr-only">
                The five most recent sealed records in the ledger
              </caption>
              <thead>
                <tr className="bg-void text-xs uppercase tracking-wider text-mute">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Forecast</th>
                  <th className="px-4 py-3 font-medium">Sealed</th>
                  <th className="px-4 py-3 font-medium">Hash</th>
                </tr>
              </thead>
              <tbody>
                {ledger.records.map((record) => (
                  <tr key={record.sealId} className="border-t border-line">
                    <td className="px-4 py-4 font-display text-seal tabular-nums">
                      {record.index}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-bone">
                      {record.forecasterId}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-mute">
                      {record.sealedAt.slice(0, 19).replace("T", " ")}
                    </td>
                    <td
                      className="px-4 py-4 font-mono text-xs text-bone"
                      title={record.hash}
                    >
                      {shorten(record.hash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section id="leaderboard" index={0}>
        <LeaderboardSection />
        <div className="mt-12 lg:grid lg:grid-cols-[1.35fr_1fr] lg:gap-11">
          <div aria-hidden="true" />
          <CalibrationPanel series={leaderboard.forecastSeries} />
        </div>
      </Section>

      <Section id="method" index={1}>
        <SectionHeader
          title="Method"
          body="The same four steps run for every question. Nothing is scored before it is settled."
        />
        <div className="grid gap-16 lg:grid-cols-2">
          <ol className="relative flex flex-col gap-8 border-l border-line pl-7">
            {METHOD_STEPS.map((step) => (
              <li key={step.title}>
                <div className="absolute -left-[5px] mt-2 h-[9px] w-[9px] bg-seal" />
                <p className="font-mono text-[12.5px] text-mute">{step.date}</p>
                <h3 className="mt-1 text-[19px] text-bone">{step.title}</h3>
                <p className="mt-1 max-w-[460px] text-[15px] text-mute">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <ReceiptSlip
            rows={[
              { label: "RECEIPT", value: "rcpt-seal-4-0000abcd" },
              { label: "RECORD", value: "#4" },
              { label: "COMMIT", value: "9f2c…d41a" },
              { label: "PROBABILITY", value: "68%" },
              { label: "SEALED", value: "2026-09-26T09:41:07Z" },
            ]}
            stamp="SAMPLE, NOT A REAL RECEIPT"
            note="A real receipt is signed with Ed25519 and can be checked offline with the public key at /.well-known/called-receipt-key."
          />
        </div>
      </Section>

      <Section id="faq" index={2} tone="ink">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Limits
            </h2>
            <p className="mt-3 max-w-[320px] text-mute">
              What this cannot do, stated plainly.
            </p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            <FaqRow q="What does a sealed record actually prove?">
              That the prediction existed before the outcome only once the record
              is anchored on-chain. Before that, it is a claim this server makes.
            </FaqRow>
            <FaqRow q="Why is a score marked provisional?">
              Fewer than 20 settled answers is not enough to rank. Those rows are
              shown but excluded from the ranking.
            </FaqRow>
            <FaqRow q="Can a failed call be scored as 50%?">
              No. A failure is counted as a failure. It is never turned into a
              number.
            </FaqRow>
          </div>
        </div>
      </Section>

      <HomeFooter />
    </>
  );
}

const METHOD_STEPS = [
  {
    date: "Day 0",
    title: "Ask",
    body: "A question passes the gate: a future date, a readable source, and a parseable test.",
  },
  {
    date: "Day 0",
    title: "Seal",
    body: "Forecasters commit a probability and one sentence. The commit hides the value until close.",
  },
  {
    date: "Day N",
    title: "Wait",
    body: "Nothing can be edited. The chain only grows, and the head is anchored on-chain.",
  },
  {
    date: "Day N+1",
    title: "Settle",
    body: "The resolver reads one number from one source. An unreadable source means void, never a guess.",
  },
];

function HomeHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[rgba(10,10,11,0.92)] backdrop-blur">
      <nav className="mx-auto flex w-full max-w-[1180px] items-center gap-1 overflow-x-auto px-6 py-2">
        <Link href="/" className="mr-4 font-display text-lg font-bold text-bone">
          Called
        </Link>
        {[
          ["/questions", "Questions"],
          ["/ledger", "Ledger"],
          ["/leaderboard", "Leaderboard"],
          ["/method", "Method"],
          ["/faq", "FAQ"],
          ["/agents", "Agents"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-11 items-center rounded-field px-3 text-sm text-mute hover:bg-ink hover:text-bone"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function HomeFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-16">
        <p className="font-display text-4xl font-bold text-bone">Called</p>
        <p className="mt-3 max-w-[420px] text-lg text-mute">
          Forecasts, sealed in public. Settled from a readable source.
        </p>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["/questions", "Questions"],
            ["/ledger", "Ledger"],
            ["/leaderboard", "Leaderboard"],
            ["/method", "Method"],
            ["/faq", "FAQ"],
            ["/agents", "Agents"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center text-sm text-mute hover:text-bone"
            >
              {label}
            </Link>
          ))}
        </div>

        <p className="mt-8 border-t border-line pt-6 font-mono text-xs text-mute">
          Scoring adapted from{" "}
          <a
            href="https://github.com/Noisyxl/brier"
            className="text-bone hover:text-seal"
            rel="noreferrer noopener"
            target="_blank"
          >
            brier
          </a>{" "}
          (MIT). See THIRD_PARTY.md.
        </p>
      </div>
    </footer>
  );
}

function Section({
  id,
  index,
  tone = "void",
  children,
}: {
  id: string;
  index: number;
  tone?: "void" | "ink";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-reveal={index % 3}
      className={`border-b border-line py-16 lg:py-24 ${
        tone === "ink" ? "bg-ink" : "bg-void"
      }`}
    >
      <div className="mx-auto w-full max-w-[1180px] px-6">{children}</div>
    </section>
  );
}

function SectionHeader({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_520px] lg:items-end">
      <h2 className="font-display text-3xl font-bold tracking-tight text-bone">
        {title}
      </h2>
      <p className="text-mute">{body}</p>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-mute">{children}</p>;
}

function FaqRow({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-[22px] text-[19px] font-medium text-bone">
        {q}
        <span aria-hidden="true" className="font-mono text-mute">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">-</span>
        </span>
      </summary>
      <p className="max-w-[640px] pb-6 text-mute">{children}</p>
    </details>
  );
}
