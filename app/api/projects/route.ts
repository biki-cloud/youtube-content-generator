import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, createProject } from "@/lib/projects";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    logInfo("Fetching all projects");
    const projects = getAllProjects();
    logInfo("Projects fetched successfully", { projectCount: projects.length });
    return NextResponse.json({ projects });
  } catch (error: any) {
    logError("Error fetching projects", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let name: string | undefined;
  let description: string | undefined;
  
  try {
    logInfo("Creating new project");
    const body = await req.json();
    ({ name, description } = body);

    if (!name || typeof name !== "string") {
      logError("Invalid project name provided", { name, description });
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    logInfo("Creating project with details", { name, description });
    const project = createProject(name, description);
    logInfo("Project created successfully", {
      projectId: project.id,
      name: project.name,
    });
    return NextResponse.json({ project });
  } catch (error: any) {
    logError("Error creating project", error, { name, description });
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
