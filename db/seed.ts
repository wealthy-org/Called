import "./load-env";
import { db, sql } from "./index";
import * as schema from "./schema";
import { BASELINE_RULES, runBaseline, type BaselineContext } from "../lib/baselines";
import { encryptPayload, newSalt } from "../lib/crypto-box";
import { GENESIS_PREV_HASH } from "../lib/hash";
import { questionId } from "../lib/question-id";
import { fnv1a32, seededUnitInterval } from "../lib/random";
import { commitHash, recordHash, stablePayloadJson } from "../lib/seal";
import { signReceipt } from "../lib/receipt";
import { evaluateTest, parseTest } from "../lib/test-grammar";
import { verifyChain } from "../lib/verify";
import { HOUSE_MODELS } from "../config/house-models";

// .env is loaded by ./load-env, imported above, before any env read here.

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DB_SEED !== "1") {
  console.error(
    "refusing to seed a production database. Set ALLOW_DB_SEED=1 to override.",
  );
  process.exit(1);
}

const ENCRYPTION_KEY = process.env.PAYLOAD_ENCRYPTION_KEY?.trim();
const SIGNING_KEY = process.env.RECEIPT_SIGNING_KEY?.trim();

if (!ENCRYPTION_KEY || !SIGNING_KEY) {
  console.error(
    "PAYLOAD_ENCRYPTION_KEY and RECEIPT_SIGNING_KEY must be set before seeding.",
  );
  process.exit(1);
}

const TABLES = [
  "admin_log",
  "agent_runs",
  "scores",
  "anchors",
  "receipts",
  "failures",
  "seal_reveals",
  "seals",
  "questions",
  "forecasters",
  "users",
] as const;

const SETTLED_COUNT = 21;
const DEX_POOL = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640";
const DEX_SOURCE = `dex.twap:${DEX_POOL}:4h`;
const RATIONALE = [
  "The move has held for three sessions and the depth is there to absorb a retrace.",
  "Momentum is one-sided but the funding rate says the crowd is already positioned.",
  "Spot volume is thin for this hour, so I am keeping the number near the middle.",
  "The range has compressed and the earlier breakout has not been retested.",
  "I am leaning toward the trend holding, but not by much.",
];

const SUBJECTS = [
  "ETH",
  "BTC",
  "SOL",
  "ARB",
  "OP",
  "MATIC",
  "LINK",
  "UNI",
  "AAVE",
  "DOGE",
  "AVAX",
  "LDO",
  "MKR",
  "CRV",
  "SNX",
  "COMP",
  "SUSHI",
  "BAL",
  "YFI",
  "1INCH",
  "ENS",
];

const DAY_MS = 86_400_000;

const ADMIN_WALLET =
  (process.env.ADMIN_WALLETS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0)[0] ?? "0x4444444444444444444444444444444444444444";

const ALICE = "0x1111111111111111111111111111111111111111";
const BOB = "0x2222222222222222222222222222222222222222";
const CAROL = "0x3333333333333333333333333333333333333333";

const HUMAN_ALICE = `human:${ALICE}`;
const HUMAN_BOB = `human:${BOB}`;
const AGENT_ID = "agent-alice-demo";

type QuestionStatus = "open" | "closed" | "settled" | "void";

interface QuestionSpec {
  id: string;
  text: string;
  source: string;
  test: string;
  opensAt: Date;
  closesAt: Date;
  resolvesAt: Date;
  status: QuestionStatus;
  outcome: boolean | null;
  readingValue: string | null;
  readingBlock: number | null;
}

interface SealPlan {
  questionId: string;
  forecasterId: string;
  handle: string;
  p: number;
  rationale: string;
  sealedAt: Date;
  reveal: boolean;
}

function clamp(value: number, low: number, high: number): number {
  if (!Number.isFinite(value)) {
    return low;
  }
  return Math.min(high, Math.max(low, value));
}

function offsetFor(seed: string, span: number): number {
  return span > 0 ? fnv1a32(seed) % span : 0;
}

async function buildQuestions(now: Date): Promise<QuestionSpec[]> {
  const specs: QuestionSpec[] = [];

  for (let i = 0; i < SETTLED_COUNT; i += 1) {
    const subject = SUBJECTS[i % SUBJECTS.length]!;
    const threshold = 100 + i * 37;
    const outcome = i % 3 !== 0;
    const manual = i === 4;
    const test = `gte ${threshold}`;
    const source = manual ? "manual" : DEX_SOURCE;
    const text = `Will ${subject} be at or above ${threshold} USD when the question resolves?`;
    const closesAt = new Date(now.getTime() - (i + 30) * DAY_MS);
    const resolvesAt = new Date(closesAt.getTime() + DAY_MS);
    const opensAt = new Date(closesAt.getTime() - 7 * DAY_MS);
    const reading = outcome ? threshold + 5 : threshold - 5;
    const id = await questionId({
      text,
      date: resolvesAt.toISOString(),
      source,
      test,
    });

    const expression = parseTest(test);
    if (evaluateTest(expression, reading) !== outcome) {
      throw new Error(`seed test does not match the outcome for question ${i}`);
    }

    specs.push({
      id,
      text,
      source,
      test,
      opensAt,
      closesAt,
      resolvesAt,
      status: "settled",
      outcome,
      readingValue: String(reading),
      readingBlock: 21_000_000 + i * 1000,
    });
  }

  const closedText = "Will the pool depth stay above 25000 USD through the close?";
  const closedId = await questionId({
    text: closedText,
    date: new Date(now.getTime() + 3 * DAY_MS).toISOString(),
    source: DEX_SOURCE,
    test: "gte 25000",
  });
  specs.push({
    id: closedId,
    text: closedText,
    source: DEX_SOURCE,
    test: "gte 25000",
    opensAt: new Date(now.getTime() - 9 * DAY_MS),
    closesAt: new Date(now.getTime() - 2 * DAY_MS),
    resolvesAt: new Date(now.getTime() + 3 * DAY_MS),
    status: "closed",
    outcome: null,
    readingValue: null,
    readingBlock: null,
  });

  const voidText = "Will the index read a number when the source is reachable?";
  const voidId = await questionId({
    text: voidText,
    date: new Date(now.getTime() - 8 * DAY_MS).toISOString(),
    source: DEX_SOURCE,
    test: "lte 120",
  });
  specs.push({
    id: voidId,
    text: voidText,
    source: DEX_SOURCE,
    test: "lte 120",
    opensAt: new Date(now.getTime() - 16 * DAY_MS),
    closesAt: new Date(now.getTime() - 10 * DAY_MS),
    resolvesAt: new Date(now.getTime() - 8 * DAY_MS),
    status: "void",
    outcome: null,
    readingValue: null,
    readingBlock: null,
  });

  const openOne = "Will ETH be at or above 4200 USD when the question resolves?";
  specs.push({
    id: await questionId({
      text: openOne,
      date: new Date(now.getTime() + 4 * DAY_MS).toISOString(),
      source: DEX_SOURCE,
      test: "gte 4200",
    }),
    text: openOne,
    source: DEX_SOURCE,
    test: "gte 4200",
    opensAt: new Date(now.getTime() - DAY_MS),
    closesAt: new Date(now.getTime() + 3 * DAY_MS),
    resolvesAt: new Date(now.getTime() + 4 * DAY_MS),
    status: "open",
    outcome: null,
    readingValue: null,
    readingBlock: null,
  });

  const openTwo = "Will BTC be at or above 95000 USD when the question resolves?";
  specs.push({
    id: await questionId({
      text: openTwo,
      date: new Date(now.getTime() + 8 * DAY_MS).toISOString(),
      source: DEX_SOURCE,
      test: "gte 95000",
    }),
    text: openTwo,
    source: DEX_SOURCE,
    test: "gte 95000",
    opensAt: now,
    closesAt: new Date(now.getTime() + 7 * DAY_MS),
    resolvesAt: new Date(now.getTime() + 8 * DAY_MS),
    status: "open",
    outcome: null,
    readingValue: null,
    readingBlock: null,
  });

  return specs;
}

function houseProbability(
  forecasterId: string,
  question: QuestionSpec,
  jitterScale: number,
): number {
  const outcome = question.outcome ?? false;
  const base = outcome ? 0.72 : 0.28;
  const jitter =
    (seededUnitInterval(`${question.id}:${forecasterId}`) - 0.5) * jitterScale;
  return clamp(base + jitter, 0.03, 0.97);
}

function probabilityFor(
  forecasterId: string,
  question: QuestionSpec,
): { p: number; handle: string } {
  if (forecasterId === HUMAN_ALICE) {
    return {
      p: houseProbability(forecasterId, question, 0.36),
      handle: "alice",
    };
  }
  if (forecasterId === HUMAN_BOB) {
    return {
      p: houseProbability(forecasterId, question, 0.42),
      handle: "bob",
    };
  }
  return { p: houseProbability(forecasterId, question, 0.24), handle: forecasterId };
}

async function main(): Promise<void> {
  const now = new Date();

  console.log("seeding called: truncating tables");
  await sql.unsafe(
    `TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`,
  );

  await db.insert(schema.users).values(
    [
      { walletAddress: ADMIN_WALLET, handle: "admin" },
      { walletAddress: ALICE, handle: "alice" },
      { walletAddress: BOB, handle: "bob" },
      { walletAddress: CAROL, handle: "carol" },
    ].map((row) => ({ ...row, sessionToken: null })),
  );

  const forecasterRows: (typeof schema.forecasters.$inferInsert)[] =
    HOUSE_MODELS.map((tier) => ({
      id: tier.id,
      kind: "house" as const,
      ownerWallet: null,
      name: tier.name,
      model: tier.model,
      modelVersion: "2026-09-01",
      providerEndpoint: null,
      promptHash: null,
      isReserve: tier.isReserve,
      isRanked: tier.isRanked,
    }));

  for (const rule of BASELINE_RULES) {
    forecasterRows.push({
      id: rule.id,
      kind: "baseline" as const,
      ownerWallet: null,
      name: rule.name,
      model: null,
      modelVersion: null,
      providerEndpoint: null,
      promptHash: null,
      isReserve: false,
      isRanked: true,
    });
  }

  forecasterRows.push(
    {
      id: HUMAN_ALICE,
      kind: "human" as const,
      ownerWallet: ALICE,
      name: "alice",
      model: null,
      modelVersion: null,
      providerEndpoint: null,
      promptHash: null,
      isReserve: false,
      isRanked: true,
    },
    {
      id: HUMAN_BOB,
      kind: "human" as const,
      ownerWallet: BOB,
      name: "bob",
      model: null,
      modelVersion: null,
      providerEndpoint: null,
      promptHash: null,
      isReserve: false,
      isRanked: true,
    },
    {
      id: `human:${CAROL}`,
      kind: "human" as const,
      ownerWallet: CAROL,
      name: "carol",
      model: null,
      modelVersion: null,
      providerEndpoint: null,
      promptHash: null,
      isReserve: false,
      isRanked: true,
    },
    {
      id: AGENT_ID,
      kind: "agent" as const,
      ownerWallet: ALICE,
      name: "Alice's agent",
      model: "openai/gpt-4o-mini",
      modelVersion: null,
      providerEndpoint: "https://openrouter.ai/api/v1/chat/completions",
      promptHash: "a".repeat(64),
      isReserve: false,
      isRanked: true,
    },
  );

  await db.insert(schema.forecasters).values(forecasterRows);

  const questions = await buildQuestions(now);
  await db.insert(schema.questions).values(
    questions.map((question) => ({
      id: question.id,
      text: question.text,
      source: question.source,
      test: question.test,
      opensAt: question.opensAt,
      closesAt: question.closesAt,
      resolvesAt: question.resolvesAt,
      status: question.status,
      outcome: question.outcome,
      readingValue: question.readingValue,
      readingBlock: question.readingBlock,
      createdBy: ADMIN_WALLET,
    })),
  );

  const houseIds = HOUSE_MODELS.map((tier) => tier.id);
  const settledForecasters = [...houseIds, ...BASELINE_RULES.map((rule) => rule.id), HUMAN_ALICE, HUMAN_BOB];
  const otherForecasters = [...houseIds, ...BASELINE_RULES.map((rule) => rule.id), HUMAN_ALICE];

  const failurePlans = [
    {
      questionId: questions[3]!.id,
      forecasterId: "house:tiresias",
      rawResponse: "It is likely, roughly in the sixties.",
      reason: "unparseable answer: no JSON object found",
    },
    {
      questionId: questions[7]!.id,
      forecasterId: "house:stray",
      rawResponse: null,
      reason: "provider unavailable: 503",
    },
  ];

  const plans: SealPlan[] = [];

  for (const question of questions) {
    const settled = question.status === "settled";
    const forecasters = settled ? settledForecasters : otherForecasters;
    const reveal = question.closesAt.getTime() <= now.getTime();

    for (const forecasterId of forecasters) {
      if (
        failurePlans.some(
          (failure) =>
            failure.questionId === question.id &&
            failure.forecasterId === forecasterId,
        )
      ) {
        continue;
      }

      const second = offsetFor(`${question.id}:${forecasterId}`, 24);
      const sealDeadline = Math.min(question.closesAt.getTime(), now.getTime());
      const sealWindow = Math.max(sealDeadline - question.opensAt.getTime(), 60_000);
      const sealedAt = new Date(
        question.opensAt.getTime() +
          (offsetFor(`${question.id}:${forecasterId}:t`, 24) + 1) * (sealWindow / 25),
      );

      const baselineRule = BASELINE_RULES.find((rule) => rule.id === forecasterId);
      let p: number;
      let handle: string;

      if (baselineRule) {
        const context: BaselineContext = {
          questionId: question.id,
          text: question.text,
          source: question.source,
          test: question.test,
          opensAt: question.opensAt,
          closesAt: question.closesAt,
          resolvesAt: question.resolvesAt,
          baseRate: 0.62,
          priceHistory: [100, 100, second % 2 === 0 ? 112 : 88],
        };
        p = clamp(runBaseline(baselineRule, context), 0.01, 0.99);
        handle = baselineRule.name;
      } else if (forecasterId === AGENT_ID) {
        p = houseProbability(forecasterId, question, 0.3);
        handle = "Alice's agent";
      } else {
        const resolved = probabilityFor(forecasterId, question);
        p = resolved.p;
        handle = resolved.handle;
      }

      plans.push({
        questionId: question.id,
        forecasterId,
        handle,
        p: Math.round(p * 100) / 100,
        rationale: RATIONALE[second % RATIONALE.length]!,
        sealedAt,
        reveal,
      });
    }

    if (settled) {
      const agentQuestionIndex = questions.indexOf(question);
      if (agentQuestionIndex % 7 === 1) {
        plans.push({
          questionId: question.id,
          forecasterId: AGENT_ID,
          handle: "Alice's agent",
          p: Math.round(houseProbability(AGENT_ID, question, 0.3) * 100) / 100,
          rationale: "The provider answered once for this question.",
          sealedAt: new Date(question.opensAt.getTime() + 90 * 60_000),
          reveal,
        });
      }
    }
  }

  plans.sort((a, b) => a.sealedAt.getTime() - b.sealedAt.getTime());

  console.log(`seeding called: ${plans.length} seals`);

  const sealRows: (typeof schema.seals.$inferInsert)[] = [];
  const revealRows: (typeof schema.sealReveals.$inferInsert)[] = [];
  const receiptRows: (typeof schema.receipts.$inferInsert)[] = [];

  let prev = GENESIS_PREV_HASH;

  for (let index = 0; index < plans.length; index += 1) {
    const plan = plans[index]!;
    const salt = newSalt();
    const payloadJson = stablePayloadJson({
      p: plan.p,
      handle: plan.handle,
      rationale: plan.rationale,
    });
    const commit = await commitHash(payloadJson, salt);
    const hash = await recordHash(index, commit, plan.sealedAt, prev);
    const ciphertext = await encryptPayload(payloadJson, ENCRYPTION_KEY!);
    const sealId = `seal-${index}-${commit.slice(0, 12)}`;

    sealRows.push({
      id: sealId,
      questionId: plan.questionId,
      forecasterId: plan.forecasterId,
      commit,
      salt,
      payloadCiphertext: ciphertext,
      sealedAt: plan.sealedAt,
      recordIndex: index,
      prevHash: prev,
      hash,
    });

    if (plan.reveal) {
      revealRows.push({
        id: `reveal-${sealId}`,
        sealId,
        payloadJson,
        salt,
        revealedAt: new Date(plan.sealedAt.getTime() + 30 * 60_000),
      });
    }

    const receiptId = `rcpt-${sealId}`;
    const signature = await signReceipt(SIGNING_KEY!, {
      receiptId,
      sealId,
      recordIndex: index,
      commit,
      salt,
      recordHash: hash,
      sealedAt: plan.sealedAt,
      questionId: plan.questionId,
      forecasterId: plan.forecasterId,
    });

    receiptRows.push({
      id: receiptId,
      sealId,
      signature,
      createdAt: plan.sealedAt,
    });

    prev = hash;

    if ((index + 1) % 50 === 0) {
      console.log(`  ${index + 1}/${plans.length}`);
    }
  }

  await db.insert(schema.seals).values(sealRows);
  if (revealRows.length > 0) {
    await db.insert(schema.sealReveals).values(revealRows);
  }
  await db.insert(schema.receipts).values(receiptRows);

  await db.insert(schema.failures).values(
    failurePlans.map((failure, index) => ({
      id: `failure-seed-${index}`,
      questionId: failure.questionId,
      forecasterId: failure.forecasterId,
      rawResponse: failure.rawResponse,
      reason: failure.reason,
      at: new Date(now.getTime() - (index + 1) * 3_600_000),
    })),
  );

  const agentRunQuestions = questions.filter(
    (question, index) => question.status === "settled" && index % 7 === 1,
  );
  if (agentRunQuestions.length > 0) {
    await db.insert(schema.agentRuns).values(
      agentRunQuestions.map((question) => ({
        id: `run-seed-${question.id}`,
        forecasterId: AGENT_ID,
        questionId: question.id,
        attemptedAt: question.opensAt,
      })),
    );
  }

  const manualQuestion = questions[4]!;
  const proposalId = `proposal-seed-1`;
  await db.insert(schema.adminLog).values([
    {
      id: proposalId,
      actorWallet: ADMIN_WALLET,
      action: "manual_settle_proposal",
      questionId: manualQuestion.id,
      evidence: {
        proposalId,
        questionId: manualQuestion.id,
        value: Number(manualQuestion.readingValue),
        evidenceUrl: "https://example.com/evidence/manual-settle",
        reason: "Source page captured the closing number by hand.",
        proposedBy: ADMIN_WALLET,
        proposedAt: new Date(now.getTime() - 6 * DAY_MS).toISOString(),
        approvals: [],
      },
      at: new Date(now.getTime() - 6 * DAY_MS),
    },
    {
      id: "proposal-seed-2",
      actorWallet: ADMIN_WALLET,
      action: "manual_settle_proposal",
      questionId: questions[0]!.id,
      evidence: {
        proposalId: "proposal-seed-2",
        questionId: questions[0]!.id,
        value: Number(questions[0]!.readingValue),
        evidenceUrl: "https://example.com/evidence/manual-settle-two",
        reason: "Second reviewer requested before the number was accepted.",
        proposedBy: ADMIN_WALLET,
        proposedAt: new Date(now.getTime() - 5 * DAY_MS).toISOString(),
        approvals: [
          { wallet: ADMIN_WALLET, approvedAt: new Date(now.getTime() - 4 * DAY_MS).toISOString() },
        ],
      },
      at: new Date(now.getTime() - 5 * DAY_MS),
    },
    {
      id: "audit-seed-1",
      actorWallet: ADMIN_WALLET,
      action: "manual_settle",
      questionId: manualQuestion.id,
      evidence: {
        questionId: manualQuestion.id,
        actor: ADMIN_WALLET,
        action: "manual_settle",
        evidence: {
          proposalId,
          value: Number(manualQuestion.readingValue),
          evidenceUrl: "https://example.com/evidence/manual-settle",
          approvals: [ADMIN_WALLET, ALICE],
        },
      },
      at: new Date(now.getTime() - 4 * DAY_MS),
    },
  ]);

  const stored = await db.query.seals.findMany({
    columns: {
      recordIndex: true,
      commit: true,
      sealedAt: true,
      prevHash: true,
      hash: true,
    },
    orderBy: (seal, { asc }) => [asc(seal.recordIndex)],
  });

  const verdict = await verifyChain(
    stored.map((row) => ({
      index: row.recordIndex,
      commit: row.commit,
      sealedAt: row.sealedAt,
      prev: row.prevHash,
      hash: row.hash,
    })),
  );

  if (verdict.status !== "VALID") {
    console.error(
      `seed produced a broken chain at record ${verdict.index}: ${verdict.reason}`,
    );
    process.exit(1);
  }

  console.log("seed complete");
  console.log(`  users: 4`);
  console.log(`  forecasters: ${forecasterRows.length}`);
  console.log(`  questions: ${questions.length}`);
  console.log(`  seals: ${sealRows.length} (chain VALID, ${verdict.records} records)`);
  console.log(`  reveals: ${revealRows.length}`);
  console.log(`  receipts: ${receiptRows.length}`);
  console.log(`  failures: ${failurePlans.length}`);
  console.log(`  agent runs: ${agentRunQuestions.length}`);
  console.log(`  anchors: 0 (everything stays pending anchor)`);

  await sql.end();
}

main().catch(async (error: unknown) => {
  console.error(error);
  try {
    await sql.end();
  } catch {
    // ignore shutdown errors
  }
  process.exit(1);
});
