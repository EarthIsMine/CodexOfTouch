import { NextResponse } from "next/server";

export async function GET() {
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
    const response = await fetch(`${backendApiUrl}/api/user/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${backendTestJwt}`,
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        data: payload,
      },
      { status: response.ok ? 200 : response.status },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
