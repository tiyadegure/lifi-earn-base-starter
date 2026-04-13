import Link from "next/link";
import { IntegrationDoctor } from "@/components/integration-doctor";
import { VaultList } from "@/components/vault-list";
import { getComposerKeyStatus } from "@/lib/composer-api";
import { getBaseVaults } from "@/lib/earn-api";
import { publicEnv } from "@/lib/env";

export default async function Home() {
  const [vaults, keyStatus] = await Promise.all([
    getBaseVaults(10),
    getComposerKeyStatus(),
  ]);
  const keyMatchesIntegrator =
    keyStatus?.user.name &&
    publicEnv.integrator &&
    keyStatus.user.name === publicEnv.integrator;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:gap-10 lg:py-10">
      <section className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
        <div className="motion-rise rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-6 shadow-[4px_4px_0_var(--ink)]  sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-none bg-[color:var(--ink)] px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--paper)]">
              Base-first
            </span>
            <span className="inline-flex rounded-none bg-[color:var(--accent-soft)] px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--accent-strong)]">
              Builder starter
            </span>
          </div>
          <div className="mt-8 max-w-3xl space-y-5">
            <p className="text-[0.78rem] font-medium uppercase tracking-[0.35em] text-[color:var(--muted-ink)]">
              Builder proof surface
            </p>
            <h1 className="max-w-4xl text-4xl font-bold tracking-[-0.06em] leading-[1.02] tracking-[-0.05em] text-[color:var(--ink)] sm:text-5xl lg:text-[4.5rem]">
              Start from a real Base Earn loop, not from a blank repo.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[color:var(--muted-ink)] sm:text-lg">
              This starter is scoped around one standard path:
              discover a Base vault, build a Composer quote, hand the
              transaction to a wallet, and verify the resulting portfolio
              state. Everything else stays secondary.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={vaults[0] ? `/vaults/${vaults[0].address}` : "/"}
              className="inline-flex min-h-12 items-center justify-center rounded-none bg-[color:var(--ink)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--paper)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
            >
              Open a live vault flow
            </Link>
            <Link
              href="/toolkit"
              className="inline-flex min-h-12 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--ink)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
            >
              Open toolkit details
            </Link>
            <a
              href="https://lifi-faucet.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--ink)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
            >
              Claim Base faucet
            </a>
          </div>
          <div className="mt-6 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] p-4 text-sm leading-7 text-[color:var(--muted-ink)]">
            <p>
              Open <span className="font-semibold text-[color:var(--ink)]">the starter flow here first</span>.
              Use <span className="font-semibold text-[color:var(--ink)]">/toolkit</span> after the main Base path is working and you need diagnostics or export artifacts.
            </p>
          </div>
        </div>

        <aside className="motion-rise rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] p-6 shadow-[4px_4px_0_var(--ink)] [animation-delay:120ms] sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
                First-run checklist
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--ink)]">
                What the main demo path needs
              </h2>
            </div>
            <div className="rounded-none bg-[color:var(--paper)] px-3 py-2 text-right shadow-[2px_2px_0_var(--ink)] border-2 border-[color:var(--ink)]">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--muted-ink)]">
                Setup
              </p>
              <p className="mt-1 text-sm font-bold text-[color:var(--ink)]">
                {publicEnv.integrator ? "READY" : "MISSING"}
              </p>
            </div>
          </div>
          
          <div className="mt-8 space-y-3">
            {[
              {
                text: "`NEXT_PUBLIC_LIFI_INTEGRATOR` is part of the working surface, not a later analytics detail.",
                color: "bg-[color:var(--accent-strong)]",
              },
              {
                text: "Quotes build through the starter quote route. In trusted local mode with a LI.FI key, that route uses authenticated Composer.",
                color: "bg-[color:var(--signal)]",
              },
              {
                text: "The recorded live proof stays on Base. Keep your first demo on that same path.",
                color: "bg-[color:var(--accent-warm)]",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-4 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]"
              >
                <div className={`mt-1.5 h-3 w-3 shrink-0 rounded-none ${item.color} border border-[color:var(--ink)]`} />
                <p className="text-sm leading-relaxed text-[color:var(--ink)]">{item.text}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-5 text-sm leading-7 text-[color:var(--muted-ink)] shadow-[2px_2px_0_var(--ink)]">
            <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)] mb-2">
              Status
            </p>
            <p className="text-[color:var(--ink)] font-medium leading-relaxed">
              {keyStatus
                ? keyMatchesIntegrator
                  ? "Server-side LI.FI validation is healthy, and the configured integrator matches the validated account."
                  : "Server-side LI.FI validation is healthy, but the configured integrator does not match the validated account."
                : "Server-side LI.FI validation is unavailable. The main UI still works, but protected diagnostics are degraded."}
            </p>
          </div>
        </aside>
      </section>

      <IntegrationDoctor
        integrator={publicEnv.integrator}
        keyValidated={Boolean(keyStatus)}
        keyMatchesIntegrator={Boolean(keyMatchesIntegrator)}
      />

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] items-start">
        <div className="motion-rise rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-5 shadow-[4px_4px_0_var(--ink)] [animation-delay:180ms] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
                Transactional Base vaults
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.06em] tracking-[-0.04em] text-[color:var(--ink)]">
                Start from a real vault, not from API guesswork.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[color:var(--muted-ink)]">
              These rows are fetched from the public Earn Data API, filtered to
              Base and transactional vaults, and sorted for fast builder
              inspection.
            </p>
          </div>
          <div className="mt-6">
            <VaultList vaults={vaults} />
          </div>
        </div>

        <div className="motion-rise h-fit flex flex-col gap-6 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--ink)] p-6 text-[color:var(--paper)] shadow-[4px_4px_0_var(--ink)] [animation-delay:240ms]">
          <div>
            <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-white/50">
              Starter scope
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              One convincing flow beats a broad surface.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              This repo is a narrow builder tool that proves one stable Earn
              plus Composer execution loop with real Base funds.
            </p>
          </div>
          
          <div className="space-y-3 border-t border-white/10 pt-6">
            {[
              "1. Connect injected wallet",
              "2. Inspect a Base vault",
              "3. Build a Composer quote",
              "4. Approve if required",
              "5. Send transaction",
              "6. Verify portfolio output",
            ].map((step, index) => (
              <div
                key={index}
                className="rounded-none border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white/90"
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
