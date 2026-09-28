import Link from "next/link";
import { CalibrationPanel } from "@/app/leaderboard/calibration-panel";
import { LeaderboardSection } from "@/app/leaderboard/leaderboard-section";
import { loadLeaderboardPage } from "@/app/leaderboard/data";
import { FaqRow, HOME_FAQ_ITEMS } from "@/components/faq-list";
import { Hero } from "@/components/hero";
import { HomeQuestion } from "@/components/home-question";
import { ReceiptSlip } from "@/components/receipt-slip";
import { RevealObserver } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SpreadPlot } from "@/components/spread-plot";
import { VerifyButton } from "@/app/ledger/verify";
import { brierScore } from "@/lib/scoring/brier";
import {
  loadHomeLedger,
  loadHomeMethod,
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
  const [session, question, ledger, leaderboard, result, method] =
    await Promise.all([
      loadHomeSession(),
      loadHomeQuestion(),
      loadHomeLedger(),
      loadLeaderboardPage(),
      loadHomeResult(),
      loadHomeMethod(),
    ]);

  const calibrationLabels: Record<string, string> = {};
  for (const entry of [...leaderboard.ranked, ...leaderboard.provisional]) {
    calibrationLabels[entry.forecasterId] = entry.handle;
  }

  const scored =
    result === null
      ? []
      : result.forecasts
          .map((forecast) => ({
            label: forecast.label,
            brier: brierScore(forecast.p, result.outcome),
          }))
          .sort((a, b) => a.brier - b.brier);

  return (
    <>
      <RevealObserver />
      <SiteHeader variant="landing" />

      <Hero
        headHash={session.headHash}
        recordCount={session.recordCount}
        anchorStatus={session.anchorStatus}
      />

      <Section id="question" index={0}>
        {question === null ? (
          <>
            <SectionHeader
              title="Open question"
              body="One question is live at a time. Read the source and the test, then seal a probability and a single sentence."
            />
            <Empty>No question is open right now. Nothing is being asked.</Empty>
          </>
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
          <>
            <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.4fr]">
              <div>
                <p className="font-display text-[clamp(96px,17vw,230px)] leading-[0.82] font-black text-bone">
                  {result.outcome ? "YES" : "NO"}
                </p>
                <p className="mt-4 max-w-[360px] text-mute">
                  {result.questionText}
                </p>
                {result.readingValue !== null ? (
                  <p className="mt-2 font-mono text-xs text-mute">
                    reading {result.readingValue} against {result.test}
                  </p>
                ) : null}
              </div>
              <SpreadPlot forecasts={result.forecasts} outcome={result.outcome} />
            </div>

            {scored.length > 0 && (
              <div className="mt-14 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <caption className="sr-only">
                    Each forecaster&apos;s Brier score on this question
                  </caption>
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wider text-mute">
                      <th className="py-3 pr-4 font-medium">Forecaster</th>
                      <th className="py-3 pr-4 font-medium">Brier</th>
                      <th className="py-3 font-medium">Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scored.map((row, i) => (
                      <tr key={row.label} className="border-b border-line">
                        <td
                          className={`py-3 pr-4 text-sm ${
                            i === 0 ? "font-semibold text-seal" : "text-bone"
                          }`}
                        >
                          {row.label}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs tabular-nums text-mute">
                          {row.brier.toFixed(3)}
                        </td>
                        <td className="py-3">
                          <div
                            className="h-1.5 rounded-sm bg-bone"
                            style={{
                              width: `${Math.max(2, (1 - row.brier) * 50)}%`,
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="pt-4 max-w-[560px] text-[13.5px] text-mute">
                  Brier score for one question is (forecast minus outcome)
                  squared. Lower is better. One question proves nothing, which
                  is why every score on the leaderboard carries its n.
                </p>
              </div>
            )}
          </>
        )}
      </Section>

      <Section id="ledger" index={2} tone="ink">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
            The ledger
          </p>
          <h2 className="mt-3 font-display text-[clamp(40px,7.4vw,104px)] leading-none font-black tracking-tight text-bone">
            A chain you can break.
          </h2>
          <p className="mt-4 max-w-[560px] text-mute">
            Every seal is a link in one hash chain. Verify recomputes it in your
            browser. Change one byte of one record and the chain shows where it
            broke.
          </p>
        </div>

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
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="sr-only">
                The five most recent sealed records in the ledger
              </caption>
              <thead>
                <tr className="bg-void text-xs uppercase tracking-wider text-mute">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Forecast</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Previous hash</th>
                  <th className="px-4 py-3 font-medium">Hash</th>
                </tr>
              </thead>
              <tbody>
                {ledger.records.map((record) => (
                  <tr key={record.sealId} className="border-t border-line">
                    <td className="px-4 py-[17px] font-display text-seal tabular-nums">
                      {record.index}
                    </td>
                    <td className="px-4 py-[17px] font-mono text-sm text-bone">
                      {record.label}
                    </td>
                    <td className="px-4 py-[17px] max-w-[260px] text-[13.5px] text-mute">
                      {record.reason === "" ? "—" : record.reason}
                    </td>
                    <td
                      className="px-4 py-[17px] font-mono text-xs text-mute"
                      title={record.prev}
                    >
                      {shorten(record.prev)}
                    </td>
                    <td
                      className="px-4 py-[17px] font-mono text-xs text-bone"
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
        <div className="lg:grid lg:grid-cols-[1.35fr_1fr] lg:gap-11">
          <LeaderboardSection
            title="Skill, not luck."
            banner="Skill is measured against the always-yes baseline. Anyone with fewer than 20 settled questions is marked provisional."
          />
          <div className="mt-12 lg:mt-0">
            <CalibrationPanel
              series={leaderboard.forecastSeries}
              labels={calibrationLabels}
              subtitle="When it said 70%, how often was it true? The closer to the dashed line, the more honest the forecaster."
            />
          </div>
        </div>
      </Section>

      <Section id="method" index={1}>
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
              Method
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-bone">
              One question, start to finish.
            </h2>
            {method.questionId === null ? (
              <p className="mt-6 text-mute">
                No question is open right now, so there is no timeline to show.
              </p>
            ) : (
              <ol className="mt-8 flex flex-col gap-8 border-l border-line pl-7">
                {method.steps.map((step) => (
                  <li key={step.key} className="relative">
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[12px] mt-1.5 h-[9px] w-[9px] ${
                        step.done ? "bg-seal" : "bg-bone"
                      }`}
                    />
                    <p className="font-mono text-[12.5px] uppercase text-mute">
                      {step.dateLabel}
                    </p>
                    <h3 className="mt-1 text-[19px] text-bone">{step.title}</h3>
                    <p className="mt-1 max-w-[460px] text-[15px] text-mute">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {method.receipt === null ? (
            <div className="rounded-panel border border-line bg-ink p-7">
              <p className="text-mute">
                No receipt yet. The first seal on this question produces one.
              </p>
            </div>
          ) : (
            <div>
              <ReceiptSlip
                live
                rows={[
                  { label: "RECEIPT", value: method.receipt.receiptId },
                  {
                    label: "RECORD",
                    value: `#${method.receipt.recordIndex}`,
                  },
                  {
                    label: "QUESTION",
                    value: method.receipt.questionId,
                  },
                  {
                    label: "FORECAST",
                    value:
                      method.receipt.probability === null
                        ? "sealed"
                        : `${Math.round(method.receipt.probability * 100)}%`,
                  },
                  { label: "SEALED", value: method.receipt.sealedAt },
                  { label: "CHAIN HASH", value: method.receipt.chainHash },
                  {
                    label: "ANCHOR",
                    value:
                      method.receipt.anchorBlock === null
                        ? method.receipt.anchorStatus
                        : `${method.receipt.anchorStatus} · block ${method.receipt.anchorBlock}`,
                  },
                ]}
                note="The head hash of the chain is written to Robinhood Chain in an ordinary transaction. The block supplies the date, a clock the forecaster does not own."
              />
              <p className="mx-auto mt-5 max-w-[420px] text-[13.5px] text-mute">
                <Link
                  href={`/receipt/${method.receipt.receiptId}`}
                  className="text-bone hover:text-seal"
                >
                  Open the full receipt
                </Link>
              </p>
            </div>
          )}
        </div>
      </Section>

      <Section id="faq" index={2} tone="ink">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
              Questions asked
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-bone">
              Before you seal one.
            </h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {HOME_FAQ_ITEMS.map((item) => (
              <FaqRow key={item.q} q={item.q}>
                {item.a}
              </FaqRow>
            ))}
          </div>
        </div>
      </Section>

      <SiteFooter />
    </>
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
