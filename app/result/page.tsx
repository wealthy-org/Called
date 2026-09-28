import Link from "next/link";
import { loadHomeResult } from "@/app/home-data";
import { SpreadPlot } from "@/components/spread-plot";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { brierScore } from "@/lib/scoring/brier";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Result — Called",
  description: "The latest settled question and how each forecaster scored.",
};

export default async function ResultPage() {
  const result = await loadHomeResult({ maxForecasts: null });

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
      <SiteHeader />
      <main className="result-view wrap section">
        <p className="kicker">RESULT</p>
        <h1 className="page-title">Settled question</h1>

        {result === null ? (
          <div className="result-view mt-12 grid gap-16 lg:grid-cols-[0.9fr_1.4fr] lg:items-center">
            <div>
              <p className="font-display text-[clamp(96px,17vw,230px)] leading-[0.82] font-black text-bone">
                &#8212;
              </p>
              <p className="mt-4 max-w-[360px] text-mute">
                No settled questions yet. A result appears here once a question
                is resolved.
              </p>
              <Link
                href="/questions"
                className="mt-6 inline-flex min-h-11 items-center rounded-field border border-line px-5 text-sm text-mute hover:border-seal hover:text-seal"
              >
                View open questions
              </Link>
            </div>
            <div>
              <div className="mt-8">
                <SpreadPlot forecasts={[]} />
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="scores w-full border-collapse text-left">
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
                    <tr className="border-b border-line">
                      <td className="py-3 pr-4 text-sm text-mute" colSpan={3}>
                        No settled questions yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-12 grid gap-16 lg:grid-cols-[0.9fr_1.4fr] lg:items-center">
            <div>
              <p className="font-display text-[clamp(96px,17vw,230px)] leading-[0.82] font-black text-bone">
                {result.outcome ? "YES" : "NO"}
              </p>
              <p className="vsub mt-4 max-w-[360px] text-mute">
                {result.questionText}
              </p>
              {result.readingValue !== null && (
                <p className="mt-2 font-mono text-xs text-mute">
                  reading {result.readingValue} against {result.test}
                </p>
              )}
              <Link
                href={`/q/${result.questionId}`}
                className="mt-6 inline-flex min-h-11 items-center rounded-field border border-line px-5 text-sm text-mute hover:border-seal hover:text-seal"
              >
                View question
              </Link>
            </div>
            <div>
              <p className="result-explanation max-w-[520px] text-mute">
                When the source reports a number, the test settles the question.
                Every forecaster is plotted at the probability they sealed.
              </p>
              <div className="mt-8">
                <SpreadPlot
                  forecasts={result.forecasts}
                  outcome={result.outcome}
                />
              </div>
              {scored.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <table className="scores w-full border-collapse text-left">
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
                              className="score-bar"
                              style={{
                                width: `${Math.max(2, (1 - row.brier) * 100)}%`,
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="paper-note pt-4 max-w-[420px] text-[13.5px] text-mute">
                    Brier score for one question is (forecast minus outcome)
                    squared. Lower is better. One question proves nothing, which
                    is why every score on the leaderboard carries its n.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
