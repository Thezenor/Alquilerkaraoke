"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { recomputeBookingPayment } from "@/server/payments";
import { createContractForBooking } from "@/server/contracts";
import { redirect } from "next/navigation";
import { sendEmail, sendQuoteEmail, notifyBookingStatusChange } from "@/server/email";
import { eurosToCents } from "@/lib/money";
import { Role, type PaymentMethod } from "@/generated/prisma/enums";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.alquilerkaraoke.com").replace(/\/$/, "");
}

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

  const existing = await prisma.booking.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return { status: "error", message: "Reserva no encontrada." };

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

  // Email al cliente al cambiar de estado (confirmada / rechazada / cancelada).
  // Best-effort: un fallo de email nunca bloquea la action.
  if (existing.status !== status && status !== "PENDING") {
    try {
      await notifyBookingStatusChange(id, status);
    } catch (err) {
      console.error(`[email] aviso de estado de reserva ${id} falló:`, err);
    }
  }

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

  const booking = await prisma.booking.findUnique({
    where: { id: d.bookingId },
    select: { id: true, amountPaid: true },
  });
  if (!booking) return { status: "error", message: "Reserva no encontrada." };

  // Un reembolso no puede superar lo cobrado hasta ahora.
  if (d.kind === "refund" && cents > booking.amountPaid) {
    return { status: "error", message: `El reembolso no puede superar lo cobrado (${booking.amountPaid / 100} €).` };
  }

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

// ── Contratos ────────────────────────────────────────────────────
export async function generateContract(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL)).user.id;
  } catch {
    return;
  }
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;

  const contract = await createContractForBooking(bookingId, userId);
  await logAudit({
    userId,
    action: "contract.create",
    entity: "Contract",
    entityId: contract.id,
    metadata: { bookingId, number: contract.number },
  });
  revalidatePath(`/admin/reservas/${bookingId}`);
}

export async function sendContract(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL)).user.id;
  } catch {
    return;
  }
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;

  const contract = await prisma.contract.findUnique({
    where: { bookingId },
    include: { booking: { select: { email: true, name: true, packName: true } } },
  });
  if (!contract || contract.status === "SIGNED" || contract.status === "CANCELLED") return;

  await prisma.contract.update({ where: { id: contract.id }, data: { status: "SENT" } });

  const link = `${siteUrl()}/contrato/${contract.token}`;
  await sendEmail({
    to: contract.booking.email,
    subject: `Firma tu contrato · ${contract.booking.packName}`,
    html: `<p>Hola ${contract.booking.name},</p>
      <p>Para confirmar tu reserva, revisa y firma tu contrato en el siguiente enlace:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Alquiler Karaoke</p>`,
  });

  await logAudit({ userId, action: "contract.send", entity: "Contract", entityId: contract.id, metadata: { bookingId } });
  revalidatePath(`/admin/reservas/${bookingId}`);
}

/** Envía el presupuesto (PDF premium) por email al cliente. */
export async function sendQuoteAction(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL)).user.id;
  } catch {
    return;
  }
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;

  let outcome: "ok" | "skip" | "err" = "err";
  try {
    const res = await sendQuoteEmail(bookingId);
    outcome = res.sent ? "ok" : res.skipped ? "skip" : "err";
  } catch {
    outcome = "err";
  }
  await logAudit({ userId, action: "quote.send", entity: "Booking", entityId: bookingId, metadata: { outcome } });
  redirect(`/admin/reservas/${bookingId}?sent=${outcome}`);
}

export async function cancelContract(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN)).user.id;
  } catch {
    return;
  }
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;
  const contract = await prisma.contract.findUnique({ where: { bookingId }, select: { id: true } });
  if (!contract) return;
  await prisma.contract.update({ where: { id: contract.id }, data: { status: "CANCELLED" } });
  await logAudit({ userId, action: "contract.cancel", entity: "Contract", entityId: contract.id, metadata: { bookingId } });
  revalidatePath(`/admin/reservas/${bookingId}`);
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
