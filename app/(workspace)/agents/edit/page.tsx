"use client";

import { useCallback, useEffect, useState } from "react";
import { SignInModal } from "@/components/sign-in-modal";

export const AGENT_SELF_RUN_LABEL = "Agent (self-run)";

function asRecord(body: unknown): Record<string, unknown> | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }
  return body as Record<string, unknown>;
}

function readString(body: unknown, key: string): string {
  const record = asRecord(body);
  if (record === null) {
    return "";
  }
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readNumber(body: unknown, key: string): number {
  const record = asRecord(body);
  if (record === null) {
    return Number.NaN;
  }
  const value = record[key];
  return typeof value === "number" ? value : Number.NaN;
}

interface AgentSummary {
  id: string;
  name: string;
  model: string | null;
  providerEndpoint: string | null;
  promptHash: string | null;
}

function parseAgents(body: unknown): AgentSummary[] {
  const record = asRecord(body);
  const list = record?.agents;
  if (!Array.isArray(list)) {
    return [];
  }
  const agents: AgentSummary[] = [];
  for (const item of list) {
    const entry = asRecord(item);
    if (entry === null) {
      continue;
    }
    const id = entry.id;
    const name = entry.name;
    if (typeof id !== "string" || typeof name !== "string") {
      continue;
    }
    agents.push({
      id,
      name,
      model: typeof entry.model === "string" ? entry.model : null,
      providerEndpoint:
        typeof entry.providerEndpoint === "string"
          ? entry.providerEndpoint
          : null,
      promptHash:
        typeof entry.promptHash === "string" ? entry.promptHash : null,
    });
  }
  return agents;
}

interface RunResult {
  p: number;
  why: string;
  recordIndex: number;
  commit: string;
}

export default function AgentsEditPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [providerEndpoint, setProviderEndpoint] = useState("");
  const [promptHash, setPromptHash] = useState("");
  const [registerStatus, setRegisterStatus] = useState<
    "idle" | "sending" | "done"
  >("idle");
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [runAgentId, setRunAgentId] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [runStatus, setRunStatus] = useState<"idle" | "sending" | "done">(
    "idle",
  );
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const [signInOpen, setSignInOpen] = useState(false);

  const reload = useCallback(() => {
    setLoadState("loading");
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/agents");
        const body: unknown = await response.json();
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          if (response.status === 401) {
            setSignInOpen(true);
          }
          setLoadState("error");
          setLoadError(
            readString(body, "error") ||
              `could not load agents (status ${response.status})`,
          );
          return;
        }
        setAgents(parseAgents(body));
        setLoadState("ready");
      } catch {
        if (!cancelled) {
          setLoadState("error");
          setLoadError("network error, could not load agents");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function onRegister(event: React.FormEvent) {
    event.preventDefault();
    setRegisterStatus("sending");
    setRegisterError(null);
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          model,
          providerEndpoint,
          promptHash: promptHash.trim() === "" ? undefined : promptHash.trim(),
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setSignInOpen(true);
        }
        setRegisterStatus("idle");
        setRegisterError(
          readString(body, "error") ||
            `registration failed with status ${response.status}`,
        );
        return;
      }
      setName("");
      setModel("");
      setProviderEndpoint("");
      setPromptHash("");
      setRegisterStatus("done");
      reload();
    } catch {
      setRegisterStatus("idle");
      setRegisterError("network error, could not register the agent");
    }
  }

  async function onRun(event: React.FormEvent, agentId: string) {
    event.preventDefault();
    setRunStatus("sending");
    setRunError(null);
    setRunResult(null);
    try {
      const response = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId, apiKey }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setSignInOpen(true);
        }
        setRunStatus("idle");
        setRunError(
          readString(body, "error") ||
            `run failed with status ${response.status}`,
        );
        return;
      }
      setRunResult({
        p: readNumber(body, "p"),
        why: readString(body, "why"),
        recordIndex: readNumber(body, "recordIndex"),
        commit: readString(body, "commit"),
      });
      setApiKey("");
      setRunStatus("done");
    } catch {
      setRunStatus("idle");
      setRunError("network error, could not run the agent");
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-bone">Manage agents</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Register an agent, run it once per question with your own provider key.
        Results are sealed like any other prediction and labelled{" "}
        <span className="font-mono text-seal">{AGENT_SELF_RUN_LABEL}</span>,
        shown separately from the house model.
      </p>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase text-mute">
          Register an agent
        </h2>
        <form onSubmit={onRegister} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-mute">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-mute">Model</span>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              required
              className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-mute">
              Provider endpoint
            </span>
            <input
              value={providerEndpoint}
              onChange={(event) => setProviderEndpoint(event.target.value)}
              type="url"
              placeholder="https://provider.example/v1/chat/completions"
              required
              className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-mute">
              Prompt hash (optional)
            </span>
            <input
              value={promptHash}
              onChange={(event) => setPromptHash(event.target.value)}
              placeholder="64 hex characters"
              className="h-11 w-full rounded-field border border-line bg-ink px-3 font-mono text-sm text-bone"
            />
          </label>
          <button
            type="submit"
            disabled={registerStatus === "sending"}
            className="h-11 rounded-field border border-bone bg-transparent font-mono text-sm uppercase text-bone hover:border-seal hover:text-seal disabled:opacity-50"
          >
            {registerStatus === "sending" ? "Registering" : "Register agent"}
          </button>
          {registerError !== null ? (
            <p role="alert" className="font-mono text-sm text-seal">
              {registerError}
            </p>
          ) : null}
        </form>
      </section>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase text-mute">Your agents</h2>

        {loadState === "loading" ? (
          <p className="mt-4 font-mono text-sm text-mute">Loading agents…</p>
        ) : null}

        {loadState === "error" ? (
          <div className="mt-4 rounded-panel border border-line bg-ink p-4">
            <p className="font-mono text-sm text-seal">{loadError}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-3 h-11 rounded-field border border-line px-4 font-mono text-xs uppercase text-mute hover:text-bone"
            >
              Try again
            </button>
          </div>
        ) : null}

        {loadState === "ready" && agents.length === 0 ? (
          <p className="mt-4 text-mute">
            No agents yet. Register one above, then run it on an open question.
          </p>
        ) : null}

        {loadState === "ready" && agents.length > 0 ? (
          <ul className="mt-4 flex flex-col">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="border-t border-line py-5 first:border-t-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-bone">{agent.name}</span>
                  <span className="font-mono text-xs text-mute">
                    {agent.id}
                  </span>
                </div>
                <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-mute">
                  <div className="flex gap-2">
                    <dt>MODEL</dt>
                    <dd className="text-bone">{agent.model ?? "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>ENDPOINT</dt>
                    <dd className="text-bone">
                      {agent.providerEndpoint ?? "—"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>PROMPT</dt>
                    <dd className="text-bone">
                      {agent.promptHash === null
                        ? "—"
                        : `${agent.promptHash.slice(0, 12)}…`}
                    </dd>
                  </div>
                </dl>

                {runAgentId === agent.id ? (
                  <form
                    onSubmit={(event) => onRun(event, agent.id)}
                    className="mt-4 flex flex-col gap-3 rounded-panel border border-line bg-ink p-4"
                  >
                    <p className="font-mono text-xs text-seal">
                      Your key is sent over TLS for exactly one call, then
                      discarded. It is never stored, logged, or added to error
                      reports. Your provider may charge you for this call.
                    </p>
                    <label className="flex flex-col gap-1">
                      <span className="font-mono text-xs uppercase text-mute">
                        Question ID
                      </span>
                      <input
                        value={questionId}
                        onChange={(event) => setQuestionId(event.target.value)}
                        placeholder="q-2026-10-03-1a2b3c"
                        required
                        className="h-11 w-full rounded-field border border-line bg-void px-3 font-mono text-sm text-bone"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="font-mono text-xs uppercase text-mute">
                        API key
                      </span>
                      <input
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        type="password"
                        autoComplete="off"
                        required
                        className="h-11 w-full rounded-field border border-line bg-void px-3 font-mono text-sm text-bone"
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={runStatus === "sending"}
                        className="h-11 rounded-field border border-bone bg-transparent px-5 font-mono text-sm uppercase text-bone hover:border-seal hover:text-seal disabled:opacity-50"
                      >
                        {runStatus === "sending" ? "Running" : "Run my agent"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRunAgentId(null);
                          setRunError(null);
                          setRunResult(null);
                          setApiKey("");
                        }}
                        className="h-11 rounded-field border border-line px-5 font-mono text-sm uppercase text-mute hover:text-bone"
                      >
                        Cancel
                      </button>
                    </div>
                    {runError !== null ? (
                      <p role="alert" className="font-mono text-sm text-seal">
                        {runError}
                      </p>
                    ) : null}
                    {runResult !== null ? (
                      <div aria-live="polite" className="border-t border-line pt-3">
                        <p className="font-mono text-xs uppercase text-mute">
                          Sealed
                        </p>
                        <p className="mt-1 font-display text-2xl text-bone tabular-nums">
                          {Number.isNaN(runResult.p)
                            ? "—"
                            : runResult.p.toFixed(2)}
                        </p>
                        <p className="mt-1 text-sm text-mute">
                          {runResult.why}
                        </p>
                        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-mute">
                          <div className="flex gap-2">
                            <dt>INDEX</dt>
                            <dd className="text-bone">
                              {runResult.recordIndex}
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt>COMMIT</dt>
                            <dd className="break-all text-bone">
                              {runResult.commit}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ) : null}
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setRunAgentId(agent.id);
                      setRunError(null);
                      setRunResult(null);
                    }}
                    className="mt-3 h-11 rounded-field border border-line px-4 font-mono text-xs uppercase text-mute hover:border-seal hover:text-seal"
                  >
                    Run my agent
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase text-mute">Cost warning</h2>
        <p className="mt-2 max-w-xl text-sm text-mute">
          You bring your own key and your own account. Called never stores it
          and never bills you. Check your provider&apos;s limits before running:
          one run per agent per question is enforced, but each run is a real
          call on your provider.
        </p>
      </section>
      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSignedIn={reload}
      />
    </div>
  );
}
