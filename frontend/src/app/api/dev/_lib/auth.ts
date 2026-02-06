import { cookies } from "next/headers";

const JWT_COOKIE_NAME = "codex_jwt";

export async function resolveBackendAuthToken() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(JWT_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return process.env.BACKEND_TEST_JWT ?? null;
}

