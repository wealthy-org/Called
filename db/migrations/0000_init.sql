CREATE TYPE "public"."forecaster_kind" AS ENUM('house', 'baseline', 'agent', 'human');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('open', 'closed', 'settled', 'void');--> statement-breakpoint
CREATE TABLE "admin_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_wallet" text NOT NULL,
	"action" text NOT NULL,
	"question_id" text,
	"evidence_json" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"forecaster_id" text NOT NULL,
	"question_id" text NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anchors" (
	"id" text PRIMARY KEY NOT NULL,
	"head_hash" text NOT NULL,
	"record_count" integer NOT NULL,
	"tx_hash" text NOT NULL,
	"block_number" bigint NOT NULL,
	"block_time" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failures" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"forecaster_id" text NOT NULL,
	"raw_response" text,
	"reason" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecasters" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "forecaster_kind" NOT NULL,
	"owner_wallet" text,
	"name" text NOT NULL,
	"model" text,
	"model_version" text,
	"prompt_hash" text,
	"is_reserve" boolean DEFAULT false NOT NULL,
	"is_ranked" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"source" text NOT NULL,
	"test" text NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"resolves_at" timestamp with time zone NOT NULL,
	"status" "question_status" DEFAULT 'open' NOT NULL,
	"outcome" boolean,
	"reading_value" numeric,
	"reading_block" bigint,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"seal_id" text NOT NULL,
	"signature" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"question_id" text NOT NULL,
	"forecaster_id" text NOT NULL,
	"p" numeric(9, 6) NOT NULL,
	"outcome" boolean NOT NULL,
	"brier" numeric(12, 8) NOT NULL,
	CONSTRAINT "scores_question_id_forecaster_id_pk" PRIMARY KEY("question_id","forecaster_id")
);
--> statement-breakpoint
CREATE TABLE "seal_reveals" (
	"id" text PRIMARY KEY NOT NULL,
	"seal_id" text NOT NULL,
	"payload_json" text NOT NULL,
	"salt" text NOT NULL,
	"revealed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seals" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"forecaster_id" text NOT NULL,
	"commit" text NOT NULL,
	"payload_ciphertext" text NOT NULL,
	"sealed_at" timestamp with time zone NOT NULL,
	"record_index" integer NOT NULL,
	"prev_hash" text NOT NULL,
	"hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"wallet_address" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_log" ADD CONSTRAINT "admin_log_actor_wallet_users_wallet_address_fk" FOREIGN KEY ("actor_wallet") REFERENCES "public"."users"("wallet_address") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_log" ADD CONSTRAINT "admin_log_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_forecaster_id_forecasters_id_fk" FOREIGN KEY ("forecaster_id") REFERENCES "public"."forecasters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failures" ADD CONSTRAINT "failures_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failures" ADD CONSTRAINT "failures_forecaster_id_forecasters_id_fk" FOREIGN KEY ("forecaster_id") REFERENCES "public"."forecasters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecasters" ADD CONSTRAINT "forecasters_owner_wallet_users_wallet_address_fk" FOREIGN KEY ("owner_wallet") REFERENCES "public"."users"("wallet_address") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_users_wallet_address_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("wallet_address") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_seal_id_seals_id_fk" FOREIGN KEY ("seal_id") REFERENCES "public"."seals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_forecaster_id_forecasters_id_fk" FOREIGN KEY ("forecaster_id") REFERENCES "public"."forecasters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seal_reveals" ADD CONSTRAINT "seal_reveals_seal_id_seals_id_fk" FOREIGN KEY ("seal_id") REFERENCES "public"."seals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seals" ADD CONSTRAINT "seals_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seals" ADD CONSTRAINT "seals_forecaster_id_forecasters_id_fk" FOREIGN KEY ("forecaster_id") REFERENCES "public"."forecasters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_log_question_id_idx" ON "admin_log" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_runs_forecaster_question_unique" ON "agent_runs" USING btree ("forecaster_id","question_id");--> statement-breakpoint
CREATE INDEX "failures_question_id_idx" ON "failures" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "forecasters_owner_wallet_idx" ON "forecasters" USING btree ("owner_wallet");--> statement-breakpoint
CREATE INDEX "forecasters_kind_idx" ON "forecasters" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "questions_status_idx" ON "questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questions_resolves_at_idx" ON "questions" USING btree ("resolves_at");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_seal_id_unique" ON "receipts" USING btree ("seal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seal_reveals_seal_id_unique" ON "seal_reveals" USING btree ("seal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seals_record_index_unique" ON "seals" USING btree ("record_index");--> statement-breakpoint
CREATE UNIQUE INDEX "seals_question_forecaster_unique" ON "seals" USING btree ("question_id","forecaster_id");--> statement-breakpoint
CREATE INDEX "seals_question_id_idx" ON "seals" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "seals_forecaster_id_idx" ON "seals" USING btree ("forecaster_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_handle_unique" ON "users" USING btree ("handle");