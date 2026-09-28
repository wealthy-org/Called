# AGENTS.md — Called

Full product implementation of the spec in `docs/`. `docs/TASKS.md` (T-001–T-067) is
complete; work from it for anything still open, then from `docs/PRD.md`.

## Commands

- `npm run dev` / `npm run build` / `npm start` — dev/build/serve.
- Cron worker: `cd workers/cron; npx.cmd wrangler deploy` (and `wrangler dev` locally).
  It is a separate bundle, excluded from `tsconfig.json` and ESLint.
- `npm run lint` (= `eslint`, flat config, Next core-web-vitals + typescript).
- Typecheck: `npm run typecheck` (= `tsc --noEmit`).
- Tests: `npm test` (= `vitest run`) / `npm run test:watch`. Vitest 5.
- Single test file: `npx.cmd vitest run lib/seal.test.ts`. Files are `**/*.test.ts`.
- DB: `npm run db:generate` / `db:migrate` / `db:push` / `db:studio` (Drizzle).
- Dev data: `npm run db:seed` (destructive wipe + rebuild). Secrets: `npm run gen:env`.
- Icons: `npm run gen:icons` rasterises `app/icon.png`, `app/apple-icon.png`,
  `app/favicon.ico` and `public/called-logo.png` / `called-mark.png` from the SVG
  geometry in `lib/brand/`. `npm run gen:brand` writes the `brand/` SVG system.
  Never hand-edit the generated binaries or the `brand/**/*.svg` files.
- Playwright is installed (`@playwright/test`) but there are no e2e tests yet.
- No CI and no `opencode.json` in repo. `package-lock.json` is present.
- Windows: PowerShell blocks `npm.ps1`/`npx.ps1`. Always use `npm.cmd` / `npx.cmd`.
  Ripgrep is not on PATH; use the grep tool, never shell `rg`.

## Gotchas (hard-won)

- Never import a `*-store.ts` (or anything importing `@/db`) from pure logic or a
  test: tests throw `DATABASE_URL is not set`. Keep pure core and DB store split.
- After adding a route, run `npm run build` before `tsc --noEmit`, or `PageProps`/
  `AppRoutes` fail against stale `.next/types`. Delete `tsconfig.tsbuildinfo` after
  changing `tsconfig.json` options if errors persist.
- `react-hooks/set-state-in-effect` is a lint ERROR: no synchronous `setState` in an
  effect body. Use `useSyncExternalStore` for external stores, derive values in render.
- A server component/page that touches the DB needs `export const dynamic =
  "force-dynamic"` or the build prerender fails.
- drizzle-orm: `uniqueIndex(...)` must be called inside the `pgTable` callback.
- Next 16 async params: handlers/pages take `{ params: Promise<{ id: string }> }` and
  must `await params` (not the older sync signature).
- Custom SQL migrations (the append-only trigger, hand-written constraints) come from
  `npx.cmd drizzle-kit generate --custom --name=...`, then edit the `.sql` and separate
  statements with `--> statement-breakpoint`. No `migrations` hook in `drizzle.config.ts`.
- `lib/env.ts` defines its own `EnvSource = Record<string, string | undefined>`; do not
  use `NodeJS.ProcessEnv` (Next's global augmentation makes it require `NODE_ENV`).
  Test fixtures use `satisfies EnvSource`.
- `db/seed.ts` is destructive: it TRUNCATEs every table. Row-level triggers (the
  append-only `seals` rules) do NOT fire on TRUNCATE, which is why this works. It
  refuses to run when `NODE_ENV=production` unless `ALLOW_DB_SEED=1`. Scripts import
  `db/load-env` first so `.env` is loaded before `@/db` reads `DATABASE_URL`.
- Vercel Hobby rejects any cron more frequent than daily, so `vercel.json` has no
  `crons` block. The schedule lives in the Cloudflare Worker at `workers/cron/`,
  which calls the cron routes with `Authorization: Bearer $CRON_SECRET`. `APP_URL`
  and `CRON_SECRET` are Worker secrets/vars, set with `wrangler secret put`.
- Cron routes accept BOTH `GET` and `POST` (Vercel's scheduler uses GET, the
  Worker uses POST). Closing is also lazy: `lib/close-sweep.ts#sweepDueQuestions`
  runs on every question page/API read, so `closes_at` is honoured without a cron.
- `anchors.record_count` is a COUNT, so an anchor with `recordCount = N` covers
  indices `0 .. N-1`. Coverage is `recordCount > recordIndex`, all comparisons in
  `lib/anchor-status.ts` are `>`/`<=`, and `anchors.confirmed` marks a row as a
  real anchor (an unconfirmed row is an in-flight claim). Never relax this to `>=`.
- A standalone tsx script must live inside the repo; repo-root relative imports do
  not resolve from `%TEMP%` or from `scripts/`. `db.execute(sql\`...\`)` fails
  (`query.getSQL is not a function`) because `sql` in `db/index.ts` is already the
  postgres.js client — call `sql\`select ...\`` directly.

## Docs map (spec source of truth)

- `docs/PRD.md` — what/why, acceptance criteria.
- `docs/ARCHITECTURE.md` — stack, endpoints, cron, schema.
- `docs/DESIGN.md` — colors, type, motion, a11y; prototype HTML is visual reference.
- `docs/Called_Brief.md` — condensed duplicate of above; check PRD/ARCHITECTURE on conflict.
- `docs/TASKS.md` — 67 granular tasks (T-001–T-067) per PRD §24 phases; all complete.
- Build order: PRD §24 (foundation → seal/ledger/receipt → settle → scoring → Cassandra/BYOK → anchor → homepage).

## Current code

- Next.js 16.3.6 App Router, React 19, TS strict (target ES2020), Tailwind v4.
- `app/` — routes and pages; `lib/` — pure logic plus `*-store.ts` DB access;
  `components/` — shared UI; `db/schema.ts` + migrations; `config/` — house tiers
  and vague words; `prompts/forecaster.md`; `assets/fonts/` for the OG card;
  `workers/cron/` — the Cloudflare cron worker (separate bundle).
- Entrypoints: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
- Alias `@/*` → `./*` (not `./src/*`).
- Tailwind v4 style: `@import "tailwindcss"` + `@theme inline`; PostCSS plugin `@tailwindcss/postcss`. No `tailwind.config`.
- Routes are built; see `README.md` for the full map (pages, API groups, cron).
- There is no browser wallet sign-in UI: the SIWE routes exist but nothing calls
  them, so session-gated pages show their signed-out state.

## Business invariants (do not violate when implementing)

- `seals` append-only: no UPDATE/DELETE; one seal per `(question_id, forecaster_id)`; `prev` genesis = 64 zeros.
- Commit-reveal: `commit = sha256(payload_json|salt)`, `record.hash = sha256(i|commit|sealed_at|prev)`; same SHA-256 module browser + server; `/ledger` Verify recomputes in browser, names first broken index.
- Receipts: Ed25519-signed, verifiable offline via `/.well-known/` public key; payload encrypted server-side until close.
- Settle: resolver reads one number from one source, sees zero predictions; unreadable source = `void`, never guess; manual settle needs 2 admin approvals + audit log.
- Scoring pure functions only: Brier `(p-outcome)^2`, skill vs always-yes on shared set, `n<20` = `provisional`, excluded from ranking; failures counted, never scored as 0.5.
- Cassandra: once per question, temp 0, seed from question ID, prompt only public question text; unparseable answer = `failure`, never triggers fallback. Fallback only on 429/5xx/timeout/unavailable after 3 exponential retries; each tier separate forecaster; Stray tier never ranked.
- Baselines never see outcome (shuffle-result test); never copy brier `fox`; log adaptations in `THIRD_PARTY.md` with MIT text.
- Anchor: Robinhood Chain ID 4663, zero-value tx, no contract/ABI/token, 44-byte calldata (`0x` + ASCII `CALL` + 32-byte head hash + 8-byte record count); daily; statuses `sealed` / `pending anchor` / `anchored`. Never say "proven" before anchored.
- BYOK keys transient: single call over TLS, never DB/log/error-report; one run per `(agent, question)`; label `Agent (self-run)`.
- Ask gate: future dates, readable source, parseable test (`gte/lte/gt/lt/eq/neq/between`), 15–240 chars, vague-word list in `config/vague.ts`; ID `q-<date>-<6hex sha256(text|date|source|test)>`.

## Design constraints

- Tokens: `--void #0a0a0b`, `--ink #111113`, `--line #26262b`, `--bone #ece9e4`, `--mute #a19d95`, `--seal #ff5a36`, `--paper #e9e4d8` (only light surface = receipt slip).
- Fonts: Doto (display/numbers), IBM Plex Sans (body), IBM Plex Mono (hash/data). Vermilion only for sealed/clickable/broken-live data; VALID stays bone. One exception: the identity's seal block is `--seal` by design (`components/brand/called-mark.tsx`, `brand/SPEC.md`).
- No pill buttons (radius 2/4/6px; only slider thumb round), no capsule badges (plain mono kicker), no generic icon lib/emoji (SVG), no decorative gradients, no links to nonexistent pages, no invented numbers (honest empty states; SAMPLE label only on demo data).
- A11y/responsive: 44px touch targets, visible bone focus ring, `prefers-reduced-motion` disables all motion, diagrams need `role="img"` + summary `aria-label`, no horizontal overflow at 1440/390 (tables scroll inside container).
