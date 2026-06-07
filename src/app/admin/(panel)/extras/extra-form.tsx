"use client";

import { useActionState } from "react";
import { saveExtra, type ExtraFormState } from "./actions";

const initial: ExtraFormState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type ExtraFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  isActive: boolean;
  sortOrder: string;
  name_en: string;
  desc_en: string;
  name_fr: string;
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
      <input id={name} name={name} type={type} step={step} required={required} defaultValue={defaultValue} className={inputClass} />
      {hint && <p className="text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

export function ExtraForm({ values }: { values: ExtraFormValues }) {
  const [state, action, pending] = useActionState(saveExtra, initial);

  return (
    <form action={action} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" name="name" defaultValue={values.name} required />
        <Field label="Slug" name="slug" defaultValue={values.slug} required hint="ej. pantalla-extra" />
        <Field label="Precio (€, sin IVA)" name="price" type="number" step="0.01" defaultValue={values.price} required />
        <Field label="Categoría" name="category" defaultValue={values.category} hint="ej. Holi, Gaming / Consolas" />
        <Field label="Orden" name="sortOrder" type="number" defaultValue={values.sortOrder} />
        <Field label="Nombre (EN)" name="name_en" defaultValue={values.name_en} />
        <Field label="Nombre (FR)" name="name_fr" defaultValue={values.name_fr} />
      </div>
      <div className="mt-5 flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-brand-text">Descripción</label>
        <textarea id="description" name="description" rows={3} defaultValue={values.description} className={inputClass} />
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
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar extra"}
      </button>
    </form>
  );
}
