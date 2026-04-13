const DEFAULT_EARN_API_URL = "https://earn.li.fi";
const DEFAULT_COMPOSER_API_URL = "https://li.quest";
const DEFAULT_BASE_CHAIN_ID = 8453;

export const publicEnv = {
  earnApiUrl: process.env.NEXT_PUBLIC_EARN_API_URL ?? DEFAULT_EARN_API_URL,
  composerApiUrl:
    process.env.NEXT_PUBLIC_COMPOSER_API_URL ?? DEFAULT_COMPOSER_API_URL,
  baseChainId: Number(
    process.env.NEXT_PUBLIC_BASE_CHAIN_ID ?? DEFAULT_BASE_CHAIN_ID,
  ),
  integrator: process.env.NEXT_PUBLIC_LIFI_INTEGRATOR ?? "",
};

export const serverEnv = {
  authenticatedComposerEnabled:
    process.env.ENABLE_AUTHENTICATED_COMPOSER !== "false",
  allowedQuoteOrigins: (
    process.env.STARTER_ALLOWED_QUOTE_ORIGINS ??
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
};

export function requireComposerApiKey() {
  const apiKey = process.env.LIFI_COMPOSER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "LIFI_COMPOSER_API_KEY is required. Add it to your environment before building quotes.",
    );
  }

  return apiKey;
}
