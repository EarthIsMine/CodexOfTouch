import { NextResponse } from "next/server";

type JackpotHistoryApiResponse = {
  success: boolean;
  data?: {
    history?: Array<{
      roundId?: number;
      characterName?: string;
      winnerWallet?: string;
      amount?: number;
      committedAt?: string;
    }>;
  };
  error?: {
    message?: string;
  };
};

export async function GET(request: Request) {
  const backendApiUrl = process.env.BACKEND_API_URL;

  if (!backendApiUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing BACKEND_API_URL in frontend environment." },
      { status: 500 },
    );
  }

  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "12";
    const offset = url.searchParams.get("offset") || "0";

    const response = await fetch(
      `${backendApiUrl}/jackpot/history?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const payload = (await response.json()) as JackpotHistoryApiResponse;
    if (!response.ok || !payload.success) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: payload.error?.message || "Failed to fetch jackpot history.",
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      data: {
        history: payload.data?.history ?? [],
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

