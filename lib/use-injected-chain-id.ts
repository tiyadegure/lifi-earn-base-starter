"use client";

import { useSyncExternalStore } from "react";

type Eip1193Provider = {
  chainId?: string;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

function getInjectedProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  return provider && typeof provider.request === "function" ? provider : null;
}

function parseChainId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return value.startsWith("0x") ? Number.parseInt(value, 16) : Number(value);
}

export function useInjectedChainId() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const provider = getInjectedProvider();

      if (!provider) {
        return () => {};
      }

      const handleChange = () => {
        onStoreChange();
      };

      provider.on?.("chainChanged", handleChange);
      provider.on?.("connect", handleChange);
      provider.on?.("disconnect", handleChange);

      return () => {
        provider.removeListener?.("chainChanged", handleChange);
        provider.removeListener?.("connect", handleChange);
        provider.removeListener?.("disconnect", handleChange);
      };
    },
    () => {
      const provider = getInjectedProvider();
      return provider ? parseChainId(provider.chainId ?? null) : null;
    },
    () => null,
  );
}
