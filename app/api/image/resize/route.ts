import { NextRequest } from "next/server";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getEnv } from "@/env/schema";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

type Body = {
  sourceKey: string;
  width: number;
  height: number;
  fit?: keyof sharp.FitEnum;
};

export async function POST(req: NextRequest) {
  try {
    logInfo("Image resize request received");
    const env = getEnv();
    const body = (await req.json()) as Body;

    if (!body?.sourceKey) {
      logError("Missing sourceKey in image resize request", { body });
      return new Response("sourceKey required", { status: 400 });
    }

    const src = path.join(env.DATA_DIR, body.sourceKey);
    if (!fs.existsSync(src)) {
      logError("Source image not found", { sourceKey: body.sourceKey, src });
      return new Response("source not found", { status: 404 });
    }

    const id = randomUUID();
    const key = path.join("output", `resized_${id}.jpg`);
    const dst = path.join(env.DATA_DIR, key);

    logInfo("Processing image resize", {
      sourceKey: body.sourceKey,
      width: body.width,
      height: body.height,
      fit: body.fit || "cover",
      id,
      key,
    });

    await fs.promises.mkdir(path.dirname(dst), { recursive: true });

    const img = sharp(src).resize({
      width: body.width,
      height: body.height,
      fit: body.fit || "cover",
    });
    await img.jpeg({ quality: 90 }).toFile(dst);

    const response = { key, url: `/api/files/${encodeURIComponent(key)}` };
    logInfo("Image resize completed successfully", { response });
    return Response.json(response);
  } catch (error) {
    logError("Image resize failed", error);
    return new Response("Internal server error", { status: 500 });
  }
}
