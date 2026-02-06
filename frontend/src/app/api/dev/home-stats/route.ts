import { NextResponse } from "next/server";
import { resolveBackendAuthToken } from "@/app/api/dev/_lib/auth";

type ActiveCharacterApiResponse = {
  success: boolean;
  data?: {
    character?: {
      id?: number;
      name?: string;
      assetFolder?: string;
      files?: Array<{
        name?: string;
        url?: string;
      }>;
    };
    jackpot?: {
      currentPool?: number;
      timeRemaining?: number;
    };
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
    const headers: Record<string, string> = {};
    if (backendAuthToken) {
      headers.Authorization = `Bearer ${backendAuthToken}`;
    }

    const response = await fetch(`${backendApiUrl}/characters/active`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const payload = (await response.json()) as ActiveCharacterApiResponse;
    if (!response.ok || !payload.success || !payload.data?.jackpot) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: payload.error?.message || "Failed to fetch active character.",
        },
        { status: response.status || 500 },
      );
    }

    const currentPool = Number(payload.data.jackpot.currentPool ?? 0);
    const timeRemaining = Number(payload.data.jackpot.timeRemaining ?? 0);
    const assetFolder = payload.data.character?.assetFolder ?? "";
    const fileNames = (payload.data.character?.files ?? [])
      .map((file) => file.name ?? "")
      .filter(Boolean);
    const htmlName = fileNames.find((name) => name.endsWith(".html")) || "index.html";
    const jsName = fileNames.find((name) => name.endsWith(".js")) || "main.js";
    const glbName =
      fileNames.find((name) => name.endsWith(".glb")) || `${assetFolder}.glb`;

    return NextResponse.json({
      ok: true,
      status: response.status,
      data: {
        characterId: Number(payload.data.character?.id ?? 0),
        characterName: payload.data.character?.name ?? "",
        characterAssetFolder: assetFolder,
        characterHtmlUrl: `${backendApiUrl}/public/${assetFolder}/${htmlName}`,
        characterJsUrl: `${backendApiUrl}/public/${assetFolder}/${jsName}`,
        characterGlbUrl: `${backendApiUrl}/public/${assetFolder}/${glbName}`,
        jackpotPool: currentPool,
        jackpot: timeRemaining,
        poolAmount: currentPool,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
