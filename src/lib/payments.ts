// Lógica pura de pagos (sin BD). Estado derivado de lo cobrado vs. el total.

export type PaymentStatusValue = "PENDING" | "PARTIAL" | "PAID";

/** Deriva el estado de pago: PAID si cubre el total, PARTIAL si hay algo, si no PENDING. */
export function derivePaymentStatus(amountPaid: number, total: number): PaymentStatusValue {
  if (total > 0 && amountPaid >= total) return "PAID";
  if (amountPaid > 0) return "PARTIAL";
  return "PENDING";
}

/** Importe pendiente (nunca negativo). */
export function amountDue(amountPaid: number, total: number): number {
  const due = total - amountPaid;
  return due > 0 ? due : 0;
}
