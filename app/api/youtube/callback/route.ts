import { NextRequest } from "next/server";
import { google } from "googleapis";
import { getEnv } from "@/env/schema";
import { writeToken } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const env = getEnv();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  const oauth2Client = new google.auth.OAuth2(
    env.YOUTUBE_CLIENT_ID,
    env.YOUTUBE_CLIENT_SECRET,
    env.YOUTUBE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    writeToken(tokens);
    return new Response("OK. You can close this window.");
  } catch (e: any) {
    return new Response(`Auth error: ${e?.message || e}`, { status: 500 });
  }
}
