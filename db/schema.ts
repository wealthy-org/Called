import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const forecasterKind = pgEnum("forecaster_kind", [
  "house",
  "baseline",
  "agent",
  "human",
]);

export const questionStatus = pgEnum("question_status", [
  "open",
  "closed",
  "settled",
  "void",
]);

export const users = pgTable(
  "users",
  {
    walletAddress: text("wallet_address").primaryKey(),
    handle: text("handle").notNull(),
    sessionToken: text("session_token"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("users_handle_unique").on(t.handle),
    uniqueIndex("users_session_token_unique").on(t.sessionToken),
  ],
);

export const forecasters = pgTable(
  "forecasters",
  {
    id: text("id").primaryKey(),
    kind: forecasterKind("kind").notNull(),
    ownerWallet: text("owner_wallet").references(() => users.walletAddress, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    model: text("model"),
    modelVersion: text("model_version"),
    providerEndpoint: text("provider_endpoint"),
    promptHash: text("prompt_hash"),
    isReserve: boolean("is_reserve").notNull().default(false),
    isRanked: boolean("is_ranked").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("forecasters_owner_wallet_idx").on(t.ownerWallet),
    index("forecasters_kind_idx").on(t.kind),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: text("id").primaryKey(),
    text: text("text").notNull(),
    source: text("source").notNull(),
    test: text("test").notNull(),
    opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
    resolvesAt: timestamp("resolves_at", { withTimezone: true }).notNull(),
    status: questionStatus("status").notNull().default("open"),
    outcome: boolean("outcome"),
    readingValue: numeric("reading_value"),
    readingBlock: bigint("reading_block", { mode: "number" }),
    createdBy: text("created_by").references(() => users.walletAddress, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("questions_status_idx").on(t.status),
    index("questions_resolves_at_idx").on(t.resolvesAt),
  ],
);

export const seals = pgTable(
  "seals",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),
    forecasterId: text("forecaster_id")
      .notNull()
      .references(() => forecasters.id, { onDelete: "restrict" }),
    commit: text("commit").notNull(),
    salt: text("salt").notNull(),
    payloadCiphertext: text("payload_ciphertext").notNull(),
    sealedAt: timestamp("sealed_at", { withTimezone: true }).notNull(),
    recordIndex: integer("record_index").notNull(),
    prevHash: text("prev_hash").notNull(),
    hash: text("hash").notNull(),
  },
  (t) => [
    uniqueIndex("seals_record_index_unique").on(t.recordIndex),
    uniqueIndex("seals_question_forecaster_unique").on(
      t.questionId,
      t.forecasterId,
    ),
    index("seals_question_id_idx").on(t.questionId),
    index("seals_forecaster_id_idx").on(t.forecasterId),
  ],
);

export const sealReveals = pgTable(
  "seal_reveals",
  {
    id: text("id").primaryKey(),
    sealId: text("seal_id")
      .notNull()
      .references(() => seals.id, { onDelete: "restrict" }),
    payloadJson: text("payload_json").notNull(),
    salt: text("salt").notNull(),
    revealedAt: timestamp("revealed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("seal_reveals_seal_id_unique").on(t.sealId)],
);

export const failures = pgTable(
  "failures",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),
    forecasterId: text("forecaster_id")
      .notNull()
      .references(() => forecasters.id, { onDelete: "restrict" }),
    rawResponse: text("raw_response"),
    reason: text("reason").notNull(),
    at: timestamp("at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("failures_question_id_idx").on(t.questionId)],
);

export const receipts = pgTable(
  "receipts",
  {
    id: text("id").primaryKey(),
    sealId: text("seal_id")
      .notNull()
      .references(() => seals.id, { onDelete: "restrict" }),
    signature: text("signature").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("receipts_seal_id_unique").on(t.sealId)],
);

export const anchors = pgTable("anchors", {
  id: text("id").primaryKey(),
  headHash: text("head_hash").notNull(),
  recordCount: integer("record_count").notNull(),
  txHash: text("tx_hash").notNull(),
  blockNumber: bigint("block_number", { mode: "number" }).notNull(),
  blockTime: timestamp("block_time", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const scores = pgTable(
  "scores",
  {
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),
    forecasterId: text("forecaster_id")
      .notNull()
      .references(() => forecasters.id, { onDelete: "restrict" }),
    p: numeric("p", { precision: 9, scale: 6 }).notNull(),
    outcome: boolean("outcome").notNull(),
    brier: numeric("brier", { precision: 12, scale: 8 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.forecasterId] })],
);

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: text("id").primaryKey(),
    forecasterId: text("forecaster_id")
      .notNull()
      .references(() => forecasters.id, { onDelete: "restrict" }),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("agent_runs_forecaster_question_unique").on(
      t.forecasterId,
      t.questionId,
    ),
  ],
);

export const adminLog = pgTable(
  "admin_log",
  {
    id: text("id").primaryKey(),
    actorWallet: text("actor_wallet")
      .notNull()
      .references(() => users.walletAddress, { onDelete: "restrict" }),
    action: text("action").notNull(),
    questionId: text("question_id").references(() => questions.id, {
      onDelete: "restrict",
    }),
    evidence: jsonb("evidence_json"),
    at: timestamp("at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("admin_log_question_id_idx").on(t.questionId)],
);

export type User = typeof users.$inferSelect;
export type Forecaster = typeof forecasters.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Seal = typeof seals.$inferSelect;
export type SealReveal = typeof sealReveals.$inferSelect;
export type Failure = typeof failures.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;
export type Anchor = typeof anchors.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
export type AdminLogEntry = typeof adminLog.$inferSelect;
