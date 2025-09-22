import { spawn } from "node:child_process";
import { logInfo, logError } from "@/lib/logger";

export type RunResult = { code: number | null };

export interface FFmpegOptions {
  onProgress?: (progress: number) => void;
  onStderr?: (data: string) => void;
  onDuration?: (duration: number) => void;
  showProgressInTerminal?: boolean;
  targetDuration?: number; // 指定された動画の長さ（秒）
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
    let stdoutOutput = "";
    let duration = 0;
    let lastProgress = 0;
    let progressUpdateCount = 0;
    let isFinalizing = false; // 最終化段階のフラグ
    const maxProgressUpdates = 100;

    // 指定された動画の長さを取得（優先）
    const targetDuration = options?.targetDuration;

    // ターミナルに進行状況を表示する関数
    const showProgressInTerminal = (
      progress: number,
      currentTime: number,
      duration: number
    ) => {
      if (options?.showProgressInTerminal) {
        const progressBar =
          "█".repeat(Math.floor(progress / 2)) +
          "░".repeat(50 - Math.floor(progress / 2));
        const timeStr = `${Math.floor(currentTime / 60)}:${String(
          Math.floor(currentTime % 60)
        ).padStart(2, "0")}`;
        const durationStr = `${Math.floor(duration / 60)}:${String(
          Math.floor(duration % 60)
        ).padStart(2, "0")}`;

        process.stdout.write(
          `\r🎬 動画作成中: [${progressBar}] ${progress}% (${timeStr}/${durationStr})`
        );
      }
    };

    // 初期情報をログに記録
    logInfo("FFmpeg command", { command: `${ffmpegPath} ${args.join(" ")}` });
    console.log("=== FFMPEG PROCESS START ===");
    console.log("Command:", `${ffmpegPath} ${args.join(" ")}`);
    console.log("Target Duration:", targetDuration);
    console.log("============================");

    if (targetDuration) {
      logInfo("Target duration", { targetDuration });
    }

    child.stdout.on("data", (data) => {
      const str = data.toString();
      stdoutOutput += str;
    });

    child.stderr.on("data", (data) => {
      const str = data.toString();
      stderrOutput += str;
      options?.onStderr?.(str);

      // デバッグ: FFmpegの出力をログに記録
      // logInfo("FFmpeg stderr output", { output: str.trim() });

      // 動画の長さを取得（指定された長さを優先）
      if (!duration) {
        if (targetDuration) {
          // 指定された動画の長さを使用
          duration = targetDuration;
          logInfo("Using target duration", { duration });
          options?.onDuration?.(duration);
        } else {
          // 複数のパターンでDurationを検索
          const durationPatterns = [
            /Duration: (\d{2}):(\d{2}):(\d{2})\.\d{2}/,
            /Duration: (\d{1,2}):(\d{2}):(\d{2})\.\d{2}/,
          ];

          for (const pattern of durationPatterns) {
            const durationMatch = str.match(pattern);
            if (durationMatch) {
              duration =
                parseInt(durationMatch[1]) * 3600 +
                parseInt(durationMatch[2]) * 60 +
                parseInt(durationMatch[3]);

              logInfo("FFmpeg duration detected", { duration });
              options?.onDuration?.(duration);
              break;
            }
          }
        }
      }

      // 最終化段階の検出
      if (
        str.includes("[out#0/mp4") ||
        str.includes("video:") ||
        str.includes("audio:") ||
        str.includes("subtitle:")
      ) {
        if (!isFinalizing) {
          isFinalizing = true;
          logInfo("FFmpeg finalizing stage detected");

          // 最終化段階では98%に設定
          if (options?.onProgress && lastProgress < 98) {
            lastProgress = 98;
            progressUpdateCount++;
            options.onProgress(98);
            showProgressInTerminal(98, duration, duration);
            logInfo("Progress set to 98% (finalizing stage)");
          }
        }
      }

      // 進行状況の計算を改善
      if (
        duration &&
        options?.onProgress &&
        progressUpdateCount < maxProgressUpdates &&
        !isFinalizing
      ) {
        // time=パターンで進行状況を計算
        const timeMatch = str.match(/time=(\d{1,2}):(\d{2}):(\d{2})\.\d{2}/);
        if (timeMatch) {
          const currentTime =
            parseInt(timeMatch[1]) * 3600 +
            parseInt(timeMatch[2]) * 60 +
            parseInt(timeMatch[3]);

          // より正確な進行状況計算（100%まで）
          const progress = Math.min(
            Math.floor((currentTime / duration) * 100), // 100%まで計算
            100
          );

          // デバッグ: 進行状況計算の詳細をログに記録
          // console.log("=== FFMPEG PROGRESS CALCULATION ===");
          // console.log("Time Match:", timeMatch[0]);
          // console.log("Current Time:", currentTime, "seconds");
          // console.log("Duration:", duration, "seconds");
          // console.log("Calculated Progress:", progress, "%");
          // console.log("Last Progress:", lastProgress, "%");
          // console.log("Will Update:", progress > lastProgress);
          // console.log("===================================");

          // logInfo("FFmpeg progress calculation", {
          //   timeMatch: timeMatch[0],
          //   currentTime,
          //   duration,
          //   calculatedProgress: progress,
          //   lastProgress,
          //   willUpdate: progress > lastProgress,
          // });

          // 進行状況が実際に進んでいる場合のみ更新
          if (progress > lastProgress) {
            lastProgress = progress;
            progressUpdateCount++;
            options.onProgress(progress);

            // ターミナルに進行状況を表示
            showProgressInTerminal(progress, currentTime, duration);

            // logInfo("FFmpeg progress update", {
            //   progress,
            //   currentTime,
            //   duration,
            //   progressUpdateCount,
            // });
          }
        }
      }

      // フレーム情報からも進行状況を推定（バックアップ）
      if (
        duration &&
        options?.onProgress &&
        progressUpdateCount < maxProgressUpdates &&
        !isFinalizing
      ) {
        const frameMatch = str.match(/frame=\s*(\d+)/);
        if (frameMatch) {
          const frame = parseInt(frameMatch[1]);
          // フレームレートを仮定（25fps）
          const estimatedTime = frame / 25;
          const progress = Math.min(
            Math.floor((estimatedTime / duration) * 100), // 100%まで計算
            100
          );

          if (progress > lastProgress) {
            lastProgress = progress;
            progressUpdateCount++;
            options.onProgress(progress);

            // ターミナルに進行状況を表示
            showProgressInTerminal(progress, estimatedTime, duration);

            // logInfo("FFmpeg progress update from frames", {
            //   progress,
            //   frame,
            //   estimatedTime,
            //   duration,
            //   progressUpdateCount,
            // });
          }
        }
      }
    });

    child.on("close", (code) => {
      logInfo("FFmpeg process closed", {
        code,
        finalProgress: lastProgress,
        progressUpdateCount,
        isFinalizing,
      });

      if (code === 0) {
        // ターミナルの進行状況表示をクリア
        if (options?.showProgressInTerminal) {
          process.stdout.write(
            `\r🎬 動画作成完了: [${"█".repeat(50)}] 100% ✅\n`
          );
        }

        logInfo("FFmpeg process completed successfully", {
          exitCode: code,
          progressUpdateCount,
          finalProgress: lastProgress,
          wasFinalizing: isFinalizing,
        });
        // 確実に100%に設定
        options?.onProgress?.(100);
        resolve();
      } else {
        // ターミナルの進行状況表示をクリア
        if (options?.showProgressInTerminal) {
          process.stdout.write(`\r🎬 動画作成失敗: [${"░".repeat(50)}] ❌\n`);
        }

        logError("FFmpeg process failed", null, {
          exitCode: code,
          stderr: stderrOutput,
          progressUpdateCount,
          finalProgress: lastProgress,
        });
        reject(
          new Error(`FFmpeg exited with code ${code}.\nStderr: ${stderrOutput}`)
        );
      }
    });

    child.on("error", (err) => {
      logError("Failed to start FFmpeg process", err);
      console.error("=== FFMPEG PROCESS ERROR ===");
      console.error("Error:", err);
      console.error("Command:", `${ffmpegPath} ${args.join(" ")}`);
      console.error("=============================");
      reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
    });

    // タイムアウト処理を追加
    const timeout = setTimeout(() => {
      logError("FFmpeg process timeout", null, {
        duration,
        progressUpdateCount,
        finalProgress: lastProgress,
      });
      child.kill("SIGTERM");
      reject(new Error("FFmpeg process timeout"));
    }, 10 * 60 * 1000); // 10分でタイムアウト

    child.on("close", () => {
      clearTimeout(timeout);
    });
  });
}
