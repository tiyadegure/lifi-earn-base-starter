"use client";

import { useEffect, useMemo, useState } from "react";
import { createWalletClient, custom, encodeFunctionData, parseAbi } from "viem";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseChain, getChainExplorerTxUrl, getSupportedChain } from "@/lib/chains";
import { parseAmountInput } from "@/lib/amounts";
import { publicEnv } from "@/lib/env";
import { getActionableQuoteErrorMessage } from "@/lib/quote-errors";
import { useInjectedChainId } from "@/lib/use-injected-chain-id";
import { useHydrated } from "@/lib/use-hydrated";
import type {
  ComposerExecutionMode,
  ComposerQuoteInput,
  ComposerQuoteResponse,
  EarnVault,
} from "@/lib/types";
import { earnToolkitClient } from "lifi-earn-toolkit";

const SAME_CHAIN_POLL_WINDOW_MS = 45_000;

const erc20Abi = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

function emitPortfolioPollingEvent(
  detail:
    | { status: "submitted"; hash: `0x${string}`; pollWindowMs: number }
    | { status: "confirmed"; hash: `0x${string}`; pollWindowMs: number },
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("starter:portfolio-polling", {
      detail,
    }),
  );
}

function getInjectedProvider() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as Window & { ethereum?: object }).ethereum;
}

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function isEip1193Provider(
  provider: object | undefined,
): provider is Eip1193Provider {
  return (
    !!provider &&
    typeof provider === "object" &&
    "request" in provider &&
    typeof provider.request === "function"
  );
}

async function ensureProviderChain(
  provider: Eip1193Provider,
  targetChainId: number,
) {
  const chain = getSupportedChain(targetChainId);

  if (!chain) {
    throw new Error(`Unsupported chain id: ${targetChainId}`);
  }

  const expectedHexChainId = `0x${chain.id.toString(16)}`;
  const currentChainId = await provider.request({ method: "eth_chainId" });

  if (currentChainId === expectedHexChainId) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: expectedHexChainId }],
    });
  } catch (error) {
    const switchError = error as { code?: number };

    if (switchError.code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: expectedHexChainId,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls.default.http,
          blockExplorerUrls: [chain.blockExplorers.default.url],
        },
      ],
    });
  }
}

export function QuoteBuilder({ vault }: { vault: EarnVault }) {
  const hydrated = useHydrated();
  const selectedFlow = useMemo(
    () => earnToolkitClient.getDefaultFlowPreset(vault),
    [vault],
  );
  const [amount, setAmount] = useState(() =>
    selectedFlow
      ? earnToolkitClient.defaultAmount(selectedFlow.fromToken.decimals)
      : "0.02",
  );
  const [submittedTx, setSubmittedTx] = useState<{
    hash: `0x${string}`;
    chainId: number;
  } | null>(null);
  const [composerMode, setComposerMode] =
    useState<ComposerExecutionMode>("public-fallback");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const { address, isConnected } = useAccount();
  const chainId = useInjectedChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!selectedFlow) {
      setAmount("0.02");
      return;
    }

    setAmount((current) =>
      current
        ? current
        : earnToolkitClient.defaultAmount(selectedFlow.fromToken.decimals),
    );
  }, [selectedFlow]);

  const parsedAmount = useMemo(() => {
    if (!selectedFlow) {
      return null;
    }

    try {
      return parseAmountInput(amount, selectedFlow.fromToken.decimals);
    } catch {
      return null;
    }
  }, [amount, selectedFlow]);

  const quoteMutation = useMutation({
    mutationFn: async (input: ComposerQuoteInput) => {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const payload = (await response.json()) as
        | {
            quote: ComposerQuoteResponse;
            composerMode: ComposerExecutionMode;
          }
        | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload ? payload.error : "Unable to build Composer quote",
        );
      }

      setComposerMode(payload.composerMode);
      return payload.quote;
    },
  });
  const resetQuoteMutation = quoteMutation.reset;

  useEffect(() => {
    resetQuoteMutation();
    setSubmittedTx(null);
    setComposerMode("public-fallback");
    setCopyState("idle");
  }, [address, resetQuoteMutation]);

  const quote = quoteMutation.data;
  const walletReady = hydrated && isConnected;
  const quoteTools = quote ? earnToolkitClient.getQuoteTools(quote) : [];
  const routeStages = quote ? earnToolkitClient.getRouteStages(quote) : [];
  const approvalAddress = quote?.estimate?.approvalAddress;
  const approvalTokenAddress = quote?.action?.fromToken?.address;
  const approvalChainId =
    quote?.action?.fromToken?.chainId ?? selectedFlow?.sourceChainId ?? baseChain.id;
  const approvalClient = usePublicClient({ chainId: approvalChainId });
  const requestChainId =
    quote?.transactionRequest?.chainId ?? selectedFlow?.sourceChainId ?? baseChain.id;
  const requestChainClient = usePublicClient({ chainId: requestChainId });
  const approvalAmount = quote?.action?.fromAmount
    ? BigInt(quote.action.fromAmount)
    : null;
  const requiresApproval = Boolean(
    approvalAddress && approvalTokenAddress && approvalAmount,
  );
  const pollWindowMs = SAME_CHAIN_POLL_WINDOW_MS;

  async function copyShareableProof() {
    if (!shareableProofText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareableProofText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  async function downloadDebugBundle() {
    if (!quote || !selectedFlow) {
      return;
    }

    const bundle = earnToolkitClient.buildDebugBundle({
      flowLabel: selectedFlow.label,
      sourceChainName: selectedFlow.sourceChainName,
      targetChainName: selectedFlow.targetChainName,
      sourceTokenSymbol: selectedFlow.fromToken.symbol,
      vaultAddress: vault.address,
      quote,
      composerMode,
      approvalRequired: requiresApproval,
      approvalChainName:
        getSupportedChain(approvalChainId)?.name ?? `Chain ${approvalChainId}`,
      receiptWatcherChainName:
        getSupportedChain(requestChainId)?.name ?? `Chain ${requestChainId}`,
      portfolioPollWindowSeconds: Math.round(pollWindowMs / 1000),
      allowanceStatus: requiresApproval
        ? `${allowanceQuery.data?.toString() ?? "unknown"} / ${approvalAmount?.toString() ?? "unknown"}`
        : "n/a",
      txHash: submittedTx?.hash ?? null,
      integrator: publicEnv.integrator,
    });

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lifi-earn-debug-bundle.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  const allowanceQuery = useQuery({
    queryKey: ["allowance", address, approvalTokenAddress, approvalAddress],
    enabled:
      !!address &&
      !!approvalClient &&
      requiresApproval &&
      approvalTokenAddress !== vault.address,
    queryFn: async () => {
      if (!address || !approvalClient || !approvalTokenAddress || !approvalAddress) {
        return BigInt(0);
      }

      return approvalClient.readContract({
        address: approvalTokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, approvalAddress],
      });
    },
  });

  const hasEnoughAllowance = !requiresApproval
    ? true
    : allowanceQuery.data !== undefined && allowanceQuery.data >= approvalAmount!;
  const topLevelToolMatchesLastStage = quote
    ? routeStages.at(-1)?.tool === quote.tool
    : true;
  const quoteFailureMessage = quoteMutation.error
    ? getActionableQuoteErrorMessage({
        message: quoteMutation.error.message,
        composerMode,
      })
    : null;
  const shareableProofText = quote
    && selectedFlow
    ? earnToolkitClient.buildShareableDebugSnapshot({
        flowLabel: selectedFlow.label,
        sourceChainName: selectedFlow.sourceChainName,
        targetChainName: selectedFlow.targetChainName,
        sourceTokenSymbol: selectedFlow.fromToken.symbol,
        vaultAddress: vault.address,
        quote,
        composerMode,
        approvalRequired: requiresApproval,
        approvalChainName:
          getSupportedChain(approvalChainId)?.name ?? `Chain ${approvalChainId}`,
        receiptWatcherChainName:
          getSupportedChain(requestChainId)?.name ?? `Chain ${requestChainId}`,
        portfolioPollWindowSeconds: Math.round(pollWindowMs / 1000),
        allowanceStatus: requiresApproval
          ? `${allowanceQuery.data?.toString() ?? "unknown"} / ${approvalAmount?.toString() ?? "unknown"}`
          : "n/a",
        txHash: submittedTx?.hash ?? null,
        integrator: publicEnv.integrator,
      })
    : "";

  async function ensureWalletReady(targetChainId: number) {
    if (!address) {
      throw new Error("Connect a wallet before sending a transaction.");
    }

    const targetChain = getSupportedChain(targetChainId);

    if (!targetChain) {
      throw new Error(`Unsupported chain id: ${targetChainId}`);
    }

    if (chainId !== targetChain.id) {
      await switchChainAsync({ chainId: targetChain.id });
    }

    const injectedProvider = getInjectedProvider();

    if (isEip1193Provider(injectedProvider)) {
      await ensureProviderChain(injectedProvider, targetChain.id);
    }

    return { injectedProvider, targetChain };
  }

  async function sendRawTransaction(parameters: {
    chainId: number;
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
    gas?: bigint;
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }) {
    const { injectedProvider, targetChain } = await ensureWalletReady(
      parameters.chainId,
    );

    const requestBase = {
      account: address!,
      chain: targetChain,
      to: parameters.to,
      data: parameters.data,
      value: parameters.value,
      gas: parameters.gas,
    };

    const sendWithClient = async (
      client: NonNullable<typeof walletClient>,
    ) => {
      return parameters.gasPrice
        ? client.sendTransaction({
            ...requestBase,
            gasPrice: parameters.gasPrice,
          })
        : client.sendTransaction({
            ...requestBase,
            maxFeePerGas: parameters.maxFeePerGas,
            maxPriorityFeePerGas: parameters.maxPriorityFeePerGas,
          });
    };

    const activeWalletClient =
      walletClient && walletClient.chain.id === targetChain.id
        ? walletClient
        : (() => {
            if (!isEip1193Provider(injectedProvider)) {
              throw new Error(
                "No wallet client available. Reload the page and reconnect the injected wallet.",
              );
            }

            return createWalletClient({
              account: address!,
              chain: targetChain,
              transport: custom(injectedProvider),
            });
          })();

    return sendWithClient(activeWalletClient);
  }

  const approveMutation = useMutation({
    mutationFn: async (quote: ComposerQuoteResponse) => {
      const spender = quote.estimate?.approvalAddress;
      const tokenAddress = quote.action?.fromToken?.address;
      const amountToApprove = quote.action?.fromAmount
        ? BigInt(quote.action.fromAmount)
        : null;

      if (!spender || !tokenAddress || !amountToApprove) {
        throw new Error(
          "Composer quote did not include the approval metadata needed for ERC20 deposits.",
        );
      }

      const approvalData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amountToApprove],
      });

      const approvalHash = await sendRawTransaction({
        chainId: approvalChainId,
        to: tokenAddress,
        data: approvalData,
      });

      if (approvalClient) {
        await approvalClient.waitForTransactionReceipt({ hash: approvalHash });
      }

      await queryClient.invalidateQueries({
        queryKey: ["allowance", address, tokenAddress, spender],
      });

      return approvalHash;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (quote: ComposerQuoteResponse) => {
      if (!address) {
        throw new Error("Connect a wallet before sending a transaction.");
      }

      if (!quote.transactionRequest?.to || !quote.transactionRequest?.data) {
        throw new Error(
          "Composer response did not include a usable transactionRequest.",
        );
      }

      const transactionRequest = quote.transactionRequest;
      const { to, data } = transactionRequest;

      if (!to || !data) {
        throw new Error(
          "Composer response did not include a usable transactionRequest.",
        );
      }

      const spender = quote.estimate?.approvalAddress;
      const tokenAddress = quote.action?.fromToken?.address;

      if (
        spender &&
        tokenAddress &&
        tokenAddress !== vault.address &&
        approvalAmount &&
        (!allowanceQuery.data || allowanceQuery.data < approvalAmount)
      ) {
        throw new Error("Approve the ERC20 token before sending the deposit transaction.");
      }

      const transactionHash = await sendRawTransaction({
        chainId: transactionRequest.chainId ?? selectedFlow?.sourceChainId ?? baseChain.id,
        to,
        data,
        value: transactionRequest.value
          ? BigInt(transactionRequest.value)
          : undefined,
        gas: transactionRequest.gasLimit
          ? BigInt(transactionRequest.gasLimit)
          : undefined,
        gasPrice: transactionRequest.gasPrice
          ? BigInt(transactionRequest.gasPrice)
          : undefined,
        maxFeePerGas: transactionRequest.maxFeePerGas
          ? BigInt(transactionRequest.maxFeePerGas)
          : undefined,
        maxPriorityFeePerGas: transactionRequest.maxPriorityFeePerGas
          ? BigInt(transactionRequest.maxPriorityFeePerGas)
          : undefined,
      });

      setSubmittedTx({
        hash: transactionHash,
        chainId: transactionRequest.chainId ?? selectedFlow?.sourceChainId ?? baseChain.id,
      });
      emitPortfolioPollingEvent({
        status: "submitted",
        hash: transactionHash,
        pollWindowMs,
      });

      if (requestChainClient) {
        await requestChainClient.waitForTransactionReceipt({ hash: transactionHash });
      }

      emitPortfolioPollingEvent({
        status: "confirmed",
        hash: transactionHash,
        pollWindowMs,
      });

      await queryClient.invalidateQueries({
        queryKey: ["portfolio", address],
      });

      return transactionHash;
    },
  });

  return (
    <section className="motion-rise rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-6 shadow-[4px_4px_0_var(--ink)] [animation-delay:180ms] sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          <div>
            <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
              Quote builder
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.06em] tracking-[-0.04em] text-[color:var(--ink)]">
              Run the standard Base deposit loop
            </h2>
          </div>
          <p className="text-sm leading-7 text-[color:var(--muted-ink)]">
            The main demo path is fixed on purpose: use the first underlying
            token on Base, build one Composer quote, hand the transaction to a
            wallet, and verify the portfolio update afterward.
          </p>
          <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] p-4 text-sm leading-7 text-[color:var(--muted-ink)]">
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
              Fixed flow
            </p>
            {selectedFlow ? (
              <>
                <p className="mt-2 font-semibold text-[color:var(--ink)]">
                  {selectedFlow.label}
                </p>
                <p className="mt-1">{selectedFlow.summary}</p>
              </>
            ) : (
              <p className="mt-2 text-red-700">
                This vault does not expose a usable primary underlying token, so
                the starter cannot build a safe default quote from it.
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                From token
              </span>
              <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-4 py-3 text-sm font-medium text-[color:var(--ink)] shadow-[2px_2px_0_var(--ink)]">
                {selectedFlow
                  ? `${selectedFlow.fromToken.symbol} on ${selectedFlow.sourceChainName}`
                  : "Unavailable for this vault"}
              </div>
            </label>
            <label className="space-y-2">
              <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                Amount
              </span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                className="min-h-12 w-full rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition-[box-shadow,border-color] duration-150 focus:border-[color:var(--accent-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-soft)]"
                placeholder={
                  selectedFlow
                    ? earnToolkitClient.defaultAmount(selectedFlow.fromToken.decimals)
                    : "0.02"
                }
                disabled={!selectedFlow}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (!address || !parsedAmount) {
                  return;
                }

                quoteMutation.mutate(
                  earnToolkitClient.buildComposerQuoteInput({
                    preset: selectedFlow!,
                    fromAddress: address,
                    fromAmount: parsedAmount,
                  }),
                );
              }}
              disabled={
                !walletReady ||
                !selectedFlow ||
                !parsedAmount ||
                quoteMutation.isPending ||
                isSwitching
              }
              className="inline-flex min-h-12 items-center justify-center rounded-none bg-[color:var(--ink)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--paper)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50"
            >
              {quoteMutation.isPending ? "Building quote..." : "Build quote"}
            </button>
            {quote ? (
              <>
                {approvalAddress && !hasEnoughAllowance ? (
                  <button
                    type="button"
                    onClick={() => approveMutation.mutate(quote)}
                    disabled={approveMutation.isPending || isSwitching}
                    className="inline-flex min-h-12 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--ink)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50"
                  >
                    {approveMutation.isPending
                      ? "Approving token..."
                      : `Approve ${selectedFlow?.fromToken.symbol ?? "token"}`}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => sendMutation.mutate(quote)}
                  disabled={
                    sendMutation.isPending ||
                    approveMutation.isPending ||
                    isSwitching ||
                    (!!approvalAddress && !hasEnoughAllowance)
                  }
                  className="inline-flex min-h-12 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--accent-soft)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--accent-strong)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50"
                >
                  {sendMutation.isPending
                    ? "Sending transaction..."
                    : "Send transaction"}
                </button>
              </>
            ) : null}
          </div>
          <div className="space-y-2 text-sm leading-7 text-[color:var(--muted-ink)]">
            {!publicEnv.integrator ? (
              <p className="text-red-700">
                `NEXT_PUBLIC_LIFI_INTEGRATOR` is missing. Quote building will
                fail until you set it.
              </p>
            ) : null}
            {!selectedFlow ? (
              <p className="text-red-700">
                This vault is missing `underlyingTokens[0]`, so the starter
                cannot infer a safe source token for the default deposit flow.
              </p>
            ) : null}
            {!hydrated ? (
              <p>Checking wallet connection...</p>
            ) : !isConnected ? (
              <p>Connect an injected wallet to build a quote.</p>
            ) : null}
            {chainId !== selectedFlow?.sourceChainId && isConnected && selectedFlow ? (
              <p>
                This flow starts on {selectedFlow.sourceChainName}. The starter
                will request a switch to Base before approval or transaction
                handoff.
              </p>
            ) : null}
            {!parsedAmount ? (
              <p>
                {selectedFlow
                  ? "Enter a valid amount using the source token decimals."
                  : "Pick a vault with a visible primary underlying token before building a quote."}
              </p>
            ) : null}
            <p>
              Quote path status:{" "}
              <span className="font-semibold text-[color:var(--ink)]">
                {quote
                  ? composerMode === "authenticated"
                    ? "Authenticated Composer confirmed"
                    : "Public fallback confirmed"
                  : "Build a quote to confirm authenticated versus fallback mode"}
              </span>
            </p>
            {quote && approvalAddress ? (
              <p>
                Allowance spender:{" "}
                <span className="font-mono">{approvalAddress}</span>
                {allowanceQuery.isPending ? " Checking allowance..." : null}
                {approvalAmount !== null && allowanceQuery.data !== undefined ? (
                  <>
                    {" "}
                    Current allowance:{" "}
                    <span className="font-mono">
                      {allowanceQuery.data.toString()}
                    </span>
                    {" / "}
                    <span className="font-mono">{approvalAmount.toString()}</span>
                  </>
                ) : null}
              </p>
            ) : null}
            {approveMutation.error ? (
              <p className="text-red-700">{approveMutation.error.message}</p>
            ) : null}
            {quoteFailureMessage ? (
              <p className="text-red-700">{quoteFailureMessage}</p>
            ) : null}
            {sendMutation.error ? (
              <p className="text-red-700">{sendMutation.error.message}</p>
            ) : null}
            {submittedTx ? (
              <div className="flex flex-wrap items-center gap-3">
                {getChainExplorerTxUrl(submittedTx.chainId, submittedTx.hash) ? (
                  <a
                    href={getChainExplorerTxUrl(
                      submittedTx.chainId,
                      submittedTx.hash,
                    )!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-none bg-[color:var(--paper-strong)] px-3 py-1 font-mono text-xs text-[color:var(--accent-strong)]"
                  >
                    View tx: {submittedTx.hash.slice(0, 10)}...
                    {submittedTx.hash.slice(-8)}
                  </a>
                ) : null}
                {sendMutation.isPending ? (
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-ink)]">
                    Waiting for receipt...
                  </p>
                ) : (
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-ink)]">
                    Receipt confirmed. Portfolio panel is refreshing.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper-strong)] p-5 shadow-[4px_4px_0_var(--ink)]">
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
            Quote response
          </p>
          {quote ? (
            <div className="mt-4 space-y-4 text-sm leading-7 text-[color:var(--muted-ink)]">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]">
                  <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    Flow
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wider text-[color:var(--ink)]">
                    {(selectedFlow?.sourceChainName ?? "Unknown source")} to {baseChain.name}
                  </p>
                </div>
                <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]">
                  <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    Route tool
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                    {quote.tool}
                  </p>
                </div>
                <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]">
                  <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    Integrator
                  </p>
                  <p className="mt-1 font-mono text-sm text-[color:var(--ink)]">
                    {publicEnv.integrator}
                  </p>
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-ink)]">
                Composer mode:{" "}
                <span className="font-semibold text-[color:var(--ink)]">
                  {composerMode === "authenticated"
                    ? "Authenticated"
                    : "Public fallback"}
                </span>
                {quote.integrator && quote.integrator !== publicEnv.integrator ? (
                  <>
                    {" · "}API response integrator:{" "}
                    <span className="font-mono text-[color:var(--ink)]">
                      {quote.integrator}
                    </span>
                  </>
                ) : null}
              </p>
              <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                      Route anatomy
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
                      Read `includedSteps` in order. The top-level `tool` is not
                      always the last execution stage.
                    </p>
                  </div>
                  <span className="rounded-none border-2 border-[color:var(--ink)] px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
                    {routeStages.length} stage{routeStages.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-3 shadow-[2px_2px_0_var(--ink)]">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                      Source chain
                    </p>
                    <p className="mt-1 font-semibold text-[color:var(--ink)]">
                      {selectedFlow?.sourceChainName ?? "Unknown source"}
                    </p>
                  </div>
                  <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-3 shadow-[2px_2px_0_var(--ink)]">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                      Execution chain
                    </p>
                    <p className="mt-1 font-semibold text-[color:var(--ink)]">
                      {getSupportedChain(requestChainId)?.name ?? `Chain ${requestChainId}`}
                    </p>
                  </div>
                  <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-3 shadow-[2px_2px_0_var(--ink)]">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                      Source token
                    </p>
                    <p className="mt-1 font-semibold text-[color:var(--ink)]">
                      {selectedFlow?.fromToken.symbol ?? "Unknown token"}
                    </p>
                  </div>
                  <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-3 shadow-[2px_2px_0_var(--ink)] min-w-0 overflow-hidden">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                      Vault target
                    </p>
                    <p className="mt-1 font-mono text-[0.65rem] text-[color:var(--ink)] break-all leading-relaxed">
                      {vault.address}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]">
                <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                  Included steps
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quoteTools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-none border-2 border-[color:var(--ink)] px-2.5 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]">
                <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                  Stage stack explainer
                </p>
                <div className="mt-4 grid gap-3">
                  {routeStages.map((stage, index) => (
                    <div
                      key={`${stage.tool}-${index}`}
                      className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                            Stage {index + 1}
                          </p>
                          <p className="mt-1 font-semibold text-[color:var(--ink)]">
                            {stage.title}
                          </p>
                        </div>
                        <span className="rounded-none border-2 border-[color:var(--ink)] px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">
                          {stage.tool}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted-ink)]">
                        {stage.detail}
                      </p>
                    </div>
                  ))}
                </div>
                {!topLevelToolMatchesLastStage ? (
                  <p className="mt-3 text-xs leading-6 text-[color:var(--muted-ink)]">
                    Top-level `tool` is <span className="font-mono">{quote.tool}</span>,
                    but the last stage in `includedSteps` is{" "}
                    <span className="font-mono">{routeStages.at(-1)?.tool}</span>.
                    Read the stack in order instead of trusting one label.
                  </p>
                ) : null}
              </div>
              <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]">
                <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                  Execution checklist
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-3 shadow-[2px_2px_0_var(--ink)]">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                      Approval
                    </p>
                    <p className="mt-1 font-semibold text-[color:var(--ink)]">
                      {requiresApproval
                        ? `Required on ${getSupportedChain(approvalChainId)?.name ?? `Chain ${approvalChainId}`}`
                        : "Not required for this quote"}
                    </p>
                    {approvalAddress ? (
                      <p className="mt-1 font-mono text-xs text-[color:var(--muted-ink)]">
                        spender: {approvalAddress}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-3 shadow-[2px_2px_0_var(--ink)]">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                      Receipt watcher
                    </p>
                    <p className="mt-1 font-semibold text-[color:var(--ink)]">
                      {getSupportedChain(requestChainId)?.name ?? `Chain ${requestChainId}`}
                    </p>
                  </div>
                  <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-3 shadow-[2px_2px_0_var(--ink)]">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                      Portfolio polling window
                    </p>
                    <p className="mt-1 font-semibold text-[color:var(--ink)]">
                      {Math.round(pollWindowMs / 1000)} seconds
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] p-4 shadow-[2px_2px_0_var(--ink)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                      Shareable proof / debug panel
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
                      Copy a compact route and execution snapshot for a teammate or issue report.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyShareableProof}
                      className="inline-flex min-h-11 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--paper)] px-4 py-2 text-sm font-bold uppercase tracking-wider text-[color:var(--ink)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                    >
                      {copyState === "copied"
                        ? "Copied"
                        : copyState === "failed"
                          ? "Copy failed"
                          : "Copy debug snapshot"}
                    </button>
                    <button
                      type="button"
                      onClick={downloadDebugBundle}
                      className="inline-flex min-h-11 items-center justify-center rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--accent-soft)] px-4 py-2 text-sm font-bold uppercase tracking-wider text-[color:var(--accent-strong)] transition-transform duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_var(--ink)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                    >
                      Download JSON bundle
                    </button>
                  </div>
                </div>
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded-none border-2 border-[color:var(--ink)] bg-[color:var(--ink)] p-4 font-mono text-xs leading-6 text-[color:var(--paper)] shadow-[2px_2px_0_var(--ink)]">
                  {shareableProofText}
                </pre>
              </div>
              <div className="rounded-none bg-[color:var(--ink)] p-4 text-[color:var(--paper)]">
                <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-white/65">
                  transactionRequest preview
                </p>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-6 text-white/78">
                  {JSON.stringify(quote.transactionRequest, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted-ink)]">
              Build a quote to inspect the exact `transactionRequest` the wallet
              will receive. The template exposes this raw preview on purpose so
              a builder can debug route behavior without opening the LI.FI SDK
              internals first.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
