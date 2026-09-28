export interface SpreadForecast {
  id: string;
  label: string;
  p: number;
}

export interface SpreadPlotProps {
  forecasts: SpreadForecast[];
  outcome: boolean;
  className?: string;
}

const PAD_X = 8;
const MARKER_ABOVE_Y = 46;
const MARKER_BELOW_Y = 104;
const AXIS_Y = 76;
const PLOT_HEIGHT = 190;

function clampPercent(p: number): number {
  if (!Number.isFinite(p)) {
    return 0;
  }
  return Math.min(1, Math.max(0, p));
}

export function spreadSummary(
  forecasts: SpreadForecast[],
  outcome: boolean,
): string {
  if (forecasts.length === 0) {
    return `No forecasters to plot. Outcome ${outcome ? "YES" : "NO"}.`;
  }
  const parts = forecasts
    .map((f) => `${f.label} said ${(clampPercent(f.p) * 100).toFixed(0)}%`)
    .join("; ");
  return `Spread of ${forecasts.length} forecasters. ${parts}. Outcome ${
    outcome ? "YES" : "NO"
  } at 100%.`;
}

export function SpreadPlot({ forecasts, outcome, className }: SpreadPlotProps) {
  const label = spreadSummary(forecasts, outcome);

  return (
    <figure className={className}>
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 360 ${PLOT_HEIGHT}`}
        className="h-[190px] w-full"
        preserveAspectRatio="none"
      >
        <line
          x1={PAD_X}
          y1={AXIS_Y}
          x2={360 - PAD_X}
          y2={AXIS_Y}
          stroke="var(--bone)"
          strokeWidth={1}
        />
        {[0, 0.5, 1].map((tick) => {
          const x = PAD_X + tick * (360 - PAD_X * 2);
          return (
            <text
              key={tick}
              x={x}
              y={AXIS_Y + 18}
              textAnchor="middle"
              className="fill-mute font-mono text-[11.5px]"
            >
              {tick * 100}%
            </text>
          );
        })}

        {forecasts.map((forecast, index) => {
          const x = PAD_X + clampPercent(forecast.p) * (360 - PAD_X * 2);
          const above = index % 2 === 0;
          const y = above ? MARKER_ABOVE_Y : MARKER_BELOW_Y;
          return (
            <g key={forecast.id}>
              <rect
                x={x - 5}
                y={y - 5}
                width={10}
                height={10}
                fill="var(--bone)"
              />
              <text
                x={x}
                y={above ? y - 12 : y + 20}
                textAnchor="middle"
                className="fill-mute font-mono text-[12px]"
              >
                {forecast.label}
              </text>
            </g>
          );
        })}

        <g>
          <rect
            x={360 - PAD_X - 10}
            y={AXIS_Y - 5}
            width={10}
            height={10}
            fill="var(--seal)"
          />
          <text
            x={360 - PAD_X}
            y={AXIS_Y - 14}
            textAnchor="end"
            className="fill-seal font-mono text-[12px]"
          >
            {outcome ? "YES" : "NO"}
          </text>
        </g>
      </svg>
    </figure>
  );
}
