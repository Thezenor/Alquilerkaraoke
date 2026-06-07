"use client";

import { useActionState } from "react";
import { saveDiscountCode, type DiscountFormState } from "./actions";

const initial: DiscountFormState = { status: "idle" };

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type DiscountFormValues = {
  id?: string;
  code: string;
  valueType: "PERCENT" | "FIXED";
  value: string;
  maxUses: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
};

export function DiscountForm({ values }: { values: DiscountFormValues }) {
  const [state, formAction, pending] = useActionState(saveDiscountCode, initial);

  return (
    <form action={formAction} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Código <span className="text-brand-neon">*</span></span>
          <input name="code" required maxLength={40} defaultValue={values.code} placeholder="VERANO24" className={`${inputClass} uppercase`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Tipo</span>
          <select name="valueType" defaultValue={values.valueType} className={inputClass}>
            <option value="PERCENT">Porcentaje (%)</option>
            <option value="FIXED">Cantidad fija (€)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Valor <span className="text-brand-neon">*</span></span>
          <input name="value" required inputMode="decimal" defaultValue={values.value} placeholder="10" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Usos máximos</span>
          <input name="maxUses" type="number" min={0} defaultValue={values.maxUses} placeholder="Vacío = ilimitado" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Válido desde</span>
          <input name="validFrom" type="date" defaultValue={values.validFrom} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Válido hasta</span>
          <input name="validUntil" type="date" defaultValue={values.validUntil} className={inputClass} />
        </label>
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-brand-text">
        <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 accent-brand-neon" />
        Activo
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar código"}
      </button>
    </form>
  );
}
