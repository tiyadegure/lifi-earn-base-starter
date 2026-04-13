import "server-only";
import { publicEnv, requireComposerApiKey } from "./env";
import type {
  ComposerApiKeyStatus,
  ComposerQuoteInput,
  ComposerQuoteResponse,
} from "./types";

async function readComposerFailure(response: Response, fallbackMessage: string) {
  const payload = (await response.json()) as { message?: string };
  throw new Error(payload.message ?? fallbackMessage);
}

export async function buildProtectedComposerQuote(
  input: ComposerQuoteInput,
): Promise<ComposerQuoteResponse> {
  if (!publicEnv.integrator) {
    throw new Error(
      "NEXT_PUBLIC_LIFI_INTEGRATOR is required before building Composer quotes.",
    );
  }

  const apiKey = requireComposerApiKey();
  const url = new URL("/v1/quote", publicEnv.composerApiUrl);
  url.search = new URLSearchParams(input).toString();

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "x-lifi-api-key": apiKey,
      "x-lifi-integrator": publicEnv.integrator,
    },
  });

  if (!response.ok) {
    await readComposerFailure(
      response,
      "Authenticated Composer quote request failed.",
    );
  }

  return (await response.json()) as ComposerQuoteResponse;
}

export async function getComposerKeyStatus(): Promise<ComposerApiKeyStatus | null> {
  try {
    const apiKey = process.env.LIFI_COMPOSER_API_KEY;

    if (!apiKey) {
      return null;
    }

    const url = new URL("/v1/keys/test", publicEnv.composerApiUrl);

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "x-lifi-api-key": apiKey,
      },
    });

    const payload = (await response.json()) as ComposerApiKeyStatus & {
      message?: string;
    };

    if (!response.ok) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
