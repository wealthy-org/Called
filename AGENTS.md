# AGENTS.md — Called

Fresh `create-next-app` boilerplate + full product spec in `docs/`. Code does not implement spec yet.

## Commands

- `npm run dev` / `npm run build` / `npm start` — dev/build/serve.
- `npm run lint` (= `eslint`, flat config, Next core-web-vitals + typescript).
- Typecheck: `npx tsc --noEmit` (no script defined).
- No test runner installed. Docs plan Vitest + Playwright — install before adding tests.
- No lockfile, CI, or `opencode.json` in repo.

## Docs map (spec source of truth)

- `docs/PRD.md` — what/why, acceptance criteria.
- `docs/ARCHITECTURE.md` — stack, endpoints, cron, schema.
- `docs/DESIGN.md` — colors, type, motion, a11y; prototype HTML is visual reference.
- `docs/Called_Brief.md` — condensed duplicate of above; check PRD/ARCHITECTURE on conflict.
- `docs/TASKS.md` — 67 granular tasks (T-001–T-067) per PRD §24 phases; work from here, not raw PRD.
- Build order: PRD §24 (foundation → seal/ledger/receipt → settle → scoring → Cassandra/BYOK → anchor → homepage).

## Current code

- Next.js 16.3.6 App Router, React 19, TS strict, Tailwind v4.
- Entrypoints: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`. No `src/`, no routes, DB, auth yet.
- Alias `@/*` → `./*` (not `./src/*`).
- Tailwind v4 style: `@import "tailwindcss"` + `@theme inline`; PostCSS plugin `@tailwindcss/postcss`. No `tailwind.config`.
- Planned routes not built: `/questions`, `/q/[id]`, `/leaderboard`, `/f/[handle]`, `/ledger`, `/receipt/[id]`, `/agents`, `/method`, `/faq`, `/me`, `/admin`.

## Business invariants (do not violate when implementing)

- `seals` append-only: no UPDATE/DELETE; one seal per `(question_id, forecaster_id)`; `prev` genesis = 64 zeros.
- Commit-reveal: `commit = sha256(payload_json|salt)`, `record.hash = sha256(i|commit|sealed_at|prev)`; same SHA-256 module browser + server; `/ledger` Verify recomputes in browser, names first broken index.
- Receipts: Ed25519-signed, verifiable offline via `/.well-known/` public key; payload encrypted server-side until close.
- Settle: resolver reads one number from one source, sees zero predictions; unreadable source = `void`, never guess; manual settle needs 2 admin approvals + audit log.
- Scoring pure functions only: Brier `(p-outcome)^2`, skill vs always-yes on shared set, `n<20` = `provisional`, excluded from ranking; failures counted, never scored as 0.5.
- Cassandra: once per question, temp 0, seed from question ID, prompt only public question text; unparseable answer = `failure`, never triggers fallback. Fallback only on 429/5xx/timeout/unavailable after 3 exponential retries; each tier separate forecaster; Stray tier never ranked.
- Baselines never see outcome (shuffle-result test); never copy brier `fox`; log adaptations in `THIRD_PARTY.md` with MIT text.
- Anchor: Robinhood Chain ID 4663, zero-value tx, no contract/ABI/token; daily + on close; statuses `sealed` / `pending anchor` / `anchored`. Never say "proven" before anchored.
- BYOK keys transient: single call over TLS, never DB/log/error-report; one run per `(agent, question)`; label `Agent (self-run)`.
- Ask gate: future dates, readable source, parseable test (`gte/lte/gt/lt/eq/neq/between`), 15–240 chars, vague-word list in `config/vague.ts`; ID `q-<date>-<6hex sha256(text|date|source|test)>`.

## Design constraints

- Tokens: `--void #0a0a0b`, `--ink #111113`, `--line #26262b`, `--bone #ece9e4`, `--mute #a19d95`, `--seal #ff5a36`, `--paper #e9e4d8` (only light surface = receipt slip).
- Fonts: Doto (display/numbers), IBM Plex Sans (body), IBM Plex Mono (hash/data). Vermilion only for sealed/clickable/broken-live data; VALID stays bone.
- No pill buttons (radius 2/4/6px; only slider thumb round), no capsule badges (plain mono kicker), no generic icon lib/emoji (SVG), no decorative gradients, no links to nonexistent pages, no invented numbers (honest empty states; SAMPLE label only on demo data).
- A11y/responsive: 44px touch targets, visible bone focus ring, `prefers-reduced-motion` disables all motion, diagrams need `role="img"` + summary `aria-label`, no horizontal overflow at 1440/390 (tables scroll inside container).
