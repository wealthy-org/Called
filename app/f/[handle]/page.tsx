import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalibrationPlot } from "@/components/calibration-plot";
import { loadProfile } from "./data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/f/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return { title: `${handle} — Called` };
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "—";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatDecimal(value: number | null, digits = 3): string {
  return value === null ? "—" : value.toFixed(digits);
}

export default async function ProfilePage({ params }: PageProps<"/f/[handle]">) {
  const { handle } = await params;
  const profile = await loadProfile(handle);

  if (!profile) {
    notFound();
  }

  const { metrics, murphy, calibration } = profile;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-mute">
        Forecaster
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-bone">
        {profile.name}
      </h1>
      <p className="mt-2 font-mono text-xs text-mute">
        {profile.forecasterId} · {profile.kind}
        {profile.isReserve ? " · reserve" : ""}
      </p>

      {(profile.model || profile.modelVersion || profile.promptHash) && (
        <dl className="mt-6 grid grid-cols-[120px_1fr] gap-y-2 font-mono text-xs">
          {profile.model && (
            <>
              <dt className="text-mute">MODEL</dt>
              <dd className="break-all text-bone">{profile.model}</dd>
            </>
          )}
          {profile.modelVersion && (
            <>
              <dt className="text-mute">VERSION</dt>
              <dd className="break-all text-bone">{profile.modelVersion}</dd>
            </>
          )}
          {profile.promptHash && (
            <>
              <dt className="text-mute">PROMPT HASH</dt>
              <dd className="break-all text-bone">{profile.promptHash}</dd>
            </>
          )}
        </dl>
      )}

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-mute">
          Metrics
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          <div className="bg-void p-4">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-mute">
              Skill
            </dt>
            <dd className="mt-1 font-display text-2xl tabular-nums text-bone">
              {formatPercent(metrics.skill)}
            </dd>
          </div>
          <div className="bg-void p-4">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-mute">
              Brier
            </dt>
            <dd className="mt-1 font-display text-2xl tabular-nums text-bone">
              {formatDecimal(metrics.brier)}
            </dd>
          </div>
          <div className="bg-void p-4">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-mute">
              n
            </dt>
            <dd className="mt-1 font-display text-2xl tabular-nums text-bone">
              {metrics.n}
            </dd>
          </div>
          <div className="bg-void p-4">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-mute">
              Failures
            </dt>
            <dd className="mt-1 font-display text-2xl tabular-nums text-bone">
              {metrics.failures}
            </dd>
          </div>
        </dl>
        {metrics.provisional && (
          <p className="mt-3 font-mono text-xs text-mute">
            Provisional: fewer than 20 scored questions. Failures are counted,
            never scored.
          </p>
        )}
      </section>

      {murphy && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-mute">
            Murphy decomposition
          </h2>
          <dl className="mt-4 grid grid-cols-[180px_1fr] gap-y-2 font-mono text-xs">
            <dt className="text-mute">RELIABILITY</dt>
            <dd className="tabular-nums text-bone">
              {murphy.reliability.toFixed(4)}
            </dd>
            <dt className="text-mute">RESOLUTION</dt>
            <dd className="tabular-nums text-bone">
              {murphy.resolution.toFixed(4)}
            </dd>
            <dt className="text-mute">UNCERTAINTY</dt>
            <dd className="tabular-nums text-bone">
              {murphy.uncertainty.toFixed(4)}
            </dd>
            <dt className="text-mute">REMAINDER</dt>
            <dd className="tabular-nums text-bone">
              {murphy.remainder.toFixed(4)}
            </dd>
            <dt className="text-mute">BRIER</dt>
            <dd className="tabular-nums text-bone">{murphy.brier.toFixed(4)}</dd>
          </dl>
        </section>
      )}

      {calibration && calibration.data.some((bin) => bin.n > 0) && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-mute">
            Calibration
          </h2>
          <CalibrationPlot
            id={profile.forecasterId}
            forecasts={profile.history.map((row) => ({
              p: row.p,
              outcome: row.outcome,
            }))}
            className="mt-4 w-full"
          />
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-mute">
          History
        </h2>
        {profile.history.length === 0 ? (
          <p className="mt-4 text-sm text-mute">
            No settled questions yet. A history appears once questions this
            forecaster answered are resolved.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Settled questions, this forecaster&apos;s prediction, the
                outcome and the score.
              </caption>
              <thead>
                <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wider text-mute">
                  <th className="py-2 pr-4 font-normal">Question</th>
                  <th className="py-2 pr-4 text-right font-normal">Said</th>
                  <th className="py-2 pr-4 text-right font-normal">Outcome</th>
                  <th className="py-2 pr-4 text-right font-normal">Brier</th>
                </tr>
              </thead>
              <tbody>
                {profile.history.map((row) => (
                  <tr key={row.questionId} className="border-b border-line">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/q/${row.questionId}`}
                        className="text-bone underline-offset-4 hover:underline"
                      >
                        {row.text}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-bone">
                      {(row.p * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-bone">
                      {row.outcome ? "YES" : "NO"}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-bone">
                      {row.brier.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
