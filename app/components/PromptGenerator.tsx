"use client";

import { useState, useTransition } from "react";
import {
  generatePrompts,
  generateAIThemes,
  generateThumbnailImage,
} from "../actions/generatePrompts";

interface PromptGeneratorProps {
  currentProjectId?: string | null;
  onPromptsSaved?: () => void;
}

export default function PromptGenerator({
  currentProjectId,
  onPromptsSaved,
}: PromptGeneratorProps) {
  const [theme, setTheme] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [characterStyle, setCharacterStyle] = useState<
    "puppy" | "lofi-girl" | "witch-girl"
  >("puppy");
  const [themeKeywords, setThemeKeywords] = useState<string>("");
  const [aiSuggestedThemes, setAiSuggestedThemes] = useState<string[]>([]);
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    imageUrl: string;
    revisedPrompt: string;
  } | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleGenerate = () => {
    if (!theme.trim()) return;

    setError(null);
    setSaveStatus(null);
    start(async () => {
      try {
        const r = await generatePrompts({ theme, characterStyle });
        setResult(r);

        // プロンプト生成成功後、自動保存
        if (currentProjectId) {
          await handleAutoSave(r);
        } else {
          setSaveStatus(
            "プロジェクトが選択されていないため、自動保存されませんでした"
          );
          setTimeout(() => setSaveStatus(null), 3000);
        }
      } catch (err: any) {
        setError(err.message || "プロンプト生成に失敗しました");
        console.error("Prompt generation error:", err);
      }
    });
  };

  const handleGenerateAIThemes = async () => {
    setIsGeneratingThemes(true);
    try {
      const themes = await generateAIThemes({ characterStyle, themeKeywords });
      setAiSuggestedThemes(themes);
    } catch (err: any) {
      console.error("AI theme generation error:", err);
    } finally {
      setIsGeneratingThemes(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!result?.thumbnail) return;

    setIsGeneratingImage(true);
    try {
      const imageResult = await generateThumbnailImage({
        thumbnailPrompt: result.thumbnail,
      });
      setGeneratedImage(imageResult);
    } catch (err: any) {
      setError(err.message || "画像生成に失敗しました");
      console.error("Image generation error:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAutoSave = async (promptResult: any) => {
    if (!currentProjectId || !promptResult) {
      return;
    }

    setSaveStatus("自動保存中...");
    try {
      const res = await fetch(`/api/projects/${currentProjectId}/prompts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          music: promptResult.music,
          thumbnail: promptResult.thumbnail,
          youtubeTitle: promptResult.youtubeTitle,
          youtubeDescription: promptResult.youtubeDescription,
        }),
      });

      if (res.ok) {
        setSaveStatus("プロンプトを自動保存しました！");
        onPromptsSaved?.();
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        const errorData = await res.json();
        setSaveStatus(`自動保存に失敗しました: ${errorData.error}`);
        setTimeout(() => setSaveStatus(null), 5000);
      }
    } catch (err: any) {
      setSaveStatus(`自動保存エラー: ${err.message}`);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const addThemeToInput = (newTheme: string) => {
    setTheme(theme ? `${theme}, ${newTheme}` : newTheme);
  };

  const themeCategories = {
    風景: [
      "森林",
      "海辺",
      "山",
      "夕焼け",
      "雨の日",
      "桜",
      "紅葉",
      "雪景色",
      "星空",
      "都市の夜景",
    ],
    感情: [
      "癒し",
      "リラックス",
      "穏やか",
      "幸せ",
      "ノスタルジック",
      "希望",
      "集中",
      "瞑想",
      "まったり",
      "安らぎ",
    ],
    場所: [
      "カフェ",
      "図書館",
      "自宅",
      "ジブリの世界",
      "古民家",
      "温泉",
      "コテージ",
      "書斎",
      "ベッドルーム",
      "ガーデン",
    ],
    時間: ["朝", "昼", "夕方", "夜", "春", "夏", "秋", "冬", "雨季", "早朝"],
    用途: [
      "勉強",
      "作業",
      "睡眠",
      "読書",
      "瞑想",
      "ヨガ",
      "お茶タイム",
      "散歩",
      "ドライブ",
      "リモートワーク",
    ],
    特別: [
      "ジブリ風",
      "カフェ風",
      "ヴィンテージ",
      "モダン",
      "ミニマル",
      "ファンタジー",
      "アニメ風",
      "レトロ",
      "アコースティック",
      "アンビエント",
    ],
  };

  return (
    <section style={{ border: "1px solid #ddd", padding: 16 }}>
      <h3>プロンプト生成</h3>

      {/* Character Style Selection */}
      <div style={{ marginBottom: "30px" }}>
        <h4 style={{ marginBottom: "15px", fontSize: "18px", color: "#333" }}>
          🎨 キャラクタースタイル選択:
        </h4>
        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
          <button
            type="button"
            onClick={() => setCharacterStyle("puppy")}
            style={{
              padding: "15px 25px",
              fontSize: "16px",
              border: `3px solid ${
                characterStyle === "puppy" ? "#007bff" : "#ddd"
              }`,
              borderRadius: "12px",
              backgroundColor:
                characterStyle === "puppy" ? "#e7f3ff" : "#f8f9fa",
              color: characterStyle === "puppy" ? "#0056b3" : "#666",
              cursor: "pointer",
              fontWeight: characterStyle === "puppy" ? "bold" : "normal",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "180px",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🐶</div>
            <div>Lofi Puppy</div>
            <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.7 }}>
              ゴールデンレトリバーの子犬
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCharacterStyle("lofi-girl")}
            style={{
              padding: "15px 25px",
              fontSize: "16px",
              border: `3px solid ${
                characterStyle === "lofi-girl" ? "#007bff" : "#ddd"
              }`,
              borderRadius: "12px",
              backgroundColor:
                characterStyle === "lofi-girl" ? "#e7f3ff" : "#f8f9fa",
              color: characterStyle === "lofi-girl" ? "#0056b3" : "#666",
              cursor: "pointer",
              fontWeight: characterStyle === "lofi-girl" ? "bold" : "normal",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "180px",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📚</div>
            <div>Lofi Girl</div>
            <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.7 }}>
              勉強している女性
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCharacterStyle("witch-girl")}
            style={{
              padding: "15px 25px",
              fontSize: "16px",
              border: `3px solid ${
                characterStyle === "witch-girl" ? "#007bff" : "#ddd"
              }`,
              borderRadius: "12px",
              backgroundColor:
                characterStyle === "witch-girl" ? "#e7f3ff" : "#f8f9fa",
              color: characterStyle === "witch-girl" ? "#0056b3" : "#666",
              cursor: "pointer",
              fontWeight: characterStyle === "witch-girl" ? "bold" : "normal",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "180px",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🧙‍♀️</div>
            <div>Witch Girl</div>
            <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.7 }}>
              ファンタジー魔女
            </div>
          </button>
        </div>

        <div
          style={{
            padding: "12px",
            backgroundColor: "#f0f8ff",
            borderRadius: "8px",
            border: "1px solid #b3d9ff",
            fontSize: "14px",
          }}
        >
          <p style={{ margin: 0, color: "#0066cc" }}>
            <strong>選択中:</strong>{" "}
            {characterStyle === "puppy"
              ? "🐶 Lofi Puppy - 可愛いゴールデンレトリバーの子犬がヘッドフォンをつけてリラックス"
              : characterStyle === "lofi-girl"
              ? "📚 Lofi Girl - 勉強に集中している女性の落ち着いた雰囲気"
              : "🧙‍♀️ Witch Girl - ファンタジー世界の魔女が魔法図書館や酒場でリラックス"}
          </p>
        </div>
      </div>

      {/* AI Theme Suggestions */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
          🤖 AI テーマ提案 (
          {characterStyle === "lofi-girl"
            ? "Lofi Girl"
            : characterStyle === "witch-girl"
            ? "Witch Girl"
            : "Lofi Puppy"}{" "}
          トレンド):
        </h4>

        {/* Theme Keywords Input */}
        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="themeKeywords"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            🔍 関連用語 (オプション):
          </label>
          <input
            id="themeKeywords"
            type="text"
            value={themeKeywords}
            onChange={(e) => setThemeKeywords(e.target.value)}
            placeholder="例: 冬、雪、カフェ、夜、図書館、桜、雨..."
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "2px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "5px",
            }}
          />
          <p
            style={{
              fontSize: "12px",
              color: "#666",
              margin: "0",
              lineHeight: "1.4",
            }}
          >
            💡
            入力した用語に関連するテーマを生成します。空欄の場合はAIが自由にトレンドテーマを提案します。
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={handleGenerateAIThemes}
            disabled={isGeneratingThemes}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              border: "1px solid #007bff",
              borderRadius: "6px",
              backgroundColor: isGeneratingThemes ? "#ccc" : "#007bff",
              color: "white",
              cursor: isGeneratingThemes ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {isGeneratingThemes ? "🔄 生成中..." : "✨ AIテーマ生成"}
          </button>
          {themeKeywords.trim() && (
            <span
              style={{
                fontSize: "12px",
                color: "#007bff",
                fontWeight: "bold",
              }}
            >
              📝 キーワード: "{themeKeywords.trim()}"
            </span>
          )}
        </div>

        {aiSuggestedThemes.length > 0 && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#f0f8ff",
              borderRadius: "8px",
              border: "1px solid #b3d9ff",
              marginBottom: "15px",
            }}
          >
            <p
              style={{
                margin: "0 0 8px 0",
                fontSize: "14px",
                color: "#0066cc",
                fontWeight: "bold",
              }}
            >
              🎯 トレンド系テーマ提案:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {aiSuggestedThemes.map((theme, index) => (
                <button
                  key={`ai-${index}`}
                  type="button"
                  onClick={() => addThemeToInput(theme)}
                  style={{
                    margin: "2px",
                    padding: "6px 12px",
                    fontSize: "13px",
                    border: "2px solid #007bff",
                    borderRadius: "15px",
                    backgroundColor: "#ffffff",
                    color: "#007bff",
                    cursor: "pointer",
                    fontWeight: "bold",
                    boxShadow: "0 2px 4px rgba(0,123,255,0.1)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#007bff";
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.color = "#007bff";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  ✨ {theme}
                </button>
              ))}
            </div>
            <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#666" }}>
              💡 これらは
              {characterStyle === "lofi-girl"
                ? "Lofi Girl"
                : characterStyle === "witch-girl"
                ? "Fantasy Witch Girl"
                : "Lofi Puppy"}
              で人気のトレンドテーマです
            </p>
          </div>
        )}
      </div>

      {/* Theme Category Buttons */}
      <div style={{ marginBottom: "15px" }}>
        <h4 style={{ marginBottom: "10px", fontSize: "16px" }}>
          🎨 テーマカテゴリ (クリックして追加):
        </h4>

        {Object.entries(themeCategories).map(([category, themes]) => (
          <div key={category} style={{ marginBottom: "10px" }}>
            <strong>{category}:</strong>
            {themes.map((themeOption) => (
              <button
                key={themeOption}
                type="button"
                onClick={() => addThemeToInput(themeOption)}
                style={{
                  margin: "2px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  backgroundColor:
                    category === "感情"
                      ? "#e7f3ff"
                      : category === "場所"
                      ? "#f0fff0"
                      : category === "時間"
                      ? "#fff8e1"
                      : category === "用途"
                      ? "#fce4ec"
                      : category === "特別"
                      ? "#f3e5f5"
                      : "#f8f9fa",
                  cursor: "pointer",
                }}
              >
                {themeOption}
              </button>
            ))}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setTheme("")}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            border: "1px solid #dc3545",
            borderRadius: "4px",
            backgroundColor: "#fff",
            color: "#dc3545",
            cursor: "pointer",
          }}
        >
          🗑️ クリア
        </button>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <textarea
          placeholder="上のボタンからテーマを選択するか、直接入力してください..."
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{ padding: 8, fontSize: 14, minHeight: "80px" }}
        />
        <button
          disabled={!theme.trim() || pending}
          onClick={handleGenerate}
          style={{
            padding: "8px 16px",
            backgroundColor: pending ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: pending ? "not-allowed" : "pointer",
          }}
        >
          {pending ? "生成中..." : "プロンプト生成"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "red",
            padding: 8,
            backgroundColor: "#ffe6e6",
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {saveStatus && (
        <div
          style={{
            color: saveStatus.includes("保存しました") ? "green" : "orange",
            padding: 8,
            backgroundColor: saveStatus.includes("保存しました")
              ? "#e6ffe6"
              : "#fff3cd",
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {saveStatus}
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              padding: 12,
              backgroundColor: "#f8f9fa",
              borderRadius: 4,
              border: "1px solid #e9ecef",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#495057" }}>
              🎵 音楽プロンプト
            </h4>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
              {result.music}
            </p>
            {result.music && (
              <div style={{ marginTop: "8px", fontSize: "12px" }}>
                <span
                  style={{
                    color: result.music.length > 180 ? "#dc3545" : "#28a745",
                    fontWeight: "bold",
                  }}
                >
                  {result.music.length}/180 文字
                </span>
                {result.music.length > 180 && (
                  <span style={{ color: "#dc3545", marginLeft: "8px" }}>
                    ⚠️ Sunoの推奨文字数を超えています
                  </span>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              padding: 12,
              backgroundColor: "#f8f9fa",
              borderRadius: 4,
              border: "1px solid #e9ecef",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#495057" }}>
              🖼️ サムネイルプロンプト
            </h4>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
              {result.thumbnail}
            </p>
            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              style={{
                marginTop: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                border: "1px solid #28a745",
                borderRadius: "4px",
                backgroundColor: isGeneratingImage ? "#ccc" : "#28a745",
                color: "white",
                cursor: isGeneratingImage ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {isGeneratingImage ? "🔄 生成中..." : "🎨 DALL-E画像生成"}
            </button>
          </div>

          {generatedImage && (
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
                🎨 生成された画像
              </h4>
              <img
                src={generatedImage.imageUrl}
                alt="Generated thumbnail"
                style={{
                  width: "100%",
                  maxWidth: "512px",
                  height: "auto",
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              />
              <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                <strong>修正されたプロンプト:</strong>{" "}
                {generatedImage.revisedPrompt}
              </p>
            </div>
          )}

          {result.youtubeTitle && (
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
                📺 YouTube タイトル
              </h4>
              <textarea
                value={result.youtubeTitle}
                onChange={(e) => {
                  const newTitle = e.target.value.replace(/^["']|["']$/g, "");
                  setResult({ ...result, youtubeTitle: newTitle });
                }}
                style={{
                  width: "100%",
                  minHeight: "60px",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          )}

          {result.youtubeDescription && (
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
                📝 YouTube 説明文
              </h4>
              <textarea
                value={result.youtubeDescription}
                onChange={(e) => {
                  const newDesc = e.target.value.replace(/^["']|["']$/g, "");
                  setResult({ ...result, youtubeDescription: newDesc });
                }}
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
