import { NextResponse } from "next/server";
import { resolveBackendAuthToken } from "@/app/api/dev/_lib/auth";

type SkillUseApiResponse = {
  success: boolean;
  data?: {
    activated?: boolean;
    expiresAt?: string;
  };
  error?: {
    message?: string;
  };
};

export async function POST(
  _request: Request,
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
    const response = await fetch(
      `${backendApiUrl}/api/skills/${encodeURIComponent(skillId)}/use`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${backendAuthToken}`,
        },
        cache: "no-store",
      },
    );

    const result = (await response.json()) as SkillUseApiResponse;
    if (!response.ok || !result.success || !result.data) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: result.error?.message || "Failed to activate skill.",
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
