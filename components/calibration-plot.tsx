"use client";

import type { ScoredForecast } from "@/lib/scoring/skill";
import { calibrationBins } from "@/lib/scoring/calibration";

const VIEWBOX = "0 0 360 330";
const PLOT_X = 44;
const PLOT_Y = 14;
const PLOT_W = 304;
const PLOT_H = 260;
const GRID_STOPS = [0, 25, 50, 75, 100];

export interface CalibrationPoint {
  x: number;
  y: number;
  radius: number;
  said: number;
  wasRight: number;
  n: number;
}

export interface CalibrationPointSet {
  bins: number;
  points: CalibrationPoint[];
  curvePath: string | null;
}

export function calibrationPoints(
  forecasts: ScoredForecast[],
  binCount = 10,
): CalibrationPointSet {
  const { bins, data } = calibrationBins(forecasts, binCount);
  const populated = data.filter((bin) => bin.n > 0);

  const points = populated.map((bin) => {
    const said = ((bin.low + bin.high) / 2) * 100;
    const wasRight = (bin.outcomeRate ?? 0) * 100;
    return {
      x: PLOT_X + (PLOT_W * ((bin.low + bin.high) / 2)),
      y: PLOT_Y + PLOT_H - (PLOT_H * (bin.outcomeRate ?? 0)),
      radius: Math.min(7, 4 + bin.n / 200),
      said,
      wasRight,
      n: bin.n,
    };
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

  return { bins, points, curvePath };
}

export function calibrationSummary(
  id: string,
  forecasts: ScoredForecast[],
): string {
  const { data } = calibrationBins(forecasts, 10);
  const populated = data.filter((bin) => bin.n > 0);
  if (populated.length === 0) {
    return `${id} has no plotted calibration data.`;
  }
  const worst = populated.reduce((prev, bin) =>
    Math.abs((bin.outcomeRate ?? 0) - (bin.meanP ?? 0)) >
    Math.abs((prev.outcomeRate ?? 0) - (prev.meanP ?? 0))
      ? bin
      : prev,
  );
  const pointsWord = populated.length >= 2 ? `${populated.length}` : "one";
  return `${id}: calibration ${pointsWord} points, largest gap between said and was right at a ${Math.round(
    (worst.meanP ?? 0) * 100,
  )}% said bin of ${Math.round((worst.outcomeRate ?? 0) * 100)}%.`;
}

interface CalibrationPlotProps {
  id: string;
  forecasts: ScoredForecast[];
  binCount?: number;
  animate?: boolean;
  className?: string;
}

export function CalibrationPlot({
  id,
  forecasts,
  binCount = 10,
  animate = false,
  className,
}: CalibrationPlotProps) {
  const { points, curvePath } = calibrationPoints(forecasts, binCount);
  const summary = calibrationSummary(id, forecasts);

  return (
    <>
      <svg
        viewBox={VIEWBOX}
        role="img"
        aria-label={summary}
        className={className}
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
        {points.map((point, i) => (
          <line
            key={`gx${i}`}
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
            pathLength={1}
            strokeDasharray={animate ? 1 : undefined}
            className={animate ? "calibration-curve" : undefined}
          />
        )}
        {points.map((point, i) => (
          <circle
            key={`pt${i}`}
            cx={point.x}
            cy={point.y}
            r={point.radius}
            fill="#ff5a36"
          >
            <title>
              {`said ${Math.round(point.said)}%, was right ${Math.round(point.wasRight)}% (n=${point.n})`}
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
      </svg>
      <p className="mt-4 min-h-11 text-sm text-mute">{summary}</p>
    </>
  );
}
