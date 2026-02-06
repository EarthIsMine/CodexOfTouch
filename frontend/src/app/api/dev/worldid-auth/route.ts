import { NextResponse } from "next/server";

type WorldIdAuthApiResponse = {
  success: boolean;
  data?: {
    token?: string;
    user?: {
      id?: string;
      walletAddress?: string | null;
    };
  };
  error?: {
    code?: string;
    message?: string;
  };
};

export async function POST(request: Request) {
  const backendApiUrl = process.env.BACKEND_API_URL;

  if (!backendApiUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing BACKEND_API_URL in frontend environment." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      proof?: {
        merkle_root: string;
        nullifier_hash: string;
        proof: string;
        verification_level: "orb" | "device";
      };
      walletAddress?: string;
    };

    if (!body.proof) {
      return NextResponse.json(
        { ok: false, error: "Missing World ID proof payload." },
        { status: 400 },
      );
    }

    const response = await fetch(`${backendApiUrl}/auth/worldid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proof: body.proof,
        walletAddress: body.walletAddress,
      }),
      cache: "no-store",
    });

    const payload = (await response.json()) as WorldIdAuthApiResponse;
    if (!response.ok || !payload.success || !payload.data?.token) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: payload.error?.message || "Failed to authenticate with World ID.",
        },
        { status: response.status || 500 },
      );
    }

    const res = NextResponse.json({
      ok: true,
      status: response.status,
      data: payload.data,
    });

    // Persist JWT for future per-user server-side calls.
    res.cookies.set("codex_jwt", payload.data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

