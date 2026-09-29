export interface SpreadForecast {
  id: string;
  label: string;
  p: number;
}

export interface SpreadPlotProps {
  forecasts: SpreadForecast[];
  outcome?: boolean;
  className?: string;
}

interface MarkerLayout {
  forecast: SpreadForecast;
  left: number;
  lane: "up" | "down";
  offset: number;
}

const LABEL_WIDTH_PER_CHARACTER = 7.2;
const PLOT_WIDTH_PX = 650;
const PADDING_PX = 8;
const OUTCOME_LABEL = "outcome";
const UP = 0;
const DOWN = 1;
const OUTCOME_STACK_OFFSET = 22;

function clampPercent(p: number): number {
  return Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
}

function labelWidth(label: string): number {
  return Math.max(20, label.length * LABEL_WIDTH_PER_CHARACTER);
}

function percentToPx(left: number): number {
  return (left / 100) * (PLOT_WIDTH_PX - PADDING_PX * 2) + PADDING_PX;
}

function overlaps(a: MarkerLayout, b: MarkerLayout): boolean {
  return Math.abs(percentToPx(a.left) - percentToPx(b.left)) <
    labelWidth(a.forecast.label) / 2 + labelWidth(b.forecast.label) / 2 + PADDING_PX;
}

export function layoutSpreadMarkers(forecasts: SpreadForecast[], outcome?: boolean): MarkerLayout[] {
  const sorted = forecasts
    .map((forecast, index) => ({ forecast, index }))
    .sort((a, b) => clampPercent(a.forecast.p) - clampPercent(b.forecast.p) || a.index - b.index);
  const lanes: MarkerLayout[][] = [[], []];

  const outcomeSlot: MarkerLayout | null =
    outcome !== undefined
      ? {
          forecast: { id: "__outcome__", label: OUTCOME_LABEL, p: 1 },
          left:
            100 -
            (labelWidth(OUTCOME_LABEL) / 2 / (PLOT_WIDTH_PX - PADDING_PX * 2)) * 100,
          lane: "down",
          offset: 0,
        }
      : null;

  if (outcomeSlot) {
    lanes[DOWN].push(outcomeSlot);
  }

  const markers = sorted.map(({ forecast, index }) => {
    const left = clampPercent(forecast.p) * 100;
    const preferred = index % 2;
    const alternate = preferred === UP ? DOWN : UP;
    let laneIndex = preferred;
    let offset = 0;
    let candidate: MarkerLayout = { forecast, left, lane: preferred === UP ? "up" : "down", offset };

    if (outcomeSlot && overlaps(candidate, outcomeSlot)) {
      laneIndex = UP;
      candidate = { ...candidate, lane: "up" };
      offset = lanes[UP].filter((marker) => overlaps(candidate, marker)).length * OUTCOME_STACK_OFFSET;
      candidate = { ...candidate, offset };
    } else if (lanes[preferred].some((marker) => overlaps(candidate, marker))) {
      const alternateCandidate: MarkerLayout = { ...candidate, lane: alternate === UP ? "up" : "down" };
      if (!lanes[alternate].some((marker) => overlaps(alternateCandidate, marker))) {
        laneIndex = alternate;
        candidate = alternateCandidate;
      } else {
        offset = lanes[preferred].filter((marker) => overlaps(candidate, marker)).length * OUTCOME_STACK_OFFSET;
        candidate = { ...candidate, offset };
      }
    }

    const marker: MarkerLayout = {
      forecast,
      left,
      lane: laneIndex === UP ? "up" : "down",
      offset,
    };
    lanes[laneIndex].push(marker);
    return marker;
  });

  return markers;
}

export function spreadSummary(forecasts: SpreadForecast[], outcome?: boolean): string {
  if (forecasts.length === 0) {
    return outcome === undefined
      ? "No forecasters to plot. No outcome yet."
      : `No forecasters to plot. Outcome ${outcome ? "YES" : "NO"}.`;
  }
  const parts = forecasts.map((f) => `${f.label} said ${(clampPercent(f.p) * 100).toFixed(0)}%`).join("; ");
  if (outcome === undefined) {
    return `Spread of ${forecasts.length} forecasters. ${parts}. No outcome yet.`;
  }
  return `Spread of ${forecasts.length} forecasters. ${parts}. Outcome ${outcome ? "YES" : "NO"} at 100%.`;
}

export function SpreadPlot({ forecasts, outcome, className }: SpreadPlotProps) {
  const markers = layoutSpreadMarkers(forecasts, outcome);
  return (
    <figure className={`spread ${className ?? ""}`} role="img" aria-label={spreadSummary(forecasts, outcome)}>
      <div className="axis" aria-hidden="true" />
      {[0, 50, 100].map((tick) => <span key={`tick-${tick}`} className="tick" style={{ left: `${tick}%` }} aria-hidden="true" />)}
      {[0, 50, 100].map((tick) => <span key={`label-${tick}`} className="tl" style={{ left: `${tick}%` }} aria-hidden="true">{tick}%</span>)}
      {markers.map((marker) => (
        <span
          key={marker.forecast.id}
          className={`mk ${marker.lane}`}
          style={{
            left: `${marker.left}%`,
            marginTop: marker.lane === "up" ? -marker.offset : marker.offset,
          }}
        >
          {marker.lane === "up" ? (
            <>
              <span>{marker.forecast.label}</span>
              <small>{Math.round(clampPercent(marker.forecast.p) * 100)}%</small>
              <i aria-hidden="true" />
            </>
          ) : (
            <>
              <i aria-hidden="true" />
              <span>{marker.forecast.label}</span>
              <small>{Math.round(clampPercent(marker.forecast.p) * 100)}%</small>
            </>
          )}
        </span>
      ))}
      {outcome !== undefined && (
        <span className="mk down out"><i aria-hidden="true" /><span>{outcome ? "YES" : "NO"}</span><small>outcome</small></span>
      )}
    </figure>
  );
}
