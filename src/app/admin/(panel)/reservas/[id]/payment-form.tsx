"use client";

import { useActionState } from "react";
import { cn } from "@/lib/cn";
import { addPayment, type PaymentState } from "../actions";

const initial: PaymentState = { status: "idle" };

const inputCls =
  "w-full rounded-lg border border-brand-border bg-brand-bg px-2.5 py-1.5 text-sm text-white placeholder:text-brand-muted/60 focus:border-brand-neon focus:outline-none";

export function PaymentForm({ bookingId, defaultAmount }: { bookingId: string; defaultAmount: string }) {
  const [state, formAction, pending] = useActionState(addPayment, initial);

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-xl border border-brand-border bg-brand-bg p-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="text-sm font-medium text-white">Registrar cobro</p>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-brand-muted">Importe (€)</span>
          <input name="amount" required inputMode="decimal" defaultValue={defaultAmount} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-brand-muted">Método</span>
          <select name="method" defaultValue="TRANSFER" className={inputCls}>
            <option value="TRANSFER">Transferencia</option>
            <option value="BIZUM">Bizum</option>
            <option value="CASH">Efectivo</option>
            <option value="CARD">Tarjeta</option>
            <option value="OTHER">Otro</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-brand-muted">Tipo</span>
          <select name="kind" defaultValue="charge" className={inputCls}>
            <option value="charge">Cobro</option>
            <option value="refund">Reembolso</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-brand-muted">Fecha</span>
          <input type="date" name="paidAt" className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-brand-muted">Referencia / concepto (opcional)</span>
        <input name="reference" maxLength={120} placeholder="Nº de operación, nota…" className={inputCls} />
      </label>

      {state.message && (
        <p className={cn("text-xs", state.status === "success" ? "text-emerald-400" : "text-red-400")}>
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-neon px-3 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Añadir pago"}
      </button>
    </form>
  );
}
