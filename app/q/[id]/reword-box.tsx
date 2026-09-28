"use client";

import { useEffect, useState } from "react";
import { questionId } from "@/lib/question-id";

export interface RewordBoxProps {
  originalId: string;
  date: string;
  source: string;
  test: string;
  onIdChange?: (id: string) => void;
}

export function RewordBox({
  originalId,
  date,
  source,
  test,
  onIdChange,
}: RewordBoxProps) {
  const [text, setText] = useState("");
  const [computed, setComputed] = useState<{
    key: string;
    id: string;
  } | null>(null);

  const trimmed = text.trim();

  useEffect(() => {
    if (trimmed.length === 0) {
      return;
    }

    let cancelled = false;

    void questionId({ text: trimmed, date, source, test })
      .then((next) => {
        if (cancelled) {
          return;
        }
        setComputed({ key: trimmed, id: next });
        onIdChange?.(next);
      })
      .catch(() => {
        if (!cancelled) {
          setComputed(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [trimmed, date, source, test, onIdChange]);

  const liveId =
    trimmed.length === 0 || computed?.key !== trimmed
      ? originalId
      : computed.id;

  const changed = liveId !== originalId;

  return (
    <div className="rounded-panel border border-line bg-ink p-4">
      <label
        htmlFor="reword-input"
        className="font-mono text-xs uppercase tracking-[0.12em] text-mute"
      >
        Reword
      </label>

      <textarea
        id="reword-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        maxLength={240}
        placeholder="Type a different wording to see the id change"
        className="mt-2 w-full rounded-field border border-line bg-void p-3 text-sm text-bone placeholder:text-mute focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
      />

      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
          id
        </span>
        <span
          aria-live="polite"
          className={`font-mono text-sm tabular-nums ${
            changed ? "text-seal" : "text-bone"
          }`}
        >
          {liveId}
        </span>
      </div>

      {changed ? (
        <p className="mt-2 text-xs text-mute">
          A different wording produces a different id. Existing seals stay on
          the original.
        </p>
      ) : null}
    </div>
  );
}
