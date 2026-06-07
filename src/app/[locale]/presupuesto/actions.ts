"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateBudget, isWeekend, type BudgetBreakdown } from "@/lib/budget";
import { logAudit } from "@/server/audit";
import { CONSENT_VERSION } from "@/lib/consent";

export type QuoteState = {
  status: "idle" | "ok" | "error" | "booked";
  message?: string;
  result?: BudgetBreakdown & { packName: string };
};

const orNull = (v: string) => (v && v.length ? v : null);

export async function quoteAction(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  try {
    const intent = String(formData.get("intent") ?? "calculate");

    const packId = String(formData.get("packId") ?? "");
    const pack = await prisma.pack.findFirst({ where: { id: packId, isActive: true } });
    if (!pack) return { status: "error", message: "Pack no válido." };

    const hoursRaw = parseInt(String(formData.get("hours") ?? ""), 10);
    const hours = Number.isFinite(hoursRaw) && hoursRaw > 0 ? hoursRaw : pack.includedHours || 4;
    const province = String(formData.get("province") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();
    const night = formData.get("night") === "on";
    const extraIds = formData.getAll("extras").map(String).filter(Boolean);

    const [prov, extras, surcharges, config] = await Promise.all([
      province
        ? prisma.province.findFirst({ where: { name: province, isActive: true }, include: { zone: true } })
        : Promise.resolve(null),
      extraIds.length
        ? prisma.extra.findMany({ where: { id: { in: extraIds }, isActive: true } })
        : Promise.resolve([]),
      prisma.surcharge.findMany({
        where: { isActive: true, valueType: "PERCENT", type: { in: ["WEEKEND", "NIGHT"] } },
      }),
      prisma.pricingConfig.findUnique({ where: { id: "default" } }),
    ]);

    const surchargePercents: number[] = [];
    for (const s of surcharges) {
      if (s.type === "WEEKEND" && date && isWeekend(date)) surchargePercents.push(s.value);
      if (s.type === "NIGHT" && night) surchargePercents.push(s.value);
    }

    const inputs = {
      basePrice: pack.basePrice,
      isPerDay: pack.isPerDay,
      includedHours: pack.includedHours,
      extraHourPrice: pack.extraHourPrice,
      hours,
      provinceSupplement: prov?.zone && prov.zone.isActive ? prov.zone.supplement : 0,
      extras: extras.map((e) => e.price),
      surchargePercents,
      vatPercent: config?.vatPercent ?? 21,
      depositType: pack.depositType,
      depositValue: pack.depositValue,
      securityDeposit: pack.securityDeposit,
    };

    // Cálculo público (sin descuento: solo aplica a clientes profesionales).
    if (intent !== "book") {
      const breakdown = calculateBudget({ ...inputs, discountPercent: 0 });
      return { status: "ok", result: { ...breakdown, packName: pack.name } };
    }

    // ── Envío de solicitud de reserva (PENDING) ──
    const customer = z
      .object({
        name: z.string().trim().min(1).max(120),
        email: z.email(),
        phone: z.string().trim().max(40).optional(),
        message: z.string().trim().max(4000).optional(),
        acceptedTerms: z.literal("on"),
        marketing: z.string().optional(),
        locale: z.string().trim().max(5).optional(),
      })
      .safeParse(Object.fromEntries(formData));

    if (!customer.success) {
      return { status: "error", message: "Revisa tu nombre, email y la aceptación de la política." };
    }
    const c = customer.data;

    // Cliente: se crea si no existe (no profesional). El descuento SOLO se aplica
    // si el admin lo ha marcado como profesional y le ha asignado un porcentaje.
    const dbCustomer = await prisma.customer.upsert({
      where: { email: c.email },
      update: { name: c.name, phone: orNull(c.phone ?? "") },
      create: { email: c.email, name: c.name, phone: orNull(c.phone ?? "") },
    });
    const discountPercent = dbCustomer.isProfessional ? dbCustomer.discountPercent : 0;

    const breakdown = calculateBudget({ ...inputs, discountPercent });

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = h.get("user-agent") ?? null;

    const created = await prisma.booking.create({
      data: {
        packId: pack.id,
        packName: pack.name,
        hours,
        province: orNull(province),
        eventDate: date ? new Date(`${date}T12:00:00`) : null,
        night,
        extras: extras.map((e) => ({ name: e.name, price: e.price })),
        subtotal: breakdown.subtotal,
        discount: breakdown.discount,
        vat: breakdown.vat,
        total: breakdown.total,
        deposit: breakdown.deposit,
        securityDeposit: breakdown.securityDeposit,
        name: c.name,
        email: c.email,
        phone: orNull(c.phone ?? ""),
        message: orNull(c.message ?? ""),
        customerId: dbCustomer.id,
        acceptedTerms: true,
        marketingConsent: c.marketing === "on",
        consentVersion: CONSENT_VERSION,
        consentAt: new Date(),
        locale: orNull(c.locale ?? ""),
        ip,
        userAgent,
        // status PENDING por defecto
      },
    });

    await logAudit({
      action: "booking.create",
      entity: "Booking",
      entityId: created.id,
      metadata: { email: c.email, total: breakdown.total, discount: breakdown.discount },
    });

    return { status: "booked", message: "ok", result: { ...breakdown, packName: pack.name } };
  } catch {
    return { status: "error", message: "No se pudo procesar la solicitud." };
  }
}
