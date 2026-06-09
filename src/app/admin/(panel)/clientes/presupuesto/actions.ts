"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { computeQuoteFromForm } from "@/server/quote-input";
import { Role } from "@/generated/prisma/enums";

export type QuoteState = { status: "idle" | "error"; message?: string };

export async function createManualQuote(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL)).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para crear presupuestos." };
  }

  const computed = await computeQuoteFromForm(formData, { requireCustomer: true });
  if (!computed.ok) return { status: "error", message: computed.message };
  const { customer: c, date, province, eventTime, attendees, lines, breakdown } = computed.data;

  let bookingId: string;
  try {
    // Cliente: upsert por email (no pisa descuentos profesionales existentes).
    const customer = await prisma.customer.upsert({
      where: { email: c.email },
      update: { name: c.name, phone: c.phone },
      create: { email: c.email, name: c.name, phone: c.phone },
    });

    // Alta de usuario con login: email + teléfono como contraseña inicial.
    // Si ya existe, no se toca su contraseña ni sus roles.
    const existingUser = await prisma.user.findUnique({ where: { email: c.email } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          name: c.name,
          email: c.email,
          roles: [],
          isActive: true,
          emailVerified: new Date(),
          passwordHash: await bcrypt.hash(c.phone, 12),
        },
      });
      await logAudit({ userId, action: "user.create", entity: "User", metadata: { source: "admin-quote", email: c.email } });
    }

    const booking = await prisma.booking.create({
      data: {
        packName: lines[0].name,
        hours: lines[0].hours ?? 4,
        province,
        eventDate: date ? new Date(`${date}T12:00:00`) : null,
        eventTime,
        attendees,
        night: false,
        extras: [],
        activities: lines,
        subtotal: breakdown.subtotal,
        discount: breakdown.discount,
        vat: breakdown.vat,
        total: breakdown.total,
        deposit: breakdown.deposit,
        securityDeposit: 0,
        name: c.name,
        email: c.email,
        phone: c.phone,
        customerId: customer.id,
        acceptedTerms: false,
        status: "PENDING",
        handledById: userId,
        handledAt: new Date(),
        locale: "es",
      },
    });
    bookingId = booking.id;

    await logAudit({
      userId,
      action: "booking.create",
      entity: "Booking",
      entityId: booking.id,
      metadata: { source: "admin-quote", total: breakdown.total, lines: lines.length },
    });
  } catch {
    return { status: "error", message: "No se pudo crear el presupuesto." };
  }

  redirect(`/admin/reservas/${bookingId}?created=quote`);
}
