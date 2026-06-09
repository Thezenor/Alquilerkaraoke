"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { BLOG_TAG } from "@/server/blog";
import { generateJSON, isAIConfigured } from "@/server/ai";
import { getActiveServices, localizedService } from "@/server/services";
import { getActiveEventTypes, localizedEventType } from "@/server/event-types";
import { getActiveCities } from "@/server/cities";
import { slugifyCity } from "@/lib/cities";
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

export type BlogDraft = {
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  coverImagePrompt: string;
};
export type BlogDraftResult = { ok: boolean; draft?: BlogDraft; error?: string };

const LANG: Record<string, string> = { es: "español", en: "inglés", fr: "francés" };

/** Construye la lista de enlaces internos REALES disponibles para que la IA enlace a páginas existentes. */
async function buildInternalLinks(locale: string): Promise<string[]> {
  const [services, events, cities] = await Promise.all([
    getActiveServices().catch(() => []),
    getActiveEventTypes().catch(() => []),
    getActiveCities().catch(() => []),
  ]);
  const links = [
    `/${locale}/servicios — Servicios`,
    `/${locale}/packs — Packs y precios`,
    `/${locale}/canciones — Catálogo de canciones`,
    `/${locale}/eventos — Tipos de evento`,
    `/${locale}/karaoke — Ciudades`,
    `/${locale}/presupuesto — Pedir presupuesto`,
    `/${locale}/contacto — Contacto`,
    ...services.slice(0, 8).map((s) => `/${locale}/servicios/${s.slug} — ${localizedService(s, locale).name}`),
    ...events.slice(0, 8).map((e) => `/${locale}/eventos/${e.slug} — ${localizedEventType(e, locale).name}`),
    ...cities.slice(0, 12).map((c) => `/${locale}/karaoke/${c.slug} — Karaoke en ${c.name}`),
  ];
  return links;
}

/**
 * Genera con IA un BORRADOR completo y MUY optimizado de artículo de blog:
 * estructura SEO, enlaces internos reales, enlaces externos a fuentes autorizadas
 * (NUNCA competencia), metadatos y sugerencia de portada. No guarda nada.
 */
export async function generateBlogDraft(input: { title: string; locale: string; brief?: string }): Promise<BlogDraftResult> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { ok: false, error: "No tienes permisos." };
  }
  if (!(await isAIConfigured())) return { ok: false, error: "IA no configurada. Conéctala en Admin → IA." };

  const title = (input.title || "").trim();
  if (!title) return { ok: false, error: "Escribe primero un título o tema." };
  const lang = LANG[input.locale] ?? "español";
  const internal = await buildInternalLinks(input.locale);

  const system = [
    "Eres redactor SEO senior y estratega de contenidos de 'Alquiler Karaoke', empresa española líder en alquiler de karaoke y eventos con cobertura nacional (bodas, empresas, cumpleaños, comuniones, despedidas, fiestas infantiles, Navidad, graduaciones).",
    "Tu objetivo: redactar un artículo que posicione en Google para la intención de búsqueda del tema, demostrando experiencia (E-E-A-T), siendo útil y específico, no genérico.",
    "Marca: 'No alquilamos una máquina: montamos una experiencia'. Equipo profesional (pantallas LED, micrófonos inalámbricos, sonido, iluminación), con o sin técnico, +180.000 canciones, montaje incluido.",
    "Reglas estrictas:",
    "- No inventes datos verificables (precios, teléfonos, fechas, estadísticas, premios). Si das un dato numérico, que sea de conocimiento común o frasea con cautela.",
    "- Español neutro de España, tono profesional y cercano, frases claras, párrafos cortos.",
    "- ENLACES INTERNOS: usa SOLO rutas de la lista que te paso (markdown [texto](ruta)). Inserta entre 3 y 6 de forma natural y relevante. No inventes rutas internas.",
    "- ENLACES EXTERNOS: como máximo 2, y SOLO a fuentes autorizadas y neutrales (Wikipedia, webs oficiales de turismo o ayuntamientos, organismos como SGAE, medios de referencia). PROHIBIDO enlazar a competidores o a cualquier empresa de alquiler de karaoke, sonido, DJ o eventos. Ante la duda, no pongas enlace externo.",
    "- Estructura el contenido para SEO: gancho inicial, subtítulos H2/H3 (## y ###), listas con viñetas o numeradas cuando aporten, una sección de preguntas frecuentes con 3-4 Q&A, y una llamada a la acción final que enlace a /presupuesto o /contacto.",
    "Devuelves EXCLUSIVAMENTE un JSON válido, sin texto alrededor ni ```.",
  ].join("\n");

  const prompt = [
    `Tema del artículo: "${title}".`,
    input.brief ? `Enfoque/indicaciones del editor: ${input.brief}.` : "",
    `Idioma de salida: ${lang}.`,
    "",
    "Enlaces internos disponibles (usa solo estas rutas, formato 'ruta — descripción'):",
    internal.map((l) => `- ${l}`).join("\n"),
    "",
    "Devuelve un JSON con EXACTAMENTE estas claves:",
    '- "slug": slug corto en kebab-case ascii derivado del tema (sin acentos, 3-7 palabras).',
    '- "metaTitle": <= 60 caracteres, con la keyword principal y gancho.',
    '- "metaDescription": 140-155 caracteres, persuasiva, con keyword y llamada a la acción.',
    '- "excerpt": 1-2 frases (<= 220 caracteres) que resuman y enganchen.',
    '- "content": artículo en Markdown de 700-1100 palabras. Sin H1 (el título va aparte). Empieza con un párrafo gancho; 4-6 secciones "## "; subsecciones "### " cuando convenga; listas; una sección "## Preguntas frecuentes" con 3-4 preguntas en "### " y su respuesta; cierre con CTA enlazando a /presupuesto. Incluye 3-6 enlaces internos de la lista y, si aporta, 1-2 enlaces externos a fuentes autorizadas (nunca competencia).',
    '- "coverImagePrompt": una frase en español describiendo la imagen de portada ideal (ambiente de evento/karaoke), para que el editor la suba o la genere.',
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const draft = await generateJSON<BlogDraft>({ system, prompt, maxTokens: 3500 });
    if (draft.slug) draft.slug = slugifyCity(draft.slug);
    await logAudit({ userId, action: "ai.generate", entity: "Post", metadata: { kind: "blog", title } });
    return { ok: true, draft };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI_ERROR";
    return { ok: false, error: `No se pudo generar (${msg}).` };
  }
}
