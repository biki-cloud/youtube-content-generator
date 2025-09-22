"use client";

import { useCallback, useState, useEffect } from "react";

interface ThumbnailCreatorProps {
  imageKey: string | null;
  onThumbnailCreate?: (key: string) => void;
  onImageUpload?: (key: string) => void;
  projectId?: string;
  thumbnailPrompt?: string;
}

export default function ThumbnailCreator({
  imageKey,
  onThumbnailCreate,
  onImageUpload,
  projectId,
  thumbnailPrompt,
}: ThumbnailCreatorProps) {
  const [generatedThumbnailKey, setGeneratedThumbnailKey] = useState<
    string | null
  >(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(
    imageKey
  );

  // DALL-E related state
  const [dallePrompt, setDallePrompt] = useState("");
  const [isGeneratingDalle, setIsGeneratingDalle] = useState(false);
  const [dalleImageKey, setDalleImageKey] = useState<string | null>(null);
  const [dalleRevisedPrompt, setDalleRevisedPrompt] = useState<string | null>(
    null
  );

  // プロジェクトデータからサムネイルプロンプトを取得してデフォルトにセット
  useEffect(() => {
    // 直接渡されたサムネイルプロンプトを優先
    if (thumbnailPrompt) {
      console.log(
        "ThumbnailCreator: Setting thumbnail prompt from props:",
        thumbnailPrompt
      );
      setDallePrompt(thumbnailPrompt);
      return;
    }

    const loadThumbnailPrompt = async () => {
      if (!projectId) {
        console.log("ThumbnailCreator: No projectId provided");
        return;
      }

      console.log(
        "ThumbnailCreator: Loading thumbnail prompt for projectId:",
        projectId
      );

      try {
        const response = await fetch(`/api/projects/${projectId}`);
        console.log("ThumbnailCreator: API response status:", response.status);

        if (response.ok) {
          const project = await response.json();
          console.log("ThumbnailCreator: Project data:", project);

          if (project.project?.data?.prompts?.thumbnail) {
            console.log(
              "ThumbnailCreator: Setting thumbnail prompt:",
              project.project.data.prompts.thumbnail
            );
            setDallePrompt(project.project.data.prompts.thumbnail);
          } else {
            console.log(
              "ThumbnailCreator: No thumbnail prompt found in project data"
            );
          }
        } else {
          console.error(
            "ThumbnailCreator: Failed to fetch project:",
            response.status
          );
        }
      } catch (error) {
        console.error(
          "ThumbnailCreator: Failed to load thumbnail prompt:",
          error
        );
      }
    };

    loadThumbnailPrompt();
  }, [projectId, thumbnailPrompt]);

  const generateThumbnailFromImage = useCallback(
    async (imageKey: string) => {
      console.log("ThumbnailCreator: Starting automatic thumbnail generation", {
        imageKey,
        imageKeyType: typeof imageKey,
        imageKeyLength: imageKey?.length,
      });

      try {
        const requestBody = {
          sourceKey: imageKey,
          title: undefined,
          style: "default",
        };

        console.log("ThumbnailCreator: Sending thumbnail generation request", {
          url: "/api/image/thumbnail",
          body: requestBody,
        });

        const res = await fetch("/api/image/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        console.log(
          "ThumbnailCreator: Thumbnail API response status:",
          res.status
        );

        const json = await res.json();
        console.log("ThumbnailCreator: Thumbnail API response:", json);

        if (res.ok) {
          console.log(
            "ThumbnailCreator: Automatic thumbnail generation successful",
            {
              thumbnailKey: json.key,
            }
          );
          setGeneratedThumbnailKey(json.key);
          onThumbnailCreate?.(json.key);
        } else {
          console.error(
            "ThumbnailCreator: Automatic thumbnail generation failed",
            {
              error: json.error,
              response: json,
            }
          );
          setError(json.error || "サムネイル生成に失敗しました");
        }
      } catch (error: any) {
        console.error(
          "ThumbnailCreator: Automatic thumbnail generation request failed",
          error
        );
        setError(`エラー: ${error.message}`);
      }
    },
    [onThumbnailCreate]
  );

  const uploadImage = useCallback(
    async (file: File) => {
      console.log("ThumbnailCreator: Starting image upload", {
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
          console.log("ThumbnailCreator: Image upload successful", {
            uploadedKey: json.key,
          });
          setUploadedImageKey(json.key);

          // 自動でリサイズを実行
          console.log(
            "ThumbnailCreator: Calling generateThumbnailFromImage for uploaded image"
          );
          await generateThumbnailFromImage(json.key);

          onImageUpload?.(json.key);
        } else {
          console.error("ThumbnailCreator: Image upload failed", {
            error: json.error,
            response: json,
          });
          setError(json.error || "画像アップロードに失敗しました");
        }
      } catch (error: any) {
        console.error("ThumbnailCreator: Image upload request failed", error);
        setError(`エラー: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    },
    [onImageUpload, generateThumbnailFromImage]
  );

  const generateDalleImage = useCallback(async () => {
    if (!dallePrompt.trim()) {
      setError("プロンプトを入力してください");
      return;
    }

    console.log("ThumbnailCreator: Starting DALL-E image generation", {
      prompt: dallePrompt,
    });

    setIsGeneratingDalle(true);
    setError(null);

    try {
      const res = await fetch("/api/image/dalle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: dallePrompt,
          size: "1024x1024",
          quality: "hd",
          n: 1,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        console.log("ThumbnailCreator: DALL-E image generation successful", {
          imageKey: json.key,
          revisedPrompt: json.revised_prompt,
        });
        setDalleImageKey(json.key);
        setDalleRevisedPrompt(json.revised_prompt);
        setUploadedImageKey(json.key);

        // 自動でリサイズを実行
        console.log(
          "ThumbnailCreator: Calling generateThumbnailFromImage for DALL-E image"
        );
        await generateThumbnailFromImage(json.key);

        onImageUpload?.(json.key);
      } else {
        console.error("ThumbnailCreator: DALL-E image generation failed", {
          error: json.error,
          response: json,
        });
        setError(json.error || "DALL-E画像生成に失敗しました");
      }
    } catch (error: any) {
      console.error(
        "ThumbnailCreator: DALL-E image generation request failed",
        error
      );
      setError(`エラー: ${error.message}`);
    } finally {
      setIsGeneratingDalle(false);
    }
  }, [dallePrompt, onImageUpload, generateThumbnailFromImage]);

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
        <h3 style={{ margin: 0 }}>サムネイル画像作成</h3>
        {(generatedThumbnailKey || imageKey) && (
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
      <div style={{ display: "grid", gap: 16 }}>
        {/* サムネイル準備方法の選択 */}
        <div
          style={{
            padding: 16,
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            border: "1px solid #dee2e6",
          }}
        >
          <h4 style={{ margin: "0 0 12px 0", color: "#333", fontSize: "16px" }}>
            📸 サムネイルを用意する方法を選択してください
          </h4>
          <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}>
            以下の2つの方法から選択できます：
          </p>
        </div>

        {/* 方法1: DALL-E画像生成 */}
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
            方法1
          </div>
          <h4
            style={{
              margin: "8px 0 12px 0",
              color: "#155724",
              fontSize: "18px",
            }}
          >
            🎨 DALL-Eで画像を生成
          </h4>
          <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}>
            AIがプロンプトに基づいて画像を自動生成します
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                プロンプト:
              </label>
              <textarea
                value={dallePrompt}
                onChange={(e) => setDallePrompt(e.target.value)}
                placeholder="例: A futuristic cityscape at sunset with flying cars and neon lights, cinematic style"
                disabled={isGeneratingDalle}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  minHeight: 100,
                  resize: "vertical",
                  fontSize: "14px",
                }}
              />
            </div>
            <button
              onClick={generateDalleImage}
              disabled={!dallePrompt.trim() || isGeneratingDalle}
              style={{
                padding: "12px 24px",
                backgroundColor: isGeneratingDalle ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isGeneratingDalle ? "not-allowed" : "pointer",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              {isGeneratingDalle ? "🎨 生成中..." : "🎨 DALL-Eで画像生成"}
            </button>
            {dalleRevisedPrompt && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: "#e8f5e8",
                  borderRadius: 6,
                  fontSize: "13px",
                  color: "#2d5a2d",
                  border: "1px solid #c3e6c3",
                }}
              >
                <strong>修正されたプロンプト:</strong> {dalleRevisedPrompt}
              </div>
            )}
          </div>
        </div>

        {/* 方法2: 画像アップロード */}
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
            方法2
          </div>
          <h4
            style={{
              margin: "8px 0 12px 0",
              color: "#004085",
              fontSize: "18px",
            }}
          >
            📁 画像をアップロード
          </h4>
          <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}>
            既存の画像ファイルをアップロードして使用します
          </p>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: "bold",
                color: "#333",
              }}
            >
              画像ファイルを選択:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  uploadImage(file);
                }
              }}
              disabled={isUploading}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #ccc",
                borderRadius: 6,
                fontSize: "14px",
              }}
            />
            {isUploading && (
              <div
                style={{
                  color: "#666",
                  marginTop: 8,
                  fontSize: "14px",
                  fontStyle: "italic",
                }}
              >
                📤 アップロード中...
              </div>
            )}
          </div>
        </div>

        {/* 現在の画像プレビュー */}
        {(uploadedImageKey || imageKey) && (
          <div
            style={{
              border: "2px solid #17a2b8",
              padding: 20,
              borderRadius: 12,
              backgroundColor: "#f0f8ff",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                left: 20,
                backgroundColor: "#17a2b8",
                color: "white",
                padding: "4px 12px",
                borderRadius: 12,
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              サムネイル作成完了
            </div>
            <h4
              style={{
                margin: "8px 0 12px 0",
                color: "#0c5460",
                fontSize: "18px",
              }}
            >
              {dalleImageKey
                ? "🎨 DALL-Eで生成された画像"
                : "📁 サムネイル画像"}
            </h4>
            <p
              style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}
            >
              {dalleImageKey ? "AIが生成した画像が準備できました" : ""}
            </p>
            <div style={{ textAlign: "center" }}>
              <img
                src={`/api/files/${uploadedImageKey || imageKey}`}
                alt={
                  dalleImageKey ? "DALL-E generated image" : "Uploaded image"
                }
                style={{
                  width: "100%",
                  maxWidth: 400,
                  border: "2px solid #17a2b8",
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              />
              {dalleImageKey && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: "#e8f5e8",
                    borderRadius: 6,
                    fontSize: "13px",
                    color: "#2d5a2d",
                    border: "1px solid #c3e6c3",
                  }}
                >
                  <strong>生成キー:</strong> {dalleImageKey}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 生成されたサムネイルプレビュー */}
        {generatedThumbnailKey && (
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
              サムネイル完成
            </div>
            <h4
              style={{
                margin: "8px 0 12px 0",
                color: "#155724",
                fontSize: "18px",
              }}
            >
              🎬 YouTube用サムネイル
            </h4>
            <p
              style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}
            >
              画像が自動でリサイズされ、YouTube用サムネイルが完成しました
            </p>
            <div style={{ textAlign: "center" }}>
              <img
                src={`/api/files/${generatedThumbnailKey}`}
                alt="Generated thumbnail"
                style={{
                  width: "100%",
                  maxWidth: 400,
                  border: "2px solid #28a745",
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              />
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: "#e8f5e8",
                  borderRadius: 6,
                  fontSize: "13px",
                  color: "#2d5a2d",
                  border: "1px solid #c3e6c3",
                }}
              >
                <strong>サムネイルキー:</strong> {generatedThumbnailKey}
              </div>
              <div style={{ marginTop: 12 }}>
                <a
                  href={`/api/files/${generatedThumbnailKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#28a745",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  🔗 サムネイルを新しいタブで開く
                </a>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: "red", padding: 8, backgroundColor: "#ffe6e6" }}>
            {error}
          </div>
        )}

        {generatedThumbnailKey && (
          <div style={{ marginTop: 16 }}>
            <h4>生成されたサムネイル:</h4>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <strong>キー:</strong> {generatedThumbnailKey}
              </div>
              <div>
                <img
                  src={`/api/files/${generatedThumbnailKey}`}
                  alt="Generated thumbnail"
                  style={{
                    width: "100%",
                    maxWidth: 640,
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div>
                <a
                  href={`/api/files/${generatedThumbnailKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff", textDecoration: "none" }}
                >
                  🔗 サムネイルを新しいタブで開く
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
