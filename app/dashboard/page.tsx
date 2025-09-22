"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProjectList from "../components/ProjectList";

export default function Dashboard() {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) {
      setError("プロジェクト名は必須です");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDescription.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        // プロジェクト作成後、そのプロジェクトの詳細ページに遷移
        router.push(`/projects/${json.project.id}`);
      } else {
        setError(json.error || "プロジェクトの作成に失敗しました");
      }
    } catch (error: any) {
      setError(`エラー: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  }, [newProjectName, newProjectDescription, router]);

  const handleShowCreateForm = useCallback(() => {
    setShowCreateForm(true);
    setError(null);
  }, []);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setNewProjectName("");
    setNewProjectDescription("");
    setError(null);
  }, []);

  return (
    <main>
      {/* Header */}
      <div
        style={{
          padding: "32px 24px 0 24px",
          borderBottom: "1px solid #dee2e6",
          backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 12px 0",
                fontSize: "36px",
                color: "white",
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              🎬 YouTube Content Generator
            </h1>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.9)",
                fontSize: "18px",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              AIを活用して効率的にYouTubeコンテンツを制作しましょう
            </p>
          </div>
        </div>

        {/* Quick Create Form */}
        {showCreateForm && (
          <div
            style={{
              padding: 24,
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #dee2e6",
              marginBottom: 32,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: "24px" }}>✨</span>
              <h3
                style={{
                  margin: 0,
                  color: "#333",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                新しいプロジェクトを作成
              </h3>
            </div>

            {error && (
              <div
                style={{
                  color: "red",
                  padding: 8,
                  backgroundColor: "#ffe6e6",
                  marginBottom: 16,
                  borderRadius: "4px",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  📝 プロジェクト名 *
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="例: 料理チャンネル第1回"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 14,
                      border: "2px solid #dee2e6",
                      borderRadius: "8px",
                      fontSize: "16px",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#007bff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#dee2e6";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = String(today.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(today.getDate()).padStart(2, "0");
                      setNewProjectName(`${year}-${month}-${day}`);
                    }}
                    style={{
                      padding: "14px 16px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#218838";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#28a745";
                    }}
                  >
                    📅 今日の日付
                  </button>
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  📄 説明（任意）
                </label>
                <input
                  type="text"
                  placeholder="プロジェクトの詳細や目的を記入してください"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 14,
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "16px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#007bff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#dee2e6";
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || isCreating}
                  style={{
                    padding: "14px 28px",
                    backgroundColor: isCreating ? "#ccc" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: isCreating ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (!isCreating && newProjectName.trim()) {
                      e.currentTarget.style.backgroundColor = "#218838";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCreating && newProjectName.trim()) {
                      e.currentTarget.style.backgroundColor = "#28a745";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {isCreating ? "⏳ 作成中..." : "✨ プロジェクトを作成"}
                </button>
                <button
                  onClick={handleCancelCreate}
                  style={{
                    padding: "14px 28px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#5a6268";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#6c757d";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  ❌ キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project List */}
      <ProjectList onCreateProject={handleShowCreateForm} />
    </main>
  );
}
