"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import type { EarnPortfolioResponse } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";

export function PortfolioPanel() {
  const { address, isConnected } = useAccount();
  const hydrated = useHydrated();
  const [activePollingState, setActivePollingState] = useState<{
    status: "submitted" | "confirmed";
    hash: `0x${string}`;
    pollWindowMs: number;
  } | null>(null);

  const portfolioQuery = useQuery({
    queryKey: ["portfolio", address],
    enabled: !!address && isConnected && hydrated,
    refetchInterval: activePollingState ? 4000 : 15000,
    queryFn: async () => {
      const response = await fetch(`/api/portfolio/${address}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Unable to fetch portfolio data");
      }
      return (await response.json()) as EarnPortfolioResponse;
    },
  });

  useEffect(() => {
    const handlePollingEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      setActivePollingState(customEvent.detail);
    };

    window.addEventListener(
      "starter:portfolio-polling",
      handlePollingEvent as EventListener,
    );
    return () =>
      window.removeEventListener(
        "starter:portfolio-polling",
        handlePollingEvent as EventListener,
      );
  }, []);

  const previousPositionCount = useRef<number | null>(null);
  const activePortfolio = portfolioQuery.data;

  useEffect(() => {
    if (!activePollingState || !activePortfolio) {
      return;
    }

    if (previousPositionCount.current === null) {
      previousPositionCount.current = activePortfolio.positions.length;
      return;
    }

    if (activePortfolio.positions.length > previousPositionCount.current) {
      setActivePollingState(null);
      previousPositionCount.current = activePortfolio.positions.length;
    }
  }, [activePortfolio, activePollingState]);

  const isPollingActive = Boolean(activePollingState);

  return (
    <aside className="h-fit motion-rise rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-6 shadow-[4px_4px_0_var(--ink)] [animation-delay:240ms] sm:p-8 lg:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
            Portfolio verification
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.06em] tracking-[-0.04em] text-[color:var(--ink)]">
            Check the wallet against Earn output
          </h2>
        </div>
        <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--ink)] px-3 py-1 font-mono text-[0.65rem] font-bold text-[color:var(--paper)] uppercase tracking-widest">
          Live verification
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-[color:var(--muted-ink)] max-w-xl">
        This panel stays close to the live API shape. It does not try to hide
        empty arrays or re-label protocol names.
      </p>

      {activePollingState ? (
        <div className="mt-4 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)] shadow-[2px_2px_0_var(--ink)]">
          <p className="font-bold uppercase tracking-wider">
            {activePollingState.status === "submitted"
              ? "Transaction submitted"
              : "Receipt confirmed"}
          </p>
          <p className="mt-1 opacity-90">
            {activePollingState.status === "submitted"
              ? "Polling for receipt and portfolio updates."
              : "Polling the Earn portfolio endpoint for fresh positions."}
          </p>
          {activePollingState.hash ? (
            <p className="mt-2 font-mono break-all opacity-80">{activePollingState.hash}</p>
          ) : null}
        </div>
      ) : null}

      {!hydrated ? (
        <div className="mt-6 rounded-none border-2 border-dashed border-[color:var(--ink)] bg-[color:var(--paper)] px-5 py-8 text-sm leading-7 text-[color:var(--muted-ink)]">
          Checking wallet state before querying the Earn portfolio endpoint.
        </div>
      ) : !isConnected || !address ? (
        <div className="mt-6 rounded-none border-2 border-dashed border-[color:var(--ink)] bg-[color:var(--paper)] px-5 py-8 text-sm leading-7 text-[color:var(--muted-ink)]">
          Connect a wallet first. This panel only reads `GET /v1/portfolio/:address/positions` for the active address.
        </div>
      ) : null}

      {portfolioQuery.isLoading ? (
        <div className="mt-6 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-5 py-8 text-sm text-[color:var(--muted-ink)] shadow-[2px_2px_0_var(--ink)]">
          Loading portfolio...
        </div>
      ) : null}

      {portfolioQuery.error ? (
        <div className="mt-6 rounded-none border-2 border-red-600 bg-red-50 px-5 py-8 text-sm leading-7 text-red-700 shadow-[2px_2px_0_#dc2626]">
          {portfolioQuery.error.message}
        </div>
      ) : null}

      {activePortfolio && activePortfolio.positions.length === 0 ? (
        <div className="mt-6 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-5 py-8 text-sm leading-7 text-[color:var(--muted-ink)] shadow-[2px_2px_0_var(--ink)]">
          The endpoint returned an empty `positions` array for this wallet. That
          is a normal runtime condition before a first successful deposit, and
          it can also happen for wallets this endpoint does not currently map to
          visible positions.
        </div>
      ) : null}

      {activePortfolio && activePortfolio.positions.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {activePortfolio.positions.map((position) => (
            <div
              key={`${position.chainId}:${position.protocolName}:${position.asset.address}`}
              className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    {position.protocolName}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[color:var(--ink)]">
                    {position.asset.symbol}
                  </h3>
                </div>
                <span className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[color:var(--ink)]">
                  chain {position.chainId}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] p-3 shadow-[2px_2px_0_var(--ink)] text-sm text-[color:var(--muted-ink)]">
                <div className="min-w-0">
                  <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em]">
                    Balance USD
                  </p>
                  <p className="mt-1 font-mono text-xs font-semibold text-[color:var(--ink)] break-all leading-tight">
                    {position.balanceUsd ?? "n/a"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em]">
                    Balance Native
                  </p>
                  <p className="mt-1 font-mono text-xs font-semibold text-[color:var(--ink)] break-all leading-tight">
                    {position.balanceNative ?? "n/a"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
