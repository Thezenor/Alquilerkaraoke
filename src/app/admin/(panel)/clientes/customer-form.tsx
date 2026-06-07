"use client";

import { useActionState } from "react";
import { saveCustomer, type CustomerFormState } from "./actions";

const initial: CustomerFormState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type CustomerFormValues = {
  id?: string;
  email: string;
  name: string;
  phone: string;
  isProfessional: boolean;
  discountPercent: string;
  notes: string;
};

export function CustomerForm({ values }: { values: CustomerFormValues }) {
  const [state, action, pending] = useActionState(saveCustomer, initial);

  return (
    <form action={action} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-brand-text">Email *</label>
          <input id="email" name="email" type="email" required defaultValue={values.email} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-brand-text">Nombre</label>
          <input id="name" name="name" defaultValue={values.name} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-brand-text">Teléfono</label>
          <input id="phone" name="phone" defaultValue={values.phone} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="discountPercent" className="text-sm font-medium text-brand-text">Descuento (%)</label>
          <input id="discountPercent" name="discountPercent" type="number" min={0} max={35} defaultValue={values.discountPercent} className={inputClass} />
          <p className="text-xs text-brand-muted">0–35%. Solo se aplica si el cliente es profesional.</p>
        </div>
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-brand-text">
        <input type="checkbox" name="isProfessional" defaultChecked={values.isProfessional} className="h-4 w-4 accent-brand-neon" />
        Cliente profesional (aplica descuento)
      </label>

      <div className="mt-5 flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-brand-text">Notas</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={values.notes} className={inputClass} />
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cliente"}
      </button>
    </form>
  );
}
