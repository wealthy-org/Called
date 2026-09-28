import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { anchors, questions } from "@/db/schema";
import { encryptPayload } from "@/lib/crypto-box";
import { serverEnv, type EnvSource } from "@/lib/env";
import { commitHash, stablePayloadJson, validateProbability } from "@/lib/seal";
import { appendSeal, ensureForecaster } from "@/lib/seal-store";
import { readSession } from "@/lib/session";
import { anchorStatusFor } from "@/lib/anchor-status";

export const MAX_RATIONALE_LENGTH = 2000;

interface SealBody {
  questionId?: unknown;
  p?: unknown;
  rationale?: unknown;
  salt?: unknown;
}

export async function POST(request: Request) {
  const env = serverEnv(process.env as EnvSource);
  const session = await readSession();

  if (session === null) {
    return NextResponse.json({ error: "sign in to seal" }, { status: 401 });
  }

  let body: SealBody;
  try {
    body = (await request.json()) as SealBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body.questionId !== "string") {
    return NextResponse.json({ error: "questionId is required" }, { status: 400 });
  }

  if (typeof body.p !== "number") {
    return NextResponse.json(
      { error: "p must be a number between 0 and 1" },
      { status: 400 },
    );
  }

  const p = body.p;
  const probabilityError = validateProbability(p);
  if (probabilityError !== null) {
    return NextResponse.json({ error: probabilityError }, { status: 400 });
  }

  const rationale =
    typeof body.rationale === "string"
      ? body.rationale.trim().slice(0, MAX_RATIONALE_LENGTH)
      : "";

  const [question] = await db
    .select({
      id: questions.id,
      status: questions.status,
      closesAt: questions.closesAt,
    })
    .from(questions)
    .where(eq(questions.id, body.questionId))
    .limit(1);

  if (question === undefined) {
    return NextResponse.json({ error: "question not found" }, { status: 404 });
  }

  if (question.status !== "open") {
    return NextResponse.json(
      { error: `question is ${question.status}, not open` },
      { status: 409 },
    );
  }

  if (question.closesAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "sealing has closed" }, { status: 409 });
  }

  if (typeof body.salt !== "string" || !/^[0-9a-f]{32}$/.test(body.salt)) {
    return NextResponse.json(
      { error: "salt must be 32 lowercase hex characters" },
      { status: 400 },
    );
  }

  const salt = body.salt;
  const forecasterId = `human:${session.address.toLowerCase()}`;
  const payloadJson = stablePayloadJson({ p, handle: session.handle, rationale });
  const commit = await commitHash(payloadJson, salt);
  const payloadCiphertext = await encryptPayload(payloadJson, env.PAYLOAD_ENCRYPTION_KEY);

  await ensureForecaster({
    forecasterId,
    forecasterName: session.handle,
    ownerWallet: session.address,
    kind: "human",
    model: null,
    modelVersion: null,
    promptHash: null,
  });

  const result = await appendSeal({
    questionId: question.id,
    forecasterId,
    ownerWallet: session.address,
    forecasterName: session.handle,
    kind: "human",
    model: null,
    modelVersion: null,
    promptHash: null,
    commit,
    salt,
    payloadCiphertext,
    sealedAt: new Date(),
    receiptSigningKey: env.RECEIPT_SIGNING_KEY,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "you already sealed a prediction for this question" },
      { status: 409 },
    );
  }

  const sealedAt = new Date().toISOString();

  const anchorRows = await db
    .select({
      headHash: anchors.headHash,
      recordCount: anchors.recordCount,
      txHash: anchors.txHash,
      blockNumber: anchors.blockNumber,
      blockTime: anchors.blockTime,
    })
    .from(anchors)
    .where(eq(anchors.confirmed, true))
    .orderBy(desc(anchors.recordCount));

  const anchorStatus = anchorStatusFor(result.recordIndex, anchorRows);

  return NextResponse.json(
    {
      sealId: result.sealId,
      commit: result.commit,
      salt,
      recordIndex: result.recordIndex,
      hash: result.hash,
      receiptId: result.receiptId,
      sealedAt,
      anchorStatus,
    },
    { status: 201 },
  );
}
