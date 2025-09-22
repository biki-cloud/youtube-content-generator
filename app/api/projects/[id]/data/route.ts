import { NextRequest, NextResponse } from "next/server";
import { saveProjectData } from "@/lib/projects";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const project = saveProjectData(params.id, body);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error("Error saving project data:", error);
    return NextResponse.json(
      { error: "Failed to save project data" },
      { status: 500 }
    );
  }
}
