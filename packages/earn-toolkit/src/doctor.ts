import type {
  DoctorReport,
  DoctorSummary,
  IntegrationDoctorCheck,
  ServerDoctorInput,
  WalletDoctorInput,
} from "./types";

export function buildServerDoctorChecks(
  input: ServerDoctorInput,
): IntegrationDoctorCheck[] {
  return [
    {
      id: "integrator",
      label: "Integrator configured",
      status: input.integrator ? "pass" : "fail",
      detail: input.integrator
        ? `Using ${input.integrator} as the LI.FI integrator string.`
        : "NEXT_PUBLIC_LIFI_INTEGRATOR is missing.",
    },
    {
      id: "composer-key",
      label: "Composer key validates",
      status: input.keyValidated ? "pass" : "warn",
      detail: input.keyValidated
        ? "Server-side LI.FI key validation succeeded."
        : "No server-side LI.FI key validation is available.",
    },
    {
      id: "integrator-match",
      label: "Integrator matches key owner",
      status: input.keyValidated
        ? input.keyMatchesIntegrator
          ? "pass"
          : "warn"
        : "warn",
      detail: input.keyValidated
        ? input.keyMatchesIntegrator
          ? "Configured integrator matches the validated LI.FI account."
          : "Configured integrator differs from the validated LI.FI account."
        : "Cannot compare integrator against a validated LI.FI account because no server-side key validation is available.",
    },
  ];
}

export function buildWalletDoctorChecks(
  input: WalletDoctorInput,
): IntegrationDoctorCheck[] {
  return [
    {
      id: "wallet-connected",
      label: "Injected wallet connected",
      status: input.isConnected ? "pass" : "fail",
      detail: input.isConnected
        ? "A browser wallet is connected to the starter."
        : "Connect an injected wallet before running live flows.",
    },
    {
      id: "starter-chain",
      label: "Wallet on Base demo chain",
      status: input.isConnected
        ? input.onBaseDemoChain
          ? "pass"
          : "warn"
        : "warn",
      detail: input.isConnected
        ? input.onBaseDemoChain
          ? `Wallet is currently on ${input.chainName}.`
          : `Wallet is on ${input.chainName ?? "an unsupported chain"}. Switch to Base for the standard demo path.`
        : "No connected wallet to inspect.",
    },
    {
      id: "base-gas",
      label: "Base gas present",
      status: input.baseNativeBalance && Number(input.baseNativeBalance) > 0
        ? "pass"
        : input.isConnected
          ? "warn"
          : "warn",
      detail:
        input.baseNativeBalance && Number(input.baseNativeBalance) > 0
          ? `Base native balance detected: ${input.baseNativeBalance}.`
          : "No Base native balance detected yet. Same-chain send will fail without gas.",
    },
    {
      id: "base-usdc",
      label: "Base USDC present",
      status: input.baseUsdcBalance && Number(input.baseUsdcBalance) > 0
        ? "pass"
        : input.isConnected
          ? "warn"
          : "warn",
      detail:
        input.baseUsdcBalance && Number(input.baseUsdcBalance) > 0
          ? `Base USDC balance detected: ${input.baseUsdcBalance}.`
          : "No Base USDC detected. Same-chain USDC deposit paths will need funding first.",
    },
  ];
}

export function summarizeDoctorChecks(checks: IntegrationDoctorCheck[]) {
  const passCount = checks.filter((check) => check.status === "pass").length;
  const warnCount = checks.filter((check) => check.status === "warn").length;
  const failCount = checks.filter((check) => check.status === "fail").length;

  return {
    passCount,
    warnCount,
    failCount,
    overallStatus: failCount > 0 ? "blocked" : warnCount > 0 ? "caution" : "ready",
  } satisfies DoctorSummary;
}

export function buildDoctorReport(
  checks: IntegrationDoctorCheck[],
): DoctorReport {
  return {
    checks,
    summary: summarizeDoctorChecks(checks),
  };
}

export function buildServerDoctorReport(input: ServerDoctorInput): DoctorReport {
  return buildDoctorReport(buildServerDoctorChecks(input));
}

export function buildWalletDoctorReport(input: WalletDoctorInput): DoctorReport {
  return buildDoctorReport(buildWalletDoctorChecks(input));
}
