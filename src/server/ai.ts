import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Integración de IA. El proveedor activo y su clave se configuran desde el admin
// (/admin/ia). Si no hay ninguno, cae a la variable de entorno ANTHROPIC_API_KEY.
// Todo lo generado es BORRADOR: lo revisa y guarda un humano (regla de CLAUDE.md).

export const AI_TAG = "ai-providers";

export class AINotConfiguredError extends Error {
  constructor() {
    super("AI_NOT_CONFIGURED");
    this.name = "AINotConfiguredError";
  }
}

export type ResolvedProvider = {
  provider: "ANTHROPIC" | "OPENAI";
  apiKey: string;
  model: string;
  baseUrl: string | null;
};

/** Proveedor activo configurado en el admin (sin exponer la clave al cliente: solo se usa en servidor). */
const getActiveProvider = unstable_cache(
  async (): Promise<ResolvedProvider | null> => {
    try {
      const p = await prisma.aiProvider.findFirst({ where: { isActive: true } });
      if (p?.apiKey && p.model) {
        return { provider: p.provider, apiKey: p.apiKey, model: p.model, baseUrl: p.baseUrl };
      }
    } catch {
      // sin proveedor en BD
    }
    return null;
  },
  [`${AI_TAG}-active`],
  { tags: [AI_TAG], revalidate: 3600 },
);

/** Resuelve el proveedor a usar: el activo del admin o, si no, la variable de entorno. */
async function resolveProvider(): Promise<ResolvedProvider | null> {
  const active = await getActiveProvider();
  if (active) return active;
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) {
    return { provider: "ANTHROPIC", apiKey: envKey, model: process.env.AI_MODEL || "claude-sonnet-4-6", baseUrl: null };
  }
  return null;
}

/** ¿Hay IA configurada (proveedor activo en admin o variable de entorno)? */
export async function isAIConfigured(): Promise<boolean> {
  return (await resolveProvider()) !== null;
}

/** Genera texto con el proveedor configurado. Lanza AINotConfiguredError si no hay ninguno. */
export async function generateContent(opts: { system: string; prompt: string; maxTokens?: number }): Promise<string> {
  const cfg = await resolveProvider();
  if (!cfg) throw new AINotConfiguredError();
  return generateWithProvider(cfg, opts);
}

/** Genera texto con un proveedor concreto (usado también para "probar conexión"). */
export async function generateWithProvider(
  cfg: ResolvedProvider,
  opts: { system: string; prompt: string; maxTokens?: number },
): Promise<string> {
  const maxTokens = opts.maxTokens ?? 1200;

  if (cfg.provider === "OPENAI") {
    const base = (cfg.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI_ERROR_${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return (data.choices?.[0]?.message?.content ?? "").trim();
  }

  // Anthropic (por defecto). Las API keys estándar (sk-ant-api…) van en x-api-key;
  // los tokens OAuth (sk-ant-oat…) van en Authorization: Bearer.
  const isOAuth = cfg.apiKey.startsWith("sk-ant-oat");
  const authHeaders: Record<string, string> = isOAuth
    ? { authorization: `Bearer ${cfg.apiKey}` }
    : { "x-api-key": cfg.apiKey };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "anthropic-version": "2023-06-01", ...authHeaders },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    }),
  });
  if (!res.ok) throw new Error(`AI_ERROR_${res.status}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (data.content ?? [])
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text as string)
    .join("\n")
    .trim();
}

// ── Generación de imágenes (OpenAI-compatible: gpt-image-1 / dall-e-3) ──

type ImageProvider = { apiKey: string; model: string; baseUrl: string | null };

const getImageProvider = unstable_cache(
  async (): Promise<ImageProvider | null> => {
    try {
      // Prefiere el activo si tiene modelo de imágenes; si no, el primero con imageModel.
      const active = await prisma.aiProvider.findFirst({ where: { isActive: true, provider: "OPENAI", imageModel: { not: null } } });
      const p = active ?? (await prisma.aiProvider.findFirst({ where: { provider: "OPENAI", imageModel: { not: null } } }));
      if (p?.apiKey && p.imageModel) return { apiKey: p.apiKey, model: p.imageModel, baseUrl: p.baseUrl };
    } catch {
      // sin proveedor de imágenes
    }
    return null;
  },
  [`${AI_TAG}-image`],
  { tags: [AI_TAG], revalidate: 3600 },
);

/** ¿Hay un proveedor de imágenes configurado (OpenAI con modelo de imágenes)? */
export async function isImageAIConfigured(): Promise<boolean> {
  return (await getImageProvider()) !== null;
}

/** Genera una imagen y devuelve sus bytes (PNG). Lanza si no hay proveedor de imágenes. */
export async function generateImageBytes(prompt: string): Promise<ArrayBuffer> {
  const cfg = await getImageProvider();
  if (!cfg) throw new AINotConfiguredError();
  const base = (cfg.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const res = await fetch(`${base}/images/generations`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, prompt, n: 1, size: "1024x1024" }),
  });
  if (!res.ok) throw new Error(`AI_IMG_${res.status}`);
  const data = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  const item = data.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64").buffer as ArrayBuffer;
  if (item?.url) {
    const img = await fetch(item.url);
    if (!img.ok) throw new Error(`AI_IMG_FETCH_${img.status}`);
    return await img.arrayBuffer();
  }
  throw new Error("AI_IMG_EMPTY");
}

/** Como generateContent, pero parsea la respuesta como JSON (tolerante a ```json ... ```). */
export async function generateJSON<T = unknown>(opts: { system: string; prompt: string; maxTokens?: number }): Promise<T> {
  const raw = await generateContent(opts);
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(json) as T;
}
