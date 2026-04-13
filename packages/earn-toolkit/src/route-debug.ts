import type {
  ComposerQuoteResponse,
  DebugBundle,
  DebugSnapshotContext,
  RouteStage,
} from "./types";

export function getQuoteTools(quote: ComposerQuoteResponse) {
  const tools =
    quote.includedSteps?.map((step) => step.tool).filter(Boolean) ?? [];
  return Array.from(new Set(tools));
}

export function getRouteStages(quote: ComposerQuoteResponse): RouteStage[] {
  return (quote.includedSteps ?? []).map((step) => {
    switch (step.tool) {
      case "feeCollection":
        return {
          tool: step.tool,
          title: "Fee collection",
          detail:
            "LI.FI collects the route-level fee before the rest of the flow executes.",
        };
      case "composer":
        return {
          tool: step.tool,
          title: "Vault execution",
          detail:
            "Composer turns the route into the actual deposit or withdrawal against the vault target.",
        };
      case "across":
        return {
          tool: step.tool,
          title: "Bridge stage",
          detail:
            "Assets bridge across chains before the final vault interaction on Base.",
        };
      case "kyberswap":
        return {
          tool: step.tool,
          title: "Swap stage",
          detail:
            "A token swap happens before the route reaches the vault execution stage.",
        };
      default:
        return {
          tool: step.tool,
          title: step.tool,
          detail:
            "This stage is part of the executable LI.FI route and should be read in order.",
        };
    }
  });
}

export function buildShareableDebugSnapshot(context: DebugSnapshotContext) {
  return [
    "# LI.FI Earn starter proof/debug snapshot",
    `composer_mode: ${context.composerMode}`,
    `flow_preset: ${context.flowLabel}`,
    `source_chain: ${context.sourceChainName}`,
    `target_chain: ${context.targetChainName}`,
    `source_token: ${context.sourceTokenSymbol}`,
    `vault_target: ${context.vaultAddress}`,
    `top_level_tool: ${context.quote.tool}`,
    `included_steps: ${
      context.quote.includedSteps?.length
        ? context.quote.includedSteps.map((step) => step.tool).join(" -> ")
        : "none"
    }`,
    `approval_required: ${context.approvalRequired ? "yes" : "no"}`,
    `approval_chain: ${context.approvalRequired ? context.approvalChainName : "n/a"}`,
    `receipt_watcher_chain: ${context.receiptWatcherChainName}`,
    `portfolio_poll_window_seconds: ${context.portfolioPollWindowSeconds}`,
    `allowance_status: ${context.allowanceStatus}`,
    `tx_hash: ${context.txHash ?? "not-submitted"}`,
    `integrator_configured: ${context.integrator || "missing"}`,
  ].join("\n");
}

export function buildDebugBundle(context: DebugSnapshotContext) {
  return {
    artifact: "lifi-earn-base-starter",
    generatedAt: new Date().toISOString(),
    composerMode: context.composerMode,
    flowPreset: context.flowLabel,
    sourceChain: context.sourceChainName,
    targetChain: context.targetChainName,
    sourceToken: context.sourceTokenSymbol,
    vaultTarget: context.vaultAddress,
    topLevelTool: context.quote.tool,
    includedSteps: context.quote.includedSteps ?? [],
    approvalRequired: context.approvalRequired,
    approvalChain: context.approvalRequired ? context.approvalChainName : null,
    receiptWatcherChain: context.receiptWatcherChainName,
    portfolioPollWindowSeconds: context.portfolioPollWindowSeconds,
    allowanceStatus: context.allowanceStatus,
    txHash: context.txHash ?? null,
    integrator: context.integrator || null,
    transactionRequest: context.quote.transactionRequest ?? null,
  } satisfies DebugBundle;
}
