import Link from "next/link";
import type { EarnVault } from "@/lib/types";

function formatPercent(value: number | null | undefined) {
  if (value == null) {
    return "n/a";
  }

  return `${value.toFixed(2)}%`;
}

function formatUsd(value: string | null | undefined) {
  if (!value) {
    return "n/a";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: amount >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: amount >= 1_000_000 ? 1 : 0,
  }).format(amount);
}

export function VaultCard({ vault, index = 0 }: { vault: EarnVault; index?: number }) {
  const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
  const underlyingSummary = vault.underlyingTokens.length
    ? vault.underlyingTokens.map((token) => token.symbol).join(", ")
    : "No underlying tokens exposed";
  return (
    <Link
      href={`/vaults/${vault.address}`}
      className={`group grid gap-4 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[4px_4px_0_var(--ink)] transition-all duration-200 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] hover:shadow-[4px_4px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none sm:grid-cols-[1.2fr_0.8fr] motion-rise ${staggerClass}`}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
              {vault.protocol.name}
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[color:var(--ink)]">
              {vault.name}
            </h3>
          </div>
          <span className="rounded-none bg-[color:var(--accent-soft)] px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--accent-strong)]">
            {vault.network}
          </span>
        </div>
        <p className="text-sm leading-7 text-[color:var(--muted-ink)]">
          Underlying: {underlyingSummary}
        </p>
        <div className="flex flex-wrap gap-2">
          {vault.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-none border-2 border-[color:var(--ink)] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-[color:var(--muted-ink)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-none bg-[color:var(--paper-strong)] p-3">
        <div>
          <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            APY
          </p>
          <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
            {formatPercent(vault.analytics.apy.total)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            TVL
          </p>
          <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
            {formatUsd(vault.analytics.tvl.usd)}
          </p>
        </div>
        <div className="col-span-2">
          <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            Vault
          </p>
          <p className="mt-1 font-mono text-sm text-[color:var(--ink)]">
            {vault.address.slice(0, 10)}...{vault.address.slice(-8)}
          </p>
        </div>
      </div>
    </Link>
  );
}
