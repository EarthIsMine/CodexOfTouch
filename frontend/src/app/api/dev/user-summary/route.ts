import { NextResponse } from "next/server";
import { resolveBackendAuthToken } from "@/app/api/dev/_lib/auth";

type UserMeApiResponse = {
  success: boolean;
  data?: {
    user?: {
      id?: string;
      walletAddress?: string | null;
      internalBalance?: number;
      lastCheckIn?: string | null;
    };
  };
  error?: {
    message?: string;
  };
};

export async function GET() {
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
    const response = await fetch(`${backendApiUrl}/api/user/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${backendAuthToken}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json()) as UserMeApiResponse;
    if (!response.ok || !payload.success || !payload.data?.user) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: payload.error?.message || "Failed to fetch user summary.",
        },
        { status: response.status || 500 },
      );
    }

    const user = payload.data.user;
    return NextResponse.json({
      ok: true,
      status: response.status,
      data: {
        id: user.id ?? "",
        walletAddress: user.walletAddress ?? null,
        internalBalance: Number(user.internalBalance ?? 0),
        lastCheckIn: user.lastCheckIn ?? null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
