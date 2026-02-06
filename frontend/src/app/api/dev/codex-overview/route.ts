import { NextResponse } from "next/server";

type CharactersApiResponse = {
  success: boolean;
  data?: {
    characters?: Array<{
      id?: number;
      name?: string;
      imageUrl?: string;
      isActive?: boolean;
      stats?: {
        successRate?: number;
      };
    }>;
  };
  error?: {
    message?: string;
  };
};

type CodexApiResponse = {
  success: boolean;
  data?: {
    codex?: Array<{
      characterId?: number;
      tokenId?: string;
      mintedAt?: string;
    }>;
    stats?: {
      total?: number;
      collected?: number;
      percentage?: number;
    };
  };
  error?: {
    message?: string;
  };
};

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
    const [charactersResponse, codexResponse] = await Promise.all([
      fetch(`${backendApiUrl}/api/characters?includeInactive=true`, {
        method: "GET",
        cache: "no-store",
      }),
      fetch(`${backendApiUrl}/api/codex/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${backendTestJwt}`,
        },
        cache: "no-store",
      }),
    ]);

    const charactersPayload =
      (await charactersResponse.json()) as CharactersApiResponse;
    const codexPayload = (await codexResponse.json()) as CodexApiResponse;

    if (!charactersResponse.ok || !charactersPayload.success) {
      return NextResponse.json(
        {
          ok: false,
          status: charactersResponse.status,
          error:
            charactersPayload.error?.message || "Failed to fetch characters.",
        },
        { status: charactersResponse.status || 500 },
      );
    }

    if (!codexResponse.ok || !codexPayload.success) {
      return NextResponse.json(
        {
          ok: false,
          status: codexResponse.status,
          error: codexPayload.error?.message || "Failed to fetch codex data.",
        },
        { status: codexResponse.status || 500 },
      );
    }

    const codexByCharacterId = new Map(
      (codexPayload.data?.codex ?? []).map((entry) => [
        Number(entry.characterId ?? 0),
        entry,
      ]),
    );

    const items = (charactersPayload.data?.characters ?? []).map((character) => {
      const id = Number(character.id ?? 0);
      const codexEntry = codexByCharacterId.get(id);
      return {
        id,
        name: character.name ?? "",
        imageUrl: character.imageUrl ?? "",
        isActive: Boolean(character.isActive),
        owned: Boolean(codexEntry),
        tokenId: codexEntry?.tokenId ?? null,
        mintedAt: codexEntry?.mintedAt ?? null,
        level: Math.max(1, Math.round(Number(character.stats?.successRate ?? 0) * 10)),
      };
    });

    return NextResponse.json({
      ok: true,
      status: 200,
      data: {
        items,
        stats: {
          total: Number(codexPayload.data?.stats?.total ?? 0),
          collected: Number(codexPayload.data?.stats?.collected ?? 0),
          percentage: Number(codexPayload.data?.stats?.percentage ?? 0),
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown request error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

