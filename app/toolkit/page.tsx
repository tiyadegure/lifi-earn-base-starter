import Link from "next/link";
import { IntegrationDoctor } from "@/components/integration-doctor";
import { getComposerKeyStatus } from "@/lib/composer-api";
import { publicEnv } from "@/lib/env";

const judgeScan = [
  "Built for builders, not end users",
  "Base vault discovery, Composer execution, and portfolio verification in one runnable starter",
  "Real Base mainnet proof archived",
  "Local toolkit package keeps the tool layer separate from the page layer",
];

const recipes = [
  {
    title: "Add a new Base vault family",
    detail:
      "Start in lib/earn-api.ts or app/page.tsx, adjust the vault filter, then reuse the existing vault page and quote builder without rewriting the execution model.",
  },
  {
    title: "Replay a quote with a different source token",
    detail:
      "Reuse the route-debug and bundle helpers from the local toolkit package instead of hardcoding route inspection into a page.",
  },
  {
    title: "Hand a route to another builder",
    detail:
      "Use the shareable proof/debug snapshot or the exported JSON bundle so route state can be reviewed without stepping through the whole app.",
  },
];

const capabilities = [
  "Local reusable package boundary under packages/earn-toolkit",
  "Integration doctor for env, wallet, network, and funding checks",
  "Same-chain Base live proof with approval, receipt, and portfolio verification",
  "Authenticated Composer in trusted local/dev mode with safe public fallback",
  "Route anatomy, stage stack, and execution checklist for built quotes",
  "Copyable and exportable proof/debug bundle for handoff",
  "Base-first scope kept narrow enough for a stable live demo",
];

const proofTimeline = [
  {
    label: "Wallet + quote",
    detail: "Injected wallet connected, Base vault selected, same-chain quote built.",
  },
  {
    label: "Approval",
    detail: "ERC20 allowance required and explicitly handled inside the starter.",
  },
  {
    label: "Execution",
    detail: "Deposit transaction handed to wallet, signed, submitted, and confirmed.",
  },
  {
    label: "Verification",
    detail: "On-chain vault-token balance observed and Earn portfolio later became non-empty.",
  },
];

const toolkitModules = [
  {
    title: "Flow presets",
    detail:
      "Standardized Base-first quote inputs instead of one-off wiring inside a page component.",
  },
  {
    title: "Route debug helpers",
    detail:
      "Ordered stage-stack, route anatomy, and execution checklist builders live in the package boundary.",
  },
  {
    title: "Doctor checks",
    detail:
      "Server-side key validation and client-side funding/network checks are packaged as reusable reports.",
  },
  {
    title: "Proof exports",
    detail:
      "The same runtime state can be copied as text or exported as a JSON debug bundle for handoff.",
  },
];

const judgeSnippets = [
  {
    title: "CLI proof",
    detail:
      "Show this only long enough to prove the toolkit is not just a page surface.",
    code: [
      "pnpm earn --help",
      "pnpm earn doctor --server packages/earn-toolkit/fixtures/server-doctor.json --wallet packages/earn-toolkit/fixtures/wallet-doctor.json",
    ].join("\n"),
  },
  {
    title: "Package proof",
    detail:
      "Show the narrow package API instead of implying a broad SDK claim.",
    code: [
      'import { earnToolkitClient, buildComposerQuoteInput } from "lifi-earn-toolkit";',
      "",
      "const preset = earnToolkitClient.getDefaultFlowPreset(vault);",
      "const input = buildComposerQuoteInput({",
      "  preset,",
      '  fromAddress: "0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e",',
      '  fromAmount: "20000",',
      "});",
    ].join("\n"),
  },
];

const submissionClaims = [
  {
    value: "1",
    label: "Real Base live proof",
  },
  {
    value: "1",
    label: "Runnable core flow",
  },
  {
    value: "4",
    label: "Toolkit module groups",
  },
  {
    value: "0",
    label: "New runtimes added",
  },
];

export default async function ToolkitPage() {
  const keyStatus = await getComposerKeyStatus();
  const keyValidated = Boolean(keyStatus);
  const keyMatchesIntegrator = Boolean(
    keyStatus?.user.name &&
      publicEnv.integrator &&
      keyStatus.user.name === publicEnv.integrator,
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:gap-10 lg:py-10">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1.1fr]">
        <div className="relative overflow-hidden rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-6 text-[color:var(--ink)] shadow-[4px_4px_0_var(--ink)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-none bg-[color:var(--accent-soft)]/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-none bg-[color:var(--ink)] border-2 border-[color:var(--ink)] px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--paper)]">
                Builder
              </span>
              <span className="inline-flex rounded-none bg-[color:var(--accent-soft)] px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--accent-strong)]">
                Base-first toolkit
              </span>
            </div>
            <p className="mt-8 text-[0.78rem] font-medium uppercase tracking-[0.35em] text-[color:var(--muted-ink)]">
              Toolkit summary
            </p>
            <h1 className="mt-3 max-w-5xl text-4xl font-bold tracking-[-0.06em] leading-[0.98] tracking-[-0.06em] text-[color:var(--ink)] sm:text-5xl lg:text-[4.4rem]">
              A Base-first Earn builder toolkit.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--muted-ink)] opacity-90 sm:text-lg">
              The starter page handles the live loop. This toolkit page exists
              to show the reusable layers behind it: runtime checks, route
              debugging, proof export, and the local package boundary.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {judgeScan.map((item) => (
                <div
                  key={item}
                  className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] px-4 py-3 text-sm leading-6 text-[color:var(--ink)] shadow-[2px_2px_0_var(--ink)]"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/vaults/0x0000000f2eb9f69274678c76222b35eec7588a65"
                className="inline-flex min-h-12 items-center justify-center rounded-none bg-[color:var(--ink)] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--paper)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
              >
                Open live proof vault
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--ink)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
              >
                Open starter path
              </Link>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-6 shadow-[4px_4px_0_var(--ink)] sm:p-8">
            <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
              Capabilities
            </p>
            <div className="mt-6 grid gap-3">
              {capabilities.map((capability, index) => {
                const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
                return (
                  <div
                    key={capability}
                    className={`flex gap-4 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] px-4 py-3 text-sm leading-relaxed text-[color:var(--ink)] shadow-[2px_2px_0_var(--ink)] motion-rise ${staggerClass}`}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--ink)] font-mono text-[0.6rem] font-bold text-[color:var(--paper)]">
                      {index + 1}
                    </div>
                    <span>{capability}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex-1 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--ink)] p-6 text-[color:var(--paper)] shadow-[4px_4px_0_var(--ink)] sm:p-8">
            <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-white/50">
              Flow rules
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Keep the proof stack in order
            </h2>
            <div className="mt-6 space-y-3">
              {[
                "Start with the Base app loop, not the CLI.",
                "Use the CLI only to prove the toolkit layer is real.",
                "Use the package snippet only to prove the API is narrow and typed.",
                "Stop before the snippets become a second product demo.",
              ].map((rule, index) => (
                <div
                  key={rule}
                  className="flex gap-4 rounded-none border border-white/20 bg-white/5 p-4 text-sm leading-relaxed text-white/90"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-white/40 bg-white/10 font-mono text-[0.6rem] font-bold">
                    {index + 1}
                  </div>
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {submissionClaims.map((claim) => (
          <article
            key={claim.label}
            className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-5 shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-1 hover:-translate-x-1"
          >
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
              {claim.label}
            </p>
            <p className="mt-4 text-4xl font-bold tracking-[-0.06em] tracking-[-0.05em] text-[color:var(--ink)]">
              {claim.value}
            </p>
          </article>
        ))}
      </section>

      <IntegrationDoctor
        integrator={publicEnv.integrator}
        keyValidated={keyValidated}
        keyMatchesIntegrator={keyMatchesIntegrator}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] items-start">
        <div className="flex flex-col gap-6">
          <div className="h-fit rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-6 shadow-[4px_4px_0_var(--ink)] sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
                  Live proof
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-[-0.06em] tracking-[-0.04em] text-[color:var(--ink)]">
                  Base mainnet path proven
                </h2>
              </div>
              <a
                href="https://basescan.org/tx/0xca323b2fffa7f69d2bf40835e8661cc433ccd8c9d9d92ae494fd8c1f90408324"
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[color:var(--ink)] transition-transform hover:-translate-y-1 hover:shadow-[3px_3px_0_var(--ink)] active:translate-y-0 active:shadow-none"
              >
                Inspect tx
              </a>
            </div>
            
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--ink)] p-5 text-[color:var(--paper)] shadow-[4px_4px_0_var(--ink)]">
                <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-white/50">
                  Deposit tx
                </p>
                <p className="mt-3 font-mono text-xs break-all leading-relaxed text-white/90">
                  0xca323b2fffa7f69d2bf40835e8661cc433ccd8c9d9d92ae494fd8c1f90408324
                </p>
              </div>
              <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--accent-strong)] p-5 text-[color:var(--paper)] shadow-[4px_4px_0_var(--ink)]">
                <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-white/50">
                  Portfolio result
                </p>
                <p className="mt-3 text-lg font-bold uppercase tracking-tight leading-tight text-white">
                  Base `morpho-v1` position returned
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-4">
              {proofTimeline.map((step, index) => (
                <div
                  key={step.label}
                  className="group rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] p-5 shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-1"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--ink)] text-lg font-bold text-[color:var(--paper)] group-hover:bg-[color:var(--accent-strong)] transition-colors">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-[color:var(--ink)]">
                        {step.label}
                      </h3>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-[color:var(--muted-ink)]">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-fit rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--ink)] p-6 text-[color:var(--paper)] shadow-[4px_4px_0_var(--ink)] sm:p-8">
            <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-white/50">
              Developer recipes
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.06em] tracking-[-0.04em]">
              Reuse paths
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {recipes.map((recipe, index) => {
                const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
                return (
                  <article
                    key={recipe.title}
                    className={`rounded-none border border-white/20 bg-white/5 p-4 motion-rise ${staggerClass}`}
                  >
                    <h3 className="text-lg font-bold text-white">
                      {recipe.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/70">
                      {recipe.detail}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="h-fit rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] p-6 shadow-[4px_4px_0_var(--ink)] sm:p-8">
            <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
              Local toolkit package
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.06em] tracking-[-0.04em] text-[color:var(--ink)]">
              Reusable modules
            </h2>
            <div className="mt-6 grid gap-4">
              {toolkitModules.map((module) => (
                <article
                  key={module.title}
                  className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-5 shadow-[2px_2px_0_var(--ink)]"
                >
                  <h3 className="text-xl font-bold tracking-tight text-[color:var(--ink)]">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[color:var(--muted-ink)]">
                    {module.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-6 shadow-[4px_4px_0_var(--ink)] sm:p-8 lg:p-10">
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
            Code snippets
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[color:var(--ink)]">
            Consume as a tool layer
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted-ink)] opacity-80">
            The starter page handles the live loop. These snippets exist to
            prove that the toolkit can also be consumed as a narrow developer
            tool layer.
          </p>

          <div className="mt-10 grid gap-6 xl:grid-cols-2">
            {judgeSnippets.map((snippet, index) => {
              const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
              return (
                <article
                  key={snippet.title}
                  className={`rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] p-6 shadow-[4px_4px_0_var(--ink)] motion-rise ${staggerClass}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-[color:var(--ink)]">
                        {snippet.title}
                      </h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-[color:var(--muted-ink)]">
                        {snippet.detail}
                      </p>
                    </div>
                  </div>
                  <pre className="mt-6 overflow-x-auto rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--ink)] p-5 font-mono text-xs leading-6 text-[color:var(--paper)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                    <code>{snippet.code}</code>
                  </pre>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] p-6 shadow-[4px_4px_0_var(--ink)] sm:p-8">
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
            Demo guideline
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-[color:var(--ink)]">
              Flow priority
            </h2>
            <p className="max-w-xl text-sm font-medium leading-7 text-[color:var(--muted-ink)]">
              Maintain the correct sequence during your recorded demo to emphasize the developer experience before diving into the CLI details.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Start with the Base app loop, not the CLI.",
              "Use the CLI only to prove the toolkit layer is real.",
              "Use the package snippet only to prove the API is narrow and typed.",
              "Stop before the snippets become a second product demo.",
            ].map((rule, index) => (
              <div
                key={rule}
                className="flex flex-col gap-4 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-5 shadow-[2px_2px_0_var(--ink)]"
              >
                <div className="flex h-8 w-8 items-center justify-center border-2 border-[color:var(--ink)] bg-[color:var(--ink)] font-mono text-xs font-bold text-[color:var(--paper)]">
                  {index + 1}
                </div>
                <p className="text-sm font-bold leading-relaxed text-[color:var(--ink)] uppercase tracking-tight">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
