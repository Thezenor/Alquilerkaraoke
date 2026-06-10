"use server";

import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { isDateAvailable } from "@/server/calendar";
import { calculateBudget, matchSurcharge } from "@/lib/budget";
import { normalizeCode } from "@/lib/discount";
import { logAudit } from "@/server/audit";
import { CONSENT_VERSION } from "@/lib/consent";
import { rateLimit, isHoneypotFilled } from "@/server/rate-limit";
import { verifyTurnstile } from "@/server/turnstile";
import { notifyNewBooking } from "@/server/email";

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
    if (!rateLimit(`quote:${ip}`, 30)) {
      return { status: "error", message: "Has enviado demasiadas solicitudes. Inténtalo más tarde." };
    }
    if (!(await verifyTurnstile(formData.get("cf-turnstile-response")?.toString(), ip))) {
      return { status: "error", message: "Verificación anti-spam fallida. Recarga e inténtalo de nuevo." };
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
    const dateRaw = String(formData.get("date") ?? "").trim();
    // Solo se acepta una fecha con formato válido; el resto se ignora (campo opcional).
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : "";

    // Defensa en servidor: fecha bloqueada en agenda o ya ocupada por una
    // reserva confirmada → error claro sin revelar detalles internos.
    if (date && !(await isDateAvailable(date))) {
      const locale = hasLocale(routing.locales, c.locale) ? c.locale : routing.defaultLocale;
      const t = await getTranslations({ locale, namespace: "Quote" });
      return { status: "error", message: t("dateUnavailable") };
    }
    const eventTime = String(formData.get("eventTime") ?? "").trim().slice(0, 20);
    const attendeesRaw = parseInt(String(formData.get("attendees") ?? ""), 10);
    const attendees = Number.isFinite(attendeesRaw) && attendeesRaw > 0 ? Math.min(attendeesRaw, 100000) : null;
    const night = formData.get("night") === "on";
    const extraIds = formData.getAll("extras").map(String).filter(Boolean);

    const [prov, extrasRaw, surcharges, config] = await Promise.all([
      province
        ? prisma.province.findFirst({ where: { name: province, isActive: true }, include: { zone: true } })
        : Promise.resolve(null),
      extraIds.length
        ? prisma.extra.findMany({ where: { id: { in: extraIds }, isActive: true } })
        : Promise.resolve([]),
      prisma.surcharge.findMany({ where: { isActive: true } }),
      prisma.pricingConfig.findUnique({ where: { id: "default" } }),
    ]);

    // Defensa servidor: descarta extras no compatibles con la categoría del pack
    // (appliesToCategories vacío = compatible con cualquier pack).
    const extras = extrasRaw.filter(
      (e) => e.appliesToCategories.length === 0 || (pack.category != null && e.appliesToCategories.includes(pack.category)),
    );

    // Aplica los suplementos que correspondan a la fecha/nocturnidad del evento.
    // Solo uno por tipo (evita duplicados si hay varias filas activas del mismo tipo).
    const surchargePercents: number[] = [];
    const surchargeFixed: number[] = [];
    const appliedTypes = new Set<string>();
    for (const s of surcharges) {
      if (appliedTypes.has(s.type)) continue;
      if (!matchSurcharge(s, { date, night })) continue;
      if (s.valueType === "PERCENT") surchargePercents.push(s.value);
      else surchargeFixed.push(s.value);
      appliedTypes.add(s.type);
    }

    // Cliente: se crea si no existe (no profesional). Descuento solo si es profesional.
    // No se sobrescriben datos de un cliente existente desde el formulario público.
    const dbCustomer = await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: { email: c.email, name: c.name, phone: orNull(c.phone ?? "") },
    });
    const professionalPercent = dbCustomer.isProfessional ? dbCustomer.discountPercent : 0;
    let discountPercent = professionalPercent;
    let discountFixed = 0;
    let appliedCode: string | null = null;

    // Código de descuento promocional (opcional). Códigos no válidos se ignoran.
    // Reserva un uso de forma ATÓMICA (respeta maxUses/fechas/activo) para evitar
    // condiciones de carrera; solo si reclama el uso se aplica el descuento.
    const rawCode = String(formData.get("code") ?? "").trim();
    if (rawCode) {
      const code = normalizeCode(rawCode);
      const claimed = await prisma.$executeRaw`
        UPDATE "DiscountCode"
        SET "usedCount" = "usedCount" + 1, "updatedAt" = now()
        WHERE "code" = ${code}
          AND "isActive" = true
          AND ("validFrom" IS NULL OR "validFrom" <= now())
          AND ("validUntil" IS NULL OR "validUntil" >= now())
          AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`;
      if (claimed === 1) {
        const rec = await prisma.discountCode.findUnique({ where: { code } });
        if (rec && rec.value > 0) {
          // El descuento del código NO se acumula con el porcentaje profesional:
          // se aplica el mayor de los dos (más el descuento fijo si lo hubiera).
          if (rec.valueType === "PERCENT") {
            discountPercent = Math.max(professionalPercent, Math.min(100, rec.value));
          } else {
            discountFixed += rec.value;
          }
          appliedCode = code;
        }
      }
    }

    // ── Actividades (primera + adicionales) ──
    const activityBase = (
      p: { basePrice: number; isPerDay: boolean; includedHours: number; extraHourPrice: number },
      hrs: number,
    ) => {
      const extraHourCount = p.isPerDay ? 0 : Math.max(0, hrs - p.includedHours);
      return p.basePrice + extraHourCount * p.extraHourPrice;
    };
    const isExtraCompatible = (cats: string[], cat: string | null) =>
      cats.length === 0 || (cat != null && cats.includes(cat));

    type ActivityCalc = { packName: string; hours: number; extras: { name: string; price: number }[]; lineTotal: number };
    const calcActivities: ActivityCalc[] = [
      {
        packName: pack.name,
        hours,
        extras: extras.map((e) => ({ name: e.name, price: e.price })),
        lineTotal: activityBase(pack, hours) + extras.reduce((s, e) => s + e.price, 0),
      },
    ];

    // Actividades adicionales (JSON del formulario).
    let parsedActivities: { packId: string; hours: number; extraIds: string[] }[] = [];
    try {
      const raw = JSON.parse(String(formData.get("activities") ?? "[]"));
      if (Array.isArray(raw)) {
        parsedActivities = raw
          .slice(0, 5)
          .map((a) => ({
            packId: String(a?.packId ?? ""),
            hours: Math.min(48, Math.max(1, parseInt(String(a?.hours ?? "4"), 10) || 4)),
            extraIds: Array.isArray(a?.extraIds) ? a.extraIds.map(String).filter(Boolean).slice(0, 30) : [],
          }))
          .filter((a) => a.packId);
      }
    } catch {
      /* sin actividades adicionales */
    }

    if (parsedActivities.length) {
      const addPackIds = [...new Set(parsedActivities.map((a) => a.packId))];
      const addExtraIds = [...new Set(parsedActivities.flatMap((a) => a.extraIds))];
      const [addPacks, addExtras] = await Promise.all([
        prisma.pack.findMany({ where: { id: { in: addPackIds }, isActive: true } }),
        addExtraIds.length
          ? prisma.extra.findMany({ where: { id: { in: addExtraIds }, isActive: true } })
          : Promise.resolve([]),
      ]);
      for (const a of parsedActivities) {
        const ap = addPacks.find((p) => p.id === a.packId);
        if (!ap) continue;
        const aExtras = addExtras.filter((e) => a.extraIds.includes(e.id) && isExtraCompatible(e.appliesToCategories, ap.category));
        calcActivities.push({
          packName: ap.name,
          hours: a.hours,
          extras: aExtras.map((e) => ({ name: e.name, price: e.price })),
          lineTotal: activityBase(ap, a.hours) + aExtras.reduce((s, e) => s + e.price, 0),
        });
      }
    }

    const combinedBase = calcActivities.reduce((s, a) => s + a.lineTotal, 0);
    const multiActivity = calcActivities.length > 1;

    const breakdown = calculateBudget({
      basePrice: combinedBase, // ya incluye base + horas extra + extras de todas las actividades
      isPerDay: true,
      includedHours: 0,
      extraHourPrice: 0,
      hours: 0,
      provinceSupplement: prov?.zone && prov.zone.isActive ? prov.zone.supplement : 0,
      extras: [],
      surchargePercents,
      surchargeFixed,
      vatPercent: config?.vatPercent ?? 21,
      discountPercent,
      discountFixed,
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
        eventTime: orNull(eventTime),
        attendees,
        night,
        extras: extras.map((e) => ({ name: e.name, price: e.price })),
        activities: multiActivity ? calcActivities : undefined,
        subtotal: breakdown.subtotal,
        discount: breakdown.discount,
        discountCode: appliedCode,
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
      metadata: { email: c.email, total: breakdown.total, discountCode: appliedCode },
    });

    // Envía el presupuesto al cliente y avisa al admin (no-op si no hay proveedor).
    await notifyNewBooking(created.id, {
      customerName: c.name,
      packName: pack.name,
      hours,
      eventDate: date || null,
      eventTime: orNull(eventTime),
      attendees,
      province: orNull(province),
      extras: extras.map((e) => ({ name: e.name, price: e.price })),
      breakdown,
      email: c.email,
      phone: orNull(c.phone ?? ""),
    });

    return { status: "booked" };
  } catch {
    return { status: "error", message: "No se pudo procesar la solicitud." };
  }
}
