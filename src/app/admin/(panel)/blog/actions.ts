"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { BLOG_TAG } from "@/server/blog";
import { generateJSON, isAIConfigured } from "@/server/ai";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "El título es obligatorio.").max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "El slug solo admite minúsculas, números y guiones."),
  locale: z.enum(["es", "en", "fr"]).default("es"),
  excerpt: z.string().trim().max(400).optional(),
  content: z.string().trim().min(1, "El contenido es obligatorio.").max(50000),
  coverImageUrl: z.string().trim().max(500).optional(),
  metaTitle: z.string().trim().max(200).optional(),
  metaDescription: z.string().trim().max(320).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export type PostFormState = { status: "idle" | "error"; message?: string };

const orNull = (v?: string) => (v && v.length ? v : null);

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
}

export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar el blog." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  // publishedAt se fija al publicar por primera vez.
  const existing = d.id ? await prisma.post.findUnique({ where: { id: d.id }, select: { publishedAt: true } }) : null;
  const publishedAt =
    d.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);

  const data = {
    title: d.title,
    slug: d.slug,
    locale: d.locale,
    excerpt: orNull(d.excerpt),
    content: d.content,
    coverImageUrl: orNull(d.coverImageUrl),
    metaTitle: orNull(d.metaTitle),
    metaDescription: orNull(d.metaDescription),
    status: d.status,
    publishedAt,
  };

  try {
    if (d.id) {
      await prisma.post.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "post.update", entity: "Post", entityId: d.id, metadata: { status: d.status } });
    } else {
      const created = await prisma.post.create({ data: { ...data, authorId: userId } });
      await logAudit({ userId, action: "post.create", entity: "Post", entityId: created.id, metadata: { status: d.status } });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe una entrada con ese slug." };
    }
    return { status: "error", message: "No se pudo guardar la entrada." };
  }

  updateTag(BLOG_TAG);
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function deletePost(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.post.delete({ where: { id } });
    await logAudit({ userId, action: "post.delete", entity: "Post", entityId: id });
  } catch {
    // si no se puede borrar, no rompemos la navegación
  }
  updateTag(BLOG_TAG);
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export type BlogDraft = { excerpt: string; content: string; metaTitle: string; metaDescription: string };
export type BlogDraftResult = { ok: boolean; draft?: BlogDraft; error?: string };

const LANG: Record<string, string> = { es: "español", en: "inglés", fr: "francés" };

/**
 * Genera con IA un BORRADOR completo de artículo de blog (extracto, contenido Markdown y meta).
 * No guarda nada: el redactor lo revisa y guarda.
 */
export async function generateBlogDraft(input: { title: string; locale: string; brief?: string }): Promise<BlogDraftResult> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { ok: false, error: "No tienes permisos." };
  }
  if (!isAIConfigured()) return { ok: false, error: "IA no configurada. Define ANTHROPIC_API_KEY en el servidor." };

  const title = (input.title || "").trim();
  if (!title) return { ok: false, error: "Escribe primero un título o tema." };
  const lang = LANG[input.locale] ?? "español";

  const system =
    "Eres redactor SEO profesional de 'Alquiler Karaoke', empresa española de alquiler de karaoke y eventos con cobertura nacional. " +
    "Tono profesional, cercano y útil. No inventes datos falsos (precios, teléfonos, fechas ni estadísticas inventadas). " +
    "Devuelves EXCLUSIVAMENTE un JSON válido, sin texto alrededor ni ```.";
  const prompt =
    `Escribe un artículo de blog en ${lang} sobre: "${title}". ` +
    (input.brief ? `Enfoque/indicaciones: ${input.brief}. ` : "") +
    "Orientado a SEO para karaoke y eventos en España. Devuelve un JSON con EXACTAMENTE estas claves: " +
    `"excerpt" (1-2 frases gancho), ` +
    `"content" (Markdown de 500-800 palabras con 3-4 subtítulos "## ", listas cuando aporten, consejos prácticos y una llamada a la acción final; sin H1 y sin inventar URLs), ` +
    `"metaTitle" (<=60 caracteres con keyword), ` +
    `"metaDescription" (140-155 caracteres con gancho).`;

  try {
    const draft = await generateJSON<BlogDraft>({ system, prompt, maxTokens: 2000 });
    await logAudit({ userId, action: "ai.generate", entity: "Post", metadata: { kind: "blog", title } });
    return { ok: true, draft };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI_ERROR";
    return { ok: false, error: `No se pudo generar (${msg}).` };
  }
}
