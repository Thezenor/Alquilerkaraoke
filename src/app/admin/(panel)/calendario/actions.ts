"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { eurosToCents } from "@/lib/money";
import { PRICING_TAG } from "@/server/pricing";
import { Role } from "@/generated/prisma/enums";
import type { SurchargeType } from "@/generated/prisma/enums";

export type CalendarActionState = { ok: boolean; message?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_SURCHARGE_TYPES = ["SPECIAL_DATE", "HIGH_DEMAND", "OTHER"] as const;

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN);
}

function revalidate() {
  updateTag(PRICING_TAG);
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/recargos");
}

// ── Suplemento por fecha (single o rango) ────────────────────────
export async function createDateSurcharge(
  _prev: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { ok: false, message: "No tienes permisos." };
  }

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(120),
      type: z.enum(DATE_SURCHARGE_TYPES).default("SPECIAL_DATE"),
      valueType: z.enum(["PERCENT", "FIXED"]).default("PERCENT"),
      mode: z.enum(["single", "range"]).default("single"),
      date: z.string().regex(DATE_RE),
      to: z.string().regex(DATE_RE).optional().or(z.literal("")),
      value: z.string().trim().min(1),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "Revisa los datos del suplemento (nombre, fecha e importe)." };
  }
  const d = parsed.data;

  const value =
    d.valueType === "PERCENT"
      ? (() => {
          const n = z.coerce.number().int().min(0).max(100).safeParse(d.value);
          return n.success ? n.data : null;
        })()
      : eurosToCents(d.value);

  if (value === null || value <= 0) {
    return { ok: false, message: "El importe del suplemento no es válido." };
  }

  const isRange = d.mode === "range" && d.to && DATE_RE.test(d.to);
  if (isRange && d.to! < d.date) {
    return { ok: false, message: "La fecha final debe ser posterior a la inicial." };
  }

  const config = isRange
    ? { mode: "range" as const, from: d.date, to: d.to }
    : { mode: "single" as const, date: d.date };

  const created = await prisma.surcharge.create({
    data: {
      name: d.name,
      type: d.type as SurchargeType,
      valueType: d.valueType,
      value,
      isActive: true,
      config,
    },
  });

  await logAudit({
    userId,
    action: "surcharge.create",
    entity: "Surcharge",
    entityId: created.id,
    metadata: { name: d.name, type: d.type, valueType: d.valueType, value, config },
  });
  revalidate();
  return { ok: true, message: "Suplemento creado." };
}

// Suplemento recurrente (fin de semana / nocturnidad) — no depende de una fecha concreta.
export async function createRecurringSurcharge(
  _prev: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { ok: false, message: "No tienes permisos." };
  }

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(120),
      type: z.enum(["WEEKEND", "NIGHT"]),
      valueType: z.enum(["PERCENT", "FIXED"]).default("PERCENT"),
      value: z.string().trim().min(1),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { ok: false, message: "Revisa el nombre, el tipo y el importe." };
  const d = parsed.data;

  const value =
    d.valueType === "PERCENT"
      ? (() => {
          const n = z.coerce.number().int().min(0).max(100).safeParse(d.value);
          return n.success ? n.data : null;
        })()
      : eurosToCents(d.value);
  if (value === null || value <= 0) return { ok: false, message: "El importe no es válido." };

  const created = await prisma.surcharge.create({
    data: { name: d.name, type: d.type as SurchargeType, valueType: d.valueType, value, isActive: true },
  });
  await logAudit({
    userId,
    action: "surcharge.create",
    entity: "Surcharge",
    entityId: created.id,
    metadata: { name: d.name, type: d.type, valueType: d.valueType, value },
  });
  revalidate();
  return { ok: true, message: "Recargo recurrente creado." };
}

export async function deleteSurcharge(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.surcharge.delete({ where: { id } });
  await logAudit({ userId, action: "surcharge.delete", entity: "Surcharge", entityId: id });
  revalidate();
}

export async function toggleSurcharge(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";
  if (!id) return;
  await prisma.surcharge.update({ where: { id }, data: { isActive: !isActive } });
  await logAudit({ userId, action: "surcharge.toggle", entity: "Surcharge", entityId: id, metadata: { isActive: !isActive } });
  revalidate();
}

// ── Bloqueo de fechas (no disponible) ────────────────────────────
export async function createBlock(
  _prev: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { ok: false, message: "No tienes permisos." };
  }

  const parsed = z
    .object({
      date: z.string().regex(DATE_RE),
      endDate: z.string().regex(DATE_RE).optional().or(z.literal("")),
      reason: z.string().trim().max(200).optional(),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { ok: false, message: "Selecciona una fecha válida." };
  const d = parsed.data;

  const hasEnd = d.endDate && DATE_RE.test(d.endDate);
  if (hasEnd && d.endDate! < d.date) {
    return { ok: false, message: "La fecha final debe ser posterior a la inicial." };
  }

  const created = await prisma.dateBlock.create({
    data: {
      date: new Date(`${d.date}T12:00:00`),
      endDate: hasEnd ? new Date(`${d.endDate}T12:00:00`) : null,
      reason: d.reason && d.reason.length ? d.reason : null,
    },
  });

  await logAudit({
    userId,
    action: "dateblock.create",
    entity: "DateBlock",
    entityId: created.id,
    metadata: { date: d.date, endDate: d.endDate || null },
  });
  revalidate();
  return { ok: true, message: "Fecha bloqueada." };
}

export async function deleteBlock(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.dateBlock.delete({ where: { id } });
  await logAudit({ userId, action: "dateblock.delete", entity: "DateBlock", entityId: id });
  revalidate();
}
