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
  vatPercent: number;
  discountPercent: number; // descuento cliente (%)
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
  const surcharges = input.surchargePercents.reduce(
    (sum, pct) => sum + r((preSurcharge * nonNeg(pct)) / 100),
    0,
  );

  const subtotal = preSurcharge + surcharges;

  const discountPct = Math.min(100, nonNeg(input.discountPercent));
  const discount = r((subtotal * discountPct) / 100);
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
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day === 0 || day === 6;
}
