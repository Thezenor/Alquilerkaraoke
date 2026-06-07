"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateBudget, isWeekend } from "@/lib/budget";
import { logAudit } from "@/server/audit";
import { CONSENT_VERSION } from "@/lib/consent";
import { rateLimit, isHoneypotFilled } from "@/server/rate-limit";

// El presupuesto NO se muestra en la web: se calcula y guarda en servidor, y se
// envía por email. El público solo ve una confirmación.
export type QuoteState = {
  status: "idle" | "error" | "booked";
  message?: string;
};

const orNull = (v: string) => (v && v.length ? v : null);

export async function quoteAction(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  try {
    // Anti-spam: honeypot (silencioso) + rate-limit por IP.
    if (isHoneypotFilled(formData)) {
      return { status: "booked" }; // fingir éxito ante bots
    }
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = h.get("user-agent") ?? null;
    if (!rateLimit(`quote:${ip}`)) {
      return { status: "error", message: "Has enviado demasiadas solicitudes. Inténtalo más tarde." };
    }

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

    const packId = String(formData.get("packId") ?? "");
    const pack = await prisma.pack.findFirst({ where: { id: packId, isActive: true } });
    if (!pack) return { status: "error", message: "Selecciona un pack válido." };

    const hoursRaw = parseInt(String(formData.get("hours") ?? ""), 10);
    const hours = Number.isFinite(hoursRaw) && hoursRaw > 0 ? Math.min(hoursRaw, 48) : pack.includedHours || 4;
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

    // Solo un suplemento por tipo (evita duplicados si hay varias filas activas).
    const surchargePercents: number[] = [];
    const appliedTypes = new Set<string>();
    for (const s of surcharges) {
      if (appliedTypes.has(s.type)) continue;
      if (s.type === "WEEKEND" && date && isWeekend(date)) {
        surchargePercents.push(s.value);
        appliedTypes.add(s.type);
      }
      if (s.type === "NIGHT" && night) {
        surchargePercents.push(s.value);
        appliedTypes.add(s.type);
      }
    }

    // Cliente: se crea si no existe (no profesional). Descuento solo si es profesional.
    // No se sobrescriben datos de un cliente existente desde el formulario público.
    const dbCustomer = await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: { email: c.email, name: c.name, phone: orNull(c.phone ?? "") },
    });
    const discountPercent = dbCustomer.isProfessional ? dbCustomer.discountPercent : 0;

    const breakdown = calculateBudget({
      basePrice: pack.basePrice,
      isPerDay: pack.isPerDay,
      includedHours: pack.includedHours,
      extraHourPrice: pack.extraHourPrice,
      hours,
      provinceSupplement: prov?.zone && prov.zone.isActive ? prov.zone.supplement : 0,
      extras: extras.map((e) => e.price),
      surchargePercents,
      vatPercent: config?.vatPercent ?? 21,
      discountPercent,
      depositType: pack.depositType,
      depositValue: pack.depositValue,
      securityDeposit: pack.securityDeposit,
    });

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
        ip: ip === "unknown" ? null : ip,
        userAgent,
      },
    });

    await logAudit({
      action: "booking.create",
      entity: "Booking",
      entityId: created.id,
      metadata: { email: c.email, total: breakdown.total },
    });

    // TODO(email): enviar el presupuesto por correo al cliente y aviso al admin
    // cuando se configure el proveedor (Resend/Brevo).

    return { status: "booked" };
  } catch {
    return { status: "error", message: "No se pudo procesar la solicitud." };
  }
}
