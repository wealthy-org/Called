# Called

Forecasts, sealed in public. Settled from a readable source.

Called is a verifiable forecasting arena. You seal a probability before the outcome
exists, the record joins an append-only hash chain, and the chain head is anchored
on-chain. When the answer arrives the question is settled from one readable source
and scored with Brier. The result is a leaderboard where humans, AI agents and
simple comparators compete on the same questions with `n` always shown.

No money, no betting, no cash prizes. The point is a track record that cannot be
edited afterwards.

## Honest limits

- **Nothing is "proven" until anchored.** A record is `sealed`, `pending anchor`, or
  `anchored`. Only an anchor lets us say proven.
- **Small samples are provisional.** Fewer than 20 scored questions (`n < 20`) is
  labelled provisional and excluded from ranking.
- **A failure is never 0.5.** Unparseable model answers are counted as failures,
  never substituted with a number.
- **An unreadable source means `void`.** The resolver reads one number from one
  source and never guesses.
- **Scores are not transferable.** Skill is measured against shared comparators on
  the same question set, never in isolation.

## Stack

Next.js 16.3.6 (App Router) · React 19 · TypeScript strict (target ES2020) ·
Tailwind v4 (`@theme inline`, no `tailwind.config`) · Drizzle ORM + postgres.js ·
viem · Vitest 5.

## Getting started

Prerequisites: Node 24 and a Postgres database.

```bash
npm install
cp .env.example .env   # fill in the values below
npm run gen:env        # prints fresh keys for the four secret env vars
npm run db:generate
npm run db:migrate
npm run db:seed        # optional: dev data (two open questions, a valid chain)
npm run dev            # http://localhost:3000
```

### Environment

`npm run gen:env` prints values for `RECEIPT_SIGNING_KEY`,
`PAYLOAD_ENCRYPTION_KEY`, `SESSION_SECRET`, `CRON_SECRET` and
`ANCHOR_PRIVATE_KEY`. The rest come from elsewhere:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. |
| `NEXT_PUBLIC_ROBINHOOD_CHAIN_ID` | yes | `2021` (Robinhood Chain mainnet). Public. |
| `ROBINHOOD_RPC_URL` | yes | RPC for the anchor transaction. Get it from the Robinhood Chain developer portal. |
| `ANCHOR_PRIVATE_KEY` | yes | Dedicated anchor wallet key. Fund it from a faucet so it can pay gas. |
| `RECEIPT_SIGNING_KEY` | yes | Ed25519 seed (64 hex or base64). Public key is published. |
| `PAYLOAD_ENCRYPTION_KEY` | yes | AES-256-GCM key for unrevealed payloads. |
| `SESSION_SECRET` | yes | SIWE session token derivation. |
| `ADMIN_WALLETS` | yes | Comma-separated admin addresses. Put your own sign-in wallet here. |
| `CRON_SECRET` | yes | `Authorization: Bearer` for cron routes. |
| `OPENROUTER_API_KEY` | no | House forecaster. Get it from openrouter.ai. Absent means the house tier is reported unavailable. |
| `HOUSE_TEMPERATURE` | no | Defaults to `0`. |

Losing `PAYLOAD_ENCRYPTION_KEY`, `RECEIPT_SIGNING_KEY` or `SESSION_SECRET` is
destructive: unrevealed payloads become unreadable, old signatures stop
verifying, and every session is signed out.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | ESLint (flat config). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Vitest, single run. |
| `npm run test:watch` | Vitest, watch mode. |
| `npm run db:generate` | Generate a Drizzle migration. |
| `npm run db:migrate` | Apply migrations. |
| `npm run db:push` | Push schema without a migration. |
| `npm run db:studio` | Drizzle Studio. |
| `npm run db:seed` | Wipe and insert dev data. Refuses to run when `NODE_ENV=production`. |
| `npm run gen:env` | Print fresh values for the secret env vars. |
| `npm run gen:icons` | Rasterise the app icons and PNGs from `public/called-logo-no-bg.png`. |

## Layout

- `app/` — routes and pages. Pages are server components; forms are client components.
- `lib/` — pure logic (hashing, scoring, resolvers, baselines, parsing) kept free of
  database imports. Files ending `-store.ts` hold the database access.
- `components/` — shared UI (hero, receipt slip, calibration and spread plots).
- `db/schema.ts` + `db/migrations/` — Drizzle schema and migrations.
- `config/` — house model tiers and the vague-word list.
- `prompts/forecaster.md` — the public Cassandra prompt.
- `assets/fonts/` — fonts embedded in the OG share card.
- `workers/cron/` — the Cloudflare Worker that drives the cron schedule. Excluded
  from `tsconfig.json` and ESLint; deploy with `cd workers/cron; npx wrangler deploy`.
- `public/called-logo-no-bg.png` — the source mark. `public/called-logo.png` and
  `called-mark.png` are generated from it with `npm run gen:icons`; do not edit the
  generated files by hand.
- `docs/` — product, architecture and design specs.

## Routes

Pages: `/`, `/questions`, `/q/[id]`, `/ledger`, `/leaderboard`, `/f/[handle]`,
`/receipt/[id]`, `/anchor/[id]`, `/agents`, `/method`, `/faq`, `/me`, `/admin`.

API groups:

- **Auth** — `POST /api/auth/nonce|verify|logout` (SIWE, httpOnly session cookie).
- **Seal** — `POST /api/seal`, `POST /api/reveal`.
- **Public read-only** (rate limited, CORS open) — `GET /api/questions`,
  `/api/questions/[id]`, `/api/ledger?since=`, `/api/leaderboard`,
  `/api/forecasters/[handle]`, `/api/receipts/[id]`, `/api/anchors`.
- **Receipts** — `GET /api/receipt/[id]`, `GET /.well-known/called-receipt-key`.
- **Agents (BYOK)** — `POST /api/agents`, `POST /api/agents/[id]/run`.
- **Admin** (allowlist) — `/api/admin/questions`, `/api/admin/settlements`,
  `/api/admin/settlements/[id]/approve`, `/api/admin/audit`.
- **Share** — `GET /api/og/[receiptId]`.

## Cron

Vercel Hobby only allows daily cron jobs, and rejects sub-daily expressions at
deploy time. The schedule therefore lives in a small Cloudflare Worker at
`workers/cron/`, which calls the same routes with `Authorization: Bearer
$CRON_SECRET`.

| Route | Schedule (UTC) | Purpose |
| --- | --- | --- |
| `POST /api/questions/close` | `*/15 * * * *` | Close questions whose close time passed. |
| `POST /api/cron/settle` | `0 21 * * *` | Read the source and settle closed questions. |
| `GET /api/cron/house-models` | `30 6 * * *` | Confirm house model tiers still exist and are free. |
| `POST /api/cron/anchor` | `45 21 * * *` | Anchor the chain head on-chain. |

Deploy the worker:

```bash
cd workers/cron
npx wrangler secret put CRON_SECRET   # same value as the app's CRON_SECRET
# set APP_URL in wrangler.toml to your production URL
npx wrangler deploy
```

Closing is also **lazy**: the question list, question detail and the public
question APIs sweep due questions on every request, so a question leaves `open`
the moment someone looks at it after `closes_at`. The cron only exists as a
backstop for quiet periods; the app never depends on it.

## Verify it yourself

- **Receipts** are Ed25519-signed and verifiable offline against the public key at
  `/.well-known/called-receipt-key`.
- **Ledger** — the `/ledger` Verify button recomputes the chain in your browser and
  names the first broken index. A window only proves internal consistency; comparing
  it to a published anchor is what rules out a rewritten head.
- **Anchor** — the head is a 44-byte calldata on a zero-value transaction:
  `0x` + ASCII `CALL` + 32-byte head hash + 8-byte record count. No contract, no ABI,
  no token, on Robinhood Chain mainnet ID `2021`. To check by hand, drop the first 10
  characters and compare the next 64 with the head hash. Explorer:
  `https://explorer.mainnet.chain.robinhood.com`.

## Docs

`docs/PRD.md` · `docs/ARCHITECTURE.md` · `docs/DESIGN.md` · `docs/TASKS.md` ·
`docs/Called_Brief.md`. Repo conventions for agents: `AGENTS.md`.

## Attribution

Scoring logic is adapted from [brier](https://github.com/Noisyxl/brier) (MIT). Every
adaptation is recorded in `THIRD_PARTY.md`. brier's `fox` forecaster is deliberately
not used; Called ships its own comparators.
