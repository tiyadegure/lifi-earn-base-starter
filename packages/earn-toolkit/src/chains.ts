import { base } from "wagmi/chains";

export const baseChain = base;
const supportedStarterChains = [baseChain] as const;

export function getSupportedChain(chainId: number) {
  return supportedStarterChains.find((chain) => chain.id === chainId);
}

export function getChainExplorerTxUrl(chainId: number, hash: string) {
  const chain = getSupportedChain(chainId);

  if (!chain) {
    return null;
  }

  return `${chain.blockExplorers.default.url}/tx/${hash}`;
}
