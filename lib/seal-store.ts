import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { forecasters, questions, receipts, sealReveals, seals } from "@/db/schema";
import { CLOSE_REQUIRED_STATUS, isCloseDue } from "./close";
import { GENESIS_PREV_HASH } from "./hash";
import { signReceipt, type ReceiptFields } from "./receipt";
import { recordHash } from "./seal";

const CHAIN_LOCK_KEY = 4_662_333;

export type AppendResult =
  | {
      ok: true;
      sealId: string;
      commit: string;
      recordIndex: number;
      hash: string;
      receiptId: string;
    }
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
  receiptSigningKey: string;
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

  const result = await db.transaction(async (tx) => {
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

    const receiptId = `rcpt-${inserted.id}`;
    const receiptFields: ReceiptFields = {
      receiptId,
      sealId: inserted.id,
      recordIndex: inserted.recordIndex,
      commit: inserted.commit,
      recordHash: inserted.hash,
      sealedAt: input.sealedAt,
      questionId: input.questionId,
      forecasterId: input.forecasterId,
    };
    const signature = await signReceipt(input.receiptSigningKey, receiptFields);

    await tx.insert(receipts).values({ id: receiptId, sealId: inserted.id, signature });

    return { ok: true, sealId: inserted.id, commit: inserted.commit, recordIndex: inserted.recordIndex, hash: inserted.hash, receiptId } as const;
  });

  return result;
}

export type AppendRevealResult =
  | { ok: true; revealId: string; revealedAt: Date }
  | { ok: false; reason: "already_revealed" | "unknown_seal" };

export async function appendReveal(input: {
  sealId: string;
  payloadJson: string;
  salt: string;
}): Promise<AppendRevealResult> {
  const [seal] = await db
    .select({ id: seals.id })
    .from(seals)
    .where(eq(seals.id, input.sealId))
    .limit(1);

  if (seal === undefined) {
    return { ok: false, reason: "unknown_seal" };
  }

  const [existing] = await db
    .select({ id: sealReveals.id })
    .from(sealReveals)
    .where(eq(sealReveals.sealId, input.sealId))
    .limit(1);

  if (existing !== undefined) {
    return { ok: false, reason: "already_revealed" };
  }

  const [inserted] = await db
    .insert(sealReveals)
    .values({
      id: `reveal-${input.sealId}`,
      sealId: input.sealId,
      payloadJson: input.payloadJson,
      salt: input.salt,
    })
    .returning({ id: sealReveals.id, revealedAt: sealReveals.revealedAt });

  if (inserted === undefined) {
    throw new Error("reveal insert returned no row");
  }

  return { ok: true, revealId: inserted.id, revealedAt: inserted.revealedAt };
}

export type CloseResult =
  | { ok: true; questionId: string; status: "closed" | "settled" | "void"; revealed: number }
  | { ok: false; reason: "unknown_question" | "not_open" | "not_due" };

/**
 * Moves a question out of `open`. Never touches the chain: sealing and revealing
 * rows are read-only here, so the ledger stays append-only across a close.
 */
export async function closeQuestion(input: {
  questionId: string;
  now: Date;
}): Promise<CloseResult> {
  const [question] = await db
    .select({
      id: questions.id,
      status: questions.status,
      closesAt: questions.closesAt,
    })
    .from(questions)
    .where(eq(questions.id, input.questionId))
    .limit(1);

  if (question === undefined) {
    return { ok: false, reason: "unknown_question" };
  }

  if (question.status !== "open") {
    return { ok: false, reason: "not_open" };
  }

  if (!isCloseDue(question.closesAt, input.now)) {
    return { ok: false, reason: "not_due" };
  }

  const revealed = await db
    .select({ id: sealReveals.id })
    .from(sealReveals)
    .innerJoin(seals, eq(seals.id, sealReveals.sealId))
    .where(eq(seals.questionId, input.questionId));

  await db
    .update(questions)
    .set({ status: CLOSE_REQUIRED_STATUS })
    .where(eq(questions.id, input.questionId));

  return {
    ok: true,
    questionId: question.id,
    status: CLOSE_REQUIRED_STATUS,
    revealed: revealed.length,
  };
}
