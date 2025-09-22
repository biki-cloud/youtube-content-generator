import { NextRequest } from "next/server";
import { getJob } from "@/lib/jobs";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const jobId = ctx.params.id;

  try {
    logInfo("SSE connection started", { jobId });

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // 初期状態を送信
        const sendUpdate = (data: any) => {
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));

            // ターミナルに送信されるJSONを表示
            console.log("=== SSE SENDING TO CLIENT ===");
            console.log("Job ID:", jobId);
            console.log("Data:", JSON.stringify(data, null, 2));
            console.log("=============================");

            logInfo("SSE sending to client", {
              jobId,
              data: data,
              jsonString: JSON.stringify(data),
            });
          } catch (error) {
            console.error("=== SSE SEND ERROR ===");
            console.error("Error:", error);
            console.error("Data:", data);
            console.error("======================");
            logError("SSE send error", error, { jobId, data });
          }
        };

        // ジョブの初期状態を取得して送信
        const job = getJob(jobId);
        if (job) {
          sendUpdate({
            type: "job_update",
            job: job,
          });
        }

        // ポーリング間隔をさらに短縮（200ms）
        const interval = setInterval(async () => {
          try {
            const currentJob = getJob(jobId);
            if (currentJob) {
              // ジョブの詳細情報をログに記録
              //   logInfo("SSE polling job status", {
              //     jobId,
              //     status: currentJob.status,
              //     progress: currentJob.progress,
              //     hasResult: !!currentJob.result,
              //     hasError: !!currentJob.error,
              //   });

              // 最新のジョブ状態を再取得してから送信
              const latestJob = getJob(jobId);
              if (latestJob) {
                // console.log("=== LATEST JOB STATUS ===");
                // console.log("Status:", latestJob.status);
                // console.log("Progress:", latestJob.progress);
                // console.log("Updated At:", latestJob.updatedAt);
                // console.log("========================");

                // 進行状況が実際に更新されている場合のみ送信
                if (
                  latestJob.progress !== currentJob.progress ||
                  latestJob.status !== currentJob.status
                ) {
                  //   console.log("=== SENDING UPDATE ===");
                  //   console.log(
                  //     "Progress changed:",
                  //     currentJob.progress,
                  //     "->",
                  //     latestJob.progress
                  //   );
                  //   console.log(
                  //     "Status changed:",
                  //     currentJob.status,
                  //     "->",
                  //     latestJob.status
                  //   );
                  //   console.log("======================");

                  sendUpdate({
                    type: "job_update",
                    job: latestJob,
                  });
                } else {
                  //   console.log("=== NO UPDATE NEEDED ===");
                  //   console.log(
                  //     "Progress:",
                  //     currentJob.progress,
                  //     "->",
                  //     latestJob.progress
                  //   );
                  //   console.log(
                  //     "Status:",
                  //     currentJob.status,
                  //     "->",
                  //     latestJob.status
                  //   );
                  //   console.log("========================");
                }
              }

              // ジョブが完了したら接続を閉じる
              if (
                currentJob.status === "done" ||
                currentJob.status === "failed"
              ) {
                clearInterval(interval);
                controller.close();
                logInfo("SSE connection closed - job completed", {
                  jobId,
                  status: currentJob.status,
                });
              }
            } else {
              // ジョブが見つからない場合
              sendUpdate({
                type: "error",
                message: "Job not found",
              });
              clearInterval(interval);
              controller.close();
            }
          } catch (error) {
            logError("SSE polling error", error, { jobId });
            sendUpdate({
              type: "error",
              message: "Polling failed",
            });
            clearInterval(interval);
            controller.close();
          }
        }, 200);

        // クライアントが切断した場合の処理
        const cleanup = () => {
          clearInterval(interval);
          controller.close();
        };

        // ストリームが閉じられた時の処理
        return cleanup;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    logError("SSE connection error", error, { jobId });
    return new Response("Internal Server Error", { status: 500 });
  }
}
