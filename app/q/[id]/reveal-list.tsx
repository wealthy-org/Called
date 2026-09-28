import Link from "next/link";
import type { RevealRow } from "./data";

function fmtP(p: number): string {
  return `${Math.round(p * 100)}%`;
}

function shortDate(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

export function RevealList({
  reveals,
}: {
  reveals: RevealRow[];
}) {
  if (reveals.length === 0) {
    return (
      <p className="py-6 text-sm text-mute">No forecasts have been revealed yet.</p>
    );
  }

  return (
    <div className="reveal-list overflow-x-auto">
      <table className="reveal-table">
        <caption className="sr-only">
          Forecasts for this question — probability, rationale, record, and
          timestamp.
        </caption>
        <thead>
          <tr>
            <th scope="col">Forecaster</th>
            <th scope="col" className="reveal-th-num">Forecast</th>
            <th scope="col" className="reveal-th-lg">Rationale</th>
            <th scope="col" className="reveal-th-num">Record</th>
            <th scope="col" className="reveal-th-num">Sealed</th>
            <th scope="col" className="reveal-th-num">Anchor</th>
            <th scope="col" className="reveal-th-action" />
          </tr>
        </thead>
        <tbody>
          {reveals.map((r) => (
            <tr key={r.sealId} className="reveal-row">
              <td className="reveal-td-name">
                <span className="font-mono text-sm text-bone">{r.name}</span>
                {r.kind === "house" && (
                  <span className="reveal-tag">house</span>
                )}
                {r.kind === "baseline" && (
                  <span className="reveal-tag">baseline</span>
                )}
                {r.isReserve && <span className="reveal-tag">reserve</span>}
              </td>
              <td className="reveal-td-num">
                <span className="font-display text-lg font-black text-bone tabular-nums">
                  {fmtP(r.p)}
                </span>
              </td>
              <td className="reveal-td-lg text-mute">
                <span className="text-sm">{r.rationale || "\u2014"}</span>
              </td>
              <td className="reveal-td-num">
                <span className="font-mono text-xs text-mute">
                  #{r.recordIndex}
                </span>
              </td>
              <td className="reveal-td-num">
                <span className="font-mono text-xs text-mute">
                  {shortDate(r.sealedAt)}
                </span>
              </td>
              <td className="reveal-td-num">
                <span
                  className={`font-mono text-xs ${
                    r.anchorStatus === "anchored"
                      ? "text-bone"
                      : r.anchorStatus === "pending anchor"
                      ? "text-seal"
                      : "text-mute"
                  }`}
                >
                  {r.anchorStatus === "anchored"
                    ? "anchored"
                    : r.anchorStatus === "pending anchor"
                    ? "pending"
                    : "sealed"}
                </span>
              </td>
              <td className="reveal-td-action">
                <Link
                  href={`/receipt/${r.sealId}`}
                  className="reveal-link"
                >
                  receipt
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
