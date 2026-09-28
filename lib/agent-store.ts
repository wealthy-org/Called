import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentRuns, forecasters } from "@/db/schema";

export interface AgentRecord {
  id: string;
  ownerWallet: string | null;
  name: string;
  model: string | null;
  providerEndpoint: string | null;
  promptHash: string | null;
  createdAt: Date;
}

export interface RegisterAgentInput {
  ownerWallet: string;
  name: string;
  model: string;
  providerEndpoint: string;
  promptHash: string | null;
}

function newAgentId(): string {
  return `agent-${crypto.randomUUID()}`;
}

export async function registerAgent(
  input: RegisterAgentInput,
): Promise<AgentRecord> {
  const id = newAgentId();
  await db
    .insert(forecasters)
    .values({
      id,
      kind: "agent",
      ownerWallet: input.ownerWallet,
      name: input.name,
      model: input.model,
      providerEndpoint: input.providerEndpoint,
      promptHash: input.promptHash,
    })
    .onConflictDoNothing();

  const created = await getOwnedAgent(id, input.ownerWallet);
  if (!created) {
    throw new Error(`failed to register agent ${id}`);
  }
  return created;
}

export async function listAgents(ownerWallet: string): Promise<AgentRecord[]> {
  return db
    .select({
      id: forecasters.id,
      ownerWallet: forecasters.ownerWallet,
      name: forecasters.name,
      model: forecasters.model,
      providerEndpoint: forecasters.providerEndpoint,
      promptHash: forecasters.promptHash,
      createdAt: forecasters.createdAt,
    })
    .from(forecasters)
    .where(
      and(eq(forecasters.ownerWallet, ownerWallet), eq(forecasters.kind, "agent")),
    )
    .orderBy(desc(forecasters.createdAt));
}

export async function getOwnedAgent(
  forecasterId: string,
  ownerWallet: string,
): Promise<AgentRecord | null> {
  const rows = await db
    .select({
      id: forecasters.id,
      ownerWallet: forecasters.ownerWallet,
      name: forecasters.name,
      model: forecasters.model,
      providerEndpoint: forecasters.providerEndpoint,
      promptHash: forecasters.promptHash,
      createdAt: forecasters.createdAt,
    })
    .from(forecasters)
    .where(
      and(
        eq(forecasters.id, forecasterId),
        eq(forecasters.kind, "agent"),
        eq(forecasters.ownerWallet, ownerWallet),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function hasAgentRun(
  forecasterId: string,
  questionId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: agentRuns.id })
    .from(agentRuns)
    .where(
      and(
        eq(agentRuns.forecasterId, forecasterId),
        eq(agentRuns.questionId, questionId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function recordAgentRun(input: {
  forecasterId: string;
  questionId: string;
}): Promise<void> {
  await db
    .insert(agentRuns)
    .values({
      id: `run-${crypto.randomUUID()}`,
      forecasterId: input.forecasterId,
      questionId: input.questionId,
    })
    .onConflictDoNothing();
}
