import { NextRequest } from "next/server";
import { getJob } from "@/lib/jobs";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logInfo("Job status request received", { jobId: params.id });

    const job = getJob(params.id);
    if (!job) {
      logError("Job not found", null, { jobId: params.id });
      return new Response("Job not found", { status: 404 });
    }

    logInfo("Job status returned", {
      jobId: params.id,
      status: job.status,
      progress: job.progress,
      fullJobData: job,
    });

    const response = Response.json(job);
    logInfo("API response sent", {
      jobId: params.id,
      responseStatus: 200,
      responseBody: job,
      jobStatus: job.status,
      jobProgress: job.progress,
    });

    return response;
  } catch (error) {
    logError("Job status request failed", error, { jobId: params.id });
    return new Response("Internal Server Error", { status: 500 });
  }
}
