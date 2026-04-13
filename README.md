# LI.FI Earn Base Starter

Base-first builder starter template for LI.FI Earn discovery, Composer quote generation, and wallet execution.

This repo is intentionally narrow:

- wallet-connected browser flow
- Base vault discovery through the public Earn Data API
- same-chain deposit quote generation through Composer
- route anatomy, stage-stack, and execution-checklist debugging for the built quote
- a copyable proof/debug snapshot for teammate handoff
- a downloadable JSON debug bundle for teammate handoff
- a local reusable workspace package under `packages/earn-toolkit`
- an in-app integration doctor and toolkit page at `/toolkit`
- wallet transaction handoff
- portfolio verification against `GET /v1/earn/portfolio/:address/positions`

It is not a full yield dashboard. It is a builder-facing template that gets another participant to a real faucet-backed test loop quickly.

## Getting Started

1. Copy `.env.example` to `.env.local`
2. Fill in:
   - `NEXT_PUBLIC_LIFI_INTEGRATOR`
   - `LIFI_COMPOSER_API_KEY` if you want trusted local/dev requests to use authenticated Composer
3. Start the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Open `http://localhost:3000/toolkit` only after the starter path is already running and you want diagnostics or export artifacts.



## Required inputs

- `NEXT_PUBLIC_LIFI_INTEGRATOR`
  - Explicit string identifier used by LI.FI for API requests
- `LIFI_COMPOSER_API_KEY`
  - Get it from `https://portal.li.fi/`
  - In trusted local/dev mode, the starter quote route uses this authenticated Composer path
  - If it is missing, the starter falls back to the public Composer path and surfaces that mode in the UI
- Injected wallet with Base support
- Base faucet funds if you want to run a real deposit test
  - `https://lifi-faucet.vercel.app/`

## Optional server-side inputs

- `ENABLE_AUTHENTICATED_COMPOSER`
  - Default is enabled
  - Set to `false` only if you deliberately want to force public fallback mode
- `STARTER_ALLOWED_QUOTE_ORIGINS`
  - Comma-separated allowlist for authenticated Composer in production
  - Development defaults already include localhost on ports `3000` and `3001`

## Happy path

1. Connect an injected wallet
2. Open a Base transactional vault
3. Enter an amount for the first underlying token
4. Build a Composer quote through the starter quote route
   - trusted local/dev mode + key: authenticated Composer
   - untrusted/public mode: public Composer fallback
5. Inspect the route debugger if you need to explain or validate the route
6. Copy the proof/debug snapshot if you need to hand the route state to a teammate
7. Download the JSON debug bundle if you need a structured route artifact
8. Approve the source token when the quote requires allowance
9. Send the returned transaction request to the wallet
10. Verify the portfolio output panel

## First 5 minutes

1. Copy `.env.example` to `.env.local`
2. Set `NEXT_PUBLIC_LIFI_INTEGRATOR`
3. Set `LIFI_COMPOSER_API_KEY` if you want authenticated Composer during local development
4. Start the app with `pnpm dev`
5. Connect a Base wallet with small Base ETH and Base USDC
6. Open the first vault row and run the standard deposit loop

## Standard tool shape

This repo now has two layers:

- `app/`
  - runnable Next.js starter surface for the live demo path
- `packages/earn-toolkit/`
  - reusable local toolkit primitives for:
    - shared types
    - flow presets
    - route-debug helpers
    - proof/debug bundle builders
    - integration-doctor checks

The starter page is the working loop. The toolkit page explains the reusable
builder-facing parts behind it.

The toolkit package now exposes a clearer external API instead of only acting
as an internal helper folder:

- `earnToolkitClient`
- flow preset builders
- typed quote-input builders
- doctor reports
- debug bundle builders
- a minimal fixture-driven CLI

## Minimal CLI

The repo now ships a narrow toolkit CLI over the local package API.

Use it from the repo root:

```bash
pnpm earn --help
pnpm earn doctor --server packages/earn-toolkit/fixtures/server-doctor.json --wallet packages/earn-toolkit/fixtures/wallet-doctor.json
pnpm earn quote --vault packages/earn-toolkit/fixtures/vault.base.json --from-address 0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e --from-amount 20000
pnpm earn debug-bundle --quote packages/earn-toolkit/fixtures/quote.base.json --context packages/earn-toolkit/fixtures/debug-context.base.json --format snapshot
```

This CLI is intentionally narrow:

- no network calls
- no wallet control
- no deployment auth surface
- deterministic fixture-driven outputs for builder debugging and demos

The fastest way to understand the repo is:

1. Run `/`
2. Prove the Base flow works
3. Open `/toolkit`
4. Use the doctor, route debugger, and debug bundle only when you need them

## What is intentionally hard-coded in v1

- Base only
- Same-chain Base path only
- First underlying token only
- No backend persistence
- No general multi-chain orchestration UI yet

## Known API caveats

- Composer quote is `GET /v1/quote`, not POST
- Vault `address` is the Composer `toToken`
- APY fields can be `null`
- TVL comes back as a string
- Portfolio `protocolName` is context-sensitive
- Empty `positions: []` is a valid response shape
- This starter does not expose an open unauthenticated partner-key relay

## Swapping the vault filter

The starter currently filters to Base plus `isTransactional === true`.

If you want to widen or narrow the scope, start in:

- `lib/earn-api.ts`
- `app/page.tsx`

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm test:toolkit
pnpm earn --help
```
