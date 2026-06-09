"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { SERVICES_TAG } from "@/server/services";
import { generateContent, isAIConfigured } from "@/server/ai";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "El slug solo admite minúsculas, números y guiones."),
  category: z.string().trim().max(120).optional(),
  shortDescription: z.string().trim().max(400).optional(),
  description: z.string().trim().max(20000).optional(),
  heroImageUrl: z.string().trim().max(500).optional(),
  metaTitle: z.string().trim().max(200).optional(),
  metaDescription: z.string().trim().max(320).optional(),
  sortOrder: z.string().optional(),
  isActive: z.string().optional(),
  name_en: z.string().trim().max(120).optional(),
  short_en: z.string().trim().max(400).optional(),
  desc_en: z.string().trim().max(20000).optional(),
  name_fr: z.string().trim().max(120).optional(),
  short_fr: z.string().trim().max(400).optional(),
  desc_fr: z.string().trim().max(20000).optional(),
});

export type ServiceFormState = { status: "idle" | "error"; message?: string };

const int = (v?: string) => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : 0;
};
const orNull = (v?: string) => (v && v.length ? v : null);

function buildTranslations(d: z.infer<typeof schema>) {
  const locales: Record<string, Record<string, string>> = {};
  const add = (loc: string, name?: string, short?: string, desc?: string) => {
    const obj: Record<string, string> = {};
    if (name) obj.name = name;
    if (short) obj.shortDescription = short;
    if (desc) obj.description = desc;
    if (Object.keys(obj).length) locales[loc] = obj;
  };
  add("en", d.name_en, d.short_en, d.desc_en);
  add("fr", d.name_fr, d.short_fr, d.desc_fr);
  return Object.keys(locales).length ? locales : undefined;
}

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN);
}

export async function saveService(_prev: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar servicios." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  const data = {
    name: d.name,
    slug: d.slug,
    category: orNull(d.category),
    shortDescription: orNull(d.shortDescription),
    description: orNull(d.description),
    heroImageUrl: orNull(d.heroImageUrl),
    metaTitle: orNull(d.metaTitle),
    metaDescription: orNull(d.metaDescription),
    sortOrder: int(d.sortOrder),
    isActive: d.isActive === "on",
    translations: buildTranslations(d),
  };

  try {
    if (d.id) {
      await prisma.service.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "service.update", entity: "Service", entityId: d.id });
    } else {
      const created = await prisma.service.create({ data });
      await logAudit({ userId, action: "service.create", entity: "Service", entityId: created.id });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe un servicio con ese slug." };
    }
    return { status: "error", message: "No se pudo guardar el servicio." };
  }

  updateTag(SERVICES_TAG);
  revalidatePath("/admin/servicios");
  redirect("/admin/servicios");
}

export async function deleteService(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.service.delete({ where: { id } });
    await logAudit({ userId, action: "service.delete", entity: "Service", entityId: id });
  } catch {
    // no rompemos la navegación
  }
  updateTag(SERVICES_TAG);
  revalidatePath("/admin/servicios");
  redirect("/admin/servicios");
}

export type AiDraftResult = { ok: boolean; text?: string; error?: string };

/** Genera con IA un BORRADOR (Markdown) de la descripción de un servicio. No guarda. */
export async function generateServiceDescription(id: string): Promise<AiDraftResult> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { ok: false, error: "No tienes permisos." };
  }
  if (!(await isAIConfigured())) return { ok: false, error: "IA no configurada. Conéctala en Admin → IA." };

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return { ok: false, error: "Servicio no encontrado." };

  const system =
    "Eres redactor SEO profesional de 'Alquiler Karaoke', empresa española de alquiler de karaoke y eventos con cobertura nacional. " +
    "Tono profesional y cercano, sin inventar precios, teléfonos ni datos falsos. " +
    "Devuelves SOLO Markdown: 2-3 párrafos y 2 subtítulos de nivel 2 (##). Nada de H1.";
  const prompt =
    `Redacta la descripción de la página del servicio "${service.name}". ` +
    (service.shortDescription ? `Resumen: ${service.shortDescription}. ` : "") +
    "Explica en qué consiste, qué incluye (equipo de sonido, pantallas, microfonía, iluminación, con o sin técnico, miles de canciones cuando aplique), " +
    "para qué eventos es ideal y la cobertura en toda España. Usa la keyword del servicio de forma natural.";

  try {
    const text = await generateContent({ system, prompt, maxTokens: 900 });
    await logAudit({ userId, action: "ai.generate", entity: "Service", entityId: id, metadata: { field: "description" } });
    return { ok: true, text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI_ERROR";
    return { ok: false, error: `No se pudo generar (${msg}).` };
  }
}
