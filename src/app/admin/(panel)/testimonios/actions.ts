"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { TESTIMONIALS_TAG } from "@/server/testimonials";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().optional(),
  authorName: z.string().trim().min(1, "El nombre es obligatorio.").max(120),
  eventType: z.string().trim().max(160).optional(),
  quote: z.string().trim().min(1, "El testimonio es obligatorio.").max(1000),
  rating: z.coerce.number().int().min(1, "La valoración mínima es 1.").max(5, "La valoración máxima es 5."),
  locale: z.enum(["es", "en", "fr"], "Idioma no válido."),
  sourceUrl: z.union([z.literal(""), z.url("URL no válida.")]).optional(),
  sortOrder: z.string().optional(),
  isActive: z.string().optional(),
});

export type TestimonialFormState = { status: "idle" | "error"; message?: string };

const int = (v?: string) => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : 0;
};
const orNull = (v?: string) => (v && v.length ? v : null);

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN);
}

export async function saveTestimonial(
  _prev: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar testimonios." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  const data = {
    authorName: d.authorName,
    eventType: orNull(d.eventType),
    quote: d.quote,
    rating: d.rating,
    locale: d.locale,
    sourceUrl: orNull(d.sourceUrl),
    sortOrder: int(d.sortOrder),
    isActive: d.isActive === "on",
  };

  try {
    if (d.id) {
      await prisma.testimonial.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "testimonial.update", entity: "Testimonial", entityId: d.id });
    } else {
      const created = await prisma.testimonial.create({ data });
      await logAudit({ userId, action: "testimonial.create", entity: "Testimonial", entityId: created.id });
    }
  } catch {
    return { status: "error", message: "No se pudo guardar el testimonio." };
  }

  updateTag(TESTIMONIALS_TAG);
  revalidatePath("/admin/testimonios");
  redirect("/admin/testimonios");
}

export async function deleteTestimonial(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.testimonial.delete({ where: { id } });
    await logAudit({ userId, action: "testimonial.delete", entity: "Testimonial", entityId: id });
  } catch {
    // si no se puede borrar, no rompemos la navegación
  }
  updateTag(TESTIMONIALS_TAG);
  revalidatePath("/admin/testimonios");
  redirect("/admin/testimonios");
}
