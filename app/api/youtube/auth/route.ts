import { NextRequest } from "next/server";
import { getEnv } from "@/env/schema";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const env = getEnv();
  // 既存互換: リダイレクトURLは環境変数ベース
  const params = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID || "",
    redirect_uri: env.YOUTUBE_REDIRECT_URI || "",
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/youtube.upload",
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return Response.redirect(url, 302);
}
