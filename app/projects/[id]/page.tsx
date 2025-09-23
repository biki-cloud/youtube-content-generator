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
    prompts?: {
      theme: string;
      created_prompts: {
        music: string;
        thumbnail: string;
        youtubeTitle: string;
        youtubeDescription: string;
      };
      generatedAt: number;
    };
    thumbnail?: {
      status: "todo" | "running" | "done";
      created_thumbnail_filepath?: string;
    };
    music?: {
      status: "todo" | "running" | "done";
      created_music_filepath?: string;
      deleted?: boolean;
    };
    video?: {
      status: "todo" | "running" | "done";
      created_video_filepath?: string;
      video_url?: string;
      deleted?: boolean;
    };
    youtube?: {
      status: "todo" | "running" | "done";
      youtube_upload_url?: string;
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
  // 新しい構造のみを使用した状態管理
  const getThumbnailKey = () => {
    return project?.data.thumbnail?.created_thumbnail_filepath || "";
  };

  const getMusicKey = () => {
    return project?.data.music?.created_music_filepath || "";
  };

  const getVideoKey = () => {
    return project?.data.video?.created_video_filepath || "";
  };
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

    // 新しい構造でのチェック
    if (project.data.thumbnail?.status !== "done") return "thumbnail";

    // YouTubeアップロードが完了している場合は、音楽と動画も完了として扱う
    if (project.data.youtube?.status === "done") {
      return "completed";
    }

    if (project.data.music?.status !== "done") return "music";
    if (project.data.video?.status !== "done") return "video";
    if (
      !project.data.youtube ||
      project.data.youtube.status === "todo" ||
      project.data.youtube.status === "running"
    )
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
        // 新しい構造に対応したデータ読み込み
        // 状態変数は削除したので、直接プロジェクトデータから取得
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
    // 新しい構造での進捗計算
    if (project.data.youtube?.status === "done") {
      console.log("YouTube status is done, returning 100%");
      return 100;
    }

    // 各ステップの完了状況をチェック（YouTubeステップも含む）
    const steps = [
      project.data.prompts ? "prompts" : null,
      project.data.thumbnail?.status === "done" ? "thumbnail" : null,
      project.data.music?.status === "done" ? "music" : null,
      project.data.video?.status === "done" ? "video" : null,
      project.data.youtube?.status === "done" ? "youtube" : null,
    ];

    const completedSteps = steps.filter(Boolean).length;
    const percentage = Math.round((completedSteps / 5) * 100);

    console.log("Progress calculation:", {
      youtubeStatus: project.data.youtube?.status,
      prompts: !!project.data.prompts,
      thumbnailStatus: project.data.thumbnail?.status,
      musicStatus: project.data.music?.status,
      videoStatus: project.data.video?.status,
      steps,
      completedSteps,
      percentage,
    });

    return percentage;
  };

  // YouTubeアップロード完了状態を判定
  const isYouTubeUploadComplete = () => {
    return project.data.youtube?.status === "done";
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
            imageKey={getThumbnailKey()}
            projectId={projectId}
            thumbnailPrompt={project.data.prompts?.created_prompts?.thumbnail}
            onThumbnailCreate={(key) => {
              saveProjectData({
                thumbnail: {
                  status: "done",
                  created_thumbnail_filepath: key,
                },
              });
            }}
            onImageUpload={async (key) => {
              console.log("Project: Image uploaded in ThumbnailCreator", {
                key,
              });
              // サムネイル生成後にプロジェクトデータを保存するため、ここでは保存しない
            }}
          />
        </div>
        <div id="music-generator">
          {isYouTubeUploadComplete() ? (
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #dee2e6",
                borderRadius: "12px",
                padding: "20px",
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
                  🎵 音楽生成
                </h3>
                <div
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  ✅ 完了済み
                </div>
              </div>
              <div style={{ color: "#666", fontSize: "14px" }}>
                YouTubeアップロード完了後、音楽ファイルは自動的に削除されました。
              </div>
            </div>
          ) : (
            <MusicGenerator
              musicKey={getMusicKey()}
              onMusicUpload={async (key) => {
                console.log("Project: Music uploaded", { key });
                await saveProjectData({
                  music: {
                    status: "done",
                    created_music_filepath: key,
                  },
                });
              }}
            />
          )}
        </div>
        <div id="video-creator">
          {isYouTubeUploadComplete() ? (
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #dee2e6",
                borderRadius: "12px",
                padding: "20px",
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
                  🎬 動画作成
                </h3>
                <div
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  ✅ 完了済み
                </div>
              </div>
              <div style={{ color: "#666", fontSize: "14px" }}>
                YouTubeアップロード完了後、動画ファイルは自動的に削除されました。
              </div>
            </div>
          ) : (
            <VideoCreator
              imageKey={getThumbnailKey()}
              musicKey={getMusicKey()}
              projectId={projectId}
              onVideoCreate={async (videoKey) => {
                console.log("Project: Video created successfully", {
                  videoKey,
                });
                await saveProjectData({
                  video: {
                    status: "done",
                    created_video_filepath: videoKey,
                  },
                });
              }}
            />
          )}
        </div>
        <div id="youtube-uploader">
          <YouTubeUploader
            videoKey={getVideoKey()}
            youtubeUrl={project.data.youtube?.youtube_upload_url || ""}
            youtubeTitle={project.data.prompts?.created_prompts?.youtubeTitle}
            youtubeDescription={
              project.data.prompts?.created_prompts?.youtubeDescription
            }
            projectId={project.id}
            onUploadSuccess={async (url) => {
              console.log("Project: YouTube upload successful", { url });

              await saveProjectData({
                youtube: {
                  status: "done",
                  youtube_upload_url: url,
                },
              });
            }}
          />
        </div>
      </div>
    </main>
  );
}
