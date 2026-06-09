// Integración de IA para el admin. La clave vive en variable de entorno (no en BD).
// Todo lo generado es BORRADOR: lo revisa y guarda un humano (regla de CLAUDE.md).

const MODEL = process.env.AI_MODEL || "claude-sonnet-4-6";

/** ¿Hay clave de IA configurada? */
export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export class AINotConfiguredError extends Error {
  constructor() {
    super("AI_NOT_CONFIGURED");
    this.name = "AINotConfiguredError";
  }
}

/**
 * Genera texto con la API de Anthropic (Claude). Lanza AINotConfiguredError si no hay clave.
 * Devuelve el texto plano/Markdown generado.
 */
export async function generateContent(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AINotConfiguredError();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1200,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`AI_ERROR_${res.status}`);
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (data.content ?? [])
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text as string)
    .join("\n")
    .trim();
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
