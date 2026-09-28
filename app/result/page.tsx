import Link from "next/link";
import { loadSettlementReport } from "./data";
import { SpreadPlot } from "@/components/spread-plot";
import { WorkspaceFooter } from "@/components/workspace-footer";
import { SiteHeader } from "@/components/site-header";
import { brierScore } from "@/lib/scoring/brier";
import { explorerTxLink } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Result — Called",
  description: "The latest settled question and how each forecaster scored.",
};

export default async function ResultPage() {
  const report = await loadSettlementReport();

  const scored =
    report === null || report.outcome === null
      ? []
      : report.forecasts
          .map((forecast) => ({
            label: forecast.label,
            brier: brierScore(forecast.p, report.outcome as boolean),
          }))
          .sort((a, b) => a.brier - b.brier);

  return (
    <>
      <SiteHeader />
      <main className="report-page wrap section">
        <p className="kicker">RESULT</p>
        <h1 className="page-title">Settlement</h1>

        {report === null ? (
          <div className="report-empty">
            <p className="report-verdict-empty">&#8212;</p>
            <p className="report-empty-copy">
              No settled questions yet. A result appears here once a question
              is resolved.
            </p>
            <Link
              href="/questions"
              className="mt-6 inline-flex min-h-11 items-center rounded-field border border-line px-5 text-sm text-mute hover:border-seal hover:text-seal"
            >
              View open questions
            </Link>
            <div className="report-spread-empty">
              <SpreadPlot forecasts={[]} />
            </div>
          </div>
        ) : (
          <>
            <div className="report-head grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
              <div className="report-outcome-col">
                <p
                  className="report-verdict"
                  data-passed={report.outcome ? "yes" : "no"}
                >
                  {report.outcome ? "YES" : "NO"}
                </p>
                <p className="report-verdict-sub">
                  {report.outcome ? "Passed" : "Failed"}
                </p>
              </div>

              <div className="report-question-col">
                <p className="report-question-text">{report.questionText}</p>
                <dl className="report-meta mt-6 grid grid-cols-2 gap-x-8 gap-y-3">
                  <div className="report-meta-item">
                    <dt className="report-meta-label">Source</dt>
                    <dd className="report-meta-value font-mono text-sm text-bone">
                      {report.source}
                    </dd>
                  </div>
                  <div className="report-meta-item">
                    <dt className="report-meta-label">Test</dt>
                    <dd className="report-meta-value font-mono text-sm text-bone">
                      {report.test}
                    </dd>
                  </div>
                  <div className="report-meta-item">
                    <dt className="report-meta-label">Reading</dt>
                    <dd className="report-meta-value font-mono text-sm text-bone">
                      {report.readingValue ?? "—"}
                    </dd>
                  </div>
                  <div className="report-meta-item">
                    <dt className="report-meta-label">Settled</dt>
                    <dd className="report-meta-value font-mono text-sm text-bone">
                      {report.resolvesAt.slice(0, 10)}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/q/${report.questionId}`}
                  className="mt-6 inline-flex min-h-11 items-center rounded-field border border-line px-5 text-sm text-mute hover:border-seal hover:text-seal"
                >
                  View question
                </Link>
              </div>
            </div>

            <div className="report-spread-section">
              <p className="report-section-label">Forecasters</p>
              <p className="report-spread-desc">
                Each forecaster is plotted at the probability they sealed.
              </p>
              <div className="report-spread">
                <SpreadPlot
                  forecasts={report.forecasts}
                  outcome={report.outcome ?? undefined}
                />
              </div>
            </div>

            {scored.length > 0 && (
              <div className="report-scores-section">
                <table className="report-scores w-full border-collapse text-left">
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
                            i === 0
                              ? "font-semibold text-seal"
                              : "text-bone"
                          }`}
                        >
                          {row.label}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs tabular-nums text-mute">
                          {row.brier.toFixed(3)}
                        </td>
                        <td className="py-3">
                          <div
                            className="report-score-bar"
                            style={{
                              width: `${Math.max(2, (1 - row.brier) * 100)}%`,
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="report-scores-note">
                  Brier score for one question is (forecast minus outcome)
                  squared. Lower is better. One question proves nothing, which
                  is why every score on the leaderboard carries its n.
                </p>
              </div>
            )}

            <div className="report-evidence">
              <p className="report-section-label">Settlement evidence</p>
              <dl className="report-evidence-list">
                <div className="report-evidence-row">
                  <dt className="report-evidence-label">Source value</dt>
                  <dd className="report-evidence-value font-mono text-sm text-bone">
                    {report.readingValue ?? "—"}
                  </dd>
                  <dd className="report-evidence-desc">What the source reported</dd>
                </div>
                <div className="report-evidence-row">
                  <dt className="report-evidence-label">Test</dt>
                  <dd className="report-evidence-value font-mono text-sm text-bone">
                    {report.test}
                  </dd>
                  <dd className="report-evidence-desc">The resolution rule</dd>
                </div>
                <div className="report-evidence-row">
                  <dt className="report-evidence-label">Result</dt>
                  <dd className="report-evidence-value text-sm font-semibold text-bone">
                    {report.outcome ? "PASSED" : "FAILED"}
                  </dd>
                  <dd className="report-evidence-desc">
                    {report.outcome
                      ? "Outcome exceeded threshold"
                      : "Outcome did not exceed threshold"}
                  </dd>
                </div>
                <div className="report-evidence-row">
                  <dt className="report-evidence-label">Block</dt>
                  <dd className="report-evidence-value font-mono text-sm text-bone">
                    {report.anchorBlock !== null
                      ? `#${report.anchorBlock.toLocaleString()}`
                      : "—"}
                  </dd>
                  <dd className="report-evidence-desc">
                    Chain block of the anchor
                  </dd>
                </div>
                <div className="report-evidence-row">
                  <dt className="report-evidence-label">Anchor</dt>
                  <dd className="report-evidence-value text-sm text-bone">
                    {report.anchorStatus === "anchored" ? (
                      <span className="text-bone">{report.anchorStatus}</span>
                    ) : report.anchorStatus === "pending anchor" ? (
                      <span className="text-seal">{report.anchorStatus}</span>
                    ) : (
                      <span className="text-mute">{report.anchorStatus}</span>
                    )}
                  </dd>
                  <dd className="report-evidence-desc">Chain-head anchor status</dd>
                </div>
                {report.anchorTxHash && (
                  <div className="report-evidence-row">
                    <dt className="report-evidence-label">Explorer</dt>
                    <dd className="report-evidence-value">
                      <a
                        href={explorerTxLink(report.anchorTxHash) ?? "#"}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-mono text-sm text-bone hover:text-seal"
                      >
                        View transaction
                      </a>
                    </dd>
                    <dd className="report-evidence-desc">
                      Robinhood Chain explorer
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </>
        )}
      </main>
      <WorkspaceFooter />
    </>
  );
}
