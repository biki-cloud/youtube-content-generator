import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "プロジェクトIDが必要です" },
        { status: 400 }
      );
    }

    // プロジェクトデータを読み込み
    const projectsPath = path.join(
      process.cwd(),
      "var",
      "data",
      "projects.json"
    );
    let projects: any[] = [];

    try {
      const projectsData = await fs.readFile(projectsPath, "utf-8");
      const projectsJson = JSON.parse(projectsData);
      projects = projectsJson.projects || [];
    } catch (error) {
      console.error("Error reading projects.json:", error);
      return NextResponse.json({ videos: [] });
    }

    // 指定されたプロジェクトを検索
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      return NextResponse.json(
        { error: "プロジェクトが見つかりません" },
        { status: 404 }
      );
    }

    const outputDir = path.join(process.cwd(), "var", "data", "output");

    // outputディレクトリが存在しない場合は空の配列を返す
    try {
      await fs.access(outputDir);
    } catch {
      return NextResponse.json({ videos: [] });
    }

    const files = await fs.readdir(outputDir);

    // プロジェクトの動画キーを取得（複数対応）
    const projectVideoKeys: string[] = [];
    if (project.data?.videoKey) {
      projectVideoKeys.push(project.data.videoKey);
    }

    // プロジェクトに関連する動画ファイルをフィルタリング
    const videoFiles = files
      .filter((file) => {
        if (!file.endsWith(".mp4")) return false;

        // プロジェクトの動画キーと一致するかチェック
        const fileKey = `output/${file}`;
        if (projectVideoKeys.includes(fileKey)) return true;

        // プロジェクトIDがファイル名に含まれているかチェック（フォールバック）
        return file.includes(projectId.substring(0, 8));
      })
      .map((file) => {
        return {
          filename: file,
          key: `output/${file}`,
          url: `/api/files/${encodeURIComponent(`output/${file}`)}`,
          downloadUrl: `/api/files/${encodeURIComponent(
            `output/${file}`
          )}?download=true`,
        };
      })
      .sort((a, b) => b.filename.localeCompare(a.filename)); // 新しいファイル順でソート

    return NextResponse.json({ videos: videoFiles });
  } catch (error) {
    console.error("Error listing videos:", error);
    return NextResponse.json(
      { error: "動画一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
