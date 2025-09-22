import { spawn } from "node:child_process";
import { logInfo, logError } from "@/lib/logger";

export type RunResult = { code: number | null };

export interface FFmpegOptions {
  onProgress?: (progress: number) => void;
  onStderr?: (data: string) => void;
}

export function runFfmpeg(
  args: string[],
  onStdout?: (s: string) => void,
  onStderr?: (s: string) => void
) {
  const bin = process.env.FFMPEG_PATH || "ffmpeg";
  const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  if (onStdout) child.stdout.on("data", (d) => onStdout(String(d)));
  if (onStderr) child.stderr.on("data", (d) => onStderr(String(d)));
  return new Promise<RunResult>((resolve) => {
    child.on("close", (code) => resolve({ code }));
  });
}

export async function runFFmpegWithProgress(
  args: string[],
  options?: FFmpegOptions
): Promise<void> {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  logInfo("Starting FFmpeg process", { ffmpegPath, args });

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      env: { ...process.env, FFMPEG_PATH: undefined },
    });

    let stderrOutput = "";
    let duration = 0;

    child.stderr.on("data", (data) => {
      const str = data.toString();
      stderrOutput += str;
      options?.onStderr?.(str);

      // Try to parse duration from stderr
      if (!duration) {
        const durationMatch = str.match(
          /Duration: (\d{2}):(\d{2}):(\d{2})\.\d{2}/
        );
        if (durationMatch) {
          duration =
            parseInt(durationMatch[1]) * 3600 +
            parseInt(durationMatch[2]) * 60 +
            parseInt(durationMatch[3]);
        }
      }

      // Parse progress
      if (duration && options?.onProgress) {
        const timeMatch = str.match(/time=(\d{2}):(\d{2}):(\d{2})\.\d{2}/);
        if (timeMatch) {
          const currentTime =
            parseInt(timeMatch[1]) * 3600 +
            parseInt(timeMatch[2]) * 60 +
            parseInt(timeMatch[3]);
          const progress = Math.min(
            Math.floor((currentTime / duration) * 100),
            99
          );
          options.onProgress(progress);
        }
      }
    });

    child.on("close", (code) => {
      if (code === 0) {
        logInfo("FFmpeg process completed successfully", { exitCode: code });
        options?.onProgress?.(100);
        resolve();
      } else {
        logError("FFmpeg process failed", null, {
          exitCode: code,
          stderr: stderrOutput,
        });
        reject(
          new Error(`FFmpeg exited with code ${code}.\nStderr: ${stderrOutput}`)
        );
      }
    });

    child.on("error", (err) => {
      logError("Failed to start FFmpeg process", err);
      reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
    });
  });
}
