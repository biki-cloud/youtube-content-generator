"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import ClientOnly from "./ClientOnly";

interface Job {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  result?: { key: string };
  error?: string;
}

interface VideoFile {
  filename: string;
  key: string;
  url: string;
  downloadUrl: string;
}

interface VideoCreatorProps {
  imageKey?: string;
  musicKey?: string;
  projectId?: string;
  onVideoCreate?: (videoKey: string) => void;
}

export default function VideoCreator({
  imageKey: propImageKey,
  musicKey: propMusicKey,
  projectId,
  onVideoCreate,
}: VideoCreatorProps) {
  const [imageKey, setImageKey] = useState(propImageKey || "");
  const [musicKey, setMusicKey] = useState(propMusicKey || "");
  const [durationSec, setDurationSec] = useState(30);
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [showVideoList, setShowVideoList] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jobRef = useRef<Job | null>(null);

  // プロパティが変更されたときに状態を更新
  useEffect(() => {
    if (propImageKey) {
      setImageKey(propImageKey);
    }
  }, [propImageKey]);

  useEffect(() => {
    if (propMusicKey) {
      setMusicKey(propMusicKey);
    }
  }, [propMusicKey]);

  // 動画一覧を取得する関数
  const fetchVideoList = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/videos/list?projectId=${projectId}`);
      const data = await response.json();
      if (response.ok) {
        setVideoFiles(data.videos || []);
      } else {
        console.error("Failed to fetch video list:", data.error);
      }
    } catch (error) {
      console.error("Error fetching video list:", error);
    }
  }, [projectId]);

  // コンポーネントマウント時に動画一覧を取得
  useEffect(() => {
    fetchVideoList();
  }, [fetchVideoList]);

  const createVideo = useCallback(async () => {
    console.log("VideoCreator: createVideo called", {
      imageKey,
      musicKey,
      durationSec,
      hasImageKey: !!imageKey,
      hasMusicKey: !!musicKey,
    });

    if (!imageKey || !musicKey) {
      const missingItems = [];
      if (!imageKey) missingItems.push("画像");
      if (!musicKey) missingItems.push("音楽");
      setError(`${missingItems.join("と")}が必要です`);
      return;
    }

    console.log("VideoCreator: Starting video creation", {
      imageKey,
      musicKey,
      durationSec,
    });

    setError(null);
    setJobId("");
    setJob(null);
    setVideoUrl("");
    jobRef.current = null;

    try {
      console.log("VideoCreator: Sending request to /api/video/create");
      const res = await fetch("/api/video/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageKey, musicKey, durationSec }),
      });

      console.log("VideoCreator: Response received", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });

      const json = await res.json();
      console.log("VideoCreator: Response JSON", json);

      if (res.ok) {
        console.log("VideoCreator: Video creation request successful", {
          jobId: json.jobId,
        });
        setJobId(json.jobId);
      } else {
        console.error("VideoCreator: Video creation request failed", {
          error: json,
        });

        // より詳細なエラーメッセージを表示
        let errorMessage = "動画作成に失敗しました";
        if (json.error) {
          errorMessage = json.error;
        }
        if (json.missingFiles && Array.isArray(json.missingFiles)) {
          errorMessage += `\n\n不足しているファイル:\n${json.missingFiles.join(
            "\n"
          )}`;
        }

        setError(errorMessage);
      }
    } catch (error: any) {
      console.error("VideoCreator: Video creation request failed", error);
      setError(`エラー: ${error.message}`);
    }
  }, [imageKey, musicKey, durationSec]);

  // ジョブ状態の監視（SSEのみ）
  useEffect(() => {
    if (!jobId) return;

    console.log("VideoCreator: Starting job monitoring", { jobId });

    // SSE接続のみ
    let eventSource: EventSource | null = null;
    let sseTimeout: NodeJS.Timeout | null = null;

    const startSSE = () => {
      try {
        console.log("VideoCreator: Creating SSE connection", { jobId });
        eventSource = new EventSource(`/api/jobs/${jobId}/stream`);

        eventSource.onopen = () => {
          console.log("VideoCreator: SSE connection opened", { jobId });
          if (sseTimeout) {
            clearTimeout(sseTimeout);
            sseTimeout = null;
          }
        };

        eventSource.onmessage = (event) => {
          try {
            console.log("VideoCreator: SSE message received", {
              jobId,
              rawData: event.data,
            });
            const jobData: Job = JSON.parse(event.data);
            console.log("VideoCreator: SSE job update", { jobId, jobData });

            setJob(jobData);
            jobRef.current = jobData;

            if (jobData.status === "done" || jobData.status === "failed") {
              console.log("VideoCreator: Job completed, closing SSE", {
                jobId,
                status: jobData.status,
              });
              eventSource?.close();
            }
          } catch (error) {
            console.error("VideoCreator: Failed to parse SSE data", error, {
              rawData: event.data,
            });
          }
        };

        eventSource.onerror = (error) => {
          console.error("VideoCreator: SSE error", error, {
            jobId,
            readyState: eventSource?.readyState,
          });
          eventSource?.close();

          // SSEエラー時はエラーメッセージを表示
          setError(
            "リアルタイム接続に失敗しました。ページを更新してください。"
          );
        };

        // SSE接続のタイムアウト処理（10秒でタイムアウト）
        sseTimeout = setTimeout(() => {
          console.log("VideoCreator: SSE connection timeout", { jobId });
          eventSource?.close();
          setError("接続がタイムアウトしました。ページを更新してください。");
        }, 10000);
      } catch (error) {
        console.error("VideoCreator: Failed to create SSE connection", error, {
          jobId,
        });
        setError(
          "リアルタイム接続の作成に失敗しました。ページを更新してください。"
        );
      }
    };

    // SSE接続を開始
    startSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (sseTimeout) {
        clearTimeout(sseTimeout);
      }
    };
  }, [jobId]);

  // ジョブ完了時の処理
  useEffect(() => {
    if (!job) return;

    if (job.status === "done" && job.result) {
      console.log("VideoCreator: Video creation completed", {
        videoKey: job.result.key,
        jobData: job,
      });
      const videoUrl = `/api/files/${encodeURIComponent(job.result.key)}`;
      console.log("VideoCreator: Setting video URL", { videoUrl });
      setVideoUrl(videoUrl);
      onVideoCreate?.(job.result.key);

      // 動画作成完了後に動画一覧を更新
      if (projectId) {
        console.log("VideoCreator: Updating video list after completion");
        fetchVideoList();
      }
    } else if (job.status === "failed") {
      console.error("VideoCreator: Video creation failed", {
        error: job.error,
        jobData: job,
      });
      setError(job.error || "動画作成に失敗しました");
    }
  }, [job, onVideoCreate, projectId, fetchVideoList]);

  return (
    <section
      style={{
        border: "1px solid #dee2e6",
        borderRadius: "12px",
        padding: "24px",
        backgroundColor: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "24px" }}>🎬</span>
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            動画作成
          </h3>
        </div>
        {(videoUrl || (propImageKey && propMusicKey)) && (
          <span
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ✅ 完了
          </span>
        )}
        <button
          onClick={() => setShowVideoList(!showVideoList)}
          style={{
            marginLeft: "auto",
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#5a6268";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#6c757d";
          }}
        >
          {showVideoList ? "動画を隠す" : `作成済み動画 (${videoFiles.length})`}
        </button>
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            🎯 動画の長さ (秒)
          </label>

          {/* クイック選択ボタン */}
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}
            >
              クイック選択:
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => setDurationSec(600)} // 10分 = 600秒
                style={{
                  padding: "8px 12px",
                  backgroundColor: durationSec === 600 ? "#007bff" : "#ffffff",
                  color: durationSec === 600 ? "#ffffff" : "#333",
                  border: "1px solid #007bff",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  minWidth: "60px",
                }}
              >
                10分
              </button>
              <button
                onClick={() => setDurationSec(1800)} // 30分 = 1800秒
                style={{
                  padding: "8px 12px",
                  backgroundColor: durationSec === 1800 ? "#007bff" : "#ffffff",
                  color: durationSec === 1800 ? "#ffffff" : "#333",
                  border: "1px solid #007bff",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  minWidth: "60px",
                }}
              >
                30分
              </button>
              <button
                onClick={() => setDurationSec(3600)} // 1時間 = 3600秒
                style={{
                  padding: "8px 12px",
                  backgroundColor: durationSec === 3600 ? "#007bff" : "#ffffff",
                  color: durationSec === 3600 ? "#ffffff" : "#333",
                  border: "1px solid #007bff",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  minWidth: "60px",
                }}
              >
                1時間
              </button>
            </div>
          </div>

          {/* 従来の数値入力フィールド */}
          <input
            type="number"
            min="1"
            max="3600"
            value={durationSec}
            onChange={(e) => setDurationSec(parseInt(e.target.value) || 30)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ced4da",
              borderRadius: "6px",
              fontSize: "16px",
            }}
          />
          <div
            style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
          ></div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => {
              console.log("VideoCreator: Create Video button clicked");
              createVideo();
            }}
            disabled={!imageKey || !musicKey || durationSec < 1}
            style={{
              padding: "14px 28px",
              backgroundColor:
                !imageKey || !musicKey || durationSec < 1 ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                !imageKey || !musicKey || durationSec < 1
                  ? "not-allowed"
                  : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!(!imageKey || !musicKey || durationSec < 1)) {
                e.currentTarget.style.backgroundColor = "#0056b3";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!(!imageKey || !musicKey || durationSec < 1)) {
                e.currentTarget.style.backgroundColor = "#007bff";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            🎬 動画を作成
          </button>

          {(!imageKey || !musicKey) && (
            <div style={{ fontSize: "14px", color: "#dc3545" }}>
              {!imageKey && !musicKey
                ? "サムネイルと音楽が必要です"
                : !imageKey
                ? "サムネイルが必要です"
                : "音楽が必要です"}
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              color: "red",
              padding: 12,
              backgroundColor: "#ffe6e6",
              border: "1px solid #ffcccc",
              borderRadius: "4px",
              whiteSpace: "pre-line",
              fontSize: "14px",
            }}
          >
            <strong>エラー:</strong> {error}
          </div>
        )}

        {jobId && (
          <div
            style={{
              border: "1px solid #dee2e6",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: "20px" }}>⚙️</span>
              <h4 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
                動画生成中...
              </h4>
            </div>

            <div style={{ fontSize: "12px", color: "#666", marginBottom: 12 }}>
              Job ID: {jobId} | ポーリング中... (1秒間隔)
            </div>

            {job && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#333",
                    }}
                  >
                    {job.status === "queued"
                      ? "待機中"
                      : job.status === "running"
                      ? "処理中"
                      : job.status === "done"
                      ? "完了"
                      : "エラー"}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#007bff",
                    }}
                  >
                    {job.progress}%
                  </span>
                </div>

                {job.status === "running" && (
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "#e9ecef",
                      borderRadius: "4px",
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: `${job.progress}%`,
                        height: "100%",
                        backgroundColor: "#007bff",
                        transition: "width 0.3s ease",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                )}

                {job.error && (
                  <div
                    style={{
                      color: "#dc3545",
                      backgroundColor: "#f8d7da",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      fontSize: "14px",
                      border: "1px solid #f5c6cb",
                    }}
                  >
                    <strong>エラー:</strong> {job.error}
                  </div>
                )}
              </>
            )}

            {!job && (
              <div
                style={{
                  color: "#666",
                  fontSize: "14px",
                  textAlign: "center",
                  padding: "12px",
                }}
              >
                🔄 ジョブ状態を取得中...
              </div>
            )}
          </div>
        )}

        {videoUrl && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#d4edda",
              borderRadius: "8px",
              border: "1px solid #c3e6cb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: "20px" }}>🎉</span>
              <h4 style={{ margin: 0, fontSize: "16px", color: "#155724" }}>
                動画が完成しました！
              </h4>
            </div>
            <video
              src={videoUrl}
              controls
              style={{
                width: "100%",
                maxWidth: 480,
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            />
          </div>
        )}

        {showVideoList && (
          <ClientOnly
            fallback={
              <div
                style={{
                  marginTop: 24,
                  padding: "20px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontSize: "20px" }}>📹</span>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
                    作成済み動画
                  </h4>
                </div>
                <div style={{ textAlign: "center", color: "#666" }}>
                  読み込み中...
                </div>
              </div>
            }
          >
            <div
              style={{
                marginTop: 24,
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: "20px" }}>📹</span>
                <h4 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
                  作成済み動画
                </h4>
              </div>

              {videoFiles.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "#666",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "2px dashed #dee2e6",
                  }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    🎬
                  </div>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    まだ動画が作成されていません
                  </p>
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    上記の「動画を作成」ボタンから動画を生成してください
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {videoFiles.map((video) => (
                    <div
                      key={video.key}
                      style={{
                        border: "1px solid #dee2e6",
                        borderRadius: "12px",
                        padding: "16px",
                        backgroundColor: "white",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          {video.filename}
                        </div>
                        <a
                          href={video.downloadUrl}
                          download={video.filename}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#28a745",
                            color: "white",
                            textDecoration: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#218838";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#28a745";
                          }}
                        >
                          ⬇️ ダウンロード
                        </a>
                      </div>
                      <video
                        src={video.url}
                        controls
                        style={{
                          width: "100%",
                          maxWidth: 400,
                          height: "auto",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ClientOnly>
        )}
      </div>
    </section>
  );
}
