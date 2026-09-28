export const MIN_POOL_VOLUME_USD = 25_000;
export const MIN_APPROVALS = 2;
export const MAX_RATIONALE_LENGTH = 2000;

export interface ManualProposal {
  proposalId: string;
  questionId: string;
  value: number;
  evidenceUrl: string;
  reason: string;
  proposedBy: string;
  proposedAt: string;
  approvals: ManualApproval[];
}

export interface ManualApproval {
  wallet: string;
  approvedAt: string;
}

export type ManualProposalError =
  | "not_enough_approvals"
  | "duplicate_approval"
  | "proposer_cannot_approve"
  | "invalid_value"
  | "missing_evidence"
  | "reason_too_long"
  | "question_mismatch"
  | "already_approved";

export type ManualResult =
  | {
      ok: true;
      proposal: ManualProposal;
      auditEntry: ManualAuditEntry;
    }
  | { ok: false; reason: ManualProposalError; message: string };

export interface ManualAuditEntry {
  questionId: string;
  actor: string;
  action: "manual_settle";
  evidence: {
    proposalId: string;
    value: number;
    evidenceUrl: string;
    approvals: string[];
  };
}

export interface ManualInput {
  questionId: string;
  value: unknown;
  evidenceUrl: unknown;
  reason: unknown;
}

export function validateManualInput(input: ManualInput): ManualResult | null {
  if (typeof input.value !== "number" || !Number.isFinite(input.value)) {
    return {
      ok: false,
      reason: "invalid_value",
      message: "a single finite number is required",
    };
  }

  if (typeof input.evidenceUrl !== "string" || input.evidenceUrl.trim() === "") {
    return {
      ok: false,
      reason: "missing_evidence",
      message: "an evidence link is required",
    };
  }

  if (typeof input.reason !== "string" || input.reason.trim() === "") {
    return {
      ok: false,
      reason: "missing_evidence",
      message: "a reason is required",
    };
  }

  if (input.reason.length > MAX_RATIONALE_LENGTH) {
    return {
      ok: false,
      reason: "reason_too_long",
      message: `reason must be at most ${MAX_RATIONALE_LENGTH} characters`,
    };
  }

  return null;
}

export function hasEnoughApprovals(proposal: ManualProposal): boolean {
  return distinctApprovers(proposal) >= MIN_APPROVALS;
}

function distinctApprovers(proposal: ManualProposal): number {
  return new Set(proposal.approvals.map((a) => a.wallet.toLowerCase())).size;
}

export function hasApproved(
  proposal: ManualProposal,
  wallet: string,
): boolean {
  const target = wallet.toLowerCase();
  return proposal.approvals.some((a) => a.wallet.toLowerCase() === target);
}

export function approve(
  proposal: ManualProposal,
  wallet: string,
  approvedAt: Date,
): ManualResult {
  const actor = wallet.toLowerCase();

  if (actor === proposal.proposedBy.toLowerCase()) {
    return {
      ok: false,
      reason: "proposer_cannot_approve",
      message: "the proposer cannot approve their own settlement",
    };
  }

  if (hasApproved(proposal, actor)) {
    return {
      ok: false,
      reason: "duplicate_approval",
      message: "this wallet has already approved",
    };
  }

  const updated: ManualProposal = {
    ...proposal,
    approvals: [
      ...proposal.approvals,
      { wallet: actor, approvedAt: approvedAt.toISOString() },
    ],
  };

  if (!hasEnoughApprovals(updated)) {
    return {
      ok: false,
      reason: "not_enough_approvals",
      message: `${distinctApprovers(updated)} of ${MIN_APPROVALS} approvals so far`,
    };
  }

  return { ok: true, proposal: updated, auditEntry: buildAuditEntry(updated) };
}

function buildAuditEntry(proposal: ManualProposal): ManualAuditEntry {
  return {
    questionId: proposal.questionId,
    actor: proposal.proposedBy,
    action: "manual_settle",
    evidence: {
      proposalId: proposal.proposalId,
      value: proposal.value,
      evidenceUrl: proposal.evidenceUrl,
      approvals: proposal.approvals.map((a) => a.wallet),
    },
  };
}
