"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { AI_TAG, generateWithProvider } from "@/server/ai";
import { Role } from "@/generated/prisma/enums";

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN);
}

const optText = (s: string | undefined) => {
  const v = (s ?? "").trim();
  return v ? v : null;
};

/** Limpia la API key pegada por error con comillas, espacios o prefijo "VAR=". */
function sanitizeKey(raw: string | undefined): string | null {
  let v = (raw ?? "").trim();
  if (!v) return null;
  // Quita un prefijo tipo ANTHROPIC_API_KEY= u OPENAI_API_KEY= si lo pegaron entero.
  v = v.replace(/^[A-Z0-9_]+\s*=\s*/i, "");
  // Quita comillas envolventes.
  v = v.replace(/^["']|["']$/g, "").trim();
  // Quita cualquier espacio/salto interno accidental.
  v = v.replace(/\s+/g, "");
  return v || null;
}

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Ponle un nombre.").max(100),
  provider: z.enum(["ANTHROPIC", "OPENAI"]),
  model: z.string().trim().min(1, "Indica el modelo.").max(120),
  baseUrl: z.string().trim().max(300).optional(),
  apiKey: z.string().trim().max(300).optional(),
  isActive: z.string().optional(),
});

export type AiFormState = { status: "idle" | "error"; message?: string };

export async function saveAiProvider(_prev: AiFormState, formData: FormData): Promise<AiFormState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  const d = parsed.data;
  const isActive = d.isActive === "on";

  // La clave solo se cambia si se escribe una nueva (en edición se mantiene la anterior).
  const newKey = sanitizeKey(d.apiKey);
  if (!d.id && !newKey) return { status: "error", message: "Introduce la API key." };

  const base = {
    name: d.name,
    provider: d.provider,
    model: d.model,
    baseUrl: optText(d.baseUrl),
    isActive,
  };

  try {
    let savedId: string;
    if (d.id) {
      await prisma.aiProvider.update({
        where: { id: d.id },
        data: { ...base, ...(newKey ? { apiKey: newKey } : {}) },
      });
      savedId = d.id;
      await logAudit({ userId, action: "aiprovider.update", entity: "AiProvider", entityId: d.id, metadata: { provider: d.provider } });
    } else {
      const created = await prisma.aiProvider.create({ data: { ...base, apiKey: newKey! } });
      savedId = created.id;
      await logAudit({ userId, action: "aiprovider.create", entity: "AiProvider", entityId: created.id, metadata: { provider: d.provider } });
    }
    // Solo un proveedor activo a la vez.
    if (isActive) {
      await prisma.aiProvider.updateMany({ where: { id: { not: savedId } }, data: { isActive: false } });
    }
  } catch {
    return { status: "error", message: "No se pudo guardar el proveedor." };
  }

  updateTag(AI_TAG);
  revalidatePath("/admin/ia");
  redirect("/admin/ia");
}

export async function deleteAiProvider(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.aiProvider.delete({ where: { id } });
    await logAudit({ userId, action: "aiprovider.delete", entity: "AiProvider", entityId: id });
  } catch {
    // ignore
  }
  updateTag(AI_TAG);
  revalidatePath("/admin/ia");
  redirect("/admin/ia");
}

/** Marca un proveedor como activo (desactiva el resto). */
export async function activateAiProvider(formData: FormData): Promise<void> {
  try {
    await ensureRole();
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.aiProvider.updateMany({ data: { isActive: false } });
    await prisma.aiProvider.update({ where: { id }, data: { isActive: true } });
  } catch {
    // ignore
  }
  updateTag(AI_TAG);
  revalidatePath("/admin/ia");
  redirect("/admin/ia");
}

export type AiTestResult = { ok: boolean; message: string };

/** Prueba la conexión con un proveedor concreto (genera una respuesta mínima). */
export async function testAiProvider(id: string): Promise<AiTestResult> {
  try {
    await ensureRole();
  } catch {
    return { ok: false, message: "No tienes permisos." };
  }
  const p = await prisma.aiProvider.findUnique({ where: { id } });
  if (!p?.apiKey) return { ok: false, message: "Falta la API key." };
  // Descriptor seguro de la clave (solo el prefijo público + longitud, nunca la clave).
  const keyHint = `${p.apiKey.slice(0, 12)}… (${p.apiKey.length} car.)`;
  const ctx = `[proveedor ${p.provider}, modelo ${p.model}, clave ${keyHint}]`;
  // Coherencia proveedor/clave: aviso temprano del desajuste más común.
  if (p.provider === "ANTHROPIC" && !p.apiKey.startsWith("sk-ant-"))
    return { ok: false, message: `La clave no parece de Anthropic (debería empezar por sk-ant-…). ${ctx}` };
  if (p.provider === "OPENAI" && p.apiKey.startsWith("sk-ant-"))
    return { ok: false, message: `Has puesto una clave de Anthropic con proveedor OpenAI. Cambia el proveedor a "Anthropic". ${ctx}` };
  try {
    const text = await generateWithProvider(
      { provider: p.provider, apiKey: p.apiKey, model: p.model, baseUrl: p.baseUrl },
      { system: "Responde solo con: OK", prompt: "Di OK", maxTokens: 16 },
    );
    return { ok: true, message: `Conexión correcta. Respuesta: "${text.slice(0, 40)}" ${ctx}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    if (msg.includes("401"))
      return { ok: false, message: `Clave rechazada (401): la API key no es válida o no coincide con el proveedor. ${ctx}` };
    if (msg.includes("404"))
      return { ok: false, message: `Modelo no encontrado (404): revisa el ID del modelo y la URL base. ${ctx}` };
    if (msg.includes("400"))
      return { ok: false, message: `Petición rechazada (400): revisa el modelo y la facturación del proveedor. ${ctx}` };
    return { ok: false, message: `Fallo de conexión (${msg}). ${ctx}` };
  }
}
