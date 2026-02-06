import { NextResponse } from "next/server";

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
  const backendTestJwt = process.env.BACKEND_TEST_JWT;

  if (!backendApiUrl || !backendTestJwt) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing BACKEND_API_URL or BACKEND_TEST_JWT in frontend environment.",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${backendApiUrl}/api/user/checkin`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${backendTestJwt}`,
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

