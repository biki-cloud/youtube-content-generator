import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import { getEnv } from "@/env/schema";
import { readToken } from "@/lib/youtube";

export const runtime = "nodejs";

type Body = {
  videoKey: string;
  title: string;
  description?: string;
  tags?: string[];
  privacy?: "public" | "unlisted" | "private";
};

export async function POST(req: NextRequest) {
  const env = getEnv();
  const body = (await req.json()) as Body;
  if (!body?.videoKey || !body?.title)
    return Response.json(
      { error: "videoKey and title required" },
      { status: 400 }
    );

  const token = readToken();
  if (!token)
    return Response.json(
      { error: "Not authenticated. Run /api/youtube/auth first." },
      {
        status: 401,
      }
    );

  const oauth2Client = new google.auth.OAuth2(
    env.YOUTUBE_CLIENT_ID,
    env.YOUTUBE_CLIENT_SECRET,
    env.YOUTUBE_REDIRECT_URI
  );
  oauth2Client.setCredentials(token);

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const filePath = path.join(env.DATA_DIR, body.videoKey);
  if (!fs.existsSync(filePath))
    return Response.json({ error: "video not found" }, { status: 404 });

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: body.title,
        description: body.description || "",
        tags: body.tags,
        categoryId: "10",
        defaultLanguage: "ja",
      },
      status: {
        privacyStatus: body.privacy || "unlisted",
      },
    },
    media: { body: fs.createReadStream(filePath) },
  });

  const videoId = res.data.id;
  return Response.json({
    videoId,
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
  });
}
