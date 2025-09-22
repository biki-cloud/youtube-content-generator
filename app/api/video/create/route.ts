import { NextRequest } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { getEnv } from "@/env/schema";
import { createJob, updateJob, cleanupOldJobs } from "@/lib/jobs";
import { runFFmpegWithProgress } from "@/lib/ffmpeg";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

type Body = {
  imageKey: string;
  musicKey: string;
  durationSec?: number;
};

export async function POST(req: NextRequest) {
  try {
    logInfo("Video creation request received");

    // 古いジョブをクリーンアップ
    cleanupOldJobs();

    const env = getEnv();
    const body = (await req.json()) as Body;

    if (!body?.imageKey || !body?.musicKey) {
      logError("Missing required keys in video creation request", { body });
      return new Response("imageKey and musicKey required", { status: 400 });
    }

    const img = path.join(env.DATA_DIR, body.imageKey);
    const aud = path.join(env.DATA_DIR, body.musicKey);

    // ファイル存在チェックを詳細に行う
    const imageExists = fs.existsSync(img);
    const audioExists = fs.existsSync(aud);

    if (!imageExists || !audioExists) {
      logError("Input files not found", {
        imageKey: body.imageKey,
        musicKey: body.musicKey,
        imagePath: img,
        audioPath: aud,
        imageExists,
        audioExists,
      });

      const missingFiles = [];
      if (!imageExists) missingFiles.push(`画像ファイル: ${body.imageKey}`);
      if (!audioExists) missingFiles.push(`音楽ファイル: ${body.musicKey}`);

      return new Response(
        JSON.stringify({
          error: "必要なファイルが見つかりません",
          missingFiles,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const id = randomUUID();
    const key = path.join("output", `video_${id}.mp4`);
    const out = path.join(env.DATA_DIR, key);

    logInfo("Starting video creation", {
      imageKey: body.imageKey,
      musicKey: body.musicKey,
      durationSec: body.durationSec,
      id,
      key,
    });

    // Build basic ffmpeg command: loop image + audio, duration clamp if provided
    const args: string[] = ["-y", "-loop", "1", "-i", img, "-i", aud];
    if (body.durationSec && body.durationSec > 0) {
      args.push("-t", String(body.durationSec));
    }
    args.push(
      "-c:v",
      "libx264",
      "-tune",
      "stillimage",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      out
    );

    logInfo("FFmpeg command built", {
      args: args,
      durationSec: body.durationSec,
      hasDurationFlag: args.includes("-t"),
    });

    await fs.promises.mkdir(path.dirname(out), { recursive: true });

    const job = createJob();
    updateJob(job.id, { status: "running", progress: 1 });
    logInfo("Video creation job created", { jobId: job.id });

    // Fire and forget (no blocking the request)
    (async () => {
      try {
        logInfo("Starting FFmpeg processing", { jobId: job.id, args });
        await runFFmpegWithProgress(args, {
          onProgress: (progress) => {
            updateJob(job.id, { progress });
            // logInfo("FFmpeg progress update", { jobId: job.id, progress });
          },
          onStderr: (data) => {
            // logInfo("FFmpeg stderr", { jobId: job.id, stderr: data });
          },
          showProgressInTerminal: true, // ターミナルに進行状況を表示
          targetDuration: body.durationSec, // 指定された動画の長さを渡す
        });
        updateJob(job.id, {
          status: "done",
          progress: 100,
          result: { key },
        });
        logInfo("Video creation completed successfully", {
          jobId: job.id,
          key,
        });
      } catch (e: any) {
        logError("Video creation failed", e, { jobId: job.id });
        updateJob(job.id, {
          status: "failed",
          progress: 100,
          error: e?.message || String(e),
        });
      }
    })();

    const response = { jobId: job.id };
    logInfo("Video creation job started", { response });
    return Response.json(response);
  } catch (error) {
    logError("Video creation request failed", error);
    return new Response("Internal server error", { status: 500 });
  }
}
