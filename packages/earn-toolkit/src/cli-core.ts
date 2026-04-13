import { readFile } from "node:fs/promises";
import type {
  ComposerQuoteResponse,
  DebugSnapshotContext,
  ServerDoctorInput,
  WalletDoctorInput,
} from "./types";
import { earnToolkitClient } from "./client";
import type { EarnVault } from "./types";

type CliResult = {
  exitCode: number;
  stdout?: string;
  stderr?: string;
};

async function readJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as T;
}

function parseFlag(argv: string[], name: string) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return null;
  }

  return argv[index + 1] ?? null;
}

function requireFlag(argv: string[], name: string) {
  const value = parseFlag(argv, name);
  if (!value) {
    throw new Error(`Missing required flag: ${name}`);
  }

  return value;
}

function formatJson(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function runDoctor(argv: string[]): Promise<CliResult> {
  const serverPath = parseFlag(argv, "--server");
  const walletPath = parseFlag(argv, "--wallet");

  if (!serverPath && !walletPath) {
    throw new Error("doctor requires --server <file> and/or --wallet <file>");
  }

  const checks = [];

  if (serverPath) {
    const serverInput = await readJsonFile<ServerDoctorInput>(serverPath);
    checks.push(...earnToolkitClient.buildServerDoctorReport(serverInput).checks);
  }

  if (walletPath) {
    const walletInput = await readJsonFile<WalletDoctorInput>(walletPath);
    checks.push(...earnToolkitClient.buildWalletDoctorReport(walletInput).checks);
  }

  return {
    exitCode: 0,
    stdout: formatJson({
      checks,
      summary: earnToolkitClient.summarizeDoctorChecks(checks),
    }),
  };
}

async function runQuote(argv: string[]): Promise<CliResult> {
  const vaultPath = requireFlag(argv, "--vault");
  const fromAddress = requireFlag(argv, "--from-address") as `0x${string}`;
  const fromAmount = requireFlag(argv, "--from-amount");
  const vault = await readJsonFile<EarnVault>(vaultPath);
  const preset = earnToolkitClient.getDefaultFlowPreset(vault);

  if (!preset) {
    throw new Error("Vault does not expose a usable default preset.");
  }

  return {
    exitCode: 0,
    stdout: formatJson(
      earnToolkitClient.buildComposerQuoteInput({
        preset,
        fromAddress,
        fromAmount,
      }),
    ),
  };
}

async function runDebugBundle(argv: string[]): Promise<CliResult> {
  const quotePath = requireFlag(argv, "--quote");
  const contextPath = requireFlag(argv, "--context");
  const format = parseFlag(argv, "--format") ?? "json";
  const quote = await readJsonFile<ComposerQuoteResponse>(quotePath);
  const context = await readJsonFile<
    Omit<DebugSnapshotContext, "quote">
  >(contextPath);
  const fullContext: DebugSnapshotContext = {
    ...context,
    quote,
  };

  if (format === "snapshot") {
    return {
      exitCode: 0,
      stdout: `${earnToolkitClient.buildShareableDebugSnapshot(fullContext)}\n`,
    };
  }

  return {
    exitCode: 0,
    stdout: formatJson(earnToolkitClient.buildDebugBundle(fullContext)),
  };
}

export async function runEarnCli(argv: string[]): Promise<CliResult> {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "help") {
    return {
      exitCode: 0,
      stdout: [
        "earn <command>",
        "",
        "Commands:",
        "  doctor --server <json> [--wallet <json>]",
        "  quote --vault <json> --from-address <0x...> --from-amount <amount>",
        "  debug-bundle --quote <json> --context <json> [--format json|snapshot]",
        "",
      ].join("\n"),
    };
  }

  try {
    switch (command) {
      case "doctor":
        return await runDoctor(rest);
      case "quote":
        return await runQuote(rest);
      case "debug-bundle":
        return await runDebugBundle(rest);
      default:
        return {
          exitCode: 1,
          stderr: `Unknown command: ${command}\n`,
        };
    }
  } catch (error) {
    return {
      exitCode: 1,
      stderr: `${error instanceof Error ? error.message : String(error)}\n`,
    };
  }
}
