"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { eurosToCents } from "@/lib/money";
import { PRICING_TAG } from "@/server/pricing";
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
  description: z.string().trim().max(2000).optional(),
  price: z.string().optional(),
  isActive: z.string().optional(),
  sortOrder: z.string().optional(),
  name_en: z.string().trim().max(120).optional(),
  desc_en: z.string().trim().max(2000).optional(),
  name_fr: z.string().trim().max(120).optional(),
  desc_fr: z.string().trim().max(2000).optional(),
});

export type ExtraFormState = { status: "idle" | "error"; message?: string };

const int = (v?: string) => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : 0;
};

export async function saveExtra(_prev: ExtraFormState, formData: FormData): Promise<ExtraFormState> {
  let userId: string | undefined;
  try {
    const session = await requireRole(Role.SUPERADMIN, Role.ADMIN);
    userId = session.user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar extras." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  const translations: Record<string, Record<string, string>> = {};
  if (d.name_en || d.desc_en) translations.en = { ...(d.name_en && { name: d.name_en }), ...(d.desc_en && { description: d.desc_en }) };
  if (d.name_fr || d.desc_fr) translations.fr = { ...(d.name_fr && { name: d.name_fr }), ...(d.desc_fr && { description: d.desc_fr }) };

  const data = {
    name: d.name,
    slug: d.slug,
    description: d.description || null,
    price: eurosToCents(d.price),
    isActive: d.isActive === "on",
    sortOrder: int(d.sortOrder),
    translations: Object.keys(translations).length ? translations : undefined,
  };

  try {
    if (d.id) {
      await prisma.extra.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "extra.update", entity: "Extra", entityId: d.id });
    } else {
      const created = await prisma.extra.create({ data });
      await logAudit({ userId, action: "extra.create", entity: "Extra", entityId: created.id });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe un extra con ese slug." };
    }
    return { status: "error", message: "No se pudo guardar el extra." };
  }

  updateTag(PRICING_TAG);
  redirect("/admin/extras");
}
