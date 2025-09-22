"use server";

import { z } from "zod";
import { getEnv } from "@/env/schema";

const Schema = z.object({
  theme: z.string().min(1),
  characterStyle: z
    .enum(["puppy", "lofi-girl", "witch-girl"])
    .optional()
    .default("puppy"),
});

export async function generatePrompts(input: unknown) {
  const { theme, characterStyle } = Schema.parse(input);

  // 環境変数を安全に取得
  let env;
  try {
    env = getEnv();
  } catch (error) {
    console.warn("Environment validation failed:", error);
    throw new Error(
      "環境変数が設定されていません。OPENAI_API_KEYを設定してください。"
    );
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API keyが設定されていません。");
  }

  // キャラクター別のプロンプトテンプレート
  const getCharacterPrompt = () => {
    if (characterStyle === "lofi-girl") {
      return `Create a structured, clear AI image generation prompt for a Lofi Girl YouTube thumbnail based on theme: "${theme}".

Please provide the output in this exact format:

SCENE SETTING:
[Describe the main setting/location based on the theme "${theme}"]

CHARACTER:
[Describe the young woman - appearance, clothing, pose, and position]

PROPS & OBJECTS:
[List specific items that should be visible - books, headphones, drinks, theme-related objects]

LIGHTING & ATMOSPHERE:
[Describe the lighting, mood, and overall atmosphere that matches the theme]

COMPOSITION:
[Describe the overall composition and framing for the thumbnail - IMPORTANT: specify full-frame composition with no empty borders, black bars, or unused space]

Requirements:
- Keep each section concise and specific
- Ensure the scene directly reflects the theme "${theme}"
- Include typical lofi girl elements: simple headphones, books/study materials, cozy atmosphere
- Focus on a peaceful, relaxing mood
- CRITICAL: Specify full-frame composition that fills the entire image with no black/gray borders or empty space
- Use clear, descriptive language that an AI image generator can understand`;
    } else if (characterStyle === "witch-girl") {
      return `Create a structured, clear AI image generation prompt for a Fantasy Witch Girl YouTube thumbnail based on theme: "${theme}".

Please provide the output in this exact format:

SCENE SETTING:
[Describe the magical setting/location based on the theme "${theme}" - medieval tavern, magical study, enchanted forest, etc.]

CHARACTER:
[Describe the anime-style witch girl - long blonde hair, black wizard hat with gold patterns, elegant fantasy clothing, pose, and expression]

PROPS & OBJECTS:
[List specific magical items that should be visible - spellbooks, magical artifacts, lanterns/candles, theme-related objects]

LIGHTING & ATMOSPHERE:
[Describe the magical lighting, warm candlelight/lantern glow, and fantasy atmosphere that matches the theme]

COMPOSITION:
[Describe the overall composition and framing for the thumbnail with fantasy elements - IMPORTANT: specify full-frame composition with no empty borders, black bars, or unused space]

Requirements:
- Keep each section concise and specific
- Ensure the scene directly reflects the theme "${theme}" in a fantasy setting
- Include typical fantasy elements: spellbooks, magical items, warm magical lighting
- Focus on a cozy, inviting magical atmosphere
- CRITICAL: Specify full-frame composition that fills the entire image with no black/gray borders or empty space
- Use clear, descriptive language that an AI image generator can understand`;
    } else {
      return `Create a structured, clear AI image generation prompt for a Lofi Puppy YouTube thumbnail based on theme: "${theme}".

Please provide the output in this exact format:

SCENE SETTING:
[Describe the cozy setting/location based on the theme "${theme}" - indoor study space, outdoor park, café, etc.]

CHARACTER:
[Describe the adorable Golden Retriever puppy - appearance, headphones, pose, position, and expression]

PROPS & OBJECTS:
[List specific items that should be visible - headphones, theme-related objects like books, blankets, toys, etc.]

LIGHTING & ATMOSPHERE:
[Describe the lighting, mood, and overall cozy atmosphere that matches the theme]

COMPOSITION:
[Describe the overall composition and framing for the thumbnail - IMPORTANT: specify full-frame composition with no empty borders, black bars, or unused space]

Requirements:
- Keep each section concise and specific
- Ensure the scene directly reflects the theme "${theme}"
- Include typical lofi elements: simple headphones, cozy atmosphere, peaceful mood
- Focus on an adorable, relaxing puppy scene
- CRITICAL: Specify full-frame composition that fills the entire image with no black/gray borders or empty space
- Use clear, descriptive language that an AI image generator can understand`;
    }
  };

  const promptTemplates = {
    thumbnail: getCharacterPrompt(),
    music: `Create a Suno AI music prompt for ${
      characterStyle === "lofi-girl"
        ? "Lofi Girl"
        : characterStyle === "witch-girl"
        ? "Fantasy Witch Girl"
        : "Lofi Puppy"
    } style music themed: "${theme}".

Please provide the output in this exact format:

MUSIC STYLE:
[Genre and BPM - always start with "lofi hip-hop" and include BPM 60-85]

INSTRUMENTS:
[List 2-3 main instruments from: soft piano, electric piano, mellow guitar, subtle bass, gentle drums, vinyl crackle]

MOOD:
[Choose 2-3 descriptors: nostalgic, dreamy, peaceful, warm, melancholic, contemplative, cozy, introspective]

AMBIENT SOUNDS:
[Background sounds matching the theme: rain, café ambiance, wind, birds, ocean waves, crackling fire, city sounds, forest sounds]

FINAL PROMPT:
[Single line combining all elements, under 180 characters, ending with "no vocals"]

Requirements:
- Keep the final prompt under 180 characters total
- Always end with "no vocals"
- Match the ambient sounds to the theme "${theme}"
- Use clear, specific musical terminology that Suno AI understands`,
    youtubeTitle: `Create an SEO-optimized YouTube title for ${
      characterStyle === "lofi-girl"
        ? "Lofi Girl"
        : characterStyle === "witch-girl"
        ? "Fantasy Witch Girl"
        : "Lofi Puppy"
    } style music themed: "${theme}".

IMPORTANT: Provide ONLY the final YouTube title, nothing else. No explanations, no sections, just the title.

Format: [Category] Japanese Theme [Emojis] English Description

Requirements:
- Choose ONE category: 【作業用BGM】【勉強用BGM】【睡眠用BGM】【集中用BGM】【リラックス用BGM】【朝活用BGM】
- Japanese theme: 2-3 word phrase capturing "${theme}"
- 2-3 relevant emojis: ☕🌸🎵📚🌙💻🍃☔🎧🐶🐕🧙‍♀️✨🏰🌅🌄☀️🥐🥛
- English description: matches Japanese meaning, includes ${
      characterStyle === "lofi-girl"
        ? "study/girl elements"
        : characterStyle === "witch-girl"
        ? "fantasy/witch elements"
        : "puppy elements"
    }
- Perfect Japanese-English balance (±3 characters)
- Keep under 70 characters total
- Appeal to both Japanese and international audiences

Example output formats: 
【睡眠用BGM】雪の図書館 📚✨🌙 Fantasy Library on a Snowy
【朝活用BGM】桜咲く朝 🌅🌸☕ Cherry Blossom Morning Activity`,
    youtubeDescription: `Create an engaging, SEO-optimized YouTube description for ${
      characterStyle === "lofi-girl"
        ? "Lofi Girl"
        : characterStyle === "witch-girl"
        ? "Fantasy Witch Girl"
        : "Lofi Puppy"
    } style music themed: "${theme}".

Please provide the output in this exact format:

OPENING HOOK:
[Bilingual opening (Japanese→English) relating to "${theme}" with ${
      characterStyle === "lofi-girl"
        ? "study/work motivation"
        : characterStyle === "witch-girl"
        ? "magical atmosphere"
        : "puppy companionship"
    } context]

MUSIC DESCRIPTION:
[2-3 sentences mixing Japanese and English, describing lofi hip-hop style and how it matches the "${theme}" theme]

USE CASES:
[Bilingual bullet points for: study, work, sleep, relaxation, concentration, morning activities/朝活, plus ${
      characterStyle === "lofi-girl"
        ? "reading time"
        : characterStyle === "witch-girl"
        ? "fantasy immersion"
        : "pet relaxation"
    }]

CALL TO ACTION:
[Japanese encouragement line]
[English subscription request with character-specific appeal]

HASHTAGS:
[15-20 mixed Japanese/English hashtags for lofi hip-hop, ${characterStyle}, and "${theme}" theme]

KEYWORDS SECTION:
[Bilingual keyword line with theme-specific terms]

Requirements:
- Natural bilingual flow, not forced translation
- Integrate "${theme}" theme organically throughout
- Character-specific elements: ${
      characterStyle === "lofi-girl"
        ? "study motivation, academic focus, productivity"
        : characterStyle === "witch-girl"
        ? "magical ambiance, fantasy elements, mystical vibes"
        : "cute companionship, gentle energy, pet-friendly atmosphere"
    }
- SEO optimization for both Japanese and English audiences
- Authentic, engaging tone that builds community
- Balance Japanese cultural elements with international appeal`,
  };

  try {
    const results: any = {
      music: "",
      thumbnail: "",
      youtubeTitle: "",
      youtubeDescription: "",
    };

    // 各プロンプトを順次生成
    for (const [key, template] of Object.entries(promptTemplates)) {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are a helpful and creative assistant.",
              },
              { role: "user", content: template },
            ],
            temperature: 0.8,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      // 音楽プロンプトの文字数制限チェック
      if (key === "music" && content.length > 180) {
        content = content.substring(0, 177) + "...";
        console.log(`Music prompt truncated to 180 characters: ${content}`);
      }

      // YouTubeタイトルと説明文の処理
      if (key === "youtubeTitle") {
        const originalTitle = content.trim();
        results.youtubeTitle = originalTitle.replace(/^["']|["']$/g, "");
        console.log("🎯 YouTube Title processing:", {
          original: originalTitle,
          cleaned: results.youtubeTitle,
        });
      } else if (key === "youtubeDescription") {
        const originalDesc = content.trim();
        results.youtubeDescription = originalDesc.replace(/^["']|["']$/g, "");
        console.log("🎯 YouTube Description processing:", {
          original: originalDesc,
          cleaned: results.youtubeDescription,
        });
      } else {
        results[key] = content;
      }
    }

    return results;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(
      `プロンプト生成に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// AIテーマ提案機能
export async function generateAIThemes(input: {
  characterStyle: "puppy" | "lofi-girl" | "witch-girl";
  themeKeywords?: string;
}) {
  const { characterStyle, themeKeywords } = input;

  // 環境変数を安全に取得
  let env;
  try {
    env = getEnv();
  } catch (error) {
    console.warn("Environment validation failed:", error);
    return [];
  }

  if (!env.OPENAI_API_KEY) {
    console.warn("OpenAI API key is not configured");
    return [];
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert on ${
              characterStyle === "lofi-girl"
                ? "Lofi Girl"
                : characterStyle === "witch-girl"
                ? "Fantasy Witch Girl"
                : "Lofi Puppy"
            } style content and trending lofi hip-hop themes. Generate creative theme suggestions based on popular lofi music trends for ${
              characterStyle === "lofi-girl"
                ? "study-focused atmospheres"
                : characterStyle === "witch-girl"
                ? "magical fantasy scenarios"
                : "cute puppy scenarios"
            }.`,
          },
          {
            role: "user",
            content: `Generate 6 VERY SPECIFIC and detailed theme suggestions for ${
              characterStyle === "lofi-girl"
                ? "Lofi Girl"
                : characterStyle === "witch-girl"
                ? "Fantasy Witch Girl"
                : "Lofi Puppy"
            } style content in Japanese. 

${
  themeKeywords?.trim()
    ? `IMPORTANT: Base all themes around these keywords/concepts: "${themeKeywords.trim()}"
Create themes that incorporate these keywords while maintaining the ${
        characterStyle === "lofi-girl"
          ? "study/work atmosphere"
          : characterStyle === "witch-girl"
          ? "magical fantasy atmosphere"
          : "cute puppy atmosphere"
      }.`
    : `Create trending and popular themes based on current lofi music preferences.`
}

Create highly specific scenes that include:
- Exact time of day/season
- Specific location details  
- Particular activities or objects
- Concrete atmospheric elements
${
  themeKeywords?.trim()
    ? `- Integration of the provided keywords: "${themeKeywords.trim()}"`
    : ""
}

Examples of SPECIFIC themes for ${
              characterStyle === "lofi-girl"
                ? "Lofi Girl"
                : characterStyle === "witch-girl"
                ? "Fantasy Witch Girl"
                : "Lofi Puppy"
            } (don't use these exact ones):
${
  characterStyle === "lofi-girl"
    ? `- "午後3時の図書館窓際" (3pm library window seat)
- "雨音と読書の部屋" (room with rain sounds and reading)
- "深夜2時の勉強机" (2am study desk)
- "桜散る4月の公園読書" (reading in park with falling cherry blossoms)
- "台風の夜の一人勉強" (studying alone during typhoon night)
- "朝5時のカフェ勉強" (5am café study session)
- "朝日と共に始まる読書時間" (reading time with sunrise)
- "朝6時の窓際ヨガ勉強" (6am window-side yoga study)`
    : characterStyle === "witch-girl"
    ? `- "午後3時の魔法図書館" (3pm magical library)
- "雨音と魔女の塔部屋" (witch tower room with rain sounds)
- "深夜2時の錬金術実験" (2am alchemy experiment)
- "桜散る4月の魔法の森" (magical forest with falling cherry blossoms)
- "嵐の夜の魔法酒場" (magical tavern during storm night)
- "朝5時の魔女とハーブティー" (5am herbal tea time with witch)`
    : `- "午後3時の子犬昼寝" (3pm puppy nap time)
- "雨音と子犬のいるリビング" (living room with rain sounds and puppy)
- "深夜2時の子犬と夜更かし" (late night with sleepy puppy)
- "桜散る4月の子犬散歩" (puppy walk with falling cherry blossoms)
- "台風の夜の子犬と安全な部屋" (safe room with puppy during typhoon)
- "朝5時の子犬とコーヒー" (5am coffee time with puppy)"`
}

Each theme should be 4-8 words in Japanese and paint a very clear, specific picture that viewers can immediately visualize. Include:
- Specific times, weather, or seasons
- Concrete locations with details
- Particular objects, animals, or people
- Atmospheric conditions

Focus on themes that create strong visual imagery for thumbnails and evoke specific moods for music, ${
              characterStyle === "lofi-girl"
                ? "emphasizing study environments, reading, focus, and academic atmospheres"
                : characterStyle === "witch-girl"
                ? "emphasizing magical environments, spellcasting, fantasy taverns, and mystical atmospheres"
                : "emphasizing cute puppy scenarios, cozy environments, and relaxing moments with pets"
            }.

Return ONLY the 6 themes separated by commas, nothing else.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const themes = content
      .split(",")
      .map((theme: string) => theme.trim())
      .filter((theme: string) => theme.length > 0);
    console.log("AI suggested themes:", themes);

    return themes;
  } catch (error) {
    console.error("Error generating AI themes:", error);
    return [];
  }
}

// DALL-E画像生成機能
export async function generateThumbnailImage(input: {
  thumbnailPrompt: string;
}) {
  const { thumbnailPrompt } = input;

  // 環境変数を安全に取得
  let env;
  try {
    env = getEnv();
  } catch (error) {
    console.warn("Environment validation failed:", error);
    throw new Error(
      "環境変数が設定されていません。OPENAI_API_KEYを設定してください。"
    );
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API keyが設定されていません。");
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: thumbnailPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `DALL-E API error: ${response.status} ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error("画像の生成に失敗しました");
    }

    return {
      imageUrl,
      revisedPrompt: data.data?.[0]?.revised_prompt || thumbnailPrompt,
    };
  } catch (error) {
    console.error("DALL-E API error:", error);
    throw new Error(
      `画像生成に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
