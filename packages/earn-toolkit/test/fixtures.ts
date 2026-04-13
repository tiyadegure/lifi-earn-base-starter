import type { ComposerQuoteResponse, EarnVault } from "../src/types";

export const sampleVault: EarnVault = {
  address: "0x0000000f2eb9f69274678c76222b35eec7588a65",
  network: "base",
  chainId: 8453,
  slug: "yo-usdc",
  name: "USDC",
  description: "Sample Base vault",
  protocol: {
    name: "yo-protocol",
    url: "https://app.yo.xyz",
  },
  underlyingTokens: [
    {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      chainId: 8453,
      symbol: "USDC",
      decimals: 6,
      name: "USD Coin",
    },
  ],
  lpTokens: [],
  tags: ["base", "transactional"],
  analytics: {
    apy: {
      base: 12.1,
      reward: 4.37,
      total: 16.47,
    },
    apy1d: 16.52,
    apy7d: 15.91,
    apy30d: 14.13,
    tvl: {
      usd: "27700000",
    },
  },
  isTransactional: true,
  isRedeemable: false,
};

export const sampleQuote: ComposerQuoteResponse = {
  tool: "composer",
  integrator: "LIFI-API",
  action: {
    fromAmount: "20000",
    fromToken: {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      chainId: 8453,
      symbol: "USDC",
      decimals: 6,
      name: "USD Coin",
    },
  },
  estimate: {
    approvalAddress: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
    fromAmount: "20000",
    toAmount: "19376",
    toAmountMin: "19300",
  },
  transactionRequest: {
    to: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
    from: "0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e",
    data: "0x1234",
    value: "0x0",
    chainId: 8453,
  },
  includedSteps: [
    {
      tool: "feeCollection",
      type: "lifi",
    },
    {
      tool: "composer",
      type: "lifi",
    },
  ],
};

export const sampleQuoteWithoutApproval: ComposerQuoteResponse = {
  ...sampleQuote,
  estimate: {
    fromAmount: "20000",
    toAmount: "19376",
    toAmountMin: "19300",
  },
};

export const sampleVaultWithoutUnderlying: EarnVault = {
  ...sampleVault,
  address: "0x1111111111111111111111111111111111111111",
  slug: "empty-vault",
  name: "Empty Vault",
  underlyingTokens: [],
};
