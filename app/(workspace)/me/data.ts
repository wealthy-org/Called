import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { questions, receipts, seals } from "@/db/schema";
import { listAgents, type AgentRecord } from "@/lib/agent-store";
import { readSession, type Session } from "@/lib/session";

export interface AccountReceipt {
  receiptId: string;
  sealId: string;
  questionId: string;
  questionText: string;
  recordIndex: number;
  sealedAt: string;
}

export interface AccountData {
  session: Session;
  receipts: AccountReceipt[];
  agents: AgentRecord[];
}

export async function loadAccount(): Promise<AccountData | null> {
  const session = await readSession();
  if (session === null) {
    return null;
  }

  const forecasterId = `human:${session.address.toLowerCase()}`;

  const [rows, agents] = await Promise.all([
    db
      .select({
        receiptId: receipts.id,
        sealId: seals.id,
        questionId: seals.questionId,
        questionText: questions.text,
        recordIndex: seals.recordIndex,
        sealedAt: seals.sealedAt,
      })
      .from(receipts)
      .innerJoin(seals, eq(receipts.sealId, seals.id))
      .innerJoin(questions, eq(seals.questionId, questions.id))
      .where(eq(seals.forecasterId, forecasterId))
      .orderBy(desc(seals.recordIndex)),
    listAgents(session.address),
  ]);

  return {
    session,
    receipts: rows.map((row) => ({
      receiptId: row.receiptId,
      sealId: row.sealId,
      questionId: row.questionId,
      questionText: row.questionText,
      recordIndex: row.recordIndex,
      sealedAt: row.sealedAt.toISOString(),
    })),
    agents,
  };
}
