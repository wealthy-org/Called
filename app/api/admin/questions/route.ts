import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { MAX_OPEN_QUESTIONS, countOpenQuestions } from "@/lib/admin-store";
import { validateAsk } from "@/lib/ask-gate";
import { questionId } from "@/lib/question-id";
import { createQuestion, questionsByStatus } from "@/lib/question-store";

interface CreateBody {
  text?: unknown;
  source?: unknown;
  test?: unknown;
  closesAt?: unknown;
  resolvesAt?: unknown;
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const [open, closed] = await Promise.all([
    questionsByStatus("open"),
    questionsByStatus("closed"),
  ]);

  return NextResponse.json(
    { open, closed, openCount: open.length, maxOpen: MAX_OPEN_QUESTIONS },
    { headers: { "cache-control": "no-store" } },
  );
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body.text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (typeof body.source !== "string") {
    return NextResponse.json({ error: "source is required" }, { status: 400 });
  }
  if (typeof body.test !== "string") {
    return NextResponse.json({ error: "test is required" }, { status: 400 });
  }

  const closesAt = parseDate(body.closesAt);
  const resolvesAt = parseDate(body.resolvesAt);
  if (closesAt === null) {
    return NextResponse.json(
      { error: "closesAt must be a valid date" },
      { status: 400 },
    );
  }
  if (resolvesAt === null) {
    return NextResponse.json(
      { error: "resolvesAt must be a valid date" },
      { status: 400 },
    );
  }

  const text = body.text.trim();
  const ask = validateAsk({
    text,
    source: body.source.trim(),
    test: body.test.trim(),
    closesAt,
    resolvesAt,
  });
  if (!ask.ok) {
    return NextResponse.json(
      { error: ask.message, reason: ask.reason },
      { status: 400 },
    );
  }

  const open = await countOpenQuestions();
  if (open >= MAX_OPEN_QUESTIONS) {
    return NextResponse.json(
      {
        error: `at most ${MAX_OPEN_QUESTIONS} questions may be open at once`,
        reason: "too_many_open",
      },
      { status: 409 },
    );
  }

  const id = await questionId({
    text,
    date: resolvesAt.toISOString(),
    source: body.source.trim(),
    test: body.test.trim(),
  });

  await createQuestion({
    id,
    text,
    source: body.source.trim(),
    test: body.test.trim(),
    opensAt: new Date(),
    closesAt,
    resolvesAt,
    createdBy: gate.session.address,
  });

  return NextResponse.json({ questionId: id }, { status: 201 });
}
