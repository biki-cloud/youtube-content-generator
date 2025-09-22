import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { lookup as lookupMime } from "mime-types";
import { getEnv } from "@/env/schema";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: { key: string[] } }
) {
  try {
    const env = getEnv();
    const rel = ctx.params.key.join("/");
    const safeRel = path.normalize(rel).replace(/^\.+/, "");

    // 絶対パスに変換
    const dataDir = path.resolve(env.DATA_DIR);
    const full = path.join(dataDir, safeRel);

    logInfo("File access request", {
      rel,
      safeRel,
      dataDir,
      full,
      envDataDir: env.DATA_DIR,
    });

    // パス検証を修正
    if (!full.startsWith(dataDir)) {
      logError("Path traversal attempt detected", { full, dataDir });
      return new Response("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
      logError("File not found", { full, exists: fs.existsSync(full) });
      return new Response("Not Found", { status: 404 });
    }

    const mime = lookupMime(full) || "application/octet-stream";
    const stream = fs.createReadStream(full);

    // ダウンロードパラメータをチェック
    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "true";

    const headers: Record<string, string> = { "Content-Type": mime };

    if (isDownload) {
      const filename = path.basename(full);
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    logInfo("File served successfully", { full, mime, isDownload });
    return new Response(stream as any, { headers });
  } catch (error) {
    logError("File access error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
