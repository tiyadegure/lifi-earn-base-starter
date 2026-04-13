import type { EarnVault } from "@/lib/types";
import { VaultCard } from "./vault-card";

export function VaultList({ vaults }: { vaults: EarnVault[] }) {
  if (!vaults.length) {
    return (
      <div className="rounded-none border border-dashed border-[color:var(--ink)] bg-[color:var(--paper)] px-5 py-10 text-sm text-[color:var(--muted-ink)]">
        No Base transactional vaults were returned by the Earn Data API.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {vaults.map((vault, index) => (
        <VaultCard key={vault.address} vault={vault} index={index} />
      ))}
    </div>
  );
}
