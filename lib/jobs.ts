import { logInfo, logError } from "@/lib/logger";
import path from "node:path";
import fs from "node:fs";
import { getEnv } from "@/env/schema";

type JobStatus = "queued" | "running" | "done" | "failed";

export type JobRecord<T = any> = {
  id: string;
  status: JobStatus;
  progress: number;
  result?: T;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

// メモリ内キャッシュ
const jobsCache = new Map<string, JobRecord>();

function getJobsFilePath(): string {
  const env = getEnv();
  return path.join(env.DATA_DIR, "jobs.json");
}

function loadJobs(): Map<string, JobRecord> {
  try {
    const filePath = getJobsFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      const jobsArray = JSON.parse(data) as JobRecord[];
      const jobsMap = new Map<string, JobRecord>();
      jobsArray.forEach((job) => {
        jobsMap.set(job.id, job);
      });
      // logInfo("Jobs loaded from file", { count: jobsMap.size });
      return jobsMap;
    }
  } catch (error) {
    logError("Failed to load jobs from file", error);
  }
  return new Map<string, JobRecord>();
}

function saveJobs(jobs: Map<string, JobRecord>): void {
  try {
    const filePath = getJobsFilePath();
    const jobsArray = Array.from(jobs.values());
    fs.writeFileSync(filePath, JSON.stringify(jobsArray, null, 2));
    // logInfo("Jobs saved to file", { count: jobsArray.length });
  } catch (error) {
    logError("Failed to save jobs to file", error);
  }
}

function getJobs(): Map<string, JobRecord> {
  if (jobsCache.size === 0) {
    const loadedJobs = loadJobs();
    loadedJobs.forEach((job, id) => {
      jobsCache.set(id, job);
    });
  }
  return jobsCache;
}

export function createJob(): JobRecord {
  const id = Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const job: JobRecord = {
    id,
    status: "queued",
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };

  const jobs = getJobs();
  jobs.set(id, job);
  saveJobs(jobs);

  logInfo("Job created", { jobId: id, status: job.status });
  return job;
}

export function getJob(id: string): JobRecord | null {
  // キャッシュをクリアしてファイルから最新のデータを読み込み
  jobsCache.clear();
  const jobs = getJobs();
  const job = jobs.get(id);

  if (job) {
    // console.log("=== GET JOB (FRESH) ===");
    // console.log("Job ID:", id);
    // console.log("Status:", job.status);
    // console.log("Progress:", job.progress);
    // console.log("Updated At:", job.updatedAt);
    // console.log("======================");
  }

  return job || null;
}

export function updateJob(
  id: string,
  patch: Partial<JobRecord>
): JobRecord | null {
  const jobs = getJobs();
  const j = jobs.get(id);
  if (!j) {
    logError("Job not found for update", null, { jobId: id });
    return null;
  }

  const next = {
    ...j,
    ...patch,
    updatedAt: new Date().toISOString(),
  } as JobRecord;

  jobs.set(id, next);
  saveJobs(jobs);

  // キャッシュを強制的にリフレッシュ
  jobsCache.set(id, next);

  // console.log("=== JOB UPDATED ===");
  // console.log("Job ID:", id);
  // console.log("Status:", next.status);
  // console.log("Progress:", next.progress);
  // console.log("Previous Progress:", j.progress);
  // console.log("==================");

  // logInfo("Job updated", {
  //   jobId: id,
  //   status: next.status,
  //   progress: next.progress,
  //   hasResult: !!next.result,
  //   hasError: !!next.error,
  // });
  return next;
}

// 完了したジョブを一定時間後にクリーンアップ
export function cleanupOldJobs(): void {
  const jobs = getJobs();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1時間前

  let cleanedCount = 0;
  for (const [id, job] of jobs.entries()) {
    if (job.status === "done" || job.status === "failed") {
      const jobTime = new Date(job.updatedAt);
      if (jobTime < oneHourAgo) {
        jobs.delete(id);
        cleanedCount++;
      }
    }
  }

  if (cleanedCount > 0) {
    saveJobs(jobs);
    logInfo("Cleaned up old jobs", { count: cleanedCount });
  }
}
