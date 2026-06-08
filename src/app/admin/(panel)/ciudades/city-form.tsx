"use client";

import { useActionState } from "react";
import { saveCity, type CityFormState } from "./actions";

const initial: CityFormState = { status: "idle" };

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type CityFormValues = {
  id?: string;
  name: string;
  slug: string;
  province: string;
  region: string;
  nearby: string; // una población por línea
  sortOrder: string;
  isActive: boolean;
  population: string;
  intro: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
};

export function CityForm({ values }: { values: CityFormValues }) {
  const [state, formAction, pending] = useActionState(saveCity, initial);

  return (
    <form action={formAction} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Ciudad <span className="text-brand-neon">*</span></span>
          <input name="name" required maxLength={80} defaultValue={values.name} placeholder="Madrid" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Slug</span>
          <input name="slug" maxLength={80} defaultValue={values.slug} placeholder="Se genera del nombre" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Provincia <span className="text-brand-neon">*</span></span>
          <input name="province" required maxLength={80} defaultValue={values.province} placeholder="Madrid" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Comunidad autónoma <span className="text-brand-neon">*</span></span>
          <input name="region" required maxLength={80} defaultValue={values.region} placeholder="Comunidad de Madrid" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Orden</span>
          <input name="sortOrder" type="number" min={0} defaultValue={values.sortOrder} placeholder="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Habitantes</span>
          <input name="population" type="number" min={0} defaultValue={values.population} placeholder="Opcional" className={inputClass} />
        </label>
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-brand-text">Poblaciones cercanas que cubrimos</span>
        <textarea
          name="nearby"
          rows={6}
          defaultValue={values.nearby}
          placeholder={"Una población por línea (o separadas por comas).\nGetafe\nMóstoles\nAlcorcón"}
          className={`${inputClass} resize-y`}
        />
        <span className="text-xs text-brand-muted">Aparecen en la landing como cobertura local (SEO). Una por línea o separadas por comas.</span>
      </label>

      <div className="mt-6 rounded-xl border border-brand-border bg-brand-bg/40 p-4">
        <p className="text-sm font-medium text-brand-text">Contenido único (opcional, recomendado para SEO)</p>
        <p className="mt-1 text-xs text-brand-muted">
          Si rellenas estos campos, sustituyen al texto automático y hacen la página única (evita contenido duplicado).
        </p>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Introducción propia</span>
          <textarea name="intro" rows={3} defaultValue={values.intro} placeholder="Sustituye a la intro automática" className={`${inputClass} resize-y`} />
        </label>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Contenido (Markdown)</span>
          <textarea
            name="body"
            rows={8}
            defaultValue={values.body}
            placeholder={"Bloque de texto único de la ciudad. Admite Markdown:\n## Karaoke en {ciudad}\n\nDescribe recintos, barrios, tipos de evento..."}
            className={`${inputClass} resize-y font-mono text-sm`}
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-text">Meta title (SEO)</span>
            <input name="metaTitle" maxLength={140} defaultValue={values.metaTitle} placeholder="Override del título" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-text">Meta description (SEO)</span>
            <input name="metaDescription" maxLength={300} defaultValue={values.metaDescription} placeholder="Override de la descripción" className={inputClass} />
          </label>
        </div>
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-brand-text">
        <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 accent-brand-neon" />
        Activa (visible en la web)
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar ciudad"}
      </button>
    </form>
  );
}
