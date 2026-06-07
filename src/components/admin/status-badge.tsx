import { cn } from "@/lib/cn";

export type Tone = "pending" | "success" | "danger" | "neutral" | "info";

const TONES: Record<Tone, string> = {
  pending: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  success: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  danger: "bg-red-500/15 text-red-300 ring-red-500/30",
  neutral: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  info: "bg-brand-neon/15 text-brand-neon ring-brand-neon/30",
};

export function StatusBadge({
  tone,
  children,
  dot = true,
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const BOOKING_STATUS: Record<string, { tone: Tone; label: string }> = {
  PENDING: { tone: "pending", label: "Pendiente" },
  CONFIRMED: { tone: "success", label: "Confirmada" },
  REJECTED: { tone: "danger", label: "Rechazada" },
  CANCELLED: { tone: "neutral", label: "Cancelada" },
};

export const PAYMENT_STATUS: Record<string, { tone: Tone; label: string }> = {
  PENDING: { tone: "danger", label: "Sin pagar" },
  PARTIAL: { tone: "pending", label: "Parcial" },
  PAID: { tone: "success", label: "Pagado" },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  TRANSFER: "Transferencia",
  BIZUM: "Bizum",
  CASH: "Efectivo",
  CARD: "Tarjeta",
  OTHER: "Otro",
};

export const CONTACT_STATUS: Record<string, { tone: Tone; label: string }> = {
  NEW: { tone: "info", label: "Nueva" },
  IN_PROGRESS: { tone: "pending", label: "En curso" },
  ANSWERED: { tone: "success", label: "Respondida" },
  ARCHIVED: { tone: "neutral", label: "Archivada" },
};
