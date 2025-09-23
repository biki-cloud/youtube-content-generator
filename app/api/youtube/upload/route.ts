import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import { getEnv } from "@/env/schema";
import { readToken } from "@/lib/youtube";
import { deleteFiles } from "@/lib/storage";
import { getProject, saveProjectData } from "@/lib/projects";

export const runtime = "nodejs";

type Body = {
  videoKey: string;
  title: string;
  description?: string;
  tags?: string[];
  privacy?: "public" | "unlisted" | "private";
  projectId?: string;
};

export async function POST(req: NextRequest) {
  const env = getEnv();
  const body = (await req.json()) as Body;
  if (!body?.videoKey || !body?.title)
    return Response.json(
      { error: "videoKey and title required" },
      { status: 400 }
    );

  const token = readToken();
  if (!token)
    return Response.json(
      { error: "Not authenticated. Run /api/youtube/auth first." },
      {
        status: 401,
      }
    );

  const oauth2Client = new google.auth.OAuth2(
    env.YOUTUBE_CLIENT_ID,
    env.YOUTUBE_CLIENT_SECRET,
    env.YOUTUBE_REDIRECT_URI
  );
  oauth2Client.setCredentials(token);

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const filePath = path.join(env.DATA_DIR, body.videoKey);
  if (!fs.existsSync(filePath))
    return Response.json({ error: "video not found" }, { status: 404 });

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: body.title,
        description: body.description || "",
        tags: body.tags,
        categoryId: "10",
        defaultLanguage: "ja",
      },
      status: {
        privacyStatus: body.privacy || "unlisted",
      },
    },
    media: { body: fs.createReadStream(filePath) },
  });

  const videoId = res.data.id;
  const youtubeUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : undefined;

  // YouTubeアップロード成功後、関連ファイルを削除
  if (youtubeUrl && body.projectId) {
    try {
      const project = getProject(body.projectId);
      if (project) {
        const filesToDelete: string[] = [];

        // 新しい構造のファイルパスを削除対象に追加
        if (project.data.video?.created_video_filepath) {
          filesToDelete.push(project.data.video.created_video_filepath);
        }
        if (project.data.music?.created_music_filepath) {
          filesToDelete.push(project.data.music.created_music_filepath);
        }

        // ファイル削除を実行
        if (filesToDelete.length > 0) {
          const deleteResult = await deleteFiles(filesToDelete);
          console.log("Files deleted after YouTube upload:", {
            projectId: body.projectId,
            deleted: deleteResult.deleted,
            failed: deleteResult.failed,
          });

          // プロジェクトデータから削除されたファイルの情報をクリア
          const updateData: any = {};

          // 新しい構造での更新
          if (
            deleteResult.deleted.includes(
              project.data.video?.created_video_filepath || ""
            )
          ) {
            updateData.video = {
              ...project.data.video,
              deleted: true,
            };
          }
          if (
            deleteResult.deleted.includes(
              project.data.music?.created_music_filepath || ""
            )
          ) {
            updateData.music = {
              ...project.data.music,
              deleted: true,
            };
          }

          // YouTubeアップロード完了状態を更新
          updateData.youtube = {
            status: "done",
            youtube_upload_url: youtubeUrl,
          };

          if (Object.keys(updateData).length > 0) {
            console.log("Updating project data after file deletion:", {
              projectId: body.projectId,
              updateData,
            });
            const updatedProject = saveProjectData(body.projectId, updateData);
            if (updatedProject) {
              console.log("Project data updated successfully:", {
                projectId: body.projectId,
                updatedData: updatedProject.data,
              });
            } else {
              console.error("Failed to update project data:", {
                projectId: body.projectId,
                updateData,
              });
            }
          } else {
            console.log("No project data updates needed:", {
              projectId: body.projectId,
              deletedFiles: deleteResult.deleted,
              projectData: project.data,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error deleting files after YouTube upload:", error);
      // ファイル削除に失敗してもYouTubeアップロードは成功として扱う
    }
  }

  return Response.json({
    videoId,
    url: youtubeUrl,
  });
}
