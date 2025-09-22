import { NextRequest } from "next/server";
import { getJob } from "@/lib/jobs";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    logInfo("Job status request received", { jobId: ctx.params.id });
    const job = getJob(ctx.params.id);
    if (!job) {
      logError("Job not found for status request", null, {
        jobId: ctx.params.id,
      });
      return new Response("Not Found", { status: 404 });
    }
    logInfo("Job status returned", {
      jobId: ctx.params.id,
      status: job.status,
      progress: job.progress,
    });
    return Response.json(job);
  } catch (error) {
    logError("Job status request error", error, { jobId: ctx.params.id });
    return new Response("Internal Server Error", { status: 500 });
  }
}
