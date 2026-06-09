import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateBudget, type BudgetBreakdown } from "@/lib/budget";
import { eurosToCents } from "@/lib/money";

// Parseo y cálculo COMPARTIDO de un presupuesto manual a partir del formulario.
// Lo usan tanto el guardado (createManualQuote) como la previsualización (preview),
// para que el PDF previsualizado y el creado salgan idénticos.

export type QuoteLineComputed = {
  name: string;
  description: string | null;
  hours: number | null;
  lineTotal: number; // céntimos, sin IVA
};

export type QuoteComputation = {
  customer: { name: string; email: string; phone: string };
  date: string | null; // YYYY-MM-DD
  province: string | null;
  eventTime: string | null;
  attendees: number | null;
  depositPercent: number;
  lines: QuoteLineComputed[];
  breakdown: BudgetBreakdown;
};

const lineSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional().default(""),
  price: z.union([z.string(), z.number()]),
  hours: z.union([z.string(), z.number()]).optional(),
});

const orNull = (v: string | undefined | null) => (v && v.length ? v : null);

/**
 * Lee el formulario, valida y calcula los importes (sin tocar la BD salvo la
 * lectura de provincia/IVA). `requireCustomer` exige email/teléfono válidos
 * (necesarios al guardar; no al previsualizar).
 */
export async function computeQuoteFromForm(
  formData: FormData,
  opts: { requireCustomer: boolean },
): Promise<{ ok: true; data: QuoteComputation } | { ok: false; message: string }> {
  const customerName = String(formData.get("customerName") ?? "").trim().slice(0, 120);
  const customerEmailRaw = String(formData.get("customerEmail") ?? "").trim();
  const customerPhoneRaw = String(formData.get("customerPhone") ?? "").trim().slice(0, 40);

  if (opts.requireCustomer) {
    if (!customerName) return { ok: false, message: "Indica el nombre del cliente." };
    if (!z.email().safeParse(customerEmailRaw).success) return { ok: false, message: "Email del cliente no válido." };
    if (customerPhoneRaw.length < 6) return { ok: false, message: "Indica un teléfono (será su clave inicial)." };
  }

  // Líneas (JSON del formulario).
  let rawLines: unknown;
  try {
    rawLines = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { ok: false, message: "No se pudieron leer los productos." };
  }
  const linesParsed = z.array(lineSchema).max(12).safeParse(rawLines);
  if (!linesParsed.success || linesParsed.data.length === 0) {
    return { ok: false, message: "Añade al menos un producto con su precio." };
  }
  const lines: QuoteLineComputed[] = linesParsed.data
    .map((l) => ({
      name: l.name,
      description: orNull((l.description ?? "").trim()),
      hours: l.hours != null && String(l.hours).trim() ? Math.min(48, Math.max(1, parseInt(String(l.hours), 10) || 0)) || null : null,
      lineTotal: eurosToCents(l.price),
    }))
    .filter((l) => l.name);
  if (lines.some((l) => l.lineTotal <= 0)) {
    return { ok: false, message: "Cada producto debe tener un precio mayor que 0." };
  }

  const province = String(formData.get("province") ?? "").trim().slice(0, 80);
  const [prov, config] = await Promise.all([
    province
      ? prisma.province.findFirst({ where: { name: province, isActive: true }, include: { zone: true } })
      : Promise.resolve(null),
    prisma.pricingConfig.findUnique({ where: { id: "default" } }),
  ]);

  const depositPercent = Math.min(100, Math.max(0, parseInt(String(formData.get("depositPercent") ?? "50"), 10) || 0));
  const combinedBase = lines.reduce((s, l) => s + l.lineTotal, 0);
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

  const attendeesRaw = parseInt(String(formData.get("attendees") ?? ""), 10);

  return {
    ok: true,
    data: {
      customer: { name: customerName, email: customerEmailRaw, phone: customerPhoneRaw },
      date: orNull(String(formData.get("date") ?? "").trim().slice(0, 20)),
      province: orNull(province),
      eventTime: orNull(String(formData.get("eventTime") ?? "").trim().slice(0, 20)),
      attendees: Number.isFinite(attendeesRaw) && attendeesRaw > 0 ? Math.min(attendeesRaw, 100000) : null,
      depositPercent,
      lines,
      breakdown,
    },
  };
}
