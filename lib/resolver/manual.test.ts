import { describe, expect, it } from "vitest";
import {
  approve,
  hasApproved,
  hasEnoughApprovals,
  MIN_APPROVALS,
  validateManualInput,
  type ManualProposal,
} from "./manual";

const proposal: ManualProposal = {
  proposalId: "prop-1",
  questionId: "q-2026-10-03-a1b2c3",
  value: 212.5,
  evidenceUrl: "https://example.com/evidence",
  reason: "the feed printed 212.5 at the resolution block",
  proposedBy: "0xaaa",
  proposedAt: "2026-10-03T22:00:00Z",
  approvals: [],
};

const at = new Date("2026-10-03T22:30:00Z");

describe("validateManualInput", () => {
  it("accepts a complete proposal", () => {
    expect(
      validateManualInput({
        questionId: proposal.questionId,
        value: 212.5,
        evidenceUrl: proposal.evidenceUrl,
        reason: proposal.reason,
      }),
    ).toBeNull();
  });

  it.each([
    ["a missing number", { value: "212.5" }, "invalid_value"],
    ["NaN", { value: Number.NaN }, "invalid_value"],
    ["Infinity", { value: Number.POSITIVE_INFINITY }, "invalid_value"],
    ["a missing evidence link", { evidenceUrl: "  " }, "missing_evidence"],
    ["a missing reason", { reason: "" }, "missing_evidence"],
    ["an overlong reason", { reason: "x".repeat(2001) }, "reason_too_long"],
  ])("rejects %s", (_label, patch, reason) => {
    const result = validateManualInput({
      questionId: proposal.questionId,
      value: 212.5,
      evidenceUrl: proposal.evidenceUrl,
      reason: proposal.reason,
      ...patch,
    });
    expect(result).toMatchObject({ ok: false, reason });
  });
});

describe("approve", () => {
  it("rejects a single approval", () => {
    const result = approve(proposal, "0xbbb", at);
    expect(result).toMatchObject({ ok: false, reason: "not_enough_approvals" });
  });

  it("accepts the second distinct approval and writes an audit entry", () => {
    const first = approve(proposal, "0xbbb", at);
    expect(first.ok).toBe(false);
    if (!first.ok) {
      expect(first.reason).toBe("not_enough_approvals");
    }
    const partial: ManualProposal = {
      ...proposal,
      approvals: [{ wallet: "0xbbb", approvedAt: at.toISOString() }],
    };

    const second = approve(partial, "0xccc", at);
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.proposal.approvals).toHaveLength(2);
      expect(second.auditEntry).toEqual({
        questionId: proposal.questionId,
        actor: "0xaaa",
        action: "manual_settle",
        evidence: {
          proposalId: "prop-1",
          value: 212.5,
          evidenceUrl: proposal.evidenceUrl,
          approvals: ["0xbbb", "0xccc"],
        },
      });
    }
  });

  it("rejects a duplicate approval from the same wallet", () => {
    const partial: ManualProposal = {
      ...proposal,
      approvals: [{ wallet: "0xBBB", approvedAt: at.toISOString() }],
    };
    const result = approve(partial, "0xbbb", at);
    expect(result).toMatchObject({ ok: false, reason: "duplicate_approval" });
  });

  it("does not count the same wallet twice under different casing", () => {
    const partial: ManualProposal = {
      ...proposal,
      approvals: [{ wallet: "0xbbb", approvedAt: at.toISOString() }],
    };
    expect(hasEnoughApprovals(partial)).toBe(false);
    expect(approve(partial, "0xBBB", at)).toMatchObject({
      ok: false,
      reason: "duplicate_approval",
    });
  });

  it("rejects the proposer approving their own settlement", () => {
    const result = approve(proposal, "0xAAA", at);
    expect(result).toMatchObject({ ok: false, reason: "proposer_cannot_approve" });
  });

  it("reports approval state", () => {
    expect(hasApproved(proposal, "0xbbb")).toBe(false);
    expect(hasEnoughApprovals(proposal)).toBe(false);
    expect(MIN_APPROVALS).toBe(2);
  });
});
