"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInModal } from "@/components/sign-in-modal";
import { ReceiptBlock, type SealedReceiptData } from "./receipt-slip";
import type { AgentRecord } from "./data";

export const AGENT_SELF_RUN_LABEL = "Agent (self-run)";

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

interface RunResult {
  p: number;
  why: string;
  sealed: SealedReceiptData;
}

export function AgentRunForm({
  questionId,
  agents,
}: {
  questionId: string;
  agents: AgentRecord[];
}) {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  async function submit() {
    if (agentId === "") {
      setError("select an agent");
      return;
    }
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId, apiKey }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        setStatus("idle");
        if (response.status === 401) {
          setSignInOpen(true);
          return;
        }
        setError(
          readString(body, "error") ||
            `run failed with status ${response.status}`,
        );
        return;
      }

      setApiKey("");
      setResult({
        p: readNumber(body, "p"),
        why: readString(body, "why"),
        sealed: {
          sealId: readString(body, "sealId"),
          commit: readString(body, "commit"),
          salt: readString(body, "salt"),
          recordIndex: readNumber(body, "recordIndex"),
          receiptId: readString(body, "receiptId"),
        },
      });
      setStatus("done");
    } catch {
      setStatus("idle");
      setError("network error, agent run not sent");
    }
  }

  if (status === "done" && result !== null) {
    return (
      <div>
        <p className="font-mono text-xs uppercase text-mute">
          {AGENT_SELF_RUN_LABEL}
        </p>
        <p className="mt-2 font-display text-3xl text-bone tabular-nums">
          {Number.isNaN(result.p) ? "—" : `${Math.round(result.p * 100)}%`}
        </p>
        <p className="mt-1 text-sm text-mute">{result.why}</p>
        <div className="mt-4">
          <ReceiptBlock data={result.sealed} />
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-mute">
        Select an agent and provide your provider key. The question text is sent
        to your model, and the answer is sealed like any other forecast.
      </p>

      <label className="mt-4 flex flex-col gap-1">
        <span className="font-mono text-xs uppercase text-mute">Agent</span>
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
              {agent.model
                ? ` (${agent.model}${
                    agent.providerEndpoint
                      ? ` @ ${agent.providerEndpoint}`
                      : ""
                  })`
                : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 flex flex-col gap-1">
        <span className="font-mono text-xs uppercase text-mute">API key</span>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          type="password"
          autoComplete="off"
          required
          className="h-11 w-full rounded-field border border-line bg-ink font-mono text-sm text-bone"
        />
      </label>

      <p className="mt-3 font-mono text-xs text-seal">
        Your key is sent over TLS for exactly one call, then discarded. It is
        never stored, logged, or added to error reports. Your provider may
        charge you for this call.
      </p>

      {error !== null && (
        <p role="alert" className="mt-3 font-mono text-sm text-seal">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={status === "sending"}
        className="mt-4 h-11 rounded-field border border-bone bg-transparent font-mono text-sm uppercase text-bone hover:border-seal hover:text-seal disabled:opacity-50"
      >
        {status === "sending" ? "Running" : "Run agent"}
      </button>

      <p className="mt-4 text-[13.5px] text-mute">
        No agent yet?{" "}
        <Link href="/agents/edit" className="text-bone hover:text-seal">
          Register one
        </Link>{" "}
        for custom models and prompts.
      </p>

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
      />
    </>
  );
}
