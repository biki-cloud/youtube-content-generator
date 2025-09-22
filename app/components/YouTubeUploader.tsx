"use client";

import { useState, useEffect } from "react";

interface YouTubeUploaderProps {
  videoKey?: string;
  onUploadSuccess?: (url: string) => void;
  youtubeUrl?: string;
  youtubeTitle?: string;
  youtubeDescription?: string;
}

export default function YouTubeUploader({
  videoKey: propVideoKey,
  onUploadSuccess,
  youtubeUrl,
  youtubeTitle: propYoutubeTitle,
  youtubeDescription: propYoutubeDescription,
}: YouTubeUploaderProps) {
  const [videoKey, setVideoKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "unlisted" | "private">(
    "unlisted"
  );
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // propVideoKeyを設定
  useEffect(() => {
    if (propVideoKey) {
      setVideoKey(propVideoKey);
      console.log("YouTubeUploader: Set videoKey from props", {
        videoKey: propVideoKey,
      });
    }
  }, [propVideoKey]);

  // 既にアップロード済みの場合はステータスを設定
  useEffect(() => {
    if (youtubeUrl) {
      setStatus("✅ YouTubeアップロードが完了しました！");
    }
  }, [youtubeUrl]);

  // YouTubeタイトルを自動設定
  useEffect(() => {
    if (propYoutubeTitle && !title) {
      setTitle(propYoutubeTitle);
      console.log("YouTubeUploader: Set title from prompts", {
        title: propYoutubeTitle,
      });
    }
  }, [propYoutubeTitle, title]);

  // YouTube説明文を自動設定
  useEffect(() => {
    if (propYoutubeDescription && !description) {
      setDescription(propYoutubeDescription);
      console.log("YouTubeUploader: Set description from prompts", {
        description: propYoutubeDescription,
      });
    }
  }, [propYoutubeDescription, description]);

  async function startAuth() {
    console.log("YouTubeUploader: Starting YouTube authentication");
    window.location.href = "/api/youtube/auth";
  }

  async function upload() {
    console.log("YouTubeUploader: Starting YouTube upload", {
      videoKey,
      title,
      description,
      privacy,
    });
    setIsUploading(true);
    setStatus("アップロード中...");
    try {
      const res = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoKey, title, description, privacy }),
      });

      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        console.error("YouTubeUploader: Failed to parse response", parseError);
        setStatus(`エラー: サーバーからの応答を解析できませんでした`);
        setIsUploading(false);
        return;
      }

      if (res.ok) {
        console.log("YouTubeUploader: Upload successful", { result: json });
        const uploadUrl = json.url || json.videoId;
        setStatus("✅ YouTubeアップロードが完了しました！");
        onUploadSuccess?.(uploadUrl);
      } else {
        console.error("YouTubeUploader: Upload failed", { error: json });
        setStatus(`エラー: ${json?.error || JSON.stringify(json)}`);
      }
    } catch (error) {
      console.error("YouTubeUploader: Upload request failed", error);
      setStatus(`エラー: ${error}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section
      style={{
        border: "1px solid #e0e0e0",
        padding: "24px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #ff6b6b, #ee5a52)",
            borderRadius: "8px",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(255,107,107,0.3)",
          }}
        >
          <span style={{ fontSize: "18px" }}>📺</span>
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "600",
            color: "#2c3e50",
          }}
        >
          YouTube投稿
        </h3>
        {(status.includes("完了") || youtubeUrl) && (
          <span
            style={{
              background: "linear-gradient(135deg, #28a745, #20c997)",
              color: "white",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              boxShadow: "0 2px 8px rgba(40,167,69,0.3)",
              animation: "pulse 2s infinite",
            }}
          >
            ✅ 完了
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {!youtubeUrl && (
          <>
            <button
              onClick={startAuth}
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(102,126,234,0.3)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(102,126,234,0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(102,126,234,0.3)";
              }}
            >
              🔐 認証を開始
            </button>

            <div style={{ position: "relative" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#495057",
                  marginBottom: "8px",
                }}
              >
                📝 動画タイトル
              </label>
              <input
                placeholder="魅力的なタイトルを入力してください"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e9ecef",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#ffffff",
                  transition: "all 0.3s ease",
                  outline: "none",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(102,126,234,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e9ecef";
                  e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#495057",
                  marginBottom: "8px",
                }}
              >
                📄 動画の説明文
              </label>
              <textarea
                placeholder="動画の内容を詳しく説明してください"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "120px",
                  resize: "vertical",
                  padding: "12px 16px",
                  border: "2px solid #e9ecef",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#ffffff",
                  transition: "all 0.3s ease",
                  outline: "none",
                  fontFamily: "inherit",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(102,126,234,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e9ecef";
                  e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#495057",
                  marginBottom: "8px",
                }}
              >
                🔒 公開設定
              </label>
              <select
                value={privacy}
                onChange={(e) =>
                  setPrivacy(
                    e.target.value as "public" | "unlisted" | "private"
                  )
                }
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e9ecef",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  outline: "none",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(102,126,234,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e9ecef";
                  e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                }}
              >
                <option value="public">🌍 公開 - 誰でも検索・視聴可能</option>
                <option value="unlisted">
                  🔗 限定公開 - URLを知っている人のみ視聴可能
                </option>
                <option value="private">🔒 非公開 - 自分だけ視聴可能</option>
              </select>
            </div>

            <button
              onClick={upload}
              disabled={!videoKey || !title || isUploading}
              style={{
                background: isUploading
                  ? "linear-gradient(135deg, #6c757d, #adb5bd)"
                  : "linear-gradient(135deg, #28a745, #20c997)",
                color: "white",
                border: "none",
                padding: "14px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor:
                  !videoKey || !title || isUploading
                    ? "not-allowed"
                    : "pointer",
                boxShadow: isUploading
                  ? "0 4px 12px rgba(108,117,125,0.3)"
                  : "0 4px 12px rgba(40,167,69,0.3)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center",
                opacity: !videoKey || !title || isUploading ? 0.6 : 1,
              }}
              onMouseOver={(e) => {
                if (!(!videoKey || !title || isUploading)) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(40,167,69,0.4)";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isUploading
                  ? "0 4px 12px rgba(108,117,125,0.3)"
                  : "0 4px 12px rgba(40,167,69,0.3)";
              }}
            >
              {isUploading ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  アップロード中...
                </>
              ) : (
                <>🚀 アップロード開始</>
              )}
            </button>
          </>
        )}

        {youtubeUrl && (
          <div
            style={{
              padding: "20px",
              background: "linear-gradient(135deg, #d4edda, #c3e6cb)",
              border: "2px solid #28a745",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(40,167,69,0.2)",
            }}
          >
            <div
              style={{
                fontWeight: "700",
                marginBottom: "12px",
                fontSize: "16px",
                color: "#155724",
                textAlign: "center",
              }}
            >
              🎉 YouTubeアップロード完了！
            </div>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#155724",
                textDecoration: "none",
                wordBreak: "break-all",
                background: "rgba(255,255,255,0.8)",
                padding: "12px 16px",
                borderRadius: "8px",
                display: "block",
                textAlign: "center",
                fontWeight: "600",
                transition: "all 0.3s ease",
                border: "1px solid rgba(40,167,69,0.2)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.8)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {youtubeUrl}
            </a>
          </div>
        )}

        {status && (
          <div
            style={{
              background: status.includes("エラー")
                ? "linear-gradient(135deg, #f8d7da, #f5c6cb)"
                : "linear-gradient(135deg, #d1ecf1, #bee5eb)",
              border: `2px solid ${
                status.includes("エラー") ? "#dc3545" : "#17a2b8"
              }`,
              borderRadius: "8px",
              padding: "12px 16px",
              color: status.includes("エラー") ? "#721c24" : "#0c5460",
              textAlign: "center",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            {status}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </section>
  );
}
