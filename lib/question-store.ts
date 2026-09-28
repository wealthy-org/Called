import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { questions, sealReveals, seals } from "@/db/schema";

export type QuestionListItem = {
  id: string;
  text: string;
  source: string;
  test: string;
  status: "open" | "closed" | "settled" | "void";
  opensAt: string;
  closesAt: string;
  resolvesAt: string;
  outcome: boolean | null;
  sealCount: number;
  revealCount: number;
};

export type QuestionDetail = QuestionListItem & {
  readingValue: string | null;
  readingBlock: number | null;
};

export async function listQuestions(): Promise<QuestionListItem[]> {
  const rows = await db
    .select({
      id: questions.id,
      text: questions.text,
      source: questions.source,
      test: questions.test,
      status: questions.status,
      opensAt: questions.opensAt,
      closesAt: questions.closesAt,
      resolvesAt: questions.resolvesAt,
      outcome: questions.outcome,
    })
    .from(questions)
    .orderBy(desc(questions.createdAt));

  if (rows.length === 0) {
    return [];
  }

  const countRows = await db
    .select({
      questionId: seals.questionId,
      sealId: seals.id,
      revealId: sealReveals.id,
    })
    .from(seals)
    .leftJoin(sealReveals, eq(sealReveals.sealId, seals.id))
    .where(inArray(seals.questionId, rows.map((row) => row.id)));

  const sealCount = new Map<string, number>();
  const revealCount = new Map<string, number>();
  for (const row of countRows) {
    sealCount.set(row.questionId, (sealCount.get(row.questionId) ?? 0) + 1);
    if (row.revealId) {
      revealCount.set(row.questionId, (revealCount.get(row.questionId) ?? 0) + 1);
    }
  }

  return rows.map((row) => ({
    ...row,
    opensAt: row.opensAt.toISOString(),
    closesAt: row.closesAt.toISOString(),
    resolvesAt: row.resolvesAt.toISOString(),
    sealCount: sealCount.get(row.id) ?? 0,
    revealCount: revealCount.get(row.id) ?? 0,
  }));
}

export async function getQuestion(
  id: string,
): Promise<QuestionDetail | null> {
  const row = await db.query.questions.findFirst({
    where: eq(questions.id, id),
  });

  if (!row) {
    return null;
  }

  const countRows = await db
    .select({ sealId: seals.id, revealId: sealReveals.id })
    .from(seals)
    .leftJoin(sealReveals, eq(sealReveals.sealId, seals.id))
    .where(eq(seals.questionId, id));

  return {
    id: row.id,
    text: row.text,
    source: row.source,
    test: row.test,
    status: row.status,
    opensAt: row.opensAt.toISOString(),
    closesAt: row.closesAt.toISOString(),
    resolvesAt: row.resolvesAt.toISOString(),
    outcome: row.outcome,
    readingValue: row.readingValue,
    readingBlock: row.readingBlock,
    sealCount: countRows.length,
    revealCount: countRows.filter((entry) => entry.revealId !== null).length,
  };
}

export async function createQuestion(input: {
  id: string;
  text: string;
  source: string;
  test: string;
  opensAt: Date;
  closesAt: Date;
  resolvesAt: Date;
  createdBy: string;
}): Promise<void> {
  await db.insert(questions).values({
    id: input.id,
    text: input.text,
    source: input.source,
    test: input.test,
    opensAt: input.opensAt,
    closesAt: input.closesAt,
    resolvesAt: input.resolvesAt,
    createdBy: input.createdBy,
  });
}

export async function questionsByStatus(
  status: "open" | "closed" | "settled" | "void",
): Promise<QuestionDetail[]> {
  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.status, status))
    .orderBy(asc(questions.closesAt));

  return Promise.all(
    rows.map(async (row) => {
      const detail = await getQuestion(row.id);
      if (!detail) {
        throw new Error(`question vanished mid-read: ${row.id}`);
      }
      return detail;
    }),
  );
}
