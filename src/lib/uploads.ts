import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

// Directorio de subidas. En Railway apunta a un Volume persistente (UPLOAD_DIR=/data/uploads).
// En local, ./uploads (gitignored). Los archivos se sirven vía /media/<archivo>.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB de entrada

/** Guarda una imagen optimizada (WebP, máx. 1920px de ancho). Devuelve la URL pública. */
export async function saveImage(input: ArrayBuffer, mime: string): Promise<{ url: string; filename: string }> {
  if (!mime.startsWith("image/")) throw new Error("INVALID_TYPE");
  if (input.byteLength > MAX_BYTES) throw new Error("TOO_LARGE");

  const webp = await sharp(Buffer.from(input))
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(UPLOAD_DIR, filename), webp);
  return { url: `/media/${filename}`, filename };
}

/** Fecha de modificación de un archivo subido (null si no existe). */
export async function uploadMtime(name: string): Promise<Date | null> {
  const safe = path.basename(name);
  if (safe !== name) return null;
  try {
    return (await stat(path.join(UPLOAD_DIR, safe))).mtime;
  } catch {
    return null;
  }
}

/** Lee un archivo subido de forma segura (sin path traversal). */
export async function readUpload(name: string): Promise<Buffer | null> {
  const safe = path.basename(name); // descarta cualquier "../"
  if (safe !== name) return null;
  const full = path.join(UPLOAD_DIR, safe);
  if (!existsSync(full)) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}
