"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { slugifyCity } from "@/lib/cities";
import { EVENT_TYPES_TAG } from "@/server/event-types";
import { generateContent, isAIConfigured } from "@/server/ai";
import { Role } from "@/generated/prisma/enums";

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
}

const optText = (s: string | undefined) => {
  const v = (s ?? "").trim();
  return v ? v : null;
};

/** Una característica por línea. */
function parseFeatures(raw: string | undefined): string[] {
  return (raw ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 20);
}

/** Cada línea "pregunta | respuesta" → {q,a}. */
function parseFaq(raw: string | undefined): { q: string; a: string }[] {
  return (raw ?? "")
    .split("\n")
    .map((line) => {
      const i = line.indexOf("|");
      if (i < 0) return null;
      const q = line.slice(0, i).trim();
      const a = line.slice(i + 1).trim();
      return q && a ? { q, a } : null;
    })
    .filter((x): x is { q: string; a: string } => x !== null)
    .slice(0, 12);
}

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(120),
  slug: z.string().trim().max(120).optional(),
  shortDescription: z.string().max(300).optional(),
  intro: z.string().max(600).optional(),
  description: z.string().max(20000).optional(),
  features: z.string().optional(),
  faq: z.string().optional(),
  heroImageUrl: z.string().trim().max(500).optional(),
  metaTitle: z.string().max(140).optional(),
  metaDescription: z.string().max(300).optional(),
  sortOrder: z.string().optional(),
  isActive: z.string().optional(),
});

export type EventFormState = { status: "idle" | "error"; message?: string };

export async function saveEventType(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar eventos." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  const d = parsed.data;

  const slug = slugifyCity(d.slug && d.slug.trim() ? d.slug : d.name);
  if (!slug) return { status: "error", message: "No se pudo generar un slug válido." };

  const data = {
    name: d.name,
    slug,
    shortDescription: optText(d.shortDescription),
    intro: optText(d.intro),
    description: optText(d.description),
    features: parseFeatures(d.features),
    faq: parseFaq(d.faq),
    heroImageUrl: optText(d.heroImageUrl),
    metaTitle: optText(d.metaTitle),
    metaDescription: optText(d.metaDescription),
    sortOrder: d.sortOrder && d.sortOrder.trim() ? Math.max(0, parseInt(d.sortOrder, 10) || 0) : 0,
    isActive: d.isActive === "on",
  };

  try {
    if (d.id) {
      await prisma.eventType.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "eventtype.update", entity: "EventType", entityId: d.id, metadata: { slug } });
    } else {
      const created = await prisma.eventType.create({ data });
      await logAudit({ userId, action: "eventtype.create", entity: "EventType", entityId: created.id, metadata: { slug } });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe un evento con ese slug." };
    }
    return { status: "error", message: "No se pudo guardar el evento." };
  }

  updateTag(EVENT_TYPES_TAG);
  revalidatePath("/admin/eventos");
  redirect("/admin/eventos");
}

export async function deleteEventType(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.eventType.delete({ where: { id } });
    await logAudit({ userId, action: "eventtype.delete", entity: "EventType", entityId: id });
  } catch {
    // ignore
  }
  updateTag(EVENT_TYPES_TAG);
  revalidatePath("/admin/eventos");
  redirect("/admin/eventos");
}

export type AiDraftResult = { ok: boolean; text?: string; error?: string };

/** Genera con IA un BORRADOR Markdown del cuerpo de un tipo de evento (no guarda). */
export async function generateEventBody(id: string): Promise<AiDraftResult> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { ok: false, error: "No tienes permisos." };
  }
  if (!(await isAIConfigured())) return { ok: false, error: "IA no configurada. Conéctala en Admin → IA." };

  const e = await prisma.eventType.findUnique({ where: { id } });
  if (!e) return { ok: false, error: "Evento no encontrado." };

  const system =
    "Eres redactor SEO profesional de 'Alquiler Karaoke', empresa española de alquiler de karaoke y eventos con cobertura nacional. " +
    "Escribes en español, tono profesional y cercano, sin inventar precios, teléfonos ni direcciones. " +
    "Devuelves SOLO Markdown: 2-3 párrafos y 2 subtítulos de nivel 2 (##). Nada de H1.";
  const prompt =
    `Redacta un texto único y original para la página de karaoke para "${e.name}". ` +
    (e.shortDescription ? `Contexto: ${e.shortDescription}. ` : "") +
    "Menciona la propuesta de valor (montamos una experiencia, no solo alquilamos una máquina), equipo de sonido, pantallas, microfonía e iluminación, " +
    "con o sin técnico, miles de canciones, y cobertura en toda España. Usa variantes de keyword como 'karaoke para " +
    `${e.name.toLowerCase()}' y 'alquiler de karaoke'. Que sea específico de este tipo de evento, no genérico.`;

  try {
    const text = await generateContent({ system, prompt, maxTokens: 900 });
    await logAudit({ userId, action: "ai.generate", entity: "EventType", entityId: id, metadata: { field: "description" } });
    return { ok: true, text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI_ERROR";
    return { ok: false, error: `No se pudo generar (${msg}).` };
  }
}
