import { NextResponse } from "next/server";
import { buildProtectedComposerQuote } from "@/lib/composer-api";
import { publicEnv, serverEnv } from "@/lib/env";
import { buildPublicComposerQuote } from "@/lib/composer-public";
import type { ComposerQuoteInput } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ComposerQuoteInput>;

    const requiredFields: Array<keyof ComposerQuoteInput> = [
      "fromChain",
      "toChain",
      "fromToken",
      "toToken",
      "fromAddress",
      "toAddress",
      "fromAmount",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    const input = body as ComposerQuoteInput;
    const composerMode = shouldUseAuthenticatedComposer(request)
      ? "authenticated"
      : "public-fallback";
    const quote =
      composerMode === "authenticated"
        ? await buildProtectedComposerQuote(input)
        : await buildPublicComposerQuote(input);

    return NextResponse.json({
      quote,
      composerMode,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build quote";
    return NextResponse.json(
      { error: message },
      { status: getQuoteErrorStatus(message) },
    );
  }
}

function getQuoteErrorStatus(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("missing required field") ||
    normalized.includes("next_public_lifi_integrator") ||
    normalized.includes("lifi_composer_api_key") ||
    normalized.includes("unable to find a quote")
  ) {
    return 400;
  }

  if (normalized.includes("unauthorized") || normalized.includes("forbidden")) {
    return 401;
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return 429;
  }

  return 502;
}

function shouldUseAuthenticatedComposer(request: Request) {
  if (!serverEnv.authenticatedComposerEnabled) {
    return false;
  }

  if (!process.env.LIFI_COMPOSER_API_KEY) {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    return false;
  }

  return serverEnv.allowedQuoteOrigins.includes(requestOrigin);
}

function getRequestOrigin(request: Request) {
  const originHeader = request.headers.get("origin");

  if (originHeader) {
    return safeNormalizeOrigin(originHeader);
  }

  const refererHeader = request.headers.get("referer");

  if (!refererHeader) {
    return null;
  }

  return safeNormalizeOrigin(refererHeader);
}

function safeNormalizeOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    try {
      const url = new URL(value, publicEnv.composerApiUrl);
      return url.origin;
    } catch {
      return null;
    }
  }
}
