"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ClientOnly from "./ClientOnly";

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
    prompts?: any;
  };
}

interface ProjectListProps {
  onCreateProject?: () => void;
}

export default function ProjectList({ onCreateProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (res.ok) {
        setProjects(json.projects);
      } else {
        setError(json.error || "プロジェクトの読み込みに失敗しました");
      }
    } catch (error: any) {
      setError(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    if (!confirm("このプロジェクトを削除してもよろしいですか？")) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        const json = await res.json();
        setError(json.error || "プロジェクトの削除に失敗しました");
      }
    } catch (error: any) {
      setError(`エラー: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const formatDate = (timestamp: number) => {
    // ハイドレーションエラーを防ぐため、固定フォーマットを使用
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}/${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const getProgressPercentage = (project: Project) => {
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

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return "#28a745";
    if (percentage >= 75) return "#ffc107";
    if (percentage >= 50) return "#fd7e14";
    return "#6c757d";
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2>プロジェクト一覧</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={loadProjects}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#5a6268";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#6c757d";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "⏳ 読み込み中..." : "🔄 更新"}
          </button>
          <button
            onClick={onCreateProject}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#218838";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#28a745";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            ✨ 新規プロジェクト作成
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            color: "red",
            padding: 12,
            backgroundColor: "#ffe6e6",
            marginBottom: 16,
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: "#666",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "2px dashed #dee2e6",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
          <h3 style={{ margin: "0 0 8px 0" }}>プロジェクトがありません</h3>
          <p style={{ margin: 0 }}>
            新しいプロジェクトを作成して、YouTubeコンテンツの制作を始めましょう！
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: 20,
          }}
        >
          {projects.map((project) => {
            const progress = getProgressPercentage(project);
            const statusColor = getStatusColor(progress);

            return (
              <div
                key={project.id}
                style={{
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                {/* Progress Bar */}
                <div
                  style={{
                    height: 4,
                    backgroundColor: statusColor,
                    width: `${progress}%`,
                    transition: "width 0.3s ease",
                  }}
                />

                <div style={{ padding: 20 }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      >
                        {project.name}
                      </h3>
                      {project.description && (
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            color: "#666",
                            fontSize: "14px",
                            lineHeight: 1.4,
                          }}
                        >
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginLeft: 12,
                      }}
                    >
                      <button
                        onClick={() => deleteProject(project.id)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                        title="プロジェクトを削除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        fontWeight: "bold",
                      }}
                    >
                      進捗: {progress}%
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: statusColor,
                        fontWeight: "bold",
                      }}
                    >
                      {progress === 100 ? "完了" : "進行中"}
                    </div>
                  </div>

                  {/* Assets Status */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {[
                      {
                        key: "prompts",
                        label: "プロンプト",
                        icon: "💭",
                      },
                      {
                        key: "thumbnailImageKey",
                        label: "サムネイル",
                        icon: "🖼️",
                      },
                      { key: "musicKey", label: "音楽", icon: "🎵" },
                      { key: "videoKey", label: "動画", icon: "🎬" },
                      { key: "youtube", label: "YouTube", icon: "📺" },
                    ].map(({ key, label, icon }) => {
                      const isCompleted =
                        key === "youtube"
                          ? !!(
                              project.data.youtubeVideoId ||
                              project.data.youtubeUploadUrl
                            )
                          : !!project.data[key as keyof typeof project.data];

                      return (
                        <div
                          key={key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "12px",
                            color: isCompleted ? "#28a745" : "#6c757d",
                          }}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                          <span>{isCompleted ? "✅" : "⭕"}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dates */}
                  <ClientOnly
                    fallback={
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#888",
                          marginBottom: 16,
                        }}
                      >
                        <div>作成: 読み込み中...</div>
                        <div>更新: 読み込み中...</div>
                      </div>
                    }
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#888",
                        marginBottom: 16,
                      }}
                    >
                      <div>作成: {formatDate(project.createdAt)}</div>
                      <div>更新: {formatDate(project.updatedAt)}</div>
                    </div>
                  </ClientOnly>

                  {/* Action Button */}
                  <Link
                    href={`/projects/${project.id}`}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor: "#007bff",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "4px",
                      textAlign: "center",
                      fontSize: "14px",
                      fontWeight: "bold",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#0056b3";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#007bff";
                    }}
                  >
                    {progress === 100 ? "プロジェクトを確認" : "作業を続ける"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
