"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { calculateBudget } from "@/lib/budget";
import { eurosToCents } from "@/lib/money";
import { Role } from "@/generated/prisma/enums";

export type QuoteState = { status: "idle" | "error"; message?: string };

const lineSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional().default(""),
  price: z.union([z.string(), z.number()]),
  hours: z.union([z.string(), z.number()]).optional(),
});

const schema = z.object({
  customerName: z.string().trim().min(1, "Indica el nombre del cliente.").max(120),
  customerEmail: z.email("Email del cliente no válido."),
  customerPhone: z.string().trim().min(6, "Indica un teléfono (será su clave inicial).").max(40),
  date: z.string().trim().max(20).optional(),
  province: z.string().trim().max(80).optional(),
  eventTime: z.string().trim().max(20).optional(),
  attendees: z.coerce.number().int().min(0).max(100000).optional(),
  depositPercent: z.coerce.number().int().min(0).max(100).optional(),
});

const orNull = (v: string | undefined | null) => (v && v.length ? v : null);

export async function createManualQuote(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL)).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para crear presupuestos." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  // Líneas del presupuesto (JSON del formulario).
  let rawLines: unknown;
  try {
    rawLines = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { status: "error", message: "No se pudieron leer los productos." };
  }
  const linesParsed = z.array(lineSchema).max(12).safeParse(rawLines);
  if (!linesParsed.success || linesParsed.data.length === 0) {
    return { status: "error", message: "Añade al menos un producto con su precio." };
  }
  const lines = linesParsed.data
    .map((l) => ({
      name: l.name,
      description: orNull(l.description?.trim() || ""),
      hours: l.hours != null && String(l.hours).trim() ? Math.min(48, Math.max(1, parseInt(String(l.hours), 10) || 0)) || null : null,
      lineTotal: eurosToCents(l.price),
    }))
    .filter((l) => l.name);
  if (lines.some((l) => l.lineTotal <= 0)) {
    return { status: "error", message: "Cada producto debe tener un precio mayor que 0." };
  }

  const province = (d.province ?? "").trim();
  const [prov, config] = await Promise.all([
    province
      ? prisma.province.findFirst({ where: { name: province, isActive: true }, include: { zone: true } })
      : Promise.resolve(null),
    prisma.pricingConfig.findUnique({ where: { id: "default" } }),
  ]);

  const combinedBase = lines.reduce((s, l) => s + l.lineTotal, 0);
  const depositPercent = d.depositPercent ?? 50;
  const breakdown = calculateBudget({
    basePrice: combinedBase,
    isPerDay: true,
    includedHours: 0,
    extraHourPrice: 0,
    hours: 0,
    provinceSupplement: prov?.zone && prov.zone.isActive ? prov.zone.supplement : 0,
    extras: [],
    surchargePercents: [],
    surchargeFixed: [],
    vatPercent: config?.vatPercent ?? 21,
    discountPercent: 0,
    depositType: "PERCENT",
    depositValue: depositPercent,
    securityDeposit: 0,
  });

  let bookingId: string;
  try {
    // Cliente: upsert por email (no pisa descuentos profesionales existentes).
    const customer = await prisma.customer.upsert({
      where: { email: d.customerEmail },
      update: { name: d.customerName, phone: d.customerPhone },
      create: { email: d.customerEmail, name: d.customerName, phone: d.customerPhone },
    });

    // Alta de usuario con login: email + teléfono como contraseña inicial.
    // Si ya existe, no se toca su contraseña ni sus roles.
    const existingUser = await prisma.user.findUnique({ where: { email: d.customerEmail } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          name: d.customerName,
          email: d.customerEmail,
          roles: [],
          isActive: true,
          emailVerified: new Date(),
          passwordHash: await bcrypt.hash(d.customerPhone, 12),
        },
      });
      await logAudit({ userId, action: "user.create", entity: "User", metadata: { source: "admin-quote", email: d.customerEmail } });
    }

    const booking = await prisma.booking.create({
      data: {
        packName: lines[0].name,
        hours: lines[0].hours ?? 4,
        province: orNull(province),
        eventDate: d.date ? new Date(`${d.date}T12:00:00`) : null,
        eventTime: orNull(d.eventTime),
        attendees: d.attendees && d.attendees > 0 ? d.attendees : null,
        night: false,
        extras: [],
        activities: lines,
        subtotal: breakdown.subtotal,
        discount: breakdown.discount,
        vat: breakdown.vat,
        total: breakdown.total,
        deposit: breakdown.deposit,
        securityDeposit: 0,
        name: d.customerName,
        email: d.customerEmail,
        phone: d.customerPhone,
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
