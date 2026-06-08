"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { slugifyCity } from "@/lib/cities";
import { GALLERIES_TAG } from "@/server/galleries";
import { Role } from "@/generated/prisma/enums";

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const toDate = (v?: string) => (v && DATE_RE.test(v) ? new Date(`${v}T23:59:59`) : null);
const optText = (s: string | undefined) => {
  const v = (s ?? "").trim();
  return v ? v : null;
};

const gallerySchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "El título es obligatorio.").max(120),
  slug: z.string().trim().max(120).optional(),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().trim().max(500).optional(),
  password: z.string().max(100).optional(),
  removePassword: z.string().optional(),
  expiresAt: z.string().optional(),
  isListed: z.string().optional(),
  allowDownload: z.string().optional(),
  isActive: z.string().optional(),
  sortOrder: z.string().optional(),
});

export type GalleryFormState = { status: "idle" | "error"; message?: string };

export async function saveGallery(_prev: GalleryFormState, formData: FormData): Promise<GalleryFormState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar galerías." };
  }

  const parsed = gallerySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  const d = parsed.data;

  const slug = slugifyCity(d.slug && d.slug.trim() ? d.slug : d.title);
  if (!slug) return { status: "error", message: "No se pudo generar un slug válido." };

  // Clave: si se escribe una nueva, se hashea; si se marca quitar, se borra; si no, se mantiene.
  let passwordHash: string | null | undefined = undefined; // undefined = no tocar
  if (d.removePassword === "on") passwordHash = null;
  else if (d.password && d.password.trim()) passwordHash = await bcrypt.hash(d.password.trim(), 10);

  const base = {
    title: d.title,
    slug,
    description: optText(d.description),
    coverImageUrl: optText(d.coverImageUrl),
    expiresAt: toDate(d.expiresAt),
    isListed: d.isListed === "on",
    allowDownload: d.allowDownload === "on",
    isActive: d.isActive === "on",
    sortOrder: d.sortOrder && d.sortOrder.trim() ? Math.max(0, parseInt(d.sortOrder, 10) || 0) : 0,
  };

  try {
    if (d.id) {
      await prisma.gallery.update({
        where: { id: d.id },
        data: { ...base, ...(passwordHash !== undefined ? { passwordHash } : {}) },
      });
      await logAudit({ userId, action: "gallery.update", entity: "Gallery", entityId: d.id, metadata: { slug } });
    } else {
      const created = await prisma.gallery.create({
        data: { ...base, passwordHash: passwordHash ?? null },
      });
      await logAudit({ userId, action: "gallery.create", entity: "Gallery", entityId: created.id, metadata: { slug } });
      updateTag(GALLERIES_TAG);
      revalidatePath("/admin/galerias");
      redirect(`/admin/galerias/${created.id}`);
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe una galería con ese slug." };
    }
    throw e;
  }

  updateTag(GALLERIES_TAG);
  revalidatePath("/admin/galerias");
  redirect("/admin/galerias");
}

export async function deleteGallery(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.gallery.delete({ where: { id } });
    await logAudit({ userId, action: "gallery.delete", entity: "Gallery", entityId: id });
  } catch {
    // ignore
  }
  updateTag(GALLERIES_TAG);
  revalidatePath("/admin/galerias");
  redirect("/admin/galerias");
}

const itemSchema = z.object({
  galleryId: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]),
  url: z.string().trim().url("URL no válida.").max(1000),
  thumbnailUrl: z.string().trim().max(1000).optional(),
  caption: z.string().max(300).optional(),
});

export async function addGalleryItem(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  try {
    const count = await prisma.galleryItem.count({ where: { galleryId: d.galleryId } });
    await prisma.galleryItem.create({
      data: {
        galleryId: d.galleryId,
        type: d.type,
        url: d.url,
        thumbnailUrl: optText(d.thumbnailUrl),
        caption: optText(d.caption),
        sortOrder: count,
      },
    });
    await logAudit({ userId, action: "galleryitem.add", entity: "Gallery", entityId: d.galleryId });
  } catch {
    // ignore
  }
  updateTag(GALLERIES_TAG);
  revalidatePath(`/admin/galerias/${d.galleryId}`);
  redirect(`/admin/galerias/${d.galleryId}`);
}

export async function deleteGalleryItem(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  const galleryId = String(formData.get("galleryId") ?? "");
  if (!id) return;
  try {
    await prisma.galleryItem.delete({ where: { id } });
    await logAudit({ userId, action: "galleryitem.delete", entity: "GalleryItem", entityId: id });
  } catch {
    // ignore
  }
  updateTag(GALLERIES_TAG);
  revalidatePath(`/admin/galerias/${galleryId}`);
  redirect(`/admin/galerias/${galleryId}`);
}
