import { methodSteps } from "@/lib/method-log";

const ANCHOR_LABEL = "ANCHOR";
const ANCHOR_DONE_DESC = "head written to Robinhood Chain";
const ANCHOR_PENDING_DESC = "pending anchor";

interface LifecycleProps {
  opensAt: string;
  closesAt: string;
  resolvesAt: string;
  status: "open" | "closed" | "settled" | "void";
  sealCount: number;
  anchorStatus: "sealed" | "pending anchor" | "anchored";
}

export function QuestionLifecycle({
  opensAt,
  closesAt,
  resolvesAt,
  status,
  sealCount,
  anchorStatus,
}: LifecycleProps) {
  const steps = methodSteps({
    opensAt,
    closesAt,
    resolvesAt,
    status,
    sealCount,
    now: new Date(),
  });

  const anchorDone = anchorStatus === "anchored";

  const allSteps: {
    key: string;
    label: string;
    done: boolean;
    desc: string;
  }[] = [
    {
      key: "ask",
      label: steps[0].title.split(" ").slice(-1)[0] ?? "ASK",
      done: steps[0].done,
      desc: steps[0].body.split(". ")[0],
    },
    {
      key: "open",
      label: "OPEN",
      done: sealCount > 0,
      desc: "forecasts can be sealed",
    },
    {
      key: "closed",
      label: "CLOSED",
      done: status === "closed" || status === "settled" || status === "void",
      desc: "forecasts revealed",
    },
    {
      key: "settle",
      label: "SETTLED",
      done: status === "settled" || status === "void",
      desc:
        status === "void"
          ? "settlement could not resolve"
          : "source read and test applied",
    },
    {
      key: "anchor",
      label: ANCHOR_LABEL,
      done: anchorDone,
      desc: anchorDone ? ANCHOR_DONE_DESC : ANCHOR_PENDING_DESC,
    },
  ];

  return (
    <ol className="lifecycle">
      {allSteps.map((step) => (
        <li key={step.key} className="lifecycle-step">
          <span
            aria-hidden="true"
            className={`lifecycle-marker ${step.done ? "lifecycle-done" : "lifecycle-todo"}`}
          />
          <div className="lifecycle-content">
            <span className="lifecycle-label">{step.label}</span>
            <span className="lifecycle-desc">{step.desc}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
