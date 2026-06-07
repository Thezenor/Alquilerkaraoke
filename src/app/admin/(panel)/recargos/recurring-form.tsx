"use client";

import { useActionState } from "react";
import { cn } from "@/lib/cn";
import { createRecurringSurcharge, type CalendarActionState } from "../calendario/actions";

const INITIAL: CalendarActionState = { ok: false };

const inputCls =
  "w-full rounded-lg border border-brand-border bg-brand-surface-2 px-2.5 py-1.5 text-sm text-white placeholder:text-brand-muted/60 focus:border-brand-neon focus:outline-none";

export function RecurringForm() {
  const [state, formAction, pending] = useActionState(createRecurringSurcharge, INITIAL);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <label className="block lg:col-span-2">
        <span className="mb-1 block text-xs font-medium text-brand-muted">Nombre</span>
        <input name="name" required maxLength={120} placeholder="Ej. Suplemento fin de semana" className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-brand-muted">Tipo</span>
        <select name="type" defaultValue="WEEKEND" className={inputCls}>
          <option value="WEEKEND">Fin de semana</option>
          <option value="NIGHT">Nocturnidad</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-brand-muted">Modificador</span>
        <select name="valueType" defaultValue="PERCENT" className={inputCls}>
          <option value="PERCENT">Porcentaje (%)</option>
          <option value="FIXED">Cantidad fija (€)</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-brand-muted">Valor</span>
        <input name="value" required inputMode="decimal" placeholder="15" className={inputCls} />
      </label>
      <div className="lg:col-span-5">
        {state.message && (
          <p className={cn("mb-2 text-xs", state.ok ? "text-emerald-400" : "text-red-400")}>{state.message}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-neon px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-neon/90 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Crear recargo recurrente"}
        </button>
      </div>
    </form>
  );
}
