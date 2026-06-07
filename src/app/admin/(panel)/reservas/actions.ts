"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { recomputeBookingPayment } from "@/server/payments";
import { eurosToCents } from "@/lib/money";
import { Role, type PaymentMethod } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "REJECTED", "CANCELLED"]),
  adminNote: z.string().trim().max(4000).optional(),
});

export type BookingState = { status: "idle" | "success" | "error"; message?: string };

export async function updateBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  let userId: string | undefined;
  try {
    const session = await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
    userId = session.user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar reservas." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Datos no válidos." };
  const { id, status, adminNote } = parsed.data;

  await prisma.booking.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote && adminNote.length ? adminNote : null,
      handledById: userId,
      handledAt: new Date(),
    },
  });

  await logAudit({
    userId,
    action: "booking.update",
    entity: "Booking",
    entityId: id,
    metadata: { status },
  });

  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${id}`);
  return { status: "success", message: "Reserva actualizada." };
}

// ── Pagos manuales ───────────────────────────────────────────────
const paymentSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.string().trim().min(1),
  method: z.enum(["TRANSFER", "BIZUM", "CASH", "CARD", "OTHER"]).default("TRANSFER"),
  kind: z.enum(["charge", "refund"]).default("charge"),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  paidAt: z.string().trim().optional(),
});

export type PaymentState = { status: "idle" | "success" | "error"; message?: string };

export async function addPayment(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL)).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para registrar pagos." };
  }

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Revisa los datos del pago." };
  const d = parsed.data;

  const cents = eurosToCents(d.amount);
  if (cents <= 0) return { status: "error", message: "El importe debe ser mayor que 0." };
  const amount = d.kind === "refund" ? -cents : cents;

  const booking = await prisma.booking.findUnique({ where: { id: d.bookingId }, select: { id: true } });
  if (!booking) return { status: "error", message: "Reserva no encontrada." };

  const paidAt = d.paidAt && /^\d{4}-\d{2}-\d{2}$/.test(d.paidAt) ? new Date(`${d.paidAt}T12:00:00`) : new Date();

  const created = await prisma.payment.create({
    data: {
      bookingId: d.bookingId,
      amount,
      method: d.method as PaymentMethod,
      reference: d.reference || null,
      note: d.note || null,
      paidAt,
      createdById: userId,
    },
  });
  await recomputeBookingPayment(d.bookingId);

  await logAudit({
    userId,
    action: "payment.create",
    entity: "Payment",
    entityId: created.id,
    metadata: { bookingId: d.bookingId, amount, method: d.method, kind: d.kind },
  });

  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${d.bookingId}`);
  return { status: "success", message: d.kind === "refund" ? "Reembolso registrado." : "Pago registrado." };
}

export async function deletePayment(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL)).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const payment = await prisma.payment.findUnique({ where: { id }, select: { bookingId: true } });
  if (!payment) return;

  await prisma.payment.delete({ where: { id } });
  await recomputeBookingPayment(payment.bookingId);
  await logAudit({ userId, action: "payment.delete", entity: "Payment", entityId: id, metadata: { bookingId: payment.bookingId } });

  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${payment.bookingId}`);
}
