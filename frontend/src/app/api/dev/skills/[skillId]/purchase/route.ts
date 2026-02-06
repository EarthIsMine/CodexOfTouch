import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { resolveBackendAuthToken } from "@/app/api/dev/_lib/auth";

type SkillPurchaseApiResponse = {
  success: boolean;
  data?: {
    userSkill?: {
      skillId?: number;
    };
    autoActivated?: boolean;
    activation?: {
      activated?: boolean;
      expiresAt?: string;
    };
  };
  error?: {
    message?: string;
  };
};

export async function POST(
  request: Request,
  context: { params: Promise<{ skillId: string }> },
) {
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
    const { skillId } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as {
      transactionId?: string;
      paymentReference?: string;
    };

    const transactionId = payload.transactionId || `tx_${randomUUID()}`;
    const paymentReference = payload.paymentReference || `ref_${randomUUID()}`;

    const response = await fetch(
      `${backendApiUrl}/skills/${encodeURIComponent(skillId)}/purchase`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${backendAuthToken}`,
        },
        body: JSON.stringify({
          transactionId,
          paymentReference,
        }),
        cache: "no-store",
      },
    );

    const result = (await response.json()) as SkillPurchaseApiResponse;
    if (!response.ok || !result.success || !result.data) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: result.error?.message || "Failed to purchase skill.",
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      data: result.data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
