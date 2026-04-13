import Link from "next/link";
import { notFound } from "next/navigation";
import { PortfolioPanel } from "@/components/portfolio-panel";
import { QuoteBuilder } from "@/components/quote-builder";
import { VaultDetail } from "@/components/vault-detail";
import { getBaseVaultDetail } from "@/lib/earn-api";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const vault = await getBaseVaultDetail(address).catch(() => null);

  if (!vault) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <div className="motion-rise flex flex-wrap items-center justify-between gap-4 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-5 py-4 shadow-[4px_4px_0_var(--ink)] ">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-none bg-[color:var(--paper-strong)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-ink)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
          >
            Back to vaults
          </Link>
          <h1 className="text-3xl font-bold tracking-[-0.06em] tracking-[-0.04em] text-[color:var(--ink)] sm:text-4xl">
            {vault.name}
          </h1>
          <p className="text-sm leading-7 text-[color:var(--muted-ink)]">
            This page serves one standard demo path: same-chain Base deposit,
            wallet handoff, and portfolio verification.
          </p>
        </div>
        <div className="rounded-none bg-[color:var(--ink)] px-4 py-3 text-right text-[color:var(--paper)]">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-white/65">
            Vault address
          </p>
          <p className="mt-1 font-mono text-sm">
            {vault.address.slice(0, 6)}...{vault.address.slice(-4)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-6">
          <VaultDetail vault={vault} />
          <QuoteBuilder vault={vault} />
        </div>
        <PortfolioPanel />
      </div>
    </div>
  );
}
