"use client";

import { formatUnits, parseAbi } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import {
  BASE_USDC,
  baseChain,
  earnToolkitClient,
  getSupportedChain,
} from "lifi-earn-toolkit";
import { useInjectedChainId } from "@/lib/use-injected-chain-id";
import { useHydrated } from "@/lib/use-hydrated";

const erc20BalanceAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
]);

function formatBalance(
  value: bigint | undefined,
  decimals: number,
  maximumFractionDigits = 6,
) {
  if (value === undefined) {
    return null;
  }

  const formatted = Number(formatUnits(value, decimals));
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(formatted);
}

function statusStyles(status: "pass" | "warn" | "fail") {
  if (status === "pass") {
    return "border-[color:var(--signal)]/30 bg-[color:var(--signal)]/10 text-[color:var(--ink)]";
  }

  if (status === "warn") {
    return "border-[color:var(--accent-warm)]/30 bg-[color:var(--accent-warm)]/10 text-[color:var(--ink)]";
  }

  return "border-red-200 bg-red-50 text-red-800";
}

export function IntegrationDoctor({
  integrator,
  keyValidated,
  keyMatchesIntegrator,
}: {
  integrator: string;
  keyValidated: boolean;
  keyMatchesIntegrator: boolean;
}) {
  const hydrated = useHydrated();
  const { address, isConnected } = useAccount();
  const chainId = useInjectedChainId();
  const currentChain = chainId ? getSupportedChain(chainId) : null;
  const onBaseDemoChain = chainId === baseChain.id;

  const baseNativeBalance = useBalance({
    address,
    chainId: baseChain.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const baseUsdcBalance = useReadContract({
    abi: erc20BalanceAbi,
    address: BASE_USDC.address,
    chainId: baseChain.id,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const serverReport = earnToolkitClient.buildServerDoctorReport({
    integrator,
    keyValidated,
    keyMatchesIntegrator,
  });
  const walletReport = hydrated
    ? earnToolkitClient.buildWalletDoctorReport({
        isConnected,
        chainName: currentChain?.name ?? (chainId ? `Chain ${chainId}` : null),
        onBaseDemoChain,
        baseNativeBalance: baseNativeBalance.data?.formatted ?? null,
        baseUsdcBalance: formatBalance(
          baseUsdcBalance.data as bigint | undefined,
          BASE_USDC.decimals,
          4,
        ),
      })
    : null;
  const checks = [...serverReport.checks, ...(walletReport?.checks ?? [])];
  const summary = hydrated
    ? earnToolkitClient.summarizeDoctorChecks(checks)
    : {
        passCount: serverReport.summary.passCount,
        warnCount: serverReport.summary.warnCount,
        failCount: 0,
        overallStatus: "syncing",
      };
  const loadingChecks = [
    "Injected wallet connected",
    "Wallet on Base demo chain",
    "Base gas present",
    "Base USDC present",
  ];

  return (
    <section className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-6 shadow-[4px_4px_0_var(--ink)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
            Integration doctor
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.06em] tracking-[-0.04em] text-[color:var(--ink)]">
            Runtime checks for builders
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted-ink)]">
            Use this to clear the obvious demo blockers first: env, wallet,
            Base network, and funding.
          </p>
        </div>
        <div className="rounded-none bg-[color:var(--paper-strong)] px-4 py-3 text-right">
          <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            Overall
          </p>
          <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
            {summary.overallStatus}
          </p>
          <p className="mt-1 text-xs text-[color:var(--muted-ink)]">
            {summary.passCount} pass / {summary.warnCount} warn / {summary.failCount} fail
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checks.map((check, index) => {
          const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
          return (
            <article
              key={check.id}
              className={`rounded-none border p-4 motion-rise ${staggerClass} ${statusStyles(check.status)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{check.label}</p>
                <span className="rounded-none border border-current/20 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.2em]">
                  {check.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 opacity-85">{check.detail}</p>
            </article>
          );
        })}
        {!hydrated
          ? loadingChecks.map((label, index) => {
              const staggerClass = `stagger-${Math.min(
                serverReport.checks.length + index + 1,
                5,
              )}`;

              return (
                <article
                  key={label}
                  className={`rounded-none border border-[color:var(--ink)]/20 bg-[color:var(--paper-strong)] p-4 motion-rise ${staggerClass} text-[color:var(--ink)]`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{label}</p>
                    <span className="rounded-none border border-current/20 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.2em]">
                      syncing
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 opacity-85">
                    Waiting for client wallet state before evaluating this
                    check.
                  </p>
                </article>
              );
            })
          : null}
      </div>
    </section>
  );
}
