import fs from "node:fs";
import path from "node:path";
import { getEnv } from "@/env/schema";

const TOKEN_FILENAME = "youtube_token.json";

export function getTokenPath() {
  const env = getEnv();
  const dir = env.DATA_DIR || "/var/data";
  return path.join(dir, TOKEN_FILENAME);
}

export function readToken(): any | null {
  const p = getTokenPath();
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeToken(obj: any) {
  const p = getTokenPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
}
