"use client";

import { useState } from "react";
import { GENESIS_PREV_HASH, sha256HexOfParts } from "@/lib/hash";

export interface LedgerRecordView {
  index: number;
  sealId: string;
  questionId: string;
  forecasterId: string;
  commit: string;
  sealedAt: string;
  prev: string;
  hash: string;
}

export type VerifyState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "VALID" }
  | { status: "BROKEN"; index: number; reason: string };

async function recomputeHash(record: LedgerRecordView): Promise<string> {
  return sha256HexOfParts([
    String(record.index),
    record.commit,
    record.sealedAt,
    record.prev,
  ]);
}

export async function verifyRecords(
  records: LedgerRecordView[],
): Promise<VerifyState> {
  let prev = GENESIS_PREV_HASH;

  for (let position = 0; position < records.length; position += 1) {
    const record = records[position];

    if (record.index !== position) {
      return {
        status: "BROKEN",
        index: position,
        reason: `record ${position} claims index ${record.index}`,
      };
    }

    if (record.prev !== prev) {
      return {
        status: "BROKEN",
        index: position,
        reason: `record ${position} prev hash does not match record ${position - 1}`,
      };
    }

    const expected = await recomputeHash(record);
    if (expected !== record.hash) {
      return {
        status: "BROKEN",
        index: position,
        reason: `record ${position} hash does not match its own contents`,
      };
    }

    prev = record.hash;
  }

  return { status: "VALID" };
}

export function VerifyButton({ records }: { records: LedgerRecordView[] }) {
  const [state, setState] = useState<VerifyState>({ status: "idle" });

  async function run() {
    setState({ status: "checking" });
    setState(await verifyRecords(records));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void run()}
        disabled={state.status === "checking" || records.length === 0}
        className="h-11 rounded-field border border-line px-4 font-mono text-xs uppercase tracking-[0.12em] text-bone hover:border-seal hover:text-seal disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.status === "checking" ? "Verifying" : "Verify"}
      </button>

      <span
        role="status"
        className="font-mono text-xs uppercase tracking-[0.12em]"
      >
        {state.status === "idle" ? null : state.status === "checking" ? null : (
          <>
            <span className={state.status === "VALID" ? "text-bone" : "text-seal"}>
              {state.status}
            </span>
            {state.status === "BROKEN" ? (
              <span className="text-mute"> — first bad record {state.index}</span>
            ) : null}
          </>
        )}
      </span>

      {state.status === "BROKEN" ? (
        <p className="w-full text-sm text-mute">{state.reason}</p>
      ) : null}
    </div>
  );
}
