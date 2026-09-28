"use client";

import { useState } from "react";
import { newSalt } from "@/lib/crypto-box";
import { ReceiptBlock, type SealedReceiptData } from "./receipt-slip";
import { SignInModal } from "@/components/sign-in-modal";

export const MIN_PERCENT = 1;
export const MAX_PERCENT = 99;
export const MAX_RATIONALE_LENGTH = 140;

export function percentToProbability(percent: number): number {
  return percent / 100;
}

function asRecord(body: unknown): Record<string, unknown> | null {
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)
    : null;
}

function readString(body: unknown, key: string): string {
  const record = asRecord(body);
  const value = record?.[key];
  return typeof value === "string" ? value : "";
}

function readNumber(body: unknown, key: string): number {
  const record = asRecord(body);
  const value = record?.[key];
  return typeof value === "number" ? value : Number.NaN;
}

export function SealForm({ questionId }: { questionId: string }) {
  const [percent, setPercent] = useState(50);
  const [rationale, setRationale] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sealed, setSealed] = useState<SealedReceiptData | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

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
          readString(body, "error") ||
          `seal failed with status ${response.status}`;
        setStatus("idle");
        if (response.status === 401) {
          setSignInOpen(true);
          return;
        }
        setError(message);
        return;
      }

      setSealed({
        sealId: readString(body, "sealId"),
        commit: readString(body, "commit"),
        salt: readString(body, "salt") || salt,
        recordIndex: readNumber(body, "recordIndex"),
        receiptId: readString(body, "receiptId"),
      });
      setStatus("done");
    } catch {
      setStatus("idle");
      setError("network error, seal not sent");
    }
  }

  if (status === "done" && sealed !== null) {
    return <ReceiptBlock data={sealed} />;
  }

  return (
    <>
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
    <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
