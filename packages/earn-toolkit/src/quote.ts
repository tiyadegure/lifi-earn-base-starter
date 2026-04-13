import type {
  ApprovalRequirement,
  BuildComposerQuoteInputParams,
  ComposerQuoteInput,
  ComposerQuoteResponse,
} from "./types";

export function buildComposerQuoteInput(
  params: BuildComposerQuoteInputParams,
): ComposerQuoteInput {
  return {
    fromChain: String(params.preset.sourceChainId),
    toChain: String(params.preset.targetChainId),
    fromToken: params.preset.fromToken.address,
    toToken: params.preset.vaultAddress,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress ?? params.fromAddress,
    fromAmount: params.fromAmount,
  };
}

export function getApprovalRequirement(
  quote: ComposerQuoteResponse,
): ApprovalRequirement {
  const approvalAmount = quote.action?.fromAmount
    ? BigInt(quote.action.fromAmount)
    : null;
  const approvalAddress = quote.estimate?.approvalAddress ?? null;
  const approvalTokenAddress = quote.action?.fromToken?.address ?? null;
  const approvalChainId = quote.action?.fromToken?.chainId ?? null;

  return {
    required: Boolean(approvalAddress && approvalTokenAddress && approvalAmount),
    approvalAddress,
    approvalTokenAddress,
    approvalChainId,
    approvalAmount,
  };
}
