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
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  twitter: string;
  iban: string;
  bizum: string;
  paymentInfo: string;
  contractTerms: string;
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
      </div>

      <h2 className="mt-8 mb-1 text-sm font-semibold tracking-wide text-brand-muted uppercase">Marca y tema</h2>
      <p className="mb-4 text-sm text-brand-muted">Logos por URL e identidad visual (la subida de imágenes llegará más adelante).</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="logoUrl" label="Logo (URL)" defaultValue={values.logoUrl} placeholder="https://…" />
        <Field name="faviconUrl" label="Favicon (URL)" defaultValue={values.faviconUrl} placeholder="https://…" />
        <Field name="ogImageUrl" label="Imagen para redes/OG (URL)" defaultValue={values.ogImageUrl} placeholder="https://…" />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="primaryColor" className="text-sm font-medium text-brand-text">Color principal</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              defaultValue={values.primaryColor || "#22d3ee"}
              onChange={(e) => {
                const el = document.getElementById("primaryColor") as HTMLInputElement | null;
                if (el) el.value = e.target.value;
              }}
              className="h-10 w-12 shrink-0 cursor-pointer rounded border border-brand-border bg-brand-bg"
              aria-label="Selector de color"
            />
            <input
              id="primaryColor"
              name="primaryColor"
              defaultValue={values.primaryColor}
              placeholder="#22d3ee"
              className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30"
            />
          </div>
        </div>
      </div>

      <h2 className="mt-8 mb-1 text-sm font-semibold tracking-wide text-brand-muted uppercase">Redes sociales</h2>
      <p className="mb-4 text-sm text-brand-muted">Se muestran en el pie de página. Deja vacío las que no uses.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="instagram" label="Instagram (URL)" defaultValue={values.instagram} placeholder="https://instagram.com/…" />
        <Field name="facebook" label="Facebook (URL)" defaultValue={values.facebook} placeholder="https://facebook.com/…" />
        <Field name="tiktok" label="TikTok (URL)" defaultValue={values.tiktok} placeholder="https://tiktok.com/@…" />
        <Field name="youtube" label="YouTube (URL)" defaultValue={values.youtube} placeholder="https://youtube.com/@…" />
        <Field name="twitter" label="X / Twitter (URL)" defaultValue={values.twitter} placeholder="https://x.com/…" />
      </div>

      <h2 className="mt-8 mb-1 text-sm font-semibold tracking-wide text-brand-muted uppercase">Datos de pago</h2>
      <p className="mb-4 text-sm text-brand-muted">Se muestran al cliente en el email del presupuesto.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="iban" label="IBAN (transferencia)" defaultValue={values.iban} placeholder="ES00 0000 0000 0000 0000 0000" />
        <Field name="bizum" label="Bizum (teléfono)" defaultValue={values.bizum} placeholder="607724965" />
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="paymentInfo" className="text-sm font-medium text-brand-text">
            Instrucciones de pago (opcional)
          </label>
          <textarea
            id="paymentInfo"
            name="paymentInfo"
            defaultValue={values.paymentInfo}
            rows={3}
            maxLength={1000}
            placeholder="Ej. Indica tu nombre y la fecha del evento en el concepto."
            className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30"
          />
        </div>
      </div>

      <h2 className="mt-8 mb-1 text-sm font-semibold tracking-wide text-brand-muted uppercase">Contrato</h2>
      <p className="mb-4 text-sm text-brand-muted">
        Cláusulas que se incluyen en cada contrato. Si lo dejas vacío, se usan unas condiciones por defecto.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contractTerms" className="text-sm font-medium text-brand-text">
          Cláusulas del contrato
        </label>
        <textarea
          id="contractTerms"
          name="contractTerms"
          defaultValue={values.contractTerms}
          rows={8}
          maxLength={8000}
          placeholder="Deja vacío para usar las condiciones por defecto."
          className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 font-mono text-xs text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30"
        />
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
