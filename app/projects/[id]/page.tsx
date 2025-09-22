"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PromptGenerator from "../../components/PromptGenerator";
import YouTubeUploader from "../../components/YouTubeUploader";
import MusicGenerator from "../../components/MusicGenerator";
import VideoCreator from "../../components/VideoCreator";
import ThumbnailCreator from "../../components/ThumbnailCreator";
import SavedPrompts from "../../components/SavedPrompts";
import StepGuide from "../../components/StepGuide";
import ClientOnly from "../../components/ClientOnly";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  data: {
    imageKey?: string;
    thumbnailImageKey?: string;
    musicKey?: string;
    videoKey?: string;
    youtubeVideoId?: string;
    youtubeUrl?: string;
    youtubeUploadUrl?: string;
    title?: string;
    description?: string;
    tags?: string[];
    privacyStatus?: "public" | "private" | "unlisted";
    prompts?: {
      theme: string;
      music: string;
      thumbnail: string;
      video: string;
      youtubeTitle?: string;
      youtubeDescription?: string;
      generatedAt: number;
    };
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailImageKey, setThumbnailImageKey] = useState<string>("");
  const [musicKey, setMusicKey] = useState<string>("");
  const [videoKey, setVideoKey] = useState<string>("");
  const [youtubeUploadUrl, setYoutubeUploadUrl] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [currentStep, setCurrentStep] = useState<string>("prompts");

  // 日付フォーマット関数
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}/${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }, []);

  // ステップの定義
  const steps = useMemo(
    () => [
      {
        id: "prompts",
        title: "プロンプト生成",
        description:
          "テーマに基づいてプロンプトを生成し、コンテンツの方向性を決めます",
        icon: "💭",
        status: "pending" as const,
        component: "prompt-generator",
      },
      {
        id: "thumbnail",
        title: "サムネイル作成",
        description: "プロンプトを使って魅力的なサムネイル画像を生成します",
        icon: "🖼️",
        status: "pending" as const,
        component: "thumbnail-creator",
      },
      {
        id: "music",
        title: "音楽生成",
        description: "テーマに合ったBGMを生成またはアップロードします",
        icon: "🎵",
        status: "pending" as const,
        component: "music-generator",
      },
      {
        id: "video",
        title: "動画作成",
        description: "サムネイルと音楽を組み合わせて動画を生成します",
        icon: "🎬",
        status: "pending" as const,
        component: "video-creator",
      },
      {
        id: "youtube",
        title: "YouTube投稿",
        description: "完成した動画をYouTubeにアップロードします",
        icon: "📺",
        status: "pending" as const,
        component: "youtube-uploader",
      },
    ],
    []
  );

  // 現在のステップを決定
  const determineCurrentStep = useCallback(() => {
    if (!project) return "prompts";
    if (!project.data.prompts) return "prompts";
    if (!project.data.thumbnailImageKey) return "thumbnail";
    if (!project.data.musicKey) return "music";
    if (!project.data.videoKey) return "video";
    if (!project.data.youtubeVideoId && !project.data.youtubeUploadUrl)
      return "youtube";
    return "completed"; // 全て完了
  }, [project]);

  // 現在のステップを更新
  useEffect(() => {
    if (project) {
      setCurrentStep(determineCurrentStep());
    }
  }, [project, determineCurrentStep]);

  const loadProject = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();
      if (res.ok) {
        setProject(json.project);
        setThumbnailImageKey(json.project.data.thumbnailImageKey || "");
        setMusicKey(json.project.data.musicKey || "");
        setVideoKey(json.project.data.videoKey || "");
        setYoutubeUploadUrl(json.project.data.youtubeUploadUrl || "");
        setEditName(json.project.name);
        setEditDescription(json.project.description || "");
      } else {
        setError(json.error || "プロジェクトの読み込みに失敗しました");
      }
    } catch (error: any) {
      setError(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const saveProjectData = useCallback(
    async (projectData: any) => {
      if (!projectId) return;

      try {
        const res = await fetch(`/api/projects/${projectId}/data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
        if (res.ok) {
          // プロジェクト情報を再読み込み
          await loadProject();
        }
      } catch (error) {
        console.error("Failed to save project data:", error);
      }
    },
    [projectId, loadProject]
  );

  const updateProjectInfo = useCallback(async () => {
    if (!projectId || !editName.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        }),
      });
      if (res.ok) {
        await loadProject();
        setIsEditing(false);
      } else {
        const json = await res.json();
        setError(json.error || "プロジェクトの更新に失敗しました");
      }
    } catch (error: any) {
      setError(`エラー: ${error.message}`);
    }
  }, [projectId, editName, editDescription, loadProject]);

  const deleteProject = useCallback(async () => {
    if (
      !projectId ||
      !window.confirm("このプロジェクトを削除してもよろしいですか？")
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const json = await res.json();
        setError(json.error || "プロジェクトの削除に失敗しました");
      }
    } catch (error: any) {
      setError(`エラー: ${error.message}`);
    }
  }, [projectId, router]);

  const handlePromptsSaved = useCallback(() => {
    console.log("Prompts saved successfully");
    loadProject(); // プロジェクト情報を再読み込み
  }, [loadProject]);

  const handleLoadPrompts = useCallback((prompts: any) => {
    const promptText = `テーマ: ${prompts.theme}\n\n音楽: ${prompts.music}\n\nサムネイル: ${prompts.thumbnail}\n\n動画: ${prompts.video}`;
    navigator.clipboard
      .writeText(promptText)
      .then(() => {
        alert("プロンプトをクリップボードにコピーしました！");
      })
      .catch(() => {
        console.log("プロンプト:", promptText);
      });
  }, []);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (loading) {
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        <div>読み込み中...</div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main style={{ padding: 24 }}>
        <div
          style={{
            color: "red",
            padding: 16,
            backgroundColor: "#ffe6e6",
            borderRadius: "4px",
            marginBottom: 16,
          }}
        >
          {error || "プロジェクトが見つかりません"}
        </div>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          ダッシュボードに戻る
        </Link>
      </main>
    );
  }

  const getProgressPercentage = () => {
    const assets = [
      project.data.prompts, // プロンプト生成
      project.data.thumbnailImageKey,
      project.data.musicKey,
      project.data.videoKey,
      project.data.youtubeVideoId || project.data.youtubeUploadUrl,
    ];
    const completedAssets = assets.filter(Boolean).length;
    return Math.round((completedAssets / assets.length) * 100);
  };

  const progress = getProgressPercentage();
  const statusColor =
    progress === 100
      ? "#28a745"
      : progress >= 75
      ? "#ffc107"
      : progress >= 50
      ? "#fd7e14"
      : "#6c757d";

  // ステップクリック時のスクロール処理
  const handleStepClick = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (step?.component) {
      const element = document.getElementById(step.component);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <main>
      {/* Header */}
      <div
        style={{
          padding: "24px 24px 0 24px",
          borderBottom: "1px solid #dee2e6",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <Link
                href="/dashboard"
                style={{
                  color: "#007bff",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                ← ダッシュボードに戻る
              </Link>
            </div>

            {isEditing ? (
              <div style={{ display: "grid", gap: 12, maxWidth: 600 }}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    padding: 12,
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "24px",
                    fontWeight: "bold",
                  }}
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="説明（任意）"
                  style={{
                    padding: 12,
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "16px",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={updateProjectInfo}
                    disabled={!editName.trim()}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(project.name);
                      setEditDescription(project.description || "");
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "32px",
                    color: "#333",
                  }}
                >
                  {project.name}
                </h1>
                {project.description && (
                  <p
                    style={{
                      margin: "0 0 16px 0",
                      color: "#666",
                      fontSize: "16px",
                    }}
                  >
                    {project.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={deleteProject}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: 8,
            backgroundColor: "#e9ecef",
            borderRadius: "4px",
            marginBottom: 24,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              backgroundColor: statusColor,
              width: `${progress}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>
            進捗: {progress}% ({progress === 100 ? "完了" : "進行中"})
          </div>
          <ClientOnly
            fallback={
              <div style={{ fontSize: "12px", color: "#888" }}>
                作成: 読み込み中... | 更新: 読み込み中...
              </div>
            }
          >
            <div style={{ fontSize: "12px", color: "#888" }}>
              作成: {formatDate(project.createdAt)} | 更新:{" "}
              {formatDate(project.updatedAt)}
            </div>
          </ClientOnly>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            color: "red",
            padding: 12,
            backgroundColor: "#ffe6e6",
            margin: "16px 24px",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 24, display: "grid", gap: 24 }}>
        {/* Step Guide */}
        <ClientOnly
          fallback={
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #dee2e6",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#333",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  📋 制作手順ガイド
                </h3>
              </div>
              <div style={{ textAlign: "center", color: "#666" }}>
                読み込み中...
              </div>
            </div>
          }
        >
          <StepGuide
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </ClientOnly>

        {/* Components */}
        <div id="prompt-generator">
          <PromptGenerator
            currentProjectId={projectId}
            onPromptsSaved={handlePromptsSaved}
          />
        </div>
        <SavedPrompts projectId={projectId} onLoadPrompts={handleLoadPrompts} />
        <div id="thumbnail-creator">
          <ThumbnailCreator
            imageKey={thumbnailImageKey}
            projectId={projectId}
            thumbnailPrompt={project.data.prompts?.thumbnail}
            onThumbnailCreate={(key) => {
              setThumbnailImageKey(key);
              saveProjectData({ thumbnailImageKey: key });
            }}
            onImageUpload={async (key) => {
              console.log("Project: Image uploaded in ThumbnailCreator", {
                key,
              });
              setThumbnailImageKey(key);
              // サムネイル生成後にプロジェクトデータを保存するため、ここでは保存しない
            }}
          />
        </div>
        <div id="music-generator">
          <MusicGenerator
            musicKey={musicKey}
            onMusicUpload={async (key) => {
              console.log("Project: Music uploaded", { key });
              setMusicKey(key);
              await saveProjectData({ musicKey: key });
            }}
          />
        </div>
        <div id="video-creator">
          <VideoCreator
            imageKey={thumbnailImageKey}
            musicKey={musicKey}
            projectId={projectId}
            onVideoCreate={async (videoKey) => {
              console.log("Project: Video created successfully", { videoKey });
              setVideoKey(videoKey);
              await saveProjectData({ videoKey });
            }}
          />
        </div>
        <div id="youtube-uploader">
          <YouTubeUploader
            videoKey={videoKey}
            youtubeUrl={youtubeUploadUrl}
            youtubeTitle={project.data.prompts?.youtubeTitle}
            youtubeDescription={project.data.prompts?.youtubeDescription}
            onUploadSuccess={async (url) => {
              console.log("Project: YouTube upload successful", { url });
              setYoutubeUploadUrl(url);
              // URLからvideoIdを抽出
              const videoId = url.includes("watch?v=")
                ? url.split("watch?v=")[1]?.split("&")[0]
                : url.includes("youtu.be/")
                ? url.split("youtu.be/")[1]?.split("?")[0]
                : null;

              await saveProjectData({
                youtubeUploadUrl: url,
                youtubeVideoId: videoId,
              });
            }}
          />
        </div>
      </div>
    </main>
  );
}
