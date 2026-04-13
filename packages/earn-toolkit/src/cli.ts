#!/usr/bin/env node

import { runEarnCli } from "./cli-core";

const result = await runEarnCli(process.argv.slice(2));

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exit(result.exitCode);
