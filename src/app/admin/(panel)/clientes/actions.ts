"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { anonymizeCustomer } from "@/server/gdpr";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().optional(),
  email: z.email(),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  isProfessional: z.string().optional(),
  discountPercent: z.coerce.number().int().min(0).max(35).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export type CustomerFormState = { status: "idle" | "error"; message?: string };

export async function saveCustomer(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  let userId: string | undefined;
  try {
    const session = await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
    userId = session.user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar clientes." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  const data = {
    email: d.email,
    name: d.name || null,
    phone: d.phone || null,
    isProfessional: d.isProfessional === "on",
    discountPercent: d.discountPercent ?? 0,
    notes: d.notes || null,
  };

  try {
    if (d.id) {
      await prisma.customer.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "customer.update", entity: "Customer", entityId: d.id, metadata: { isProfessional: data.isProfessional, discountPercent: data.discountPercent } });
    } else {
      const created = await prisma.customer.create({ data });
      await logAudit({ userId, action: "customer.create", entity: "Customer", entityId: created.id });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe un cliente con ese email." };
    }
    return { status: "error", message: "No se pudo guardar el cliente." };
  }

  redirect("/admin/clientes");
}

/** Borra un cliente por completo. Sus reservas se conservan (Booking.customerId es onDelete: SetNull). */
export async function deleteCustomer(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN)).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    const c = await prisma.customer.findUnique({ where: { id }, select: { email: true } });
    await prisma.customer.delete({ where: { id } });
    await logAudit({ userId, action: "customer.delete", entity: "Customer", entityId: id, metadata: { email: c?.email } });
  } catch {
    return;
  }
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

/** RGPD — derecho de supresión: anonimiza el cliente y la PII de sus reservas. */
export async function anonymizeCustomerAction(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN)).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await anonymizeCustomer(id);
  await logAudit({ userId, action: "customer.anonymize", entity: "Customer", entityId: id });
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${id}`);
  revalidatePath("/admin/reservas");
}
