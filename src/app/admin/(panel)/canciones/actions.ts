"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { SONGS_TAG, optimizeCatalog } from "@/server/songs";
import { Role } from "@/generated/prisma/enums";

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN);
}

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  quality: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: z.string().optional(),
});

export async function saveSongBrand(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const data = { name: d.name, quality: d.quality, isActive: d.isActive === "on" };
  try {
    if (d.id) await prisma.songBrand.update({ where: { id: d.id }, data });
    else await prisma.songBrand.create({ data });
    await logAudit({ userId, action: "songbrand.save", entity: "SongBrand", entityId: d.id, metadata: { name: d.name, quality: d.quality } });
  } catch {
    // nombre duplicado u otro: no romper la navegación
  }
  updateTag(SONGS_TAG);
  revalidatePath("/admin/canciones");
}

export async function deleteSongBrand(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.songBrand.delete({ where: { id } });
    await logAudit({ userId, action: "songbrand.delete", entity: "SongBrand", entityId: id });
  } catch {
    // ignore
  }
  updateTag(SONGS_TAG);
  revalidatePath("/admin/canciones");
}

export async function reoptimizeCatalog(): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const stats = await optimizeCatalog();
  await logAudit({ userId, action: "songs.optimize", entity: "Song", metadata: stats });
  updateTag(SONGS_TAG);
  revalidatePath("/admin/canciones");
}
