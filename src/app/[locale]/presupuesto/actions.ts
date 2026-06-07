"use server";

import { prisma } from "@/lib/prisma";
import { calculateBudget, isWeekend, type BudgetBreakdown } from "@/lib/budget";

export type QuoteState = {
  status: "idle" | "ok" | "error";
  message?: string;
  result?: BudgetBreakdown & { packName: string };
};

export async function calculateQuote(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  try {
    const packId = String(formData.get("packId") ?? "");
    const pack = await prisma.pack.findFirst({ where: { id: packId, isActive: true } });
    if (!pack) return { status: "error", message: "Pack no válido." };

    const hoursRaw = parseInt(String(formData.get("hours") ?? ""), 10);
    const hours = Number.isFinite(hoursRaw) && hoursRaw > 0 ? hoursRaw : pack.includedHours || 4;

    const province = String(formData.get("province") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();
    const night = formData.get("night") === "on";
    const extraIds = formData.getAll("extras").map(String).filter(Boolean);

    const [supplement, extras, surcharges, config] = await Promise.all([
      province
        ? prisma.provinceSupplement.findFirst({ where: { province, isActive: true } })
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

    const result = calculateBudget({
      basePrice: pack.basePrice,
      isPerDay: pack.isPerDay,
      includedHours: pack.includedHours,
      extraHourPrice: pack.extraHourPrice,
      hours,
      provinceSupplement: supplement?.amount ?? 0,
      extras: extras.map((e) => e.price),
      surchargePercents,
      vatPercent: config?.vatPercent ?? 21,
      discountPercent: 0,
      depositType: pack.depositType,
      depositValue: pack.depositValue,
      securityDeposit: pack.securityDeposit,
    });

    return { status: "ok", result: { ...result, packName: pack.name } };
  } catch {
    return { status: "error", message: "No se pudo calcular." };
  }
}
