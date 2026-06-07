// Motor de presupuestos — función PURA (sin BD, sin I/O). Todo en céntimos (Int).
// Fórmula (docs 08): base + horas extra + provincia + extras + suplementos %
//   − descuento + IVA. Devuelve también reserva y fianza.

export type BudgetInput = {
  basePrice: number; // céntimos, sin IVA
  isPerDay: boolean; // OkeBox: precio por día (sin horas extra)
  includedHours: number;
  extraHourPrice: number; // céntimos por hora extra
  hours: number; // horas solicitadas
  provinceSupplement: number; // céntimos
  extras: number[]; // precio de cada extra seleccionado (céntimos)
  surchargePercents: number[]; // suplementos en % (fin de semana, nocturnidad…)
  surchargeFixed?: number[]; // suplementos en cantidad fija (céntimos)
  vatPercent: number;
  discountPercent: number; // descuento cliente (%)
  discountFixed?: number; // descuento adicional en cantidad fija (céntimos)
  depositType: "PERCENT" | "FIXED";
  depositValue: number; // % o céntimos según depositType
  securityDeposit: number; // céntimos
};

export type BudgetBreakdown = {
  base: number;
  extraHours: number;
  province: number;
  extras: number;
  surcharges: number;
  subtotal: number; // sin IVA, antes de descuento
  discount: number;
  taxableBase: number; // sin IVA, tras descuento
  vat: number;
  total: number; // con IVA
  deposit: number; // reserva a pagar
  securityDeposit: number; // fianza
};

const r = Math.round;
const nonNeg = (n: number) => (n > 0 ? n : 0);

export function calculateBudget(input: BudgetInput): BudgetBreakdown {
  const base = nonNeg(input.basePrice);

  const extraHourCount = input.isPerDay ? 0 : nonNeg(input.hours - input.includedHours);
  const extraHours = extraHourCount * nonNeg(input.extraHourPrice);

  const province = nonNeg(input.provinceSupplement);
  const extras = input.extras.reduce((sum, e) => sum + nonNeg(e), 0);

  const preSurcharge = base + extraHours + province + extras;
  const surchargesPercent = input.surchargePercents.reduce(
    (sum, pct) => sum + r((preSurcharge * nonNeg(pct)) / 100),
    0,
  );
  const surchargesFixed = (input.surchargeFixed ?? []).reduce((sum, c) => sum + nonNeg(c), 0);
  const surcharges = surchargesPercent + surchargesFixed;

  const subtotal = preSurcharge + surcharges;

  const discountPct = Math.min(100, nonNeg(input.discountPercent));
  const discountPercentAmount = r((subtotal * discountPct) / 100);
  const discount = Math.min(subtotal, discountPercentAmount + nonNeg(input.discountFixed ?? 0));
  const taxableBase = subtotal - discount;

  const vat = r((taxableBase * nonNeg(input.vatPercent)) / 100);
  const total = taxableBase + vat;

  const deposit =
    input.depositType === "PERCENT"
      ? Math.min(total, r((total * nonNeg(input.depositValue)) / 100))
      : Math.min(total, nonNeg(input.depositValue));

  return {
    base,
    extraHours,
    province,
    extras,
    surcharges,
    subtotal,
    discount,
    taxableBase,
    vat,
    total,
    deposit,
    securityDeposit: nonNeg(input.securityDeposit),
  };
}

/** ¿La fecha (YYYY-MM-DD) cae en fin de semana (sábado/domingo)? */
export function isWeekend(dateStr: string): boolean {
  const wd = weekday(dateStr);
  return wd === 0 || wd === 6;
}

function weekday(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getDay(); // 0=domingo … 6=sábado
}

export type SurchargeConfig = {
  mode?: "single" | "range" | "weekday";
  date?: string;
  from?: string;
  to?: string;
  weekdays?: number[];
  label?: string;
};

/** ¿Aplica este suplemento al evento (según tipo, fecha y nocturnidad)? Función pura. */
export function matchSurcharge(
  s: { type: string; config?: unknown },
  ctx: { date: string; night: boolean },
): boolean {
  const cfg = (s.config ?? {}) as SurchargeConfig;
  if (s.type === "NIGHT") return ctx.night;
  if (s.type === "WEEKEND") {
    const wd = weekday(ctx.date);
    if (wd === null) return false;
    const days = cfg.weekdays && cfg.weekdays.length ? cfg.weekdays : [0, 6];
    return days.includes(wd);
  }
  // Tipos basados en fecha (SPECIAL_DATE, HIGH_DEMAND, etc.) según config.mode.
  if (!ctx.date) return false;
  if (cfg.mode === "single") return cfg.date === ctx.date;
  if (cfg.mode === "range") return !!cfg.from && !!cfg.to && ctx.date >= cfg.from && ctx.date <= cfg.to;
  if (cfg.mode === "weekday") {
    const wd = weekday(ctx.date);
    return wd !== null && !!cfg.weekdays?.includes(wd);
  }
  return false; // sin config aplicable → no se aplica automáticamente
}
