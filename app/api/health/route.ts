import { NextResponse } from "next/server";
import { logInfo } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  logInfo("Health check endpoint accessed");
  const response = { ok: true, ts: Date.now() };
  logInfo("Health check response", { response });
  return NextResponse.json(response);
}
