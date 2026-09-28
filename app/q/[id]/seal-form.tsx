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
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sealed, setSealed] = useState<SealedReceiptData | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  async function submit() {
    setFormStatus("sending");
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
        setFormStatus("idle");
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
        sealedAt: readString(body, "sealedAt"),
        anchorStatus:
          readString(body, "anchorStatus") as SealedReceiptData["anchorStatus"],
      });
      setFormStatus("done");
    } catch {
      setFormStatus("idle");
      setError("network error, seal not sent");
    }
  }

  if (formStatus === "done" && sealed !== null) {
    return <ReceiptBlock data={sealed} />;
  }

  return (
    <>
      <div className="seal-form">
        <div className="seal-probability">
          <label htmlFor="seal-percent" className="seal-label">
            Probability
          </label>
          <div className="seal-slider-row">
            <input
              id="seal-percent"
              type="range"
              min={MIN_PERCENT}
              max={MAX_PERCENT}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="seal-slider"
              aria-label="Probability"
            />
            <output
              htmlFor="seal-percent"
              className="seal-output"
            >
              {percent}%
            </output>
          </div>
        </div>

        <div className="seal-reason">
          <label htmlFor="seal-rationale" className="seal-label">
            One sentence, max {MAX_RATIONALE_LENGTH} characters
          </label>
          <textarea
            id="seal-rationale"
            value={rationale}
            maxLength={MAX_RATIONALE_LENGTH}
            onChange={(e) => setRationale(e.target.value)}
            rows={3}
            className="seal-textarea"
            placeholder="Why this probability?"
            aria-describedby="seal-char-count"
          />
          <p id="seal-char-count" className="seal-char-count" aria-live="polite">
            {rationale.length} / {MAX_RATIONALE_LENGTH}
          </p>
        </div>

        {error !== null && (
          <p role="alert" className="seal-error">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={formStatus === "sending"}
          className="seal-btn"
        >
          {formStatus === "sending" ? "Sealing" : "Seal forecast"}
        </button>
      </div>

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
      />
    </>
  );
}
