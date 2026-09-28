"use client";

import { useState } from "react";
import type { ScoredForecast } from "@/lib/scoring/skill";
import { calibrationBins } from "@/lib/scoring/calibration";

const VIEWBOX = "0 0 360 330";
const PLOT_X = 44;
const PLOT_Y = 14;
const PLOT_W = 304;
const PLOT_H = 260;
const GRID_STOPS = [0, 25, 50, 75, 100];

interface CalibrationPanelProps {
  series: Record<string, ScoredForecast[]>;
}

function summarizeSeries(id: string, forecasts: ScoredForecast[]): string {
  const bins = calibrationBins(forecasts, 10).data;
  const populated = bins.filter((bin) => bin.n > 0);
  if (populated.length === 0) {
    return `${id} has no plotted calibration data.`;
  }
  const worst = populated.reduce((prev, bin) =>
    Math.abs((bin.outcomeRate ?? 0) - (bin.meanP ?? 0)) >
    Math.abs((prev.outcomeRate ?? 0) - (prev.meanP ?? 0))
      ? bin
      : prev,
  );
  const skewPoints = populated.length >= 2 ? `${populated.length}` : "one";
  return `${id}: calibration ${skewPoints} points, largest gap between said and was right at a ${Math.round(
    (worst.meanP ?? 0) * 100,
  )}% said bin of ${Math.round((worst.outcomeRate ?? 0) * 100)}%.`;
}

export function CalibrationPanel({ series }: CalibrationPanelProps) {
  const ids = Object.keys(series);
  const [selected, setSelected] = useState<string | null>(ids[0] ?? null);

  const effectiveSelected =
    selected && series[selected] ? selected : (ids[0] ?? null);
  const forecasts = effectiveSelected ? series[effectiveSelected] : undefined;

  if (ids.length === 0) {
    return (
      <div className="rounded-md border border-line bg-ink p-6">
        <p className="text-mute">
          No calibration data yet. Plot appears once a forecaster has a settled
          question.
        </p>
      </div>
    );
  }

  return (
    <div className="sticky top-[84px] rounded-md border border-line bg-ink p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Calibration</h2>
      </div>
      <select
        aria-label="Choose a forecaster"
        value={effectiveSelected ?? ""}
        onChange={(event) => setSelected(event.target.value)}
        className="mt-4 h-11 w-full rounded-md border border-line bg-void px-3 text-sm text-bone"
      >
        {ids.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      {forecasts && (
        <CalibrationChart id={effectiveSelected ?? ""} forecasts={forecasts} />
      )}
    </div>
  );
}

function CalibrationChart({
  id,
  forecasts,
}: {
  id: string;
  forecasts: ScoredForecast[];
}) {
  const bins = calibrationBins(forecasts, 10).data;
  const populated = bins.filter((bin) => bin.n > 0);
  const summary = summarizeSeries(id, forecasts);

  const points = populated.map((bin, i) => {
    const x = PLOT_X + (PLOT_W * (bin.high + bin.low)) / 2 / 100;
    const y = PLOT_Y + PLOT_H - (PLOT_H * (bin.outcomeRate ?? 0)) / 100;
    const radius = Math.min(7, 4 + bin.n / 200);
    return { x, y, radius, bin, index: i, total: populated.length };
  });

  const curvePath =
    points.length >= 2
      ? points
          .map(
            (point, i) =>
              `${i === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`,
          )
          .join(" ")
      : null;

  return (
    <>
      <svg
        viewBox={VIEWBOX}
        role="img"
        aria-label={summary}
        className="mt-4 w-full"
      >
        {GRID_STOPS.map((stop) => {
          const y = PLOT_Y + (PLOT_H * stop) / 100;
          return (
            <g key={stop}>
              <line
                x1={PLOT_X}
                y1={y}
                x2={PLOT_X + PLOT_W}
                y2={y}
                stroke="#26262b"
                strokeWidth={1}
              />
              <text
                x={PLOT_X - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill="#a19d95"
                fontFamily="IBM Plex Mono, monospace"
              >
                {stop}%
              </text>
            </g>
          );
        })}
        {GRID_STOPS.map((stop) => {
          const x = PLOT_X + (PLOT_W * stop) / 100;
          return (
            <line
              key={`v${stop}`}
              x1={x}
              y1={PLOT_Y}
              x2={x}
              y2={PLOT_Y + PLOT_H}
              stroke="#26262b"
              strokeWidth={1}
            />
          );
        })}
        {points.map((point) => (
          <line
            key={`gx${point.index}`}
            x1={PLOT_X}
            y1={point.y}
            x2={PLOT_X + PLOT_W}
            y2={point.y}
            stroke="#26262b"
            strokeDasharray="2 3"
            strokeWidth={0.8}
            opacity={0.6}
          />
        ))}
        <line
          x1={PLOT_X}
          y1={PLOT_Y + PLOT_H}
          x2={PLOT_X + PLOT_W}
          y2={PLOT_Y}
          stroke="#ece9e4"
          strokeWidth={1.2}
          strokeDasharray="5 5"
        />
        {curvePath && (
          <path
            d={curvePath}
            fill="none"
            stroke="#ff5a36"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {points.map((point) => (
          <circle key={`pt${point.index}`} cx={point.x} cy={point.y} r={point.radius} fill="#ff5a36">
            <title>
              said {Math.round((point.bin.meanP ?? 0) * 100)}%, was right{" "}
              {Math.round((point.bin.outcomeRate ?? 0) * 100)}% (n={point.bin.n})
            </title>
          </circle>
        ))}
        <text
          x={PLOT_X}
          y={PLOT_Y + PLOT_H + 22}
          fontSize={12}
          fill="#a19d95"
          fontFamily="IBM Plex Mono, monospace"
        >
          said (%)
        </text>
        {curvePath && (
          <text
            x={PLOT_X + PLOT_W}
            y={PLOT_Y + 4}
            textAnchor="end"
            fontSize={12}
            fill="#a19d95"
            fontFamily="IBM Plex Mono, monospace"
          >
            was right (%)
          </text>
        )}
      </svg>
      <p className="mt-4 min-h-11 text-sm text-mute">{summary}</p>
    </>
  );
}