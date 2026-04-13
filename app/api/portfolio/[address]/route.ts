import { NextResponse } from "next/server";
import { getPortfolio } from "@/lib/earn-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await context.params;
    const portfolio = await getPortfolio(address);
    return NextResponse.json(portfolio);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch portfolio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
