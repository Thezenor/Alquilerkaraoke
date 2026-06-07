export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
};

export const BOOKING_STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300",
  REJECTED: "bg-red-500/15 text-red-300",
  CANCELLED: "bg-slate-500/15 text-slate-300",
};

export const BOOKING_STATUS_OPTIONS = ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED"] as const;
