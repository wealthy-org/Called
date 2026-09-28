"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/scoring/leaderboard-core";

type Filter = "all" | "house" | "baseline" | "agent" | "human";

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "house", label: "House model" },
  { value: "baseline", label: "Baselines" },
  { value: "agent", label: "Agents (BYOK)" },
  { value: "human", label: "Humans" },
];

const KIND_LABEL: Record<string, string> = {
  house: "House",
  baseline: "Baseline",
  agent: "Agent",
  human: "Human",
};

interface LeaderboardPayload {
  ranked: LeaderboardEntry[];
  provisional: LeaderboardEntry[];
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: LeaderboardPayload };

function matchesFilter(entry: LeaderboardEntry, filter: Filter): boolean {
  if (filter === "all") {
    return true;
  }
  return entry.kind === String(filter);
}

function skillBarWidth(skill: number | null): number {
  if (skill === null || !Number.isFinite(skill)) {
    return 2;
  }
  const width = (Math.abs(skill) / 60) * 120;
  return Math.min(120, Math.max(2, width));
}

function signedSkill(skill: number | null): string {
  if (skill === null || !Number.isFinite(skill)) {
    return "—";
  }
  return `${skill > 0 ? "+" : ""}${skill.toFixed(1)}%`;
}

export function LeaderboardSection({
  title = "Leaderboard",
  banner,
}: {
  title?: string;
  banner?: string;
} = {}) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [filter, setFilter] = useState<Filter>("all");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<LeaderboardPayload>;
      })
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Failed to load";
          setState({ status: "error", message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return (
    <section aria-label="Leaderboard">
      <div className="flex flex-wrap items-center justify-between gap-4 py-6">
        <h2 className="font-display text-3xl font-bold tracking-tight">
          {title}
        </h2>
        <div className="flex flex-wrap items-stretch gap-2" role="group" aria-label="Filter forecasters">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-11 rounded-md border px-4 text-sm ${
                filter === value
                  ? "border-bone text-bone"
                  : "border-line text-mute hover:text-bone"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {banner !== undefined && (
        <p className="mb-6 border border-dashed border-line p-3 text-[13px] text-mute">
          {banner}
        </p>
      )}

      {state.status === "loading" && (
        <div className="space-y-2" aria-label="Loading leaderboard" role="status">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-3.5 animate-pulse rounded-sm bg-line"
              style={{ width: `${92 - i * 9}%` }}
            />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-md border border-seal p-6 text-center">
          <p className="text-seal">{state.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm hover:border-bone"
          >
            Try again
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <LeaderboardRows
          entries={state.data.ranked}
          provisional={state.data.provisional}
          filter={filter}
        />
      )}
    </section>
  );
}

function LeaderboardRows({
  entries,
  provisional,
  filter,
}: {
  entries: LeaderboardEntry[];
  provisional: LeaderboardEntry[];
  filter: Filter;
}) {
  const ranked = entries.filter((entry) => matchesFilter(entry, filter));
  const provisionalRows = provisional
    .filter((entry) => matchesFilter(entry, filter))
    .sort((a, b) => (b.n ?? 0) - (a.n ?? 0));

  if (ranked.length === 0 && provisionalRows.length === 0) {
    const label = filter === "all" ? "No forecasters" : `No ${filter} forecasters`;
    return (
      <p className="py-10 text-center text-mute">
        {label}. Skills appear here once a question is settled.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Forecasters ranked by skill against always-yes on shared questions
        </caption>
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-mute">
            <th className="py-3 pr-4 font-medium">#</th>
            <th className="py-3 pr-4 font-medium">Forecaster</th>
            <th className="py-3 pr-4 font-medium">Kind</th>
            <th className="py-3 pr-4 font-medium">Skill</th>
            <th className="py-3 pr-4 font-medium">Brier</th>
            <th className="py-3 font-medium">n</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((entry, i) => (
            <tr key={entry.forecasterId} className="border-b border-line">
              <td className="py-3 pr-4 font-display text-seal">{i + 1}</td>
              <ForecasterCell entry={entry} />
              <td className="py-3 pr-4 font-mono text-xs text-mute">
                {KIND_LABEL[entry.kind] ?? entry.kind}
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-1.5 rounded-sm bg-line"
                    style={{ width: 120 }}
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full rounded-sm transition-[width] duration-700 ease-[cubic-bezier(.2,.7,.2,1)] ${
                        (entry.skill ?? 0) < 0 ? "bg-seal" : "bg-bone"
                      }`}
                      style={{ width: skillBarWidth(entry.skill) }}
                    />
                  </div>
                  <span className="font-mono text-xs tabular-nums">
                    {signedSkill(entry.skill)}
                  </span>
                </div>
              </td>
              <td className="py-3 pr-4 font-mono text-xs tabular-nums text-mute">
                {entry.brier === null ? "—" : entry.brier.toFixed(3)}
              </td>
              <td className="py-3 font-mono text-xs tabular-nums">{entry.n}</td>
            </tr>
          ))}
          {provisionalRows.map((entry) => (
            <tr key={entry.forecasterId} className="border-b border-line text-mute">
              <td className="py-3 pr-4 font-display text-mute">·</td>
              <ForecasterCell entry={entry} provisional />
              <td className="py-3 pr-4 font-mono text-xs text-mute">
                {KIND_LABEL[entry.kind] ?? entry.kind}
              </td>
              <td className="py-3 pr-4 font-mono text-xs">—</td>
              <td className="py-3 pr-4 font-mono text-xs">
                {entry.brier === null ? "—" : entry.brier.toFixed(3)}
              </td>
              <td className="py-3 font-mono text-xs">{entry.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {provisionalRows.length > 0 && (
        <p className="pt-3 text-xs text-mute">
          Rows without a rank are provisional — fewer than {20} settled
          answers, so they are shown but not ranked.
        </p>
      )}
    </div>
  );
}

function ForecasterCell({
  entry,
  provisional = false,
}: {
  entry: LeaderboardEntry;
  provisional?: boolean;
}) {
  return (
    <td className="py-3 pr-4">
      <div className="flex items-center gap-2">
        <a
          href={`/f/${entry.handle}`}
          className={`min-h-11 inline-flex items-center text-sm hover:underline ${
            entry.kind === "house" ? "font-semibold text-seal" : "text-bone"
          }`}
        >
          {entry.handle}
        </a>
        {provisional && (
          <span className="text-xs text-mute">provisional</span>
        )}
      </div>
      {(entry.model || entry.modelVersion) && (
        <div className="font-mono text-xs text-mute">
          {entry.model ?? ""}
          {entry.modelVersion ? ` ${entry.modelVersion}` : ""}
        </div>
      )}
    </td>
  );
}