import { notFound } from "next/navigation";
import Link from "next/link";
import { sweepDueQuestions } from "@/lib/close-sweep";
import { milestoneFor } from "@/lib/countdown";
import { loadQuestionDossier } from "./data";
import { QuestionLifecycle } from "./lifecycle";
import { RevealList } from "./reveal-list";
import { EvidenceSection } from "./evidence";
import { QuestionHistory } from "./history";
import { SealForm } from "./seal-form";
import { SpreadPlot } from "@/components/spread-plot";
import { WorkspaceFooter } from "@/components/workspace-footer";
import { SiteHeader } from "@/components/site-header";
import { brierScore } from "@/lib/scoring/brier";

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

export default async function QuestionPage({
  params,
}: PageProps<"/q/[id]">) {
  const { id } = await params;
  await sweepDueQuestions();
  const dossier = await loadQuestionDossier(id);

  if (!dossier) {
    notFound();
  }

  const { question: q, reveals, mySeal } = dossier;

  const now = new Date();
  const milestone = milestoneFor(q.status, q.closesAt, q.resolvesAt, now);

  const isSealed = mySeal !== null;

  const scoredForecasts = q.status === "settled"
    ? reveals.map((r) => ({
        label: r.name,
        brier: brierScore(r.p, q.outcome ?? false),
      }))
    : [];

  return (
    <>
      <SiteHeader />
      <main className="wrap section dossier-page">
        {/* Breadcrumb */}
        <p className="dossier-breadcrumb">
          <Link href="/questions" className="hover:text-bone">
            Questions
          </Link>
        </p>

        {/* Page header */}
        <p className="kicker mt-6">Question</p>
        <h1 className="dossier-title">{q.text}</h1>

        {/* Identity row */}
        <dl className="dossier-identity">
          <div className="dossier-id-item">
            <dt>ID</dt>
            <dd className="font-mono text-xs text-mute">{q.id}</dd>
          </div>
          <div className="dossier-id-item">
            <dt>STATUS</dt>
            <dd
              className={`font-mono text-xs ${
                q.status === "open"
                  ? "text-seal"
                  : q.status === "settled"
                  ? "text-bone"
                  : "text-mute"
              }`}
            >
              {STATUS_LABEL[q.status] ?? q.status}
            </dd>
          </div>
          <div className="dossier-id-item">
            <dt>SEALS</dt>
            <dd className="font-mono text-xs text-mute">
              {q.sealCount}
              {q.status !== "open"
                ? ` / ${q.revealCount} revealed`
                : ""}
            </dd>
          </div>
          <div className="dossier-id-item">
            <dt>CLOSE</dt>
            <dd className="font-mono text-xs text-mute">
              {shortDate(q.closesAt)}
            </dd>
          </div>
        </dl>

        {/* Main dossier grid */}
        <div className="dossier-grid mt-10">
          {/* Left: dossier */}
          <div className="dossier-left">
            {/* Source + Test */}
            <dl className="dossier-dl">
              <div className="dossier-row">
                <dt className="dossier-dt">SOURCE</dt>
                <dd className="dossier-dd">{q.source}</dd>
              </div>
              <div className="dossier-row">
                <dt className="dossier-dt">TEST</dt>
                <dd className="dossier-dd">{q.test}</dd>
              </div>
              <div className="dossier-row">
                <dt className="dossier-dt">OPENS</dt>
                <dd className="dossier-dd">{shortDate(q.opensAt)}</dd>
              </div>
              <div className="dossier-row">
                <dt className="dossier-dt">CLOSES</dt>
                <dd className="dossier-dd">{shortDate(q.closesAt)}</dd>
              </div>
              <div className="dossier-row">
                <dt className="dossier-dt">RESOLVES</dt>
                <dd className="dossier-dd">{shortDate(q.resolvesAt)}</dd>
              </div>
            </dl>

            {/* Countdown or settlement note */}
            {q.status === "open" && (
              <div className="dossier-countdown">
                <p className="dossier-countdown-label">
                  SEAL CLOSES IN
                </p>
                <p className="dossier-countdown-value">
                  {milestone.reached ? (
                    <span className="font-mono text-bone">due</span>
                  ) : (
                    <span className="font-mono tabular-nums text-seal">
                      {formatCountdown(milestone.at, now)}
                    </span>
                  )}
                </p>
                <p className="dossier-countdown-hint">
                  Forecasts can be sealed until the close time. Once closed,
                  forecasts are revealed and cannot be changed.
                </p>
              </div>
            )}

            {/* Lifecycle */}
            <div className="dossier-lifecycle">
              <p className="dossier-section-label">Lifecycle</p>
              <QuestionLifecycle
                opensAt={q.opensAt}
                closesAt={q.closesAt}
                resolvesAt={q.resolvesAt}
                status={q.status}
                sealCount={q.sealCount}
                anchorStatus={
                  reveals.length > 0
                    ? reveals[reveals.length - 1]!.anchorStatus
                    : "sealed"
                }
              />
            </div>

            {/* The rule is fixed */}
            <div className="dossier-rule">
              <p className="kicker">The rule is fixed</p>
              <p className="mt-2 text-sm text-mute">
                The source and test are set before forecasts are sealed. At
                settlement, the resolver reads one value and applies this test.
              </p>
            </div>
          </div>

          {/* Right: forecast panel */}
          <div className="dossier-right">
            {q.status === "open" && !isSealed && (
              <div className="forecast-panel">
                <h2 className="forecast-panel-title">Your forecast</h2>
                <p className="forecast-panel-hint">
                  One forecast per question. Once sealed, it cannot be edited.
                </p>
                <div className="mt-6">
                  <SealForm questionId={q.id} />
                </div>
              </div>
            )}

            {q.status === "open" && isSealed && mySeal && (
              <div className="forecast-panel">
                <h2 className="forecast-panel-title">Your forecast</h2>
                <p className="forecast-panel-hint">
                  You have already sealed a forecast for this question.
                </p>
                <p className="mt-4 text-sm text-mute">
                  Your record: #{mySeal.recordIndex}
                </p>
                <p className="mt-1 text-sm text-mute">
                  Anchor: {mySeal.anchorStatus}
                </p>
                <p className="mt-1 text-sm text-mute">
                  Sealed: {shortDate(mySeal.sealedAt)}
                </p>
              </div>
            )}

            {q.status === "closed" && (
              <div className="forecast-panel">
                <h2 className="forecast-panel-title">
                  Forecasts revealed
                </h2>
                <p className="forecast-panel-hint">
                  {q.sealCount} forecast{q.sealCount !== 1 ? "s" : ""} sealed
                  {q.revealCount > 0
                    ? `, ${q.revealCount} revealed`
                    : ""}
                  .
                </p>
              </div>
            )}

            {(q.status === "settled" || q.status === "void") && (
              <div className="forecast-panel">
                <h2 className="forecast-panel-title">Result</h2>
                {q.outcome !== null ? (
                  <p className="forecast-outcome">
                    {q.outcome ? "YES" : "NO"}
                  </p>
                ) : (
                  <p className="forecast-outcome forecast-void">VOID</p>
                )}
                {q.readingValue !== null && (
                  <p className="mt-2 font-mono text-xs text-mute">
                    reading {q.readingValue}
                    {q.readingBlock !== null
                      ? ` at block ${q.readingBlock}`
                      : ""}
                  </p>
                )}
                {q.status === "void" && (
                  <p className="mt-2 text-sm text-mute">
                    Settlement could not determine an outcome from the source.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Settled: spread plot */}
        {q.status === "settled" && q.outcome !== null && scoredForecasts.length > 0 && (
          <div className="dossier-spread">
            <h2 className="kicker">Forecast distribution</h2>
            <SpreadPlot
              forecasts={scoredForecasts.map((f) => ({
                id: f.label,
                label: f.label,
                p: 1 - f.brier,
              }))}
              outcome={q.outcome}
              className="mt-4"
            />
          </div>
        )}

        {/* Reveal list for closed/settled */}
        {(q.status === "closed" ||
          q.status === "settled" ||
          q.status === "void") &&
          reveals.length > 0 && (
            <div className="dossier-reveals">
              <h2 className="kicker">Forecasts</h2>
              <RevealList reveals={reveals} questionId={q.id} />
            </div>
          )}

        {/* Evidence section */}
        {reveals.length > 0 && (
          <EvidenceSection
            questionId={q.id}
            recordHash={reveals[reveals.length - 1]!.recordHash}
            headHash={null}
            anchorStatus={
              reveals[reveals.length - 1]!.anchorStatus
            }
          />
        )}

        {/* Question history */}
        <QuestionHistory
          opensAt={q.opensAt}
          closesAt={q.closesAt}
          resolvesAt={q.resolvesAt}
          status={q.status}
          sealCount={q.sealCount}
          revealCount={q.revealCount}
        />
      </main>

      <WorkspaceFooter />
    </>
  );
}

function formatCountdown(target: string, now: Date): string {
  const totalMs = new Date(target).getTime() - now.getTime();
  if (totalMs <= 0) return "due";
  const days = Math.floor(totalMs / 86_400_000);
  const hours = Math.floor((totalMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1_000);
  const pad = (v: number) => String(v).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
