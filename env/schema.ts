import { z } from "zod";

export const EnvSchema = z.object({
  DATA_DIR: z.string().default("./var/data"),
  YOUTUBE_CLIENT_ID: z.string().optional(),
  YOUTUBE_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_REDIRECT_URI: z.string().url().optional(),
  SUNO_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  APP_BASE_URL: z.string().url().optional(),
  FFMPEG_PATH: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  return parsed.data;
}
