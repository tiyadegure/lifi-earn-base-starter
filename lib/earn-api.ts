import "server-only";
import { publicEnv, requireComposerApiKey } from "./env";
import type {
  EarnPortfolioResponse,
  EarnVault,
  EarnVaultListResponse,
} from "./types";

const VAULT_PAGE_SIZE = 100;

async function fetchJson<T>(url: string): Promise<T> {
  const apiKey = requireComposerApiKey();
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "x-lifi-api-key": apiKey,
    },
  });

  const payload = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed: ${response.status}`);
  }

  return payload;
}

export async function getBaseVaults(limit = 10): Promise<EarnVault[]> {
  const vaults = await getAllBaseVaults();

  return vaults
    .sort((left, right) => {
      const leftApy = left.analytics.apy.total ?? -1;
      const rightApy = right.analytics.apy.total ?? -1;
      return rightApy - leftApy;
    })
    .slice(0, limit);
}

export async function getBaseVaultDetail(address: string): Promise<EarnVault> {
  const payload = await getAllBaseVaults();
  const normalizedAddress = address.toLowerCase();
  const vault = payload.find(
    (item) => item.address.toLowerCase() === normalizedAddress,
  );

  if (!vault) {
    throw new Error(`Base vault not found for address ${address}.`);
  }

  return vault;
}

async function getAllBaseVaults(): Promise<EarnVault[]> {
  const vaults: EarnVault[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null | undefined;

  while (true) {
    const payload = await getBaseVaultPage(cursor);

    vaults.push(
      ...payload.data.filter(
        (vault) =>
          vault.chainId === publicEnv.baseChainId && vault.isTransactional,
      ),
    );

    if (!payload.nextCursor || seenCursors.has(payload.nextCursor)) {
      break;
    }

    seenCursors.add(payload.nextCursor);
    cursor = payload.nextCursor;
  }

  return vaults;
}

async function getBaseVaultPage(
  cursor?: string | null,
): Promise<EarnVaultListResponse> {
  const url = new URL("/v1/vaults", publicEnv.earnApiUrl);
  url.searchParams.set("chainId", String(publicEnv.baseChainId));
  url.searchParams.set("limit", String(VAULT_PAGE_SIZE));

  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  return fetchJson<EarnVaultListResponse>(url.toString());
}

export async function getPortfolio(
  address: string,
): Promise<EarnPortfolioResponse> {
  const url = new URL(
    `/v1/portfolio/${address}/positions`,
    publicEnv.earnApiUrl,
  );

  return fetchJson<EarnPortfolioResponse>(url.toString());
}
