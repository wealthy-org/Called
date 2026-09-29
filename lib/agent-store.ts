import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentRuns, forecasters, seals } from "@/db/schema";

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

export interface UpdateAgentInput {
  name?: string;
  model?: string;
  providerEndpoint?: string;
  promptHash?: string | null;
}

export async function updateAgent(
  forecasterId: string,
  ownerWallet: string,
  updates: UpdateAgentInput,
): Promise<AgentRecord | null> {
  const existing = await getOwnedAgent(forecasterId, ownerWallet);
  if (!existing) {
    return null;
  }

  const patch: Record<string, string | null> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.model !== undefined) patch.model = updates.model;
  if (updates.providerEndpoint !== undefined)
    patch.providerEndpoint = updates.providerEndpoint;
  if (updates.promptHash !== undefined) patch.promptHash = updates.promptHash;

  if (Object.keys(patch).length > 0) {
    await db
      .update(forecasters)
      .set(patch)
      .where(eq(forecasters.id, forecasterId));
  }

  return getOwnedAgent(forecasterId, ownerWallet);
}

export async function countAgentSeals(forecasterId: string): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(seals)
    .where(eq(seals.forecasterId, forecasterId));
  return rows[0]?.value ?? 0;
}

export async function sealCountsByOwner(
  ownerWallet: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select({ forecasterId: seals.forecasterId, value: count() })
    .from(seals)
    .innerJoin(forecasters, eq(seals.forecasterId, forecasters.id))
    .where(eq(forecasters.ownerWallet, ownerWallet))
    .groupBy(seals.forecasterId);
  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.forecasterId] = row.value;
  }
  return map;
}

export type DeleteAgentResult =
  | { ok: true }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "has_seals"; sealCount: number }
  | { ok: false; kind: "has_runs" };

export async function deleteAgent(
  forecasterId: string,
  ownerWallet: string,
): Promise<DeleteAgentResult> {
  const existing = await getOwnedAgent(forecasterId, ownerWallet);
  if (!existing) {
    return { ok: false, kind: "not_found" };
  }

  const sealCount = await countAgentSeals(forecasterId);
  if (sealCount > 0) {
    return { ok: false, kind: "has_seals", sealCount };
  }

  const runRows = await db
    .select({ id: agentRuns.id })
    .from(agentRuns)
    .where(eq(agentRuns.forecasterId, forecasterId))
    .limit(1);
  if (runRows.length > 0) {
    return { ok: false, kind: "has_runs" };
  }

  await db.delete(forecasters).where(eq(forecasters.id, forecasterId));
  return { ok: true };
}
