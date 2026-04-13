import {
  buildComposerQuoteInput,
  buildShareableDebugSnapshot,
  createEarnToolkitClient,
} from "../src/index";
import { sampleQuote, sampleVault } from "../test/fixtures";

const client = createEarnToolkitClient();
const preset = client.getDefaultFlowPreset(sampleVault);

if (!preset) {
  throw new Error("Expected the sample vault to expose a default preset.");
}

const quoteInput = buildComposerQuoteInput({
  preset,
  fromAddress: "0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e",
  fromAmount: "20000",
});

const snapshot = buildShareableDebugSnapshot({
  flowLabel: preset.label,
  sourceChainName: preset.sourceChainName,
  targetChainName: preset.targetChainName,
  sourceTokenSymbol: preset.fromToken.symbol,
  vaultAddress: preset.vaultAddress,
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

process.stdout.write(
  JSON.stringify(
    {
      preset: preset.id,
      quoteInput,
      snapshot,
    },
    null,
    2,
  ) + "\n",
);
