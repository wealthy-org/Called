import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listManualProposals, proposeSettlement } from "@/lib/admin-store";
import { validateManualInput } from "@/lib/resolver/manual";

interface ProposeBody {
  questionId?: unknown;
  value?: unknown;
  evidenceUrl?: unknown;
  reason?: unknown;
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const proposals = await listManualProposals();
  return NextResponse.json(
    { proposals, count: proposals.length },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let body: ProposeBody;
  try {
    body = (await request.json()) as ProposeBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body.questionId !== "string" || body.questionId.trim() === "") {
    return NextResponse.json(
      { error: "questionId is required" },
      { status: 400 },
    );
  }

  const invalid = validateManualInput({
    questionId: body.questionId,
    value: body.value,
    evidenceUrl: body.evidenceUrl,
    reason: body.reason,
  });
  if (invalid !== null) {
    return NextResponse.json(
      { error: invalid.message, reason: invalid.reason },
      { status: 400 },
    );
  }

  const value = body.value as number;
  const evidenceUrl = (body.evidenceUrl as string).trim();
  const reason = (body.reason as string).trim();

  const proposal = await proposeSettlement({
    questionId: body.questionId,
    value,
    evidenceUrl,
    reason,
    proposedBy: gate.session.address,
    proposedAt: new Date(),
  });

  return NextResponse.json({ proposal }, { status: 201 });
}
