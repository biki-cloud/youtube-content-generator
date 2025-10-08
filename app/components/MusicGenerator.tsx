"use client";

import { useCallback, useState } from "react";

interface MusicGeneratorProps {
  onMusicUpload?: (key: string) => void;
  musicKey?: string;
}

export default function MusicGenerator({
  onMusicUpload,
  musicKey: propMusicKey,
}: MusicGeneratorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [musicKey, setMusicKey] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // propMusicKeyが存在する場合はそれを使用、そうでなければローカルのmusicKeyを使用
  const currentMusicKey = propMusicKey || musicKey;

  const upload = useCallback(async () => {
    if (!file) return;
    console.log("MusicGenerator: Starting file upload", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    setIsUploading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();

      if (res.ok) {
        console.log("MusicGenerator: File upload successful", {
          musicKey: json.key,
        });
        setMusicKey(json.key);
        onMusicUpload?.(json.key);
      } else {
        console.error("MusicGenerator: File upload failed", json);
        setError(json.error || "音楽ファイルのアップロードに失敗しました");
      }
    } catch (error) {
      console.error("MusicGenerator: File upload failed", error);
      setError(
        `エラー: ${
          error instanceof Error ? error.message : "アップロードに失敗しました"
        }`
      );
    } finally {
      setIsUploading(false);
    }
  }, [file, onMusicUpload]);

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
          <span style={{ fontSize: "24px" }}>🎵</span>
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            音楽作成
          </h3>
        </div>
        {currentMusicKey && (
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
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {/* 音楽アップロードセクション */}
        <div
          style={{
            border: "2px solid #007bff",
            padding: 20,
            borderRadius: 12,
            backgroundColor: "#f8f9ff",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -10,
              left: 20,
              backgroundColor: "#007bff",
              color: "white",
              padding: "4px 12px",
              borderRadius: 12,
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            音楽ファイル
          </div>
          <h4
            style={{
              margin: "8px 0 12px 0",
              color: "#004085",
              fontSize: "18px",
            }}
          >
            🎶 音楽ファイルをアップロード
          </h4>
          <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}>
            動画の背景音楽として使用する音楽ファイルをアップロードしてください
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                音楽ファイルを選択:
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isUploading}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  fontSize: "14px",
                  backgroundColor: isUploading ? "#f8f9fa" : "white",
                }}
              />
              {file && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: "#e8f5e8",
                    borderRadius: 4,
                    fontSize: "12px",
                    color: "#2d5a2d",
                    border: "1px solid #c3e6c3",
                  }}
                >
                  <strong>選択されたファイル:</strong> {file.name} (
                  {(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <button
              onClick={upload}
              disabled={!file || isUploading}
              style={{
                padding: "12px 24px",
                backgroundColor: !file || isUploading ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: !file || isUploading ? "not-allowed" : "pointer",
                fontWeight: "bold",
                fontSize: "16px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!(!file || isUploading)) {
                  e.currentTarget.style.backgroundColor = "#0056b3";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!(!file || isUploading)) {
                  e.currentTarget.style.backgroundColor = "#007bff";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {isUploading ? "📤 アップロード中..." : "🎵 音楽をアップロード"}
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div
            style={{
              color: "#dc3545",
              padding: 12,
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            <strong>エラー:</strong> {error}
          </div>
        )}

        {/* 音楽プレイヤー */}
        {currentMusicKey && (
          <div
            style={{
              border: "2px solid #28a745",
              padding: 20,
              borderRadius: 12,
              backgroundColor: "#f8fff8",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                left: 20,
                backgroundColor: "#28a745",
                color: "white",
                padding: "4px 12px",
                borderRadius: 12,
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              音楽準備完了
            </div>
            <h4
              style={{
                margin: "8px 0 12px 0",
                color: "#155724",
                fontSize: "18px",
              }}
            >
              🎵 音楽プレイヤー
            </h4>
            <p
              style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}
            >
              アップロードされた音楽ファイルを再生できます
            </p>
            <div
              style={{
                padding: 16,
                backgroundColor: "white",
                borderRadius: 8,
                border: "1px solid #28a745",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <audio
                controls
                style={{
                  width: "100%",
                  height: "40px",
                }}
                src={`/api/files/${currentMusicKey}`}
              >
                お使いのブラウザは音声要素をサポートしていません。
              </audio>
              <div
                style={{
                  marginTop: 12,
                  padding: 8,
                  backgroundColor: "#e8f5e8",
                  borderRadius: 4,
                  fontSize: "12px",
                  color: "#2d5a2d",
                  border: "1px solid #c3e6c3",
                }}
              >
                <strong>音楽キー:</strong> {currentMusicKey}
              </div>
            </div>
          </div>
        )}

        {/* サポート情報 */}
        <div
          style={{
            padding: 16,
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            border: "1px solid #dee2e6",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#333" }}>
            💡 サポート情報
          </h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: 16,
              fontSize: "12px",
              color: "#666",
            }}
          >
            <li>対応形式: MP3, WAV, M4A, OGG</li>
            <li>推奨ファイルサイズ: 10MB以下</li>
            <li>音楽の長さは動画の長さに合わせて自動調整されます</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
