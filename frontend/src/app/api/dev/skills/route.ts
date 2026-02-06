import { NextResponse } from "next/server";
import { resolveBackendAuthToken } from "@/app/api/dev/_lib/auth";

type SkillItem = {
  id: number;
  name: string;
  description: string;
  effectType: string;
  value: number;
  durationSec: number;
  priceWld: number;
};

type SkillsListApiResponse = {
  success: boolean;
  data?: {
    skills?: SkillItem[];
  };
  error?: {
    message?: string;
  };
};

type MySkillItem = {
  skillId: number;
  isOwned: boolean;
  isActivated?: boolean;
  activationRemainingTime?: number | null;
  expiresAt?: string | null;
};

type MySkillsApiResponse = {
  success: boolean;
  data?: {
    skills?: MySkillItem[];
  };
  error?: {
    message?: string;
  };
};

export async function GET() {
  const backendApiUrl = process.env.BACKEND_API_URL;
  const backendAuthToken = await resolveBackendAuthToken();

  if (!backendApiUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing BACKEND_API_URL in frontend environment." },
      { status: 500 },
    );
  }

  try {
    const [skillsResponse, mySkillsResponse] = await Promise.all([
      fetch(`${backendApiUrl}/api/skills`, {
        method: "GET",
        cache: "no-store",
      }),
      backendAuthToken
        ? fetch(`${backendApiUrl}/api/skills/my`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${backendAuthToken}`,
            },
            cache: "no-store",
          })
        : Promise.resolve(null),
    ]);

    const skillsPayload = (await skillsResponse.json()) as SkillsListApiResponse;
    if (!skillsResponse.ok || !skillsPayload.success) {
      return NextResponse.json(
        {
          ok: false,
          status: skillsResponse.status,
          error: skillsPayload.error?.message || "Failed to fetch skills.",
        },
        { status: skillsResponse.status || 500 },
      );
    }

    const mySkillsPayload = mySkillsResponse
      ? ((await mySkillsResponse.json()) as MySkillsApiResponse)
      : null;
    const mySkillsById = new Map(
      (mySkillsPayload?.data?.skills ?? []).map((skill) => [skill.skillId, skill]),
    );

    const skills = (skillsPayload.data?.skills ?? []).map((skill) => {
      const mine = mySkillsById.get(skill.id);
      return {
        ...skill,
        isOwned: Boolean(mine?.isOwned),
        isActivated: Boolean(mine?.isActivated),
        activationRemainingTime: Number(mine?.activationRemainingTime ?? 0),
        expiresAt: mine?.expiresAt ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      status: 200,
      data: {
        skills,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
