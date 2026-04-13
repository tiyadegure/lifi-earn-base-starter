import { parseUnits } from "viem";

export function parseAmountInput(value: string, decimals: number) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("Amount is required.");
  }

  return parseUnits(normalized, decimals).toString();
}
