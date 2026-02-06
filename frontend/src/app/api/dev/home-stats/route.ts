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
    const backendOrigin = backendApiUrl.replace(/\/api\/?$/, "");
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
    const files = payload.data.character?.files ?? [];
    const htmlFile =
      files.find((file) => (file.name ?? "").endsWith(".html")) ??
      files.find((file) => (file.url ?? "").endsWith(".html"));
    const jsFile =
      files.find((file) => (file.name ?? "").endsWith(".js")) ??
      files.find((file) => (file.url ?? "").endsWith(".js"));
    const glbFile =
      files.find((file) => (file.name ?? "").endsWith(".glb")) ??
      files.find((file) => (file.url ?? "").endsWith(".glb"));

    const toAbsoluteUrl = (rawUrl: string | undefined, fallbackPath: string) => {
      if (!rawUrl) {
        return `${backendOrigin}${fallbackPath}`;
      }
      if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
        return rawUrl;
      }
      return `${backendOrigin}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
    };

    return NextResponse.json({
      ok: true,
      status: response.status,
      data: {
        characterId: Number(payload.data.character?.id ?? 0),
        characterName: payload.data.character?.name ?? "",
        characterAssetFolder: assetFolder,
        characterHtmlUrl: toAbsoluteUrl(
          htmlFile?.url,
          `/public/${assetFolder}/index.html`,
        ),
        characterJsUrl: toAbsoluteUrl(
          jsFile?.url,
          `/public/${assetFolder}/main.js`,
        ),
        characterGlbUrl: toAbsoluteUrl(
          glbFile?.url,
          `/public/${assetFolder}/${assetFolder}.glb`,
        ),
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
