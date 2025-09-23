import fs from "node:fs";
import path from "node:path";

const DEFAULT_DATA_DIR = "/var/data";

export type StorageKey = string; // e.g. "uploads/abc.jpg" | "output/video.mp4"

function getDataDir() {
  return process.env.DATA_DIR || DEFAULT_DATA_DIR;
}

export function ensureDataDirs() {
  const base = getDataDir();
  const dirs = [base, path.join(base, "uploads"), path.join(base, "output")];
  for (const d of dirs) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

export function resolveKey(key: StorageKey) {
  return path.join(getDataDir(), key);
}

export async function put(buffer: Buffer, key: StorageKey) {
  ensureDataDirs();
  const full = resolveKey(key);
  await fs.promises.mkdir(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, new Uint8Array(buffer));
  return { key, path: full };
}

export async function getStream(key: StorageKey) {
  const full = resolveKey(key);
  return fs.createReadStream(full);
}

export function urlFor(key: StorageKey) {
  // Local dev: expose via Next static route or signed URLs later.
  // For now, return file:// style info-less URL placeholder.
  return `/api/files/${encodeURIComponent(key)}`;
}

export async function deleteFile(key: StorageKey): Promise<boolean> {
  try {
    const full = resolveKey(key);
    if (fs.existsSync(full)) {
      await fs.promises.unlink(full);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete file ${key}:`, error);
    return false;
  }
}

export async function deleteFiles(
  keys: StorageKey[]
): Promise<{ deleted: string[]; failed: string[] }> {
  const deleted: string[] = [];
  const failed: string[] = [];

  for (const key of keys) {
    const success = await deleteFile(key);
    if (success) {
      deleted.push(key);
    } else {
      failed.push(key);
    }
  }

  return { deleted, failed };
}
