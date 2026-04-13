import type { EarnVault } from "@/lib/types";

function formatNullablePercent(value: number | null | undefined) {
  if (value == null) {
    return "n/a";
  }

  return `${value.toFixed(2)}%`;
}

function formatUsd(value: string | null | undefined) {
  if (!value) {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value));
}

export function VaultDetail({ vault }: { vault: EarnVault }) {
  const underlyingSummary = vault.underlyingTokens.length
    ? vault.underlyingTokens.map((token) => token.symbol).join(", ")
    : "No underlying tokens exposed by the API";

  return (
    <section className="motion-rise rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-6 shadow-[4px_4px_0_var(--ink)] [animation-delay:120ms] sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div>
            <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
              Vault briefing
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.06em] tracking-[-0.04em] text-[color:var(--ink)]">
              Discovery and execution metadata
            </h2>
          </div>
          <p className="text-sm leading-7 text-[color:var(--muted-ink)]">
            The starter keeps this panel blunt on purpose. It exposes the fields
            a builder typically misreads first: protocol name, underlying
            tokens, transactional flags, and the vault address that becomes the
            Composer `toToken`.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-none bg-[color:var(--paper-strong)] p-4">
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                Underlying
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                {underlyingSummary}
              </p>
            </div>
            <div className="rounded-none bg-[color:var(--paper-strong)] p-4">
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                Protocol
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                {vault.protocol.name}
              </p>
            </div>
            <div className="rounded-none bg-[color:var(--paper-strong)] p-4">
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                Transactional
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                {vault.isTransactional ? "Yes" : "No"}
              </p>
            </div>
            <div className="rounded-none bg-[color:var(--paper-strong)] p-4">
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                Redeemable
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                {vault.isRedeemable ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4 rounded-none bg-[color:var(--ink)] p-5 text-[color:var(--paper)] shadow-[4px_4px_0_var(--ink)]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-white/65">
                Total APY
              </p>
              <p className="mt-1 text-xl font-semibold">
                {formatNullablePercent(vault.analytics.apy.total)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-white/65">
                TVL
              </p>
              <p className="mt-1 text-xl font-semibold">
                {formatUsd(vault.analytics.tvl.usd)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-white/65">
                APY 1d
              </p>
              <p className="mt-1 font-semibold">
                {formatNullablePercent(vault.analytics.apy1d)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-white/65">
                APY 30d
              </p>
              <p className="mt-1 font-semibold">
                {formatNullablePercent(vault.analytics.apy30d)}
              </p>
            </div>
          </div>
          <div className="space-y-3 border-t border-[color:var(--paper)] pt-4 text-sm leading-7 text-white/75">
            <p>
              Composer target (`toToken`) is the vault address, not the
              underlying token.
            </p>
            <p className="font-mono text-xs break-all">{vault.address}</p>
            {vault.protocol.url ? (
              <a
                href={vault.protocol.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-none border-2 border-[color:var(--ink)] px-3 py-2 text-sm font-bold uppercase tracking-wider text-white transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
              >
                Open protocol page
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
