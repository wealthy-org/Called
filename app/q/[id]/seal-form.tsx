"use client";

import { useState } from "react";
import { newSalt } from "@/lib/crypto-box";

export const MIN_PERCENT = 1;
export const MAX_PERCENT = 99;
export const MAX_RATIONALE_LENGTH = 140;

export function percentToProbability(percent: number): number {
  return percent / 100;
}

export function SealForm({ questionId }: { questionId: string }) {
  const [percent, setPercent] = useState(50);
  const [rationale, setRationale] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [commit, setCommit] = useState<string | null>(null);

  async function submit() {
    setStatus("sending");
    setError(null);

    const salt = newSalt();

    try {
      const response = await fetch("/api/seal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questionId,
          p: percentToProbability(percent),
          rationale: rationale.trim(),
          salt,
        }),
      });

      const body: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof body === "object" && body !== null && "error" in body
            ? String((body as { error: unknown }).error)
            : `seal failed with status ${response.status}`;
        setStatus("idle");
        setError(message);
        return;
      }

      setCommit(
        typeof body === "object" && body !== null && "commit" in body
          ? String((body as { commit: unknown }).commit)
          : "",
      );
      setStatus("done");
    } catch {
      setStatus("idle");
      setError("network error, seal not sent");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-line p-4">
        <p className="font-mono text-xs uppercase text-mute">Sealed</p>
        <p className="mt-2 font-mono text-sm break-all text-seal">{commit}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="seal-percent"
          className="font-mono text-xs uppercase text-mute"
        >
          Probability
        </label>
        <div className="mt-2 flex items-center gap-4">
          <input
            id="seal-percent"
            type="range"
            min={MIN_PERCENT}
            max={MAX_PERCENT}
            value={percent}
            onChange={(event) => setPercent(Number(event.target.value))}
            className="h-11 flex-1 accent-seal"
          />
          <output className="w-16 text-right font-display text-2xl text-bone tabular-nums">
            {percent}%
          </output>
        </div>
      </div>

      <div>
        <label
          htmlFor="seal-rationale"
          className="font-mono text-xs uppercase text-mute"
        >
          One sentence, max {MAX_RATIONALE_LENGTH} characters
        </label>
        <textarea
          id="seal-rationale"
          value={rationale}
          maxLength={MAX_RATIONALE_LENGTH}
          onChange={(event) => setRationale(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-field border border-line bg-ink p-3 text-bone"
        />
        <p className="mt-1 text-right font-mono text-xs text-mute tabular-nums">
          {rationale.length} / {MAX_RATIONALE_LENGTH}
        </p>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={status === "sending"}
        className="h-11 w-full rounded-field border border-bone bg-transparent font-mono text-sm uppercase text-bone hover:border-seal hover:text-seal disabled:opacity-50"
      >
        {status === "sending" ? "Sealing" : "Seal"}
      </button>

      {error !== null ? (
        <p role="alert" className="font-mono text-sm text-seal">
          {error}
        </p>
      ) : null}
    </div>
  );
}
