import { NextResponse } from "next/server";

type ActiveCharacterApiResponse = {
  success: boolean;
  data?: {
    character?: {
      id?: number;
    };
    jackpot?: {
      currentPool?: number;
      timeRemaining?: number;
    };
  };
  error?: {
    message?: string;
  };
};

export async function GET() {
  const backendApiUrl = process.env.BACKEND_API_URL;
  const backendTestJwt = process.env.BACKEND_TEST_JWT;

  if (!backendApiUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing BACKEND_API_URL in frontend environment." },
      { status: 500 },
    );
  }

  try {
    const headers: Record<string, string> = {};
    if (backendTestJwt) {
      headers.Authorization = `Bearer ${backendTestJwt}`;
    }

    const response = await fetch(`${backendApiUrl}/api/characters/active`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const payload = (await response.json()) as ActiveCharacterApiResponse;
    if (!response.ok || !payload.success || !payload.data?.jackpot) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: payload.error?.message || "Failed to fetch active character.",
        },
        { status: response.status || 500 },
      );
    }

    const currentPool = Number(payload.data.jackpot.currentPool ?? 0);
    const timeRemaining = Number(payload.data.jackpot.timeRemaining ?? 0);

    return NextResponse.json({
      ok: true,
      status: response.status,
      data: {
        characterId: Number(payload.data.character?.id ?? 0),
        jackpotPool: currentPool,
        jackpot: timeRemaining,
        poolAmount: currentPool,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
