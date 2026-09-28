"use client";

import { useState } from "react";
import { CalibrationPlot } from "@/components/calibration-plot";
import type { ScoredForecast } from "@/lib/scoring/skill";

interface CalibrationPanelProps {
  series: Record<string, ScoredForecast[]>;
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
        <CalibrationPlot
          id={effectiveSelected ?? ""}
          forecasts={forecasts}
          className="mt-4 w-full"
        />
      )}
    </div>
  );
}
