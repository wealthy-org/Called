import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { forecasters, seals } from "@/db/schema";
import { GENESIS_PREV_HASH } from "./hash";
import { recordHash } from "./seal";

const CHAIN_LOCK_KEY = 4_662_333;

export type AppendResult =
  | { ok: true; sealId: string; commit: string; recordIndex: number; hash: string }
  | { ok: false; reason: "already_sealed" | "unknown_question" };

export interface AppendSealInput {
  questionId: string;
  forecasterId: string;
  ownerWallet: string | null;
  forecasterName: string;
  commit: string;
  payloadCiphertext: string;
  sealedAt: Date;
  model: string | null;
  modelVersion: string | null;
  promptHash: string | null;
  kind: "house" | "baseline" | "agent" | "human";
}

export async function ensureForecaster(
  input: Pick<
    AppendSealInput,
    "forecasterId" | "forecasterName" | "ownerWallet" | "kind" | "model" | "modelVersion" | "promptHash"
  >,
): Promise<void> {
  await db
    .insert(forecasters)
    .values({
      id: input.forecasterId,
      kind: input.kind,
      name: input.forecasterName,
      ownerWallet: input.ownerWallet,
      model: input.model,
      modelVersion: input.modelVersion,
      promptHash: input.promptHash,
    })
    .onConflictDoNothing();
}

export async function appendSeal(input: AppendSealInput): Promise<AppendResult> {
  const [existing] = await db
    .select({ id: seals.id })
    .from(seals)
    .where(
      and(eq(seals.questionId, input.questionId), eq(seals.forecasterId, input.forecasterId)),
    )
    .limit(1);

  if (existing !== undefined) {
    return { ok: false, reason: "already_sealed" };
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${CHAIN_LOCK_KEY})`);

    const [head] = await tx
      .select({ recordIndex: seals.recordIndex, hash: seals.hash })
      .from(seals)
      .orderBy(desc(seals.recordIndex))
      .limit(1);

    const recordIndex = (head?.recordIndex ?? -1) + 1;
    const prevHash = head?.hash ?? GENESIS_PREV_HASH;
    const hash = await recordHash(recordIndex, input.commit, input.sealedAt, prevHash);

    const [inserted] = await tx
      .insert(seals)
      .values({
        id: `seal-${recordIndex}-${input.commit.slice(0, 12)}`,
        questionId: input.questionId,
        forecasterId: input.forecasterId,
        commit: input.commit,
        payloadCiphertext: input.payloadCiphertext,
        sealedAt: input.sealedAt,
        recordIndex,
        prevHash,
        hash,
      })
      .returning({
        id: seals.id,
        commit: seals.commit,
        recordIndex: seals.recordIndex,
        hash: seals.hash,
      });

    if (inserted === undefined) {
      throw new Error("seal insert returned no row");
    }

    return { ok: true, sealId: inserted.id, commit: inserted.commit, recordIndex: inserted.recordIndex, hash: inserted.hash } as const;
  });
}
