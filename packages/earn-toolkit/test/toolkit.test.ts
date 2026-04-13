import assert from "node:assert/strict";
import test from "node:test";
import {
  buildComposerQuoteInput,
  buildDebugBundle,
  buildShareableDebugSnapshot,
  buildWalletDoctorReport,
  createEarnToolkitClient,
  getApprovalRequirement,
} from "../src/index";
import {
  sampleQuote,
  sampleQuoteWithoutApproval,
  sampleVault,
  sampleVaultWithoutUnderlying,
} from "./fixtures";

test("default preset resolves the Base same-chain vault flow", () => {
  const client = createEarnToolkitClient();
  const preset = client.getDefaultFlowPreset(sampleVault);

  assert.ok(preset);
  assert.equal(preset.id, "base-same-chain");
  assert.equal(preset.vaultAddress, sampleVault.address);
  assert.equal(preset.targetChainId, 8453);
  assert.equal(preset.fromToken.symbol, "USDC");
});

test("default preset returns null when the vault has no usable underlying token", () => {
  const client = createEarnToolkitClient();
  const preset = client.getDefaultFlowPreset(sampleVaultWithoutUnderlying);

  assert.equal(preset, null);
});

test("buildComposerQuoteInput derives a typed quote request from the preset", () => {
  const client = createEarnToolkitClient();
  const preset = client.getDefaultFlowPreset(sampleVault);

  assert.ok(preset);

  const input = buildComposerQuoteInput({
    preset,
    fromAddress: "0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e",
    fromAmount: "20000",
  });

  assert.deepEqual(input, {
    fromChain: "8453",
    toChain: "8453",
    fromToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    toToken: "0x0000000f2eb9f69274678c76222b35eec7588a65",
    fromAddress: "0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e",
    toAddress: "0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e",
    fromAmount: "20000",
  });
});

test("getApprovalRequirement returns deterministic approval metadata", () => {
  const requirement = getApprovalRequirement(sampleQuote);

  assert.deepEqual(requirement, {
    required: true,
    approvalAddress: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
    approvalTokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    approvalChainId: 8453,
    approvalAmount: BigInt(20000),
  });
});

test("getApprovalRequirement returns a non-required result when the quote lacks approval data", () => {
  const requirement = getApprovalRequirement(sampleQuoteWithoutApproval);

  assert.deepEqual(requirement, {
    required: false,
    approvalAddress: null,
    approvalTokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    approvalChainId: 8453,
    approvalAmount: BigInt(20000),
  });
});

test("doctor report summarizes wallet caution states", () => {
  const report = buildWalletDoctorReport({
    isConnected: true,
    chainName: "Base",
    onBaseDemoChain: true,
    baseNativeBalance: null,
    baseUsdcBalance: "0.02",
  });

  assert.equal(report.summary.overallStatus, "caution");
  assert.equal(report.summary.passCount, 3);
  assert.equal(report.summary.warnCount, 1);
  assert.equal(report.summary.failCount, 0);
});

test("doctor report blocks disconnected wallets deterministically", () => {
  const report = buildWalletDoctorReport({
    isConnected: false,
    chainName: null,
    onBaseDemoChain: false,
    baseNativeBalance: null,
    baseUsdcBalance: null,
  });

  assert.equal(report.summary.overallStatus, "blocked");
  assert.equal(report.summary.passCount, 0);
  assert.equal(report.summary.warnCount, 3);
  assert.equal(report.summary.failCount, 1);
});

test("debug bundle builders emit stable proof artifacts", () => {
  const bundle = buildDebugBundle({
    flowLabel: "Base to Base",
    sourceChainName: "Base",
    targetChainName: "Base",
    sourceTokenSymbol: "USDC",
    vaultAddress: sampleVault.address,
    quote: sampleQuote,
    composerMode: "authenticated",
    approvalRequired: true,
    approvalChainName: "Base",
    receiptWatcherChainName: "Base",
    portfolioPollWindowSeconds: 45,
    allowanceStatus: "20000 / 20000",
    txHash: "0xca323b2fffa7f69d2bf40835e8661cc433ccd8c9d9d92ae494fd8c1f90408324",
    integrator: "Developer-Tooling",
  });
  const snapshot = buildShareableDebugSnapshot({
    flowLabel: "Base to Base",
    sourceChainName: "Base",
    targetChainName: "Base",
    sourceTokenSymbol: "USDC",
    vaultAddress: sampleVault.address,
    quote: sampleQuote,
    composerMode: "authenticated",
    approvalRequired: true,
    approvalChainName: "Base",
    receiptWatcherChainName: "Base",
    portfolioPollWindowSeconds: 45,
    allowanceStatus: "20000 / 20000",
    txHash: "0xca323b2fffa7f69d2bf40835e8661cc433ccd8c9d9d92ae494fd8c1f90408324",
    integrator: "Developer-Tooling",
  });

  assert.equal(bundle.flowPreset, "Base to Base");
  assert.equal(bundle.topLevelTool, "composer");
  assert.equal(bundle.txHash, "0xca323b2fffa7f69d2bf40835e8661cc433ccd8c9d9d92ae494fd8c1f90408324");
  assert.match(snapshot, /composer_mode: authenticated/);
  assert.match(snapshot, /included_steps: feeCollection -> composer/);
});

test("debug snapshot renders a stable pending form before tx submission", () => {
  const snapshot = buildShareableDebugSnapshot({
    flowLabel: "Base to Base",
    sourceChainName: "Base",
    targetChainName: "Base",
    sourceTokenSymbol: "USDC",
    vaultAddress: sampleVault.address,
    quote: sampleQuoteWithoutApproval,
    composerMode: "public-fallback",
    approvalRequired: false,
    approvalChainName: "Base",
    receiptWatcherChainName: "Base",
    portfolioPollWindowSeconds: 45,
    allowanceStatus: "n/a",
    txHash: null,
    integrator: "Developer-Tooling",
  });

  assert.match(snapshot, /composer_mode: public-fallback/);
  assert.match(snapshot, /approval_required: no/);
  assert.match(snapshot, /tx_hash: not-submitted/);
});
