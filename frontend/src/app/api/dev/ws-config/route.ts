import { NextResponse } from "next/server";

export async function GET() {
  const backendApiUrl = process.env.BACKEND_API_URL;

  if (!backendApiUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing BACKEND_API_URL in frontend environment." },
      { status: 500 },
    );
  }

  const normalized = backendApiUrl.replace(/\/+$/, "");
  const withoutApiSuffix = normalized.endsWith("/api")
    ? normalized.slice(0, -4)
    : normalized;
  const wsBase = withoutApiSuffix.replace(/^http/i, "ws");

  return NextResponse.json({
    ok: true,
    data: {
      jackpotWsUrl: `${wsBase}/ws/jackpot`,
    },
  });
}

