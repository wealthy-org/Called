import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { forecasters, questions, seals } from "@/db/schema";
import { checkReveal, isRevealOpen } from "@/lib/reveal";
import { appendReveal } from "@/lib/seal-store";
import { readSession } from "@/lib/session";

interface RevealBody {
  sealId?: unknown;
  payloadJson?: unknown;
  salt?: unknown;
}

export async function POST(request: Request) {
  const session = await readSession();

  if (session === null) {
    return NextResponse.json({ error: "sign in to reveal" }, { status: 401 });
  }

  let body: RevealBody;
  try {
    body = (await request.json()) as RevealBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.sealId !== "string" ||
    typeof body.payloadJson !== "string" ||
    typeof body.salt !== "string"
  ) {
    return NextResponse.json(
      { error: "sealId, payloadJson and salt are required" },
      { status: 400 },
    );
  }

  const [row] = await db
    .select({
      sealId: seals.id,
      commit: seals.commit,
      forecasterId: seals.forecasterId,
      ownerWallet: forecasters.ownerWallet,
      kind: forecasters.kind,
      closesAt: questions.closesAt,
      status: questions.status,
    })
    .from(seals)
    .innerJoin(
      forecasters,
      eq(forecasters.id, seals.forecasterId),
    )
    .innerJoin(questions, eq(questions.id, seals.questionId))
    .where(eq(seals.id, body.sealId))
    .limit(1);

  if (row === undefined) {
    return NextResponse.json({ error: "seal not found" }, { status: 404 });
  }

  if (row.kind === "human" && row.ownerWallet?.toLowerCase() !== session.address.toLowerCase()) {
    return NextResponse.json(
      { error: "this seal belongs to another forecaster" },
      { status: 403 },
    );
  }

  if (!isRevealOpen(row.closesAt, new Date())) {
    return NextResponse.json(
      { error: "reveal opens when the question closes" },
      { status: 409 },
    );
  }

  const check = await checkReveal({
    commit: row.commit,
    payloadJson: body.payloadJson,
    salt: body.salt,
  });

  if (!check.ok) {
    return NextResponse.json(
      { error: check.message, reason: check.reason },
      { status: 400 },
    );
  }

  const result = await appendReveal({
    sealId: row.sealId,
    payloadJson: body.payloadJson,
    salt: body.salt,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "this seal has already been revealed" },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { revealId: result.revealId, revealedAt: result.revealedAt.toISOString() },
    { status: 201 },
  );
}
