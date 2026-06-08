"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { eurosToCents } from "@/lib/money";
import { normalizeCode } from "@/lib/discount";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "El código es obligatorio.").max(40),
  valueType: z.enum(["PERCENT", "FIXED"]),
  value: z.string().trim().min(1, "Indica el valor."),
  maxUses: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.string().optional(),
});

export type DiscountFormState = { status: "idle" | "error"; message?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const toDate = (v?: string) => (v && DATE_RE.test(v) ? new Date(`${v}T12:00:00`) : null);

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN);
}

export async function saveDiscountCode(
  _prev: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar descuentos." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  const code = normalizeCode(d.code);
  if (!code) return { status: "error", message: "El código no es válido." };

  const value =
    d.valueType === "PERCENT"
      ? (() => {
          const n = z.coerce.number().int().min(1).max(100).safeParse(d.value);
          return n.success ? n.data : null;
        })()
      : eurosToCents(d.value);
  if (value === null || value <= 0) {
    return { status: "error", message: "El valor del descuento no es válido." };
  }

  const maxUses = d.maxUses && d.maxUses.trim() ? Math.max(0, parseInt(d.maxUses, 10) || 0) : null;
  const validFrom = toDate(d.validFrom);
  const validUntil = toDate(d.validUntil);
  if (validFrom && validUntil && validUntil < validFrom) {
    return { status: "error", message: "La fecha final debe ser posterior a la inicial." };
  }

  const data = {
    code,
    valueType: d.valueType,
    value,
    maxUses,
    validFrom,
    validUntil,
    isActive: d.isActive === "on",
  };

  try {
    if (d.id) {
      await prisma.discountCode.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "discount.update", entity: "DiscountCode", entityId: d.id });
    } else {
      const created = await prisma.discountCode.create({ data });
      await logAudit({ userId, action: "discount.create", entity: "DiscountCode", entityId: created.id });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe un código con ese nombre." };
    }
    return { status: "error", message: "No se pudo guardar el código." };
  }

  revalidatePath("/admin/descuentos");
  redirect("/admin/descuentos");
}

export async function deleteDiscountCode(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.discountCode.delete({ where: { id } });
    await logAudit({ userId, action: "discount.delete", entity: "DiscountCode", entityId: id });
  } catch {
    // si no se puede borrar, no rompemos la navegación
  }
  revalidatePath("/admin/descuentos");
  redirect("/admin/descuentos");
}
