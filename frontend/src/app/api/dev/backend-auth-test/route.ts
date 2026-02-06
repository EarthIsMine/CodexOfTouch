import { NextResponse } from "next/server";
import { resolveBackendAuthToken } from "@/app/api/dev/_lib/auth";

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
