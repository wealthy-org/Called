import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { getManualProposal, saveProposal, writeAuditEntry } from "@/lib/admin-store";
import { approve, MIN_APPROVALS } from "@/lib/resolver/manual";
import { applySettleResult, type ApplyResult } from "@/lib/settle-store";
import { evaluateTest, parseTest } from "@/lib/test-grammar";
import type { SettleResult } from "@/lib/settle";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await context.params;
  const proposal = await getManualProposal(id);
  if (proposal === null) {
    return NextResponse.json({ error: "proposal not found" }, { status: 404 });
  }

  const decision = approve(proposal, gate.session.address, new Date());

  if (!decision.ok) {
    if (decision.reason === "not_enough_approvals") {
      await saveProposal(decision.proposal ?? proposal);
      const updated = decision.proposal ?? proposal;
      return NextResponse.json({
        approved: false,
        approvals: updated.approvals.length,
        required: MIN_APPROVALS,
        message: decision.message,
      });
    }
    return NextResponse.json(
      { error: decision.message, reason: decision.reason },
      { status: 400 },
    );
  }

  const [question] = await db
    .select({
      id: questions.id,
      test: questions.test,
      status: questions.status,
    })
    .from(questions)
    .where(eq(questions.id, proposal.questionId))
    .limit(1);

  if (question === undefined) {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }

  if (question.status !== "closed") {
    return NextResponse.json(
      { error: `question is ${question.status}, not closed` },
      { status: 409 },
    );
  }

  let passed: boolean;
  try {
    passed = evaluateTest(parseTest(question.test), proposal.value);
  } catch {
    return NextResponse.json(
      { error: `test could not be parsed: ${question.test}` },
      { status: 409 },
    );
  }

  const result: SettleResult = {
    ok: true,
    status: "settled",
    outcome: passed ? "YES" : "NO",
    readingValue: proposal.value,
    readingBlock: null,
    observedAt: proposal.proposedAt,
    reason: null,
  };

  const applied: ApplyResult = await applySettleResult(question.id, result);

  await saveProposal(decision.proposal);
  await writeAuditEntry(decision.auditEntry);

  return NextResponse.json({
    approved: true,
    questionId: applied.questionId,
    outcome: result.outcome,
  });
}
