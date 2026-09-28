import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { getOwnedAgent, hasAgentRun, recordAgentRun } from "@/lib/agent-store";
import { AGENT_SELF_RUN_LABEL, runByokAgent } from "@/lib/byok";
import { encryptPayload, newSalt } from "@/lib/crypto-box";
import { serverEnv, type EnvSource } from "@/lib/env";
import { commitHash, stablePayloadJson } from "@/lib/seal";
import { appendSeal, ensureForecaster } from "@/lib/seal-store";
import { readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "sign in to run an agent" }, { status: 401 });
  }

  const { id } = await context.params;
  const agent = await getOwnedAgent(id, session.address);
  if (!agent) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { apiKey, questionId } = body as { apiKey?: unknown; questionId?: unknown };
  if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return NextResponse.json({ error: "an API key is required" }, { status: 400 });
  }
  if (typeof questionId !== "string" || questionId.trim().length === 0) {
    return NextResponse.json({ error: "questionId is required" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: questions.id,
      text: questions.text,
      status: questions.status,
      closesAt: questions.closesAt,
    })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);
  const question = rows[0];
  if (!question) {
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

  if (await hasAgentRun(agent.id, question.id)) {
    return NextResponse.json(
      { error: "this agent already ran on this question" },
      { status: 409 },
    );
  }

  const env = serverEnv(process.env as EnvSource);
  const endpoint = agent.providerEndpoint;
  if (!endpoint) {
    return NextResponse.json(
      { error: "agent has no provider endpoint" },
      { status: 409 },
    );
  }

  const outcome = await runByokAgent(
    { fetch },
    {
      providerEndpoint: endpoint,
      model: agent.model ?? "",
      questionText: question.text,
      apiKey,
    },
  );

  if (!outcome.ok) {
    await recordAgentRun({ forecasterId: agent.id, questionId: question.id });
    if (outcome.kind === "unavailable") {
      return NextResponse.json(
        { error: "the model provider was unavailable", reason: outcome.message },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "the model answer could not be parsed", reason: outcome.reason },
      { status: 422 },
    );
  }

  const salt = newSalt();
  const payloadJson = stablePayloadJson({
    p: outcome.forecast.p,
    handle: agent.name,
    rationale: outcome.forecast.why,
  });
  const commit = await commitHash(payloadJson, salt);
  const payloadCiphertext = await encryptPayload(
    payloadJson,
    env.PAYLOAD_ENCRYPTION_KEY,
  );

  await ensureForecaster({
    forecasterId: agent.id,
    forecasterName: agent.name,
    ownerWallet: agent.ownerWallet,
    kind: "agent",
    model: agent.model,
    modelVersion: null,
    promptHash: agent.promptHash,
  });

  const result = await appendSeal({
    questionId: question.id,
    forecasterId: agent.id,
    ownerWallet: agent.ownerWallet,
    forecasterName: agent.name,
    commit,
    salt,
    payloadCiphertext,
    sealedAt: new Date(),
    model: agent.model,
    modelVersion: null,
    promptHash: agent.promptHash,
    kind: "agent",
    receiptSigningKey: env.RECEIPT_SIGNING_KEY,
  });

  await recordAgentRun({ forecasterId: agent.id, questionId: question.id });

  if (!result.ok) {
    return NextResponse.json(
      { error: "this agent already sealed a prediction for this question" },
      { status: 409 },
    );
  }

  return NextResponse.json(
    {
      agentId: agent.id,
      label: AGENT_SELF_RUN_LABEL,
      p: outcome.forecast.p,
      why: outcome.forecast.why,
      sealId: result.sealId,
      commit: result.commit,
      salt,
      recordIndex: result.recordIndex,
      hash: result.hash,
      receiptId: result.receiptId,
    },
    { status: 201 },
  );
}
