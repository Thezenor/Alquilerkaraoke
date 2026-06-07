"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { eurosToCents } from "@/lib/money";
import { PACKS_TAG } from "@/server/packs";
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
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  category: z.string().trim().max(120).optional(),
  basePrice: z.string().optional(),
  includedHours: z.string().optional(),
  extraHourPrice: z.string().optional(),
  isPerDay: z.string().optional(),
  depositType: z.enum(["PERCENT", "FIXED"]),
  depositValue: z.string().optional(),
  securityDeposit: z.string().optional(),
  isActive: z.string().optional(),
  sortOrder: z.string().optional(),
  name_en: z.string().trim().max(120).optional(),
  short_en: z.string().trim().max(300).optional(),
  desc_en: z.string().trim().max(4000).optional(),
  name_fr: z.string().trim().max(120).optional(),
  short_fr: z.string().trim().max(300).optional(),
  desc_fr: z.string().trim().max(4000).optional(),
});

export type PackFormState = { status: "idle" | "error"; message?: string };

const int = (v?: string) => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : 0;
};

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

export async function savePack(_prev: PackFormState, formData: FormData): Promise<PackFormState> {
  let userId: string | undefined;
  try {
    const session = await requireRole(Role.SUPERADMIN, Role.ADMIN);
    userId = session.user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar packs." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  const data = {
    name: d.name,
    slug: d.slug,
    shortDescription: d.shortDescription || null,
    description: d.description || null,
    category: d.category || null,
    basePrice: eurosToCents(d.basePrice),
    includedHours: int(d.includedHours),
    extraHourPrice: eurosToCents(d.extraHourPrice),
    isPerDay: d.isPerDay === "on",
    depositType: d.depositType,
    // PERCENT → entero %, FIXED → céntimos
    depositValue: d.depositType === "PERCENT" ? int(d.depositValue) : eurosToCents(d.depositValue),
    securityDeposit: eurosToCents(d.securityDeposit),
    isActive: d.isActive === "on",
    sortOrder: int(d.sortOrder),
    translations: buildTranslations(d),
  };

  try {
    if (d.id) {
      await prisma.pack.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "pack.update", entity: "Pack", entityId: d.id });
    } else {
      const created = await prisma.pack.create({ data });
      await logAudit({ userId, action: "pack.create", entity: "Pack", entityId: created.id });
    }
  } catch (e) {
    // P2002 = slug duplicado
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe un pack con ese slug." };
    }
    return { status: "error", message: "No se pudo guardar el pack." };
  }

  updateTag(PACKS_TAG);
  redirect("/admin/packs");
}
