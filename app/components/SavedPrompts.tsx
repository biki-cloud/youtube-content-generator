"use client";

import { useState, useEffect } from "react";
import { GeneratedPrompts } from "@/lib/projects";

interface SavedPromptsProps {
  projectId: string | null;
  onLoadPrompts?: (prompts: GeneratedPrompts) => void;
}

export default function SavedPrompts({
  projectId,
  onLoadPrompts,
}: SavedPromptsProps) {
  const [prompts, setPrompts] = useState<GeneratedPrompts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadPrompts = async () => {
    if (!projectId) {
      setPrompts(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();
      if (res.ok && json.project?.data?.prompts) {
        setPrompts(json.project.data.prompts);
      } else {
        setPrompts(null);
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
      setPrompts(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, [projectId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <section style={{ border: "1px solid #ddd", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={toggleExpanded}
      >
        <h3
          style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}
        >
          <span
            style={{
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            ▶
          </span>
          保存されたプロンプト
        </h3>
        {projectId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadPrompts();
            }}
            style={{
              padding: "4px 8px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Refresh
          </button>
        )}
      </div>

      {isExpanded && (
        <div style={{ marginTop: 16 }}>
          {!projectId ? (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              プロジェクトを選択してください
            </p>
          ) : loading ? (
            <p>読み込み中...</p>
          ) : error ? (
            <div
              style={{ color: "red", padding: 8, backgroundColor: "#ffe6e6" }}
            >
              {error}
            </div>
          ) : !prompts ? (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              このプロジェクトには保存されたプロンプトがありません
            </p>
          ) : (
            <>
              <div
                style={{
                  marginBottom: 12,
                  padding: 8,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 4,
                }}
              >
                <div style={{ fontSize: 14, color: "#495057" }}>
                  <strong>テーマ:</strong> {prompts.theme}
                </div>
                <div style={{ fontSize: 12, color: "#6c757d", marginTop: 4 }}>
                  生成日時: {formatDate(prompts.generatedAt)}
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div
                  style={{
                    padding: 12,
                    backgroundColor: "#f8f9fa",
                    borderRadius: 4,
                    border: "1px solid #e9ecef",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 14,
                      color: "#495057",
                    }}
                  >
                    🎵 音楽プロンプト
                  </h4>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
                    {prompts.music}
                  </p>
                </div>

                <div
                  style={{
                    padding: 12,
                    backgroundColor: "#f8f9fa",
                    borderRadius: 4,
                    border: "1px solid #e9ecef",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 14,
                      color: "#495057",
                    }}
                  >
                    🖼️ サムネイルプロンプト
                  </h4>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
                    {prompts.thumbnail}
                  </p>
                </div>

                {prompts.youtubeTitle && (
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 4,
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: 14,
                        color: "#495057",
                      }}
                    >
                      📺 YouTube タイトル
                    </h4>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
                      {prompts.youtubeTitle}
                    </p>
                  </div>
                )}

                {prompts.youtubeDescription && (
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 4,
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: 14,
                        color: "#495057",
                      }}
                    >
                      📝 YouTube 説明文
                    </h4>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
                      {prompts.youtubeDescription}
                    </p>
                  </div>
                )}
              </div>

              {onLoadPrompts && (
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={() => onLoadPrompts(prompts)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    📋 プロンプトをコピー
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
