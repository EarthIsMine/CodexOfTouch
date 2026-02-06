import { NextResponse } from "next/server";
import { resolveBackendAuthToken } from "@/app/api/dev/_lib/auth";

type PetApiResponse = {
  success: boolean;
  data?: {
    result?: "SUCCESS" | "FAIL";
    cooldownUntil?: string;
    jackpot?: {
      currentPool?: number;
      timeRemaining?: number;
    };
    rewards?: {
      balanceChange?: number;
    };
    codexUnlocked?: boolean;
  };
  error?: {
    code?: string;
    message?: string;
    details?: {
      cooldownUntil?: string;
    };
  };
};

export async function POST(request: Request) {
  const backendApiUrl = process.env.BACKEND_API_URL;
  const backendAuthToken = await resolveBackendAuthToken();

  if (!backendApiUrl || !backendAuthToken) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing BACKEND_API_URL and no auth token was found.",
      },
      { status: 500 },
    );
  }

  try {
    const input = (await request.json().catch(() => ({}))) as {
      characterId?: number;
      skillId?: number | null;
    };

    if (!input.characterId) {
      return NextResponse.json(
        { ok: false, error: "characterId is required." },
        { status: 400 },
      );
    }

    const response = await fetch(`${backendApiUrl}/api/pet`, {
      method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${backendAuthToken}`,
        },
      body: JSON.stringify({
        characterId: input.characterId,
        skillId: input.skillId ?? null,
      }),
      cache: "no-store",
    });

    const payload = (await response.json()) as PetApiResponse;
    if (!response.ok || !payload.success || !payload.data) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          errorCode: payload.error?.code,
          error: payload.error?.message || "Failed to perform pet action.",
          cooldownUntil: payload.error?.details?.cooldownUntil ?? null,
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      data: payload.data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
