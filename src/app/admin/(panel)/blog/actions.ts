"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { BLOG_TAG } from "@/server/blog";
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
