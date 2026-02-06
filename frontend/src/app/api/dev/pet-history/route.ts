import { NextResponse } from "next/server";
import { resolveBackendAuthToken } from "@/app/api/dev/_lib/auth";

type PetHistoryApiResponse = {
  success: boolean;
  data?: {
    events?: Array<{
      id?: string;
      characterId?: number;
      characterName?: string;
      result?: "SUCCESS" | "FAIL";
      balanceUsed?: number;
      createdAt?: string;
    }>;
  };
  error?: {
    message?: string;
  };
};

export async function GET(request: Request) {
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
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "20";
    const offset = url.searchParams.get("offset") || "0";

    const response = await fetch(
      `${backendApiUrl}/pet/history?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${backendAuthToken}`,
        },
        cache: "no-store",
      },
    );

    const payload = (await response.json()) as PetHistoryApiResponse;
    if (!response.ok || !payload.success) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: payload.error?.message || "Failed to fetch pet history.",
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      data: {
        events: payload.data?.events ?? [],
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
