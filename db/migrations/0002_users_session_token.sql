ALTER TABLE "users" ADD COLUMN "session_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "users_session_token_unique" ON "users" USING btree ("session_token");