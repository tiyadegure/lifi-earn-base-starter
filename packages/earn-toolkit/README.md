# lifi-earn-toolkit

Local reusable toolkit package for the `lifi-earn-base-starter`.

It exists to keep the repo from being only a demo surface.

The package owns only builder-facing primitives that can be reused across the
starter flow:

- shared Earn and Composer types
- Base-first chain helpers
- starter flow presets
- typed quote-input builders
- route-debugging helpers
- proof/debug bundle builders
- integration-doctor report builders

The Next.js app remains the runnable reference surface, while this package holds
the developer-facing primitives that can later be extracted further.

This package does not own:

- page layout
- copy for landing or toolkit surfaces
- wallet-button UI
- vault-card rendering
- server route wiring

Read it as the tool layer behind one starter path:

1. pick a Base-first flow preset
2. build or inspect a route
3. run doctor checks
4. export proof/debug artifacts

## Public API

Current top-level exports are intentionally narrow:

- `earnToolkitClient`
  - stable client-style surface for presets, quote builders, doctor reports,
    route readers, and proof artifacts
- `buildComposerQuoteInput`
  - typed helper for converting a preset plus wallet inputs into a LI.FI quote request
- `buildQuoteFlowPresets`
  - returns the supported presets for a vault
- `buildServerDoctorReport` / `buildWalletDoctorReport`
  - deterministic doctor outputs with summary counts
- `buildDebugBundle` / `buildShareableDebugSnapshot`
  - exportable proof artifacts for teammates or issue reports

The CLI entrypoint is intentionally separate from the browser-safe package
entry:

- package API: `lifi-earn-toolkit`
- CLI core: `lifi-earn-toolkit/cli-core`
- repo command: `pnpm earn`

## Minimal CLI

The package now ships a narrow CLI wrapper over the toolkit API.

From the repo root:

```bash
pnpm earn --help
pnpm earn doctor --server packages/earn-toolkit/fixtures/server-doctor.json --wallet packages/earn-toolkit/fixtures/wallet-doctor.json
pnpm earn quote --vault packages/earn-toolkit/fixtures/vault.base.json --from-address 0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e --from-amount 20000
pnpm earn debug-bundle --quote packages/earn-toolkit/fixtures/quote.base.json --context packages/earn-toolkit/fixtures/debug-context.base.json --format snapshot
```

Current commands:

- `doctor`
  - deterministic server and wallet report rendering from JSON inputs
- `quote`
  - deterministic quote-input generation from a vault fixture and wallet inputs
- `debug-bundle`
  - proof artifact rendering in JSON or shareable snapshot format

## Smoke consumer

To prove the package can be consumed outside the app wiring, run:

```bash
pnpm toolkit:smoke
```

This is still deterministic and fixture-driven. It is not a networked CLI flow.

## Tests

Run the package test surface from the repo root:

```bash
pnpm test:toolkit
```

The CLI surface is also covered by the same test run.

The tests intentionally target deterministic toolkit logic only:

- preset resolution
- quote-input building
- approval requirement parsing
- doctor report summaries
- debug bundle generation
- CLI error and help paths
- no-underlying-token and pre-submission debug states
