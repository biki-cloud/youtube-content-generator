import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getEnv } from "@/env/schema";
import { logInfo, logError } from "@/lib/logger";

export const runtime = "nodejs";

interface Body {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  n?: number;
}

export async function POST(req: NextRequest) {
  try {
    logInfo("DALL-E image generation request received");
    const env = getEnv();
    const body = (await req.json()) as Body;

    if (!body?.prompt) {
      logError("Missing prompt in DALL-E request", { body });
      return new Response("prompt required", { status: 400 });
    }

    if (!env.OPENAI_API_KEY) {
      logError("OpenAI API key not configured");
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    const id = randomUUID();
    const key = `output/dalle_${id}.png`;
    const dst = path.join(env.DATA_DIR, key);

    logInfo("Generating image with DALL-E", {
      prompt: body.prompt,
      size: body.size || "1024x1024",
      quality: body.quality || "standard",
      n: body.n || 1,
      id,
      key,
    });

    await fs.promises.mkdir(path.dirname(dst), { recursive: true });

    // Call DALL-E API
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: body.prompt,
          size: body.size || "1024x1024",
          quality: body.quality || "standard",
          n: body.n || 1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      logError("DALL-E API request failed", {
        status: response.status,
        error: errorData,
      });
      return new Response(
        `DALL-E API request failed: ${
          errorData.error?.message || response.statusText
        }`,
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.data || !data.data[0] || !data.data[0].url) {
      logError("Invalid response from DALL-E API", { data });
      return new Response("Invalid response from DALL-E API", { status: 500 });
    }

    // Download the generated image
    const imageResponse = await fetch(data.data[0].url);
    if (!imageResponse.ok) {
      logError("Failed to download generated image", {
        status: imageResponse.status,
      });
      return new Response("Failed to download generated image", {
        status: 500,
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    await fs.promises.writeFile(dst, new Uint8Array(imageBuffer));

    const result = {
      key,
      url: `/api/files/${encodeURIComponent(key)}`,
      prompt: body.prompt,
      revised_prompt: data.data[0].revised_prompt,
    };

    logInfo("DALL-E image generation completed successfully", { result });
    return Response.json(result);
  } catch (error: any) {
    logError("DALL-E image generation failed", error);
    return new Response(`DALL-E image generation failed: ${error.message}`, {
      status: 500,
    });
  }
}
