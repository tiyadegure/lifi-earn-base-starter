import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runEarnCli } from "../src/cli-core";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

test("doctor command renders combined report from fixture files", async () => {
  const result = await runEarnCli([
    "doctor",
    "--server",
    join(fixturesDir, "server-doctor.json"),
    "--wallet",
    join(fixturesDir, "wallet-doctor.json"),
  ]);

  assert.equal(result.exitCode, 0);
  assert.ok(result.stdout);

  const payload = JSON.parse(result.stdout);
  assert.equal(payload.summary.overallStatus, "caution");
  assert.equal(payload.checks.length, 7);
});

test("help command renders the minimal CLI surface", async () => {
  const result = await runEarnCli(["--help"]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout ?? "", /doctor --server <json>/);
  assert.match(result.stdout ?? "", /debug-bundle --quote <json>/);
});

test("quote command renders typed quote input from a vault fixture", async () => {
  const result = await runEarnCli([
    "quote",
    "--vault",
    join(fixturesDir, "vault.base.json"),
    "--from-address",
    "0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e",
    "--from-amount",
    "20000",
  ]);

  assert.equal(result.exitCode, 0);
  assert.ok(result.stdout);

  const payload = JSON.parse(result.stdout);
  assert.equal(payload.toToken, "0x0000000f2eb9f69274678c76222b35eec7588a65");
  assert.equal(payload.fromChain, "8453");
});

test("debug-bundle command can emit the shareable snapshot format", async () => {
  const result = await runEarnCli([
    "debug-bundle",
    "--quote",
    join(fixturesDir, "quote.base.json"),
    "--context",
    join(fixturesDir, "debug-context.base.json"),
    "--format",
    "snapshot",
  ]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout ?? "", /composer_mode: authenticated/);
  assert.match(result.stdout ?? "", /tx_hash: 0xca323b2fffa7f69d2bf40835e8661cc433ccd8c9d9d92ae494fd8c1f90408324/);
});

test("quote command fails clearly when the vault fixture has no usable preset", async () => {
  const result = await runEarnCli([
    "quote",
    "--vault",
    join(fixturesDir, "vault.no-underlying.json"),
    "--from-address",
    "0x9D58f474D6c29Dcc2703b9b432F7eE2Fe1415C5e",
    "--from-amount",
    "20000",
  ]);

  assert.equal(result.exitCode, 1);
  assert.match(result.stderr ?? "", /Vault does not expose a usable default preset/);
});

test("debug-bundle command can emit a pending snapshot before tx submission", async () => {
  const result = await runEarnCli([
    "debug-bundle",
    "--quote",
    join(fixturesDir, "quote.no-approval.json"),
    "--context",
    join(fixturesDir, "debug-context.pending.json"),
    "--format",
    "snapshot",
  ]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout ?? "", /composer_mode: public-fallback/);
  assert.match(result.stdout ?? "", /tx_hash: not-submitted/);
});
