import { baseChain } from "./chains";
import type { EarnToken, EarnVault, QuoteFlowPreset } from "./types";

export const BASE_USDC: EarnToken = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  chainId: baseChain.id,
  symbol: "USDC",
  decimals: 6,
  name: "USD Coin",
};

export function defaultAmount(decimals: number) {
  return decimals <= 6 ? "0.02" : "0.0001";
}

export function resolvePrimaryUnderlyingToken(vault: EarnVault) {
  return vault.underlyingTokens[0] ?? null;
}

export function buildBaseSameChainDepositPreset(
  vault: EarnVault,
): QuoteFlowPreset | null {
  const baseToken = resolvePrimaryUnderlyingToken(vault);

  if (!baseToken) {
    return null;
  }

  return {
    id: "base-same-chain",
    label: "Base to Base",
    summary: `Use ${baseToken.symbol} on Base and deposit into this Base vault.`,
    vaultAddress: vault.address,
    sourceChainId: baseChain.id,
    sourceChainName: baseChain.name,
    targetChainId: baseChain.id,
    targetChainName: baseChain.name,
    fromToken: baseToken,
    kind: "same-chain-vault-deposit",
  };
}

export function buildQuoteFlowPresets(vault: EarnVault): QuoteFlowPreset[] {
  const preset = buildBaseSameChainDepositPreset(vault);
  return preset ? [preset] : [];
}

export function getDefaultFlowPreset(vault: EarnVault) {
  return buildBaseSameChainDepositPreset(vault);
}

export const createStarterFlowPresets = buildQuoteFlowPresets;
