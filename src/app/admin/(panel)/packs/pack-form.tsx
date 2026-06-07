"use client";

import { useActionState } from "react";
import { savePack, type PackFormState } from "./actions";

const initial: PackFormState = { status: "idle" };

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type PackFormValues = {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  basePrice: string;
  includedHours: string;
  extraHourPrice: string;
  isPerDay: boolean;
  depositType: "PERCENT" | "FIXED";
  depositValue: string;
  securityDeposit: string;
  isActive: boolean;
  sortOrder: string;
  name_en: string;
  short_en: string;
  desc_en: string;
  name_fr: string;
  short_fr: string;
  desc_fr: string;
};

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  step,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  step?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-brand-text">
        {label}
        {required && <span className="text-brand-neon"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className={inputClass}
      />
      {hint && <p className="text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

export function PackForm({ values }: { values: PackFormValues }) {
  const [state, action, pending] = useActionState(savePack, initial);

  return (
    <form action={action} className="max-w-3xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">Básico</h2>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" name="name" defaultValue={values.name} required />
        <Field
          label="Slug"
          name="slug"
          defaultValue={values.slug}
          required
          hint="minúsculas, números y guiones (ej. karaoke-fiesta)"
        />
        <Field label="Descripción corta" name="shortDescription" defaultValue={values.shortDescription} />
        <Field label="Categoría" name="category" defaultValue={values.category} hint="ej. Karaoke, Gaming / Consolas, Fiesta Holi" />
        <Field label="Orden" name="sortOrder" type="number" defaultValue={values.sortOrder} />
      </div>
      <div className="mt-5 flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-brand-text">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={values.description}
          className={inputClass}
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold tracking-wide text-brand-muted uppercase">Precios (€, sin IVA)</h2>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        <Field label="Precio base (€)" name="basePrice" type="number" step="0.01" defaultValue={values.basePrice} required />
        <Field label="Horas incluidas" name="includedHours" type="number" defaultValue={values.includedHours} />
        <Field label="Precio hora extra (€)" name="extraHourPrice" type="number" step="0.01" defaultValue={values.extraHourPrice} />
        <Field label="Fianza (€)" name="securityDeposit" type="number" step="0.01" defaultValue={values.securityDeposit} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="depositType" className="text-sm font-medium text-brand-text">
            Tipo de reserva
          </label>
          <select id="depositType" name="depositType" defaultValue={values.depositType} className={inputClass}>
            <option value="PERCENT">Porcentaje (%)</option>
            <option value="FIXED">Cantidad fija (€)</option>
          </select>
        </div>
        <Field
          label="Valor de la reserva"
          name="depositValue"
          type="number"
          step="0.01"
          defaultValue={values.depositValue}
          hint="Según el tipo: % (ej. 30) o € (ej. 50.00)"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" name="isPerDay" defaultChecked={values.isPerDay} className="h-4 w-4 accent-brand-neon" />
          Precio por día (OkeBox)
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 accent-brand-neon" />
          Activo (visible en la web)
        </label>
      </div>

      <h2 className="mt-8 text-sm font-semibold tracking-wide text-brand-muted uppercase">Traducciones (opcional)</h2>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        <Field label="Nombre (EN)" name="name_en" defaultValue={values.name_en} />
        <Field label="Nombre (FR)" name="name_fr" defaultValue={values.name_fr} />
        <Field label="Descr. corta (EN)" name="short_en" defaultValue={values.short_en} />
        <Field label="Descr. corta (FR)" name="short_fr" defaultValue={values.short_fr} />
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar pack"}
      </button>
    </form>
  );
}
