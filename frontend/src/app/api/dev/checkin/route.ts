import { NextResponse } from "next/server";
import { resolveBackendAuthToken } from "@/app/api/dev/_lib/auth";

type CheckInApiResponse = {
  success: boolean;
  data?: {
    reward?: number;
    streak?: number;
    totalBalance?: number;
  };
  error?: {
    message?: string;
  };
};

export async function POST() {
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
    const response = await fetch(`${backendApiUrl}/user/checkin`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${backendAuthToken}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json()) as CheckInApiResponse;
    if (!response.ok || !payload.success || !payload.data) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: payload.error?.message || "Failed to process daily check-in.",
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      data: {
        reward: Number(payload.data.reward ?? 0),
        streak: Number(payload.data.streak ?? 0),
        totalBalance: Number(payload.data.totalBalance ?? 0),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
