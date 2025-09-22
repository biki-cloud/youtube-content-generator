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

  // propMusicKeyが存在する場合はそれを使用、そうでなければローカルのmusicKeyを使用
  const currentMusicKey = propMusicKey || musicKey;

  const upload = useCallback(async () => {
    if (!file) return;
    console.log("MusicGenerator: Starting file upload", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      console.log("MusicGenerator: File upload successful", {
        musicKey: json.key,
      });
      setMusicKey(json.key);
      onMusicUpload?.(json.key);
    } catch (error) {
      console.error("MusicGenerator: File upload failed", error);
    }
  }, [file, onMusicUpload]);

  return (
    <section style={{ border: "1px solid #ddd", padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0 }}>音楽作成</h3>
        {currentMusicKey && (
          <span
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            ✅ 完了
          </span>
        )}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={upload} disabled={!file}>
          Upload MP3
        </button>
        {currentMusicKey && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                padding: 12,
                backgroundColor: "#f8f9fa",
                borderRadius: 4,
                border: "1px solid #e9ecef",
              }}
            >
              <h4
                style={{ margin: "0 0 8px 0", fontSize: 14, color: "#495057" }}
              >
                🎵 音楽プレイヤー
              </h4>
              <audio
                controls
                style={{ width: "100%" }}
                src={`/api/files/${currentMusicKey}`}
              >
                お使いのブラウザは音声要素をサポートしていません。
              </audio>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
