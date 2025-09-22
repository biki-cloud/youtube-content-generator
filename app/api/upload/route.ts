import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getEnv } from "@/env/schema";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    logInfo("File upload request received");
    const env = getEnv();
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      logError("No file provided in upload request");
      return new Response("file is required", { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const id = randomUUID();
    const key = path.join("uploads", `${id}${ext || ""}`);
    const dst = path.join(env.DATA_DIR, key);

    logInfo("Processing file upload", {
      originalFilename: file.name,
      fileSize: file.size,
      extension: ext,
      id,
      key,
    });

    await fs.promises.mkdir(path.dirname(dst), { recursive: true });

    // Convert File to Buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    await fs.promises.writeFile(dst, buffer);

    const response = { key, url: `/api/files/${encodeURIComponent(key)}` };
    logInfo("File upload completed successfully", { response });
    return Response.json(response);
  } catch (error) {
    logError("File upload failed", error);
    return new Response("Internal server error", { status: 500 });
  }
}
