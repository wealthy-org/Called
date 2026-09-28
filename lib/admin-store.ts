import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminLog, questions, sealReveals, seals } from "@/db/schema";
import type { ManualAuditEntry, ManualProposal } from "./resolver/manual";

export const MAX_OPEN_QUESTIONS = 5;

export interface AuditLogRow {
  id: string;
  actorWallet: string;
  action: string;
  questionId: string | null;
  evidence: unknown;
  at: Date;
}

export async function countOpenQuestions(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(questions)
    .where(eq(questions.status, "open"));
  return row?.n ?? 0;
}

export async function listOpenQuestionIds(): Promise<string[]> {
  const rows = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.status, "open"));
  return rows.map((row) => row.id);
}

export async function countPredictions(questionId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(sealReveals)
    .innerJoin(seals, eq(seals.id, sealReveals.sealId))
    .where(eq(seals.questionId, questionId));
  return row?.n ?? 0;
}

function newProposalId(): string {
  return `proposal-${crypto.randomUUID()}`;
}

export async function proposeSettlement(input: {
  questionId: string;
  value: number;
  evidenceUrl: string;
  reason: string;
  proposedBy: string;
  proposedAt: Date;
}): Promise<ManualProposal> {
  const proposal: ManualProposal = {
    proposalId: newProposalId(),
    questionId: input.questionId,
    value: input.value,
    evidenceUrl: input.evidenceUrl,
    reason: input.reason,
    proposedBy: input.proposedBy.toLowerCase(),
    proposedAt: input.proposedAt.toISOString(),
    approvals: [],
  };

  await db.insert(adminLog).values({
    id: proposal.proposalId,
    actorWallet: proposal.proposedBy,
    action: "manual_settle_proposal",
    questionId: input.questionId,
    evidence: proposal,
    at: input.proposedAt,
  });

  return proposal;
}

export async function listManualProposals(): Promise<ManualProposal[]> {
  const rows = await db
    .select({ evidence: adminLog.evidence })
    .from(adminLog)
    .where(eq(adminLog.action, "manual_settle_proposal"))
    .orderBy(desc(adminLog.at));

  return rows
    .map((row) => parseProposal(row.evidence))
    .filter((proposal): proposal is ManualProposal => proposal !== null);
}

export async function getManualProposal(
  proposalId: string,
): Promise<ManualProposal | null> {
  const [row] = await db
    .select({ evidence: adminLog.evidence })
    .from(adminLog)
    .where(
      and(
        eq(adminLog.id, proposalId),
        eq(adminLog.action, "manual_settle_proposal"),
      ),
    )
    .limit(1);

  return row ? parseProposal(row.evidence) : null;
}

export async function saveProposal(proposal: ManualProposal): Promise<void> {
  await db
    .update(adminLog)
    .set({ evidence: proposal })
    .where(eq(adminLog.id, proposal.proposalId));
}

export async function writeAuditEntry(entry: ManualAuditEntry): Promise<void> {
  await db.insert(adminLog).values({
    id: `audit-${crypto.randomUUID()}`,
    actorWallet: entry.actor.toLowerCase(),
    action: entry.action,
    questionId: entry.questionId,
    evidence: entry,
  });
}

export async function listAuditLog(limit = 50): Promise<AuditLogRow[]> {
  return db
    .select({
      id: adminLog.id,
      actorWallet: adminLog.actorWallet,
      action: adminLog.action,
      questionId: adminLog.questionId,
      evidence: adminLog.evidence,
      at: adminLog.at,
    })
    .from(adminLog)
    .orderBy(desc(adminLog.at))
    .limit(limit);
}

function parseProposal(evidence: unknown): ManualProposal | null {
  if (typeof evidence !== "object" || evidence === null) {
    return null;
  }
  const record = evidence as Record<string, unknown>;
  if (
    typeof record.proposalId !== "string" ||
    typeof record.questionId !== "string" ||
    typeof record.value !== "number" ||
    typeof record.evidenceUrl !== "string" ||
    typeof record.reason !== "string" ||
    typeof record.proposedBy !== "string" ||
    typeof record.proposedAt !== "string" ||
    !Array.isArray(record.approvals)
  ) {
    return null;
  }

  const approvals = record.approvals
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) {
        return null;
      }
      const approval = entry as Record<string, unknown>;
      if (
        typeof approval.wallet !== "string" ||
        typeof approval.approvedAt !== "string"
      ) {
        return null;
      }
      return { wallet: approval.wallet, approvedAt: approval.approvedAt };
    })
    .filter((entry): entry is { wallet: string; approvedAt: string } => entry !== null);

  return {
    proposalId: record.proposalId,
    questionId: record.questionId,
    value: record.value,
    evidenceUrl: record.evidenceUrl,
    reason: record.reason,
    proposedBy: record.proposedBy,
    proposedAt: record.proposedAt,
    approvals,
  };
}
