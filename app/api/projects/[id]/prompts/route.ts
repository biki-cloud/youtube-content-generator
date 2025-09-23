import { NextRequest, NextResponse } from "next/server";
import { saveProjectData } from "@/lib/projects";
import { GeneratedPrompts } from "@/lib/projects";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { theme, music, thumbnail, youtubeTitle, youtubeDescription } = body;

    if (!theme || !music || !thumbnail) {
      return NextResponse.json(
        {
          error: "Required prompt fields (theme, music, thumbnail) are missing",
        },
        { status: 400 }
      );
    }

    const prompts: GeneratedPrompts = {
      theme,
      music,
      thumbnail,
      youtubeTitle,
      youtubeDescription,
      generatedAt: Date.now(),
    };

    const project = saveProjectData(params.id, { prompts });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Prompts saved successfully",
      project,
    });
  } catch (error: any) {
    console.error("Error saving prompts:", error);
    return NextResponse.json(
      { error: "Failed to save prompts" },
      { status: 500 }
    );
  }
}
