import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getEnv } from "@/env/schema";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

interface Body {
  sourceKey: string;
  title?: string;
  style?: "default" | "minimal" | "bold";
}

export async function POST(req: NextRequest) {
  try {
    logInfo("Thumbnail generation request received");
    const env = getEnv();
    const body = (await req.json()) as Body;

    if (!body?.sourceKey) {
      logError("Missing sourceKey in thumbnail generation request", { body });
      return new Response("sourceKey required", { status: 400 });
    }

    const src = path.join(env.DATA_DIR, body.sourceKey);

    logInfo("Thumbnail generation path check", {
      sourceKey: body.sourceKey,
      dataDir: env.DATA_DIR,
      fullPath: src,
      pathExists: fs.existsSync(src),
    });

    if (!fs.existsSync(src)) {
      // デバッグ用：uploadsディレクトリの内容を確認
      const uploadsDir = path.join(env.DATA_DIR, "uploads");
      let uploadsFiles: string[] = [];
      try {
        if (fs.existsSync(uploadsDir)) {
          uploadsFiles = fs.readdirSync(uploadsDir);
        }
      } catch (error) {
        logError("Failed to read uploads directory", error);
      }

      logError("Source image not found for thumbnail generation", {
        sourceKey: body.sourceKey,
        src,
        dataDir: env.DATA_DIR,
        uploadsDir,
        uploadsFiles,
      });
      return new Response("source not found", { status: 404 });
    }

    const id = randomUUID();
    const key = `output/thumbnail_${id}.jpg`;
    const dst = path.join(env.DATA_DIR, key);

    logInfo("Processing thumbnail generation", {
      sourceKey: body.sourceKey,
      title: body.title,
      style: body.style,
      id,
      key,
    });

    await fs.promises.mkdir(path.dirname(dst), { recursive: true });

    // YouTube thumbnail size: 1280x720
    const thumbnail = sharp(src)
      .resize(1280, 720, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 90 });

    // Add title overlay if provided
    if (body.title) {
      const title = body.title;
      const style = body.style || "default";

      logInfo("Adding title overlay to thumbnail", { title, style });

      // Create title overlay
      const titleSvg = createTitleOverlay(title, style);

      thumbnail.composite([
        {
          input: Buffer.from(titleSvg),
          top: 50,
          left: 50,
        },
      ]);
    }

    await thumbnail.toFile(dst);

    const response = {
      key,
      url: `/api/files/${encodeURIComponent(key)}`,
    };
    logInfo("Thumbnail generation completed successfully", { response });
    return Response.json(response);
  } catch (error: any) {
    logError("Thumbnail generation failed", error);
    return new Response(`Thumbnail generation failed: ${error.message}`, {
      status: 500,
    });
  }
}

function createTitleOverlay(title: string, style: string): string {
  const fontSize = style === "bold" ? 72 : style === "minimal" ? 48 : 60;
  const fontWeight = style === "bold" ? "bold" : "normal";
  const fill = style === "minimal" ? "#ffffff" : "#ff0000";
  const stroke = style === "minimal" ? "#000000" : "#ffffff";
  const strokeWidth = style === "minimal" ? 2 : 3;

  // Split title into lines if too long
  const words = title.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > 25) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  const lineHeight = fontSize + 10;
  const totalHeight = lines.length * lineHeight;
  const startY = fontSize + 20;

  const textElements = lines
    .map(
      (line, index) =>
        `<text x="20" y="${
          startY + index * lineHeight
        }" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}">${line}</text>`
    )
    .join("");

  return `
    <svg width="1200" height="${
      totalHeight + 40
    }" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="${
        totalHeight + 40
      }" fill="rgba(0,0,0,0.3)" rx="10"/>
      ${textElements}
    </svg>
  `;
}
