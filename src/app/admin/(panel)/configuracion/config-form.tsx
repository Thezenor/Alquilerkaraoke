"use client";

import { useActionState } from "react";
import { updateSiteConfig, type ConfigFormState } from "./actions";

const initialState: ConfigFormState = { status: "idle" };

export type ConfigValues = {
  companyName: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  primaryColor: string;
};

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required = false,
  placeholder,
}: {
  name: keyof ConfigValues;
  label: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
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
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30"
      />
    </div>
  );
}

export function ConfigForm({ values }: { values: ConfigValues }) {
  const [state, formAction, pending] = useActionState(updateSiteConfig, initialState);

  return (
    <form action={formAction} className="max-w-2xl">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="companyName" label="Nombre de empresa" defaultValue={values.companyName} required />
        <Field name="legalName" label="Razón social" defaultValue={values.legalName} />
        <Field name="taxId" label="CIF / NIF" defaultValue={values.taxId} />
        <Field name="email" label="Email" type="email" defaultValue={values.email} />
        <Field name="phone" label="Teléfono" defaultValue={values.phone} required />
        <Field name="whatsapp" label="WhatsApp" defaultValue={values.whatsapp} placeholder="Si difiere del teléfono" />
        <Field name="address" label="Dirección" defaultValue={values.address} />
        <Field name="primaryColor" label="Color principal (hex)" defaultValue={values.primaryColor} placeholder="#22d3ee" />
      </div>

      {state.status !== "idle" && state.message && (
        <p
          role="status"
          className={
            state.status === "success"
              ? "mt-5 text-sm text-emerald-400"
              : "mt-5 text-sm text-red-400"
          }
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
