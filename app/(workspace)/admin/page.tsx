"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminQuestion {
  id: string;
  text: string;
  source: string;
  test: string;
  status: string;
  closesAt: string;
  resolvesAt: string;
  sealCount: number;
  revealCount: number;
}

interface ProposalView {
  proposalId: string;
  questionId: string;
  value: number;
  evidenceUrl: string;
  reason: string;
  proposedBy: string;
  proposedAt: string;
  approvals: { wallet: string; approvedAt: string }[];
}

interface AuditView {
  id: string;
  actorWallet: string;
  action: string;
  questionId: string | null;
  at: string;
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  return body as Record<string, unknown>;
}

function readString(body: unknown, key: string): string {
  const record = asRecord(body);
  const value = record?.[key];
  return typeof value === "string" ? value : "";
}

function parseQuestions(body: unknown): AdminQuestion[] {
  const record = asRecord(body);
  const raw = record?.open;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (entry): entry is AdminQuestion =>
      typeof entry === "object" && entry !== null && "id" in entry,
  );
}

function parseProposals(body: unknown): ProposalView[] {
  const record = asRecord(body);
  const raw = record?.proposals;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (entry): entry is ProposalView =>
      typeof entry === "object" && entry !== null && "proposalId" in entry,
  );
}

function parseAudit(body: unknown): AuditView[] {
  const record = asRecord(body);
  const raw = record?.entries;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (entry): entry is AuditView =>
      typeof entry === "object" && entry !== null && "action" in entry,
  );
}

export default function AdminPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [proposals, setProposals] = useState<ProposalView[]>([]);
  const [audit, setAudit] = useState<AuditView[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");

  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [test, setTest] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [resolvesAt, setResolvesAt] = useState("");
  const [createState, setCreateState] = useState<"idle" | "sending">("idle");
  const [createError, setCreateError] = useState("");
  const [createdId, setCreatedId] = useState("");

  const [settleQuestionId, setSettleQuestionId] = useState("");
  const [settleValue, setSettleValue] = useState("");
  const [settleEvidence, setSettleEvidence] = useState("");
  const [settleReason, setSettleReason] = useState("");
  const [settleState, setSettleState] = useState<"idle" | "sending">("idle");
  const [settleError, setSettleError] = useState("");
  const [settleOk, setSettleOk] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [questionsResponse, proposalsResponse, auditResponse] =
          await Promise.all([
            fetch("/api/admin/questions"),
            fetch("/api/admin/settlements"),
            fetch("/api/admin/audit"),
          ]);

        if (!questionsResponse.ok) {
          throw new Error(`load failed with status ${questionsResponse.status}`);
        }

        const questionsBody: unknown = await questionsResponse.json();
        const proposalsBody: unknown = await proposalsResponse.json();
        const auditBody: unknown = await auditResponse.json();

        if (cancelled) {
          return;
        }

        setQuestions(parseQuestions(questionsBody));
        setProposals(parseProposals(proposalsBody));
        setAudit(parseAudit(auditBody));
        setLoadState("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }
        setLoadState("error");
        setLoadError(
          error instanceof Error ? error.message : "could not load admin data",
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreateState("sending");
    setCreateError("");
    setCreatedId("");

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, source, test, closesAt, resolvesAt }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        setCreateState("idle");
        setCreateError(readString(body, "error") || "could not create question");
        return;
      }

      setCreatedId(readString(body, "questionId"));
      setText("");
      setSource("");
      setTest("");
      setClosesAt("");
      setResolvesAt("");
      setCreateState("idle");
      setRefreshKey((key) => key + 1);
    } catch {
      setCreateState("idle");
      setCreateError("network error, the question was not created");
    }
  }

  async function handlePropose(event: React.FormEvent) {
    event.preventDefault();
    setSettleState("sending");
    setSettleError("");
    setSettleOk("");

    try {
      const response = await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questionId: settleQuestionId,
          value: Number(settleValue),
          evidenceUrl: settleEvidence,
          reason: settleReason,
        }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        setSettleState("idle");
        setSettleError(readString(body, "error") || "could not propose settlement");
        return;
      }

      setSettleOk("Proposal recorded. It needs a second admin approval.");
      setSettleState("idle");
      setRefreshKey((key) => key + 1);
    } catch {
      setSettleState("idle");
      setSettleError("network error, the proposal was not recorded");
    }
  }

  async function handleApprove(proposalId: string) {
    setSettleError("");
    setSettleOk("");

    try {
      const response = await fetch(
        `/api/admin/settlements/${proposalId}/approve`,
        { method: "POST" },
      );
      const body: unknown = await response.json();

      if (!response.ok) {
        setSettleError(readString(body, "error") || "could not approve");
        return;
      }

      const approved = asRecord(body)?.approved === true;
      setSettleOk(
        approved
          ? "Second approval accepted. The question is settled."
          : "Approval recorded. The proposal still needs another admin.",
      );
      setRefreshKey((key) => key + 1);
    } catch {
      setSettleError("network error, the approval was not recorded");
    }
  }

  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-seal">
        Admin
      </p>
      <h1 className="mt-2 font-display text-3xl text-bone">
        Question control
      </h1>
      <p className="mt-3 max-w-2xl text-mute">
        Questions pass the ask gate before they exist. A manual settlement
        needs two distinct admin wallets, and every action is written to the
        audit log.
      </p>

      {loadState === "loading" ? (
        <p className="mt-8 font-mono text-sm text-mute">Loading admin data...</p>
      ) : null}

      {loadState === "error" ? (
        <div className="mt-8 rounded-panel border border-seal/60 bg-ink p-5">
          <p className="font-mono text-sm text-seal">{loadError}</p>
          <p className="mt-2 text-sm text-mute">
            You may not be signed in as an admin wallet.
          </p>
        </div>
      ) : null}

      {loadState === "ready" ? (
        <>
          <section className="mt-10">
            <h2 className="font-display text-xl text-bone">Create a question</h2>
            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase text-mute">
                  Question text
                </span>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  required
                  rows={2}
                  className="w-full rounded-field border border-line bg-ink p-3 text-bone"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase text-mute">
                  Source
                </span>
                <input
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  required
                  placeholder="dex.twap:0xpool:1h or oracle:0xfeed or manual"
                  className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase text-mute">
                  Test
                </span>
                <input
                  value={test}
                  onChange={(event) => setTest(event.target.value)}
                  required
                  placeholder="gte 100000"
                  className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-xs uppercase text-mute">
                    Seals close
                  </span>
                  <input
                    type="datetime-local"
                    value={closesAt}
                    onChange={(event) => setClosesAt(event.target.value)}
                    required
                    className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-xs uppercase text-mute">
                    Resolves
                  </span>
                  <input
                    type="datetime-local"
                    value={resolvesAt}
                    onChange={(event) => setResolvesAt(event.target.value)}
                    required
                    className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
                  />
                </label>
              </div>
              {createError ? (
                <p role="alert" className="font-mono text-sm text-seal">
                  {createError}
                </p>
              ) : null}
              {createdId ? (
                <p className="font-mono text-sm text-bone">
                  Created {createdId}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={createState === "sending"}
                className="h-11 self-start rounded-field border border-seal bg-seal px-5 font-mono text-sm uppercase text-void disabled:opacity-50"
              >
                {createState === "sending" ? "Creating" : "Create question"}
              </button>
            </form>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-xl text-bone">
              Open questions
            </h2>
            {questions.length === 0 ? (
              <p className="mt-3 text-mute">No question is open right now.</p>
            ) : (
              <ul className="mt-4 flex flex-col">
                {questions.map((question) => (
                  <li
                    key={question.id}
                    className="border-t border-line py-4 first:border-t-0"
                  >
                    <Link
                      href={`/q/${question.id}`}
                      className="block text-bone hover:text-seal"
                    >
                      {question.text}
                    </Link>
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-mute">
                      <div className="flex gap-2">
                        <dt>ID</dt>
                        <dd>{question.id}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt>Seals</dt>
                        <dd>{question.sealCount}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt>Closes</dt>
                        <dd>{question.closesAt.slice(0, 10)}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-12">
            <h2 className="font-display text-xl text-bone">
              Manual settlement
            </h2>
            <form onSubmit={handlePropose} className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase text-mute">
                  Closed question ID
                </span>
                <input
                  value={settleQuestionId}
                  onChange={(event) => setSettleQuestionId(event.target.value)}
                  required
                  className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase text-mute">
                  One number
                </span>
                <input
                  type="number"
                  step="any"
                  value={settleValue}
                  onChange={(event) => setSettleValue(event.target.value)}
                  required
                  className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase text-mute">
                  Evidence link
                </span>
                <input
                  type="url"
                  value={settleEvidence}
                  onChange={(event) => setSettleEvidence(event.target.value)}
                  required
                  className="h-11 w-full rounded-field border border-line bg-ink px-3 text-bone"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase text-mute">
                  Reason
                </span>
                <textarea
                  value={settleReason}
                  onChange={(event) => setSettleReason(event.target.value)}
                  required
                  rows={2}
                  className="w-full rounded-field border border-line bg-ink p-3 text-bone"
                />
              </label>
              {settleError ? (
                <p role="alert" className="font-mono text-sm text-seal">
                  {settleError}
                </p>
              ) : null}
              {settleOk ? (
                <p className="font-mono text-sm text-bone">{settleOk}</p>
              ) : null}
              <button
                type="submit"
                disabled={settleState === "sending"}
                className="h-11 self-start rounded-field border border-bone px-5 font-mono text-sm uppercase text-bone disabled:opacity-50"
              >
                {settleState === "sending" ? "Proposing" : "Propose settlement"}
              </button>
            </form>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-xl text-bone">
              Pending proposals
            </h2>
            {proposals.length === 0 ? (
              <p className="mt-3 text-mute">No manual settlement proposals.</p>
            ) : (
              <ul className="mt-4 flex flex-col">
                {proposals.map((proposal) => (
                  <li
                    key={proposal.proposalId}
                    className="border-t border-line py-4 first:border-t-0"
                  >
                    <p className="text-bone">
                      {proposal.questionId} — value {proposal.value}
                    </p>
                    <p className="mt-1 text-sm text-mute">{proposal.reason}</p>
                    <p className="mt-1 font-mono text-xs text-mute">
                      proposed by {proposal.proposedBy.slice(0, 10)}... ·
                      approvals {proposal.approvals.length}/2
                    </p>
                    <a
                      href={proposal.evidenceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1 block font-mono text-xs text-seal break-all"
                    >
                      {proposal.evidenceUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleApprove(proposal.proposalId)}
                      className="mt-3 h-11 rounded-field border border-bone px-4 font-mono text-sm uppercase text-bone hover:border-seal hover:text-seal"
                    >
                      Approve
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-12">
            <h2 className="font-display text-xl text-bone">Audit log</h2>
            {audit.length === 0 ? (
              <p className="mt-3 text-mute">No admin actions recorded yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col">
                {audit.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-t border-line py-3 font-mono text-xs text-mute first:border-t-0"
                  >
                    {entry.at.slice(0, 19).replace("T", " ")} · {entry.action}
                    {entry.questionId ? ` · ${entry.questionId}` : ""} ·{" "}
                    {entry.actorWallet.slice(0, 10)}...
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
