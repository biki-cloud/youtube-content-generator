"use client";

import { useCallback, useState, useEffect } from "react";

interface ImageResizerProps {
  thumbnailImageKey?: string;
  onThumbnailImageKeyUpdate?: (newThumbnailImageKey: string) => void;
}

export default function ImageResizer({
  thumbnailImageKey,
  onThumbnailImageKeyUpdate,
}: ImageResizerProps) {
  const [resizedKey, setResizedKey] = useState("");
  const [isResizing, setIsResizing] = useState(false);

  // thumbnailImageKeyが変更されたら自動的にリサイズを実行
  useEffect(() => {
    const autoResize = async () => {
      if (thumbnailImageKey && !resizedKey && !isResizing) {
        console.log("ImageResizer: Auto-resizing triggered", {
          thumbnailImageKey,
        });

        setIsResizing(true);
        try {
          const res = await fetch("/api/image/resize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceKey: thumbnailImageKey,
              width: 1280,
              height: 720,
            }),
          });
          const json = await res.json();
          console.log("ImageResizer: Auto-resize successful", {
            resizedKey: json.key,
          });
          setResizedKey(json.key);
          onThumbnailImageKeyUpdate?.(json.key);
        } catch (error) {
          console.error("ImageResizer: Auto-resize failed", error);
        } finally {
          setIsResizing(false);
        }
      }
    };

    autoResize();
  }, [thumbnailImageKey, resizedKey, isResizing, onThumbnailImageKeyUpdate]);

  return (
    <section style={{ border: "1px solid #ddd", padding: 16 }}>
      <h3>Image Resizer</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {thumbnailImageKey ? (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>入力画像:</strong> {thumbnailImageKey}
            </div>
            <div style={{ marginBottom: 8 }}>
              <img
                src={`/api/files/${thumbnailImageKey}`}
                alt="Source image"
                style={{
                  maxWidth: 320,
                  maxHeight: 180,
                  border: "1px solid #ddd",
                }}
              />
            </div>
            {isResizing && (
              <div style={{ color: "#007bff", fontStyle: "italic" }}>
                リサイズ中... (1280x720)
              </div>
            )}
            {!isResizing && !resizedKey && (
              <div style={{ color: "#666", fontStyle: "italic" }}>
                リサイズを開始しています...
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "#666", fontStyle: "italic" }}>
            画像をアップロードしてください
          </div>
        )}

        {resizedKey && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{ marginBottom: 8, color: "#28a745", fontWeight: "bold" }}
            >
              ✓ リサイズ完了 (1280x720)
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>リサイズ済み画像:</strong> {resizedKey}
            </div>
            <div>
              <img
                src={`/api/files/${resizedKey}`}
                alt="Resized image"
                style={{
                  maxWidth: 320,
                  maxHeight: 180,
                  border: "1px solid #ddd",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
