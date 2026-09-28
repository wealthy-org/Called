import { methodSteps } from "@/lib/method-log";

interface HistoryProps {
  opensAt: string;
  closesAt: string;
  resolvesAt: string;
  status: "open" | "closed" | "settled" | "void";
  sealCount: number;
  revealCount: number;
}

function shortDate(iso: string): string {
  return iso.slice(0, 10);
}

export function QuestionHistory({
  opensAt,
  closesAt,
  resolvesAt,
  status,
  sealCount,
  revealCount,
}: HistoryProps) {
  const steps = methodSteps({
    opensAt,
    closesAt,
    resolvesAt,
    status,
    sealCount,
    now: new Date(),
  });

  const events: { date: string; label: string; done: boolean }[] = [
    {
      date: shortDate(opensAt),
      label: "Question opened",
      done: true,
    },
    ...steps
      .filter((s) => s.key === "seal" && s.done)
      .map((s) => ({
        date: s.dateLabel,
        label: `${sealCount} forecast${sealCount !== 1 ? "s" : ""} sealed`,
        done: true,
      })),
  ];

  if (status === "closed") {
    events.push({
      date: shortDate(closesAt),
      label: `Forecasting closed${revealCount > 0 ? `, ${revealCount} revealed` : ""}`,
      done: true,
    });
  }

  if (status === "settled" || status === "void") {
    events.push({
      date: shortDate(closesAt),
      label: "Forecasting closed",
      done: true,
    });
    events.push({
      date: shortDate(resolvesAt),
      label:
        status === "void"
          ? "Settlement voided"
          : "Settlement completed",
      done: true,
    });
  }

  return (
    <section className="history-section">
      <h2 className="kicker">Question history</h2>
      <ol className="history-list">
        {events.map((ev, i) => (
          <li key={i} className="history-item">
            <span className="history-date font-mono text-xs text-mute">
              {ev.date}
            </span>
            <span className="history-label text-sm text-bone">
              {ev.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
