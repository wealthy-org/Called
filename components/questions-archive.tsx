"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type QuestionRow = {
  id: string;
  text: string;
  status: "open" | "closed" | "settled" | "void";
  closesAt: string;
  resolvesAt: string;
  outcome: boolean | null;
  sealCount: number;
  revealCount: number;
};

type ArchiveSummary = {
  total: number;
  open: number;
  closed: number;
  settled: number;
  void: number;
  totalSeals: number;
};

type LatestSettled = {
  id: string;
  text: string;
  outcome: boolean;
  resolvesAt: string;
  sealCount: number;
} | null;

type FilterStatus = "all" | "open" | "closed" | "settled" | "void";

const STATUS_LABEL: Record<string, string> = {
  open: "OPEN",
  closed: "CLOSED",
  settled: "SETTLED",
  void: "VOID",
};

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "open", label: "OPEN" },
  { key: "closed", label: "CLOSED" },
  { key: "settled", label: "SETTLED" },
  { key: "void", label: "VOID" },
];

const LIFECYCLE_STEPS = [
  { label: "ASK", desc: "question created" },
  { label: "OPEN", desc: "forecasters can seal" },
  { label: "CLOSED", desc: "forecasts revealed" },
  { label: "SETTLED", desc: "source + test applied" },
  { label: "VOID", desc: "when settlement fails" },
];

function shortDate(iso: string): string {
  return iso.slice(0, 10);
}

function padded(n: number): string {
  return String(n).padStart(2, "0");
}

export function QuestionsArchive({
  questions,
  summary,
  latestSettled,
}: {
  questions: QuestionRow[];
  summary: ArchiveSummary;
  latestSettled: LatestSettled;
}) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = questions;
    if (filter !== "all") {
      result = result.filter((q) => q.status === filter);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (q) =>
          q.text.toLowerCase().includes(term) ||
          q.id.toLowerCase().includes(term),
      );
    }
    return result;
  }, [questions, filter, search]);

  return (
    <div className="questions-page">
      {/* ── Page Header ── */}
      <p className="kicker">Questions</p>
      <h1 className="page-title">Questions asked.</h1>
      <p className="mt-5 max-w-[620px] text-lg text-mute">
        A public archive of questions with fixed sources, resolution tests, and
        forecast history.
      </p>

      {/* ── Archive Summary ── */}
      <div className="qsummary mt-10">
        <div className="qsummary-item">
          <span className="qsummary-label">QUESTIONS</span>
          <span className="qsummary-value font-display">{padded(summary.total)}</span>
        </div>
        <div className="qsummary-item">
          <span className="qsummary-label">OPEN</span>
          <span className="qsummary-value qsummary-open">{padded(summary.open)}</span>
        </div>
        <div className="qsummary-item">
          <span className="qsummary-label">CLOSED</span>
          <span className="qsummary-value">{padded(summary.closed)}</span>
        </div>
        <div className="qsummary-item">
          <span className="qsummary-label">SETTLED</span>
          <span className="qsummary-value">{padded(summary.settled)}</span>
        </div>
        <div className="qsummary-item">
          <span className="qsummary-label">VOID</span>
          <span className="qsummary-value">{padded(summary.void)}</span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="qfilter mt-8">
        <div className="qfilter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`qfilter-btn${filter === f.key ? " qfilter-active" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="qfilter-search"
          aria-label="Search questions"
        />
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="qgrid mt-10">
        {/* Left: Question Archive */}
        <div className="qleft">
          <h2 className="qcol-head">Question archive</h2>

          {filtered.length === 0 ? (
            <p className="py-8 text-mute">
              {questions.length === 0
                ? "No questions yet. Nothing has been asked."
                : "No questions match your filter."}
            </p>
          ) : (
            <ul className="qlist">
              {filtered.map((q) => (
                <li key={q.id} className="qrow">
                  <Link href={`/q/${q.id}`} className="qrow-link">
                    <p className="qrow-text">{q.text}</p>
                    <dl className="qrow-meta">
                      <div className="qrow-meta-item">
                        <dt>ID</dt>
                        <dd>{q.id}</dd>
                      </div>
                      <div className="qrow-meta-item">
                        <dt>STATUS</dt>
                        <dd className={`qrow-status-${q.status}`}>
                          {STATUS_LABEL[q.status] ?? q.status}
                        </dd>
                      </div>
                      <div className="qrow-meta-item">
                        <dt>CLOSE</dt>
                        <dd>{shortDate(q.closesAt)}</dd>
                      </div>
                      <div className="qrow-meta-item">
                        <dt>SEALS</dt>
                        <dd>
                          {q.sealCount}
                          {q.status === "closed"
                            ? ` / ${q.revealCount} revealed`
                            : ""}
                        </dd>
                      </div>
                      {q.outcome !== null && (
                        <div className="qrow-meta-item">
                          <dt>OUTCOME</dt>
                          <dd className="qrow-outcome">
                            {q.outcome ? "YES" : "NO"}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Archive Intelligence */}
        <aside className="qright">
          {/* Archive Status */}
          <section className="qright-block">
            <h3 className="kicker">Archive status</h3>
            <dl className="qstatus">
              <div className="qstatus-row">
                <dt>QUESTIONS</dt>
                <dd className="font-display">{summary.total}</dd>
              </div>
              <div className="qstatus-row">
                <dt>OPEN</dt>
                <dd className="qstatus-open">{summary.open}</dd>
              </div>
              <div className="qstatus-row">
                <dt>SETTLED</dt>
                <dd>{summary.settled}</dd>
              </div>
              <div className="qstatus-row">
                <dt>VOID</dt>
                <dd>{summary.void}</dd>
              </div>
              <div className="qstatus-row">
                <dt>CLOSED</dt>
                <dd>{summary.closed}</dd>
              </div>
              {summary.totalSeals > 0 && (
                <div className="qstatus-row">
                  <dt>SEALS</dt>
                  <dd>{summary.totalSeals}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Latest Settlement */}
          {latestSettled && (
            <section className="qright-block">
              <h3 className="kicker">Latest settlement</h3>
              <Link href={`/q/${latestSettled.id}`} className="qlatest">
                <p className="qlatest-text">{latestSettled.text}</p>
                <p className="qlatest-outcome">
                  {latestSettled.outcome ? "YES" : "NO"}
                </p>
                <dl className="qlatest-meta">
                  <div className="flex gap-2">
                    <dt>SETTLED</dt>
                    <dd>{shortDate(latestSettled.resolvesAt)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>SEALS</dt>
                    <dd>{latestSettled.sealCount}</dd>
                  </div>
                </dl>
              </Link>
            </section>
          )}

          {/* Question Lifecycle */}
          <section className="qright-block">
            <h3 className="kicker">Question lifecycle</h3>
            <ol className="qlifecycle">
              {LIFECYCLE_STEPS.map((step) => (
                <li key={step.label} className="qlifecycle-step">
                  <span aria-hidden="true" className="qlifecycle-marker" />
                  <div>
                    <span className="qlifecycle-label">{step.label}</span>
                    <span className="qlifecycle-desc">{step.desc}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13.5px] text-mute">
              Every question has a fixed source and binary test before forecasts
              exist.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
