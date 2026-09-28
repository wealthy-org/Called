export interface CloseOutcome {
  questionId: string;
  ok: boolean;
  reason?: string;
  revealed?: number;
}

export interface CloseSweepDeps {
  listDue: (now: Date) => Promise<string[]>;
  close: (questionId: string, now: Date) => Promise<
    { ok: true; revealed: number } | { ok: false; reason: string }
  >;
}

export interface CloseSweepResult {
  due: number;
  closed: { questionId: string; revealed: number }[];
  skipped: { questionId: string; reason: string }[];
}

/**
 * Closes every question that is due, one at a time. `closeQuestion` is already
 * idempotent, so running this on every page view is safe. A sweep that loses a
 * race simply reports the loser as `not_open` rather than throwing.
 */
export async function sweepDueQuestions(
  now: Date,
  deps: CloseSweepDeps,
): Promise<CloseSweepResult> {
  const due = await deps.listDue(now);

  const closed: CloseSweepResult["closed"] = [];
  const skipped: CloseSweepResult["skipped"] = [];

  for (const questionId of due) {
    const result = await deps.close(questionId, now);
    if (result.ok) {
      closed.push({ questionId, revealed: result.revealed });
    } else {
      skipped.push({ questionId, reason: result.reason });
    }
  }

  return { due: due.length, closed, skipped };
}
