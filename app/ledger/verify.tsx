"use client";

import { useState, useCallback } from "react";
import type { AnchorRecord } from "@/lib/anchor-status";
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
  | { status: "fetching" }
  | { status: "checking" }
  | { status: "VALID"; checked: number }
  | { status: "BROKEN"; index: number; reason: string }
  | { status: "ERROR"; message: string };

export type AnchorState =
  | { status: "idle" }
  | { status: "fetching" }
  | { status: "loaded"; records: LedgerRecordView[]; total: number; headHash: string; anchor: AnchorRecord | null }
  | { status: "ERROR"; message: string };

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
): Promise<{ status: "VALID"; checked: number } | { status: "BROKEN"; index: number; reason: string }> {
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

  return { status: "VALID", checked: records.length };
}

function exportJsonl(records: LedgerRecordView[]): void {
  const lines = records.map((r) =>
    JSON.stringify({
      index: r.index,
      sealId: r.sealId,
      questionId: r.questionId,
      forecasterId: r.forecasterId,
      commit: r.commit,
      sealedAt: r.sealedAt,
      prev: r.prev,
      hash: r.hash,
    }),
  );
  const blob = new Blob(lines.map((l) => l + "\n"), {
    type: "application/x-ndjson",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "called-ledger.jsonl";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface LedgerVerificationProps {
  initialAnchorStatus: "sealed" | "pending anchor" | "anchored";
  initialLatestAnchor: {
    headHash: string;
    recordCount: number;
    txHash: string;
    blockNumber: number;
    blockTime: string;
  } | null;
}

export function LedgerVerification({
  initialAnchorStatus,
  initialLatestAnchor,
}: LedgerVerificationProps) {
  const [chainState, setChainState] = useState<AnchorState>({ status: "idle" });
  const [verifyState, setVerifyState] = useState<VerifyState>({ status: "idle" });

  const fetchChain = useCallback(async () => {
    setChainState({ status: "fetching" });
    setVerifyState({ status: "idle" });
    try {
      const res = await fetch("/api/ledger");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const records: LedgerRecordView[] = data.records.map((r: Record<string, unknown>) => ({
        ...r,
        sealedAt: String(r.sealedAt),
      }));
      const anchor: AnchorRecord | null = data.anchor
        ? {
            headHash: String(data.anchor.headHash),
            recordCount: Number(data.anchor.recordCount),
            txHash: String(data.anchor.txHash),
            blockNumber: Number(data.anchor.blockNumber),
            blockTime: new Date(String(data.anchor.blockTime)),
          }
        : null;
      setChainState({
        status: "loaded",
        records,
        total: data.total,
        headHash: data.head ? String(data.head.hash) : "",
        anchor,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setChainState({ status: "ERROR", message: msg });
    }
  }, []);

  const runVerify = useCallback(async () => {
    if (chainState.status !== "loaded") {
      await fetchChain();
      return;
    }
    setVerifyState({ status: "checking" });
    const result = await verifyRecords(chainState.records);
    setVerifyState(result);
  }, [chainState, fetchChain]);

  const canExport =
    chainState.status === "loaded" && chainState.records.length > 0;

  const localStateLabel =
    verifyState.status === "idle"
      ? "NOT RUN"
      : verifyState.status === "fetching" || verifyState.status === "checking"
        ? "VERIFYING"
        : verifyState.status === "VALID"
          ? "VALID"
          : verifyState.status === "BROKEN"
            ? "BROKEN"
            : "ERROR";

  const localStateClass =
    verifyState.status === "VALID"
      ? "text-bone"
      : verifyState.status === "BROKEN"
        ? "text-seal"
        : verifyState.status === "idle" ||
            verifyState.status === "fetching" ||
            verifyState.status === "checking"
          ? "text-mute"
          : "text-seal";

  const anchorDisplayStatus =
    initialAnchorStatus === "anchored"
      ? "ANCHORED"
      : initialAnchorStatus === "pending anchor"
        ? "PENDING ANCHOR"
        : "SEALED";

  const anchorDisplayClass =
    initialAnchorStatus === "anchored"
      ? "text-bone"
      : initialAnchorStatus === "pending anchor"
        ? "text-seal"
        : "text-mute";

  return (
    <div className="lverify">
      {/* Verification panel */}
      <div className="lverify-panel">
        <div className="lverify-head">
          <span className="lverify-title">Verify the chain</span>
          <span className="lverify-desc">
            Recompute every record in your browser.
          </span>
        </div>

        <div className="lverify-actions">
          <button
            type="button"
            onClick={runVerify}
            disabled={
              verifyState.status === "checking" ||
              verifyState.status === "fetching"
            }
            className="lverify-btn"
          >
            {verifyState.status === "checking" ||
            verifyState.status === "fetching"
              ? "Verifying"
              : "Verify chain"}
          </button>

          {canExport && (
            <button
              type="button"
              onClick={() => exportJsonl(chainState.records)}
              className="lverify-btn-secondary"
            >
              Export JSONL
            </button>
          )}
        </div>

        <div className="lverify-status">
          <span className="lverify-status-label">LOCAL CHAIN</span>
          <span className={`lverify-status-value ${localStateClass}`}>
            {localStateLabel}
          </span>
          {verifyState.status === "VALID" && (
            <span className="lverify-status-detail text-mute">
              {" "}
              {verifyState.checked} / {verifyState.checked} records match.
            </span>
          )}
          {verifyState.status === "BROKEN" && (
            <span className="lverify-status-detail text-seal">
              {" "}
              First mismatch at record {verifyState.index}.
            </span>
          )}
          {verifyState.status === "ERROR" && (
            <span className="lverify-status-detail text-seal">
              {" "}
              {verifyState.message}
            </span>
          )}
        </div>

        <div className="lverify-status">
          <span className="lverify-status-label">PUBLIC ANCHOR</span>
          <span className={`lverify-status-value ${anchorDisplayClass}`}>
            {anchorDisplayStatus}
          </span>
          {initialLatestAnchor && (
            <span className="lverify-status-detail text-mute">
              {" "}
              block {initialLatestAnchor.blockNumber.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {chainState.status === "ERROR" && (
        <p className="lverify-error" role="alert">
          Could not load chain: {chainState.message}
        </p>
      )}
    </div>
  );
}

/* ── Standalone VerifyButton for homepage ledger section ── */

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

      <span role="status" className="font-mono text-xs uppercase tracking-[0.12em]">
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
