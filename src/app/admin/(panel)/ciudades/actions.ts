"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { slugifyCity } from "@/lib/cities";
import { CITIES_TAG } from "@/server/cities";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(80),
  slug: z.string().trim().max(80).optional(),
  province: z.string().trim().min(1, "Indica la provincia.").max(80),
  region: z.string().trim().min(1, "Indica la comunidad autónoma.").max(80),
  nearby: z.string().optional(),
  sortOrder: z.string().optional(),
  isActive: z.string().optional(),
});

export type CityFormState = { status: "idle" | "error"; message?: string };

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
}

/** Parsea poblaciones desde el textarea (una por línea o separadas por comas). */
function parseNearby(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export async function saveCity(_prev: CityFormState, formData: FormData): Promise<CityFormState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar ciudades." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  const slug = slugifyCity(d.slug && d.slug.trim() ? d.slug : d.name);
  if (!slug) return { status: "error", message: "No se pudo generar un slug válido." };

  const data = {
    name: d.name,
    slug,
    province: d.province,
    region: d.region,
    nearby: parseNearby(d.nearby),
    sortOrder: d.sortOrder && d.sortOrder.trim() ? Math.max(0, parseInt(d.sortOrder, 10) || 0) : 0,
    isActive: d.isActive === "on",
  };

  try {
    if (d.id) {
      await prisma.city.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "city.update", entity: "City", entityId: d.id, metadata: { slug } });
    } else {
      const created = await prisma.city.create({ data });
      await logAudit({ userId, action: "city.create", entity: "City", entityId: created.id, metadata: { slug } });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe una ciudad con ese slug." };
    }
    return { status: "error", message: "No se pudo guardar la ciudad." };
  }

  updateTag(CITIES_TAG);
  revalidatePath("/admin/ciudades");
  redirect("/admin/ciudades");
}

export async function deleteCity(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.city.delete({ where: { id } });
    await logAudit({ userId, action: "city.delete", entity: "City", entityId: id });
  } catch {
    // si no se puede borrar, no rompemos la navegación
  }
  updateTag(CITIES_TAG);
  revalidatePath("/admin/ciudades");
  redirect("/admin/ciudades");
}
