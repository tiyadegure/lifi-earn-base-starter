export type EarnToken = {
  address: `0x${string}`;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
};

export type EarnVault = {
  address: `0x${string}`;
  network: string;
  chainId: number;
  slug: string;
  name: string;
  description: string;
  protocol: {
    name: string;
    url?: string;
  };
  underlyingTokens: EarnToken[];
  lpTokens: EarnToken[];
  tags: string[];
  analytics: {
    apy: {
      base: number | null;
      reward: number | null;
      total: number | null;
    };
    apy1d: number | null;
    apy7d: number | null;
    apy30d: number | null;
    tvl: {
      usd: string;
    };
    updatedAt?: string;
  };
  isTransactional: boolean;
  isRedeemable: boolean;
  depositPacks?: Array<{
    name: string;
    stepsType: string;
  }>;
  redeemPacks?: Array<{
    name: string;
    stepsType: string;
  }>;
};

export type EarnVaultListResponse = {
  data: EarnVault[];
  nextCursor?: string | null;
  total: number;
};

export type EarnPosition = {
  chainId: number;
  protocolName: string;
  asset: {
    address: `0x${string}`;
    name: string;
    symbol: string;
    decimals: number;
  };
  balanceUsd: string | null;
  balanceNative: string | null;
};

export type EarnPortfolioResponse = {
  positions: EarnPosition[];
};

export type ComposerQuoteInput = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAddress: string;
  toAddress: string;
  fromAmount: string;
};

export type ComposerQuoteResponse = {
  tool: string;
  integrator?: string;
  action?: {
    fromAmount?: string;
    fromToken?: {
      address: `0x${string}`;
      chainId: number;
      symbol: string;
      decimals: number;
      name: string;
    };
  };
  estimate?: {
    approvalAddress?: `0x${string}`;
    fromAmount?: string;
    toAmount?: string;
    toAmountMin?: string;
  };
  transactionRequest?: {
    to?: `0x${string}`;
    from?: `0x${string}`;
    data?: `0x${string}`;
    value?: string;
    chainId?: number;
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
  includedSteps?: Array<{
    tool: string;
    type: string;
  }>;
};

export type ComposerApiKeyStatus = {
  user: {
    name: string;
    rateLimit: number;
  };
};

export type ComposerExecutionMode = "authenticated" | "public-fallback";

export type RouteStage = {
  tool: string;
  title: string;
  detail: string;
};

export type QuoteFlowKind = "same-chain-vault-deposit";

export type QuoteFlowPreset = {
  id: string;
  label: string;
  summary: string;
  vaultAddress: `0x${string}`;
  sourceChainId: number;
  sourceChainName: string;
  targetChainId: number;
  targetChainName: string;
  fromToken: EarnToken;
  kind: QuoteFlowKind;
};

export type BuildComposerQuoteInputParams = {
  preset: QuoteFlowPreset;
  fromAddress: `0x${string}`;
  toAddress?: `0x${string}`;
  fromAmount: string;
};

export type IntegrationDoctorCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type ServerDoctorInput = {
  integrator: string;
  keyValidated: boolean;
  keyMatchesIntegrator: boolean;
};

export type WalletDoctorInput = {
  isConnected: boolean;
  chainName: string | null;
  onBaseDemoChain: boolean;
  baseNativeBalance: string | null;
  baseUsdcBalance: string | null;
};

export type DoctorSummary = {
  passCount: number;
  warnCount: number;
  failCount: number;
  overallStatus: "blocked" | "caution" | "ready";
};

export type DoctorReport = {
  checks: IntegrationDoctorCheck[];
  summary: DoctorSummary;
};

export type DebugSnapshotContext = {
  flowLabel: string;
  sourceChainName: string;
  targetChainName: string;
  sourceTokenSymbol: string;
  vaultAddress: string;
  quote: ComposerQuoteResponse;
  composerMode: ComposerExecutionMode;
  approvalRequired: boolean;
  approvalChainName: string;
  receiptWatcherChainName: string;
  portfolioPollWindowSeconds: number;
  allowanceStatus: string;
  txHash?: `0x${string}` | null;
  integrator: string;
};

export type DebugBundle = {
  artifact: string;
  generatedAt: string;
  composerMode: ComposerExecutionMode;
  flowPreset: string;
  sourceChain: string;
  targetChain: string;
  sourceToken: string;
  vaultTarget: string;
  topLevelTool: string;
  includedSteps: NonNullable<ComposerQuoteResponse["includedSteps"]>;
  approvalRequired: boolean;
  approvalChain: string | null;
  receiptWatcherChain: string;
  portfolioPollWindowSeconds: number;
  allowanceStatus: string;
  txHash: `0x${string}` | null;
  integrator: string | null;
  transactionRequest: ComposerQuoteResponse["transactionRequest"] | null;
};

export type ApprovalRequirement = {
  required: boolean;
  approvalAddress: `0x${string}` | null;
  approvalTokenAddress: `0x${string}` | null;
  approvalChainId: number | null;
  approvalAmount: bigint | null;
};
