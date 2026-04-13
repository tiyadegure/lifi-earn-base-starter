import { publicEnv } from "./env";
import type { ComposerQuoteInput, ComposerQuoteResponse } from "./types";

async function readComposerFailure(response: Response, fallbackMessage: string) {
  const payload = (await response.json()) as { message?: string };
  throw new Error(payload.message ?? fallbackMessage);
}

export async function buildPublicComposerQuote(
  input: ComposerQuoteInput,
): Promise<ComposerQuoteResponse> {
  if (!publicEnv.integrator) {
    throw new Error(
      "NEXT_PUBLIC_LIFI_INTEGRATOR is required before building Composer quotes.",
    );
  }

  const url = new URL("/v1/quote", publicEnv.composerApiUrl);
  url.search = new URLSearchParams(input).toString();

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "x-lifi-integrator": publicEnv.integrator,
    },
  });

  if (!response.ok) {
    await readComposerFailure(response, "Public Composer quote request failed.");
  }

  return (await response.json()) as ComposerQuoteResponse;
}
