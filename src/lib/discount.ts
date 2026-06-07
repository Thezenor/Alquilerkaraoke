// Evaluación pura de un código de descuento (sin BD). Fechas como ms epoch.

export type DiscountCodeRecord = {
  valueType: "PERCENT" | "FIXED";
  value: number;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  validFromMs: number | null;
  validUntilMs: number | null;
};

export type DiscountEval = {
  valid: boolean;
  reason?: string;
  percent: number; // a sumar a discountPercent
  fixed: number; // céntimos a sumar a discountFixed
};

const INVALID = (reason: string): DiscountEval => ({ valid: false, reason, percent: 0, fixed: 0 });

/** ¿Es aplicable el código en este momento? Devuelve el descuento a aplicar. */
export function evaluateDiscountCode(c: DiscountCodeRecord, ctx: { nowMs: number }): DiscountEval {
  if (!c.isActive) return INVALID("inactivo");
  if (c.validFromMs !== null && ctx.nowMs < c.validFromMs) return INVALID("aún no válido");
  if (c.validUntilMs !== null && ctx.nowMs > c.validUntilMs) return INVALID("caducado");
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return INVALID("agotado");
  if (c.value <= 0) return INVALID("sin valor");
  if (c.valueType === "PERCENT") return { valid: true, percent: Math.min(100, c.value), fixed: 0 };
  return { valid: true, percent: 0, fixed: c.value };
}

/** Normaliza un código introducido por el usuario. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
