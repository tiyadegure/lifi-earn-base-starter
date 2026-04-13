export function getActionableQuoteErrorMessage(input: {
  message: string;
  composerMode?: "authenticated" | "public-fallback";
}) {
  const normalized = input.message.toLowerCase();

  if (normalized.includes("next_public_lifi_integrator")) {
    return "Set NEXT_PUBLIC_LIFI_INTEGRATOR in .env.local, restart the dev server, and build the quote again.";
  }

  if (normalized.includes("lifi_composer_api_key")) {
    return "Add LIFI_COMPOSER_API_KEY to .env.local or disable authenticated Composer before building quotes.";
  }

  if (normalized.includes("missing required field")) {
    return "The starter could not build a complete quote request. Reload the vault page and try again.";
  }

  if (
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("invalid api key")
  ) {
    return input.composerMode === "authenticated"
      ? "Authenticated Composer rejected the request. Check LIFI_COMPOSER_API_KEY and allowed origins."
      : "Public Composer rejected the request. Check the current request parameters and try again.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return input.composerMode === "authenticated"
      ? "Authenticated Composer is rate-limited. Wait a moment or use a different key before retrying."
      : "Public Composer is rate-limited. Wait a moment and retry the quote.";
  }

  if (normalized.includes("unable to find a quote")) {
    return "LI.FI could not find a route for this amount and token pair. Try a different amount or pick another Base vault.";
  }

  if (
    normalized.includes("quote request failed") ||
    normalized.includes("composer quote request failed")
  ) {
    return input.composerMode === "authenticated"
      ? "Authenticated Composer failed upstream. Confirm the key is valid, then retry the quote."
      : "Public Composer failed upstream. Retry the quote or switch to authenticated mode for clearer diagnostics.";
  }

  return input.message;
}
