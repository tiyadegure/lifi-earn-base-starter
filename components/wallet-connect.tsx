"use client";

import { useMemo } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { baseChain } from "@/lib/chains";
import { useInjectedChainId } from "@/lib/use-injected-chain-id";
import { useHydrated } from "@/lib/use-hydrated";

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnect() {
  const hydrated = useHydrated();
  const { address, isConnected } = useAccount();
  const chainId = useInjectedChainId();
  const { connectors, connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const connector = useMemo(
    () => connectors.find((item) => item.id === "injected") ?? connectors[0],
    [connectors],
  );

  if (!hydrated) {
    return (
      <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-4 py-3 text-sm text-[color:var(--muted-ink)]">
        Checking wallet...
      </div>
    );
  }

  if (!connector) {
    return (
      <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-4 py-3 text-sm text-[color:var(--muted-ink)]">
        No injected wallet found.
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => connect({ connector })}
          className="inline-flex min-h-11 items-center justify-center rounded-none bg-[color:var(--ink)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--paper)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? "Connecting wallet..." : `Connect ${connector.name}`}
        </button>
        {error ? (
          <p className="max-w-xs text-right text-xs text-red-700">
            {error.message}
          </p>
        ) : null}
      </div>
    );
  }

  const onBase = chainId === baseChain.id;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-4 py-3 shadow-[4px_4px_0_var(--ink)]">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
          Wallet
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-none ${
              onBase
                ? "bg-[color:var(--signal)]"
                : "bg-[color:var(--accent-warm)]"
            }`}
          />
          <span className="font-mono text-sm text-[color:var(--ink)]">
            {formatAddress(address)}
          </span>
        </div>
        <p className="mt-1 text-[0.68rem] uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
          {onBase ? "Base" : chainId ? `Chain ${chainId}` : "Unknown chain"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {!onBase ? (
          <button
            type="button"
            onClick={() => switchChain({ chainId: baseChain.id })}
            className="inline-flex min-h-11 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--accent-soft)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--accent-strong)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-60"
            disabled={isSwitching}
          >
            {isSwitching ? "Switching..." : "Switch to Base"}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => disconnect()}
        className="inline-flex min-h-11 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--ink)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
      >
        Disconnect
      </button>
    </div>
  );
}
